from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ArchiveReason
from app.repositories.archived_tickets import ArchivedTicketRepository
from app.repositories.audit import AuditRepository
from app.repositories.parking import ParkingRepository
from app.repositories.tickets import TicketRepository


def expiration_hours_to_minutes(expiration_hours: int) -> int:
    return expiration_hours * 60


def expiration_minutes_to_hours(expiration_minutes: int) -> int:
    from math import ceil

    return max(1, ceil(expiration_minutes / 60))


def is_ticket_expired(entry_at: datetime, expiration_minutes: int) -> bool:
    """Check if a ticket has expired based on its entry time and the configured expiration."""
    if entry_at.tzinfo is None:
        entry_at = entry_at.replace(tzinfo=UTC)
    now = datetime.now(UTC)
    return now >= entry_at + timedelta(minutes=expiration_minutes)


async def expire_stale_tickets(session: AsyncSession) -> int:
    """Expire active tickets whose entry_at exceeds the configured expiration window.

    Returns the number of tickets expired.
    """
    parking_repository = ParkingRepository(session)
    ticket_repository = TicketRepository(session)
    archived_repository = ArchivedTicketRepository(session)
    audit_repository = AuditRepository(session)

    settings = await parking_repository.get_settings()
    expiration_minutes = settings.ticket_expiration_minutes
    if expiration_minutes <= 0:
        return 0

    now = datetime.now(UTC)
    expired_tickets = await ticket_repository.get_expired_active_tickets(
        expiration_minutes=expiration_minutes, now=now
    )

    if not expired_tickets:
        return 0

    state = await parking_repository.lock_state()

    for ticket in expired_tickets:
        # Archive the ticket
        await archived_repository.create(
            id=ticket.id,
            code=ticket.code,
            status=str(ticket.status),
            payment_status=str(ticket.payment_status),
            entry_at=ticket.entry_at,
            paid_at=ticket.paid_at,
            exit_at=ticket.exit_at,
            duration_minutes=ticket.duration_minutes,
            calculated_amount=ticket.calculated_amount,
            lost_ticket=ticket.lost_ticket,
            entry_device_id=ticket.entry_device_id,
            exit_device_id=ticket.exit_device_id,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            archived_at=now,
            expired_at=now,
            archive_reason=ArchiveReason.EXPIRED,
        )

        # Audit the expiration
        await audit_repository.log(
            event_type="ticket_expired",
            actor_type="system_cron",
            actor_id=None,
            payload={
                "ticket_code": ticket.code,
                "entry_at": ticket.entry_at.isoformat(),
                "expiration_minutes": expiration_minutes,
            },
            ticket_id=ticket.id,
        )

        # Delete from active tickets
        await ticket_repository.delete(ticket)

        # Decrement parking state counters
        state.occupied_spaces = max(state.occupied_spaces - 1, 0)
        state.active_tickets_count = max(state.active_tickets_count - 1, 0)

    await session.commit()
    return len(expired_tickets)
