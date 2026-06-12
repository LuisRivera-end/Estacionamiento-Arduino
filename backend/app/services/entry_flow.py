from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.models.enums import DeviceType, PaymentStatus, TicketStatus
from app.repositories.audit import AuditRepository
from app.repositories.devices import DeviceRepository
from app.repositories.parking import ParkingRepository
from app.repositories.tickets import TicketRepository
from app.schemas.tickets import EntryTicketResponse
from app.services.realtime import admin_events_broker
from app.services.ticket_codes import generate_ticket_code


async def _count_expired(
    ticket_repository: TicketRepository,
    expiration_minutes: int,
) -> int:
    """Return the number of expired-but-not-yet-archived active tickets."""
    if expiration_minutes <= 0:
        return 0
    return await ticket_repository.count_expired_active(
        expiration_minutes=expiration_minutes, now=datetime.now(UTC)
    )


async def create_entry_ticket(*, session: AsyncSession, device_id: str) -> EntryTicketResponse:
    audit_repository = AuditRepository(session)
    device_repository = DeviceRepository(session)
    parking_repository = ParkingRepository(session)
    ticket_repository = TicketRepository(session)

    device = await device_repository.get_active_device(device_id, DeviceType.ENTRY)
    if device is None:
        raise AppError(403, "unknown_device", "La caseta de entrada no esta registrada")

    state = await parking_repository.lock_state()
    settings = await parking_repository.get_settings()

    # Discount expired tickets that haven't been archived yet, matching the
    # admin panel logic in get_status_summary.
    expired_count = await _count_expired(ticket_repository, settings.ticket_expiration_minutes)
    real_occupied = max(state.occupied_spaces - expired_count, 0)
    available_spaces = settings.capacity_total - real_occupied

    if available_spaces <= 0:
        await audit_repository.log(
            event_type="parking_full",
            actor_type="arduino_entry",
            actor_id=device_id,
            payload={
                "capacity_total": settings.capacity_total,
                "occupied_spaces": real_occupied,
            },
        )
        await session.commit()
        raise AppError(409, "parking_full", "Estacionamiento lleno")

    ticket = None
    for _ in range(5):
        code = normalize_ticket_code(generate_ticket_code())
        try:
            ticket = await ticket_repository.create(code=code, entry_device_id=device.id)
            break
        except IntegrityError:
            await session.rollback()
    if ticket is None:
        raise AppError(500, "ticket_generation_failed", "No fue posible generar un ticket unico")

    now = datetime.now(UTC)
    state.occupied_spaces += 1
    state.active_tickets_count += 1
    state.last_entry_at = now

    await audit_repository.log(
        event_type="ticket_created",
        actor_type="arduino_entry",
        actor_id=device_id,
        payload={"ticket_code": ticket.code},
        ticket_id=ticket.id,
    )
    await session.commit()
    await session.refresh(ticket)
    await session.refresh(state)
    await admin_events_broker.publish(
        {
            "type": "ticket_created",
            "ticket_code": ticket.code,
            "device_id": device_id,
            "entry_at": ticket.entry_at.isoformat(),
        }
    )

    # Recount expired after commit (the new ticket is fresh, won't be expired)
    expired_count = await _count_expired(ticket_repository, settings.ticket_expiration_minutes)
    real_occupied = max(state.occupied_spaces - expired_count, 0)

    return EntryTicketResponse(
        ticket_code=ticket.code,
        entry_at=ticket.entry_at,
        status=TicketStatus(ticket.status),
        payment_status=PaymentStatus(ticket.payment_status),
        available_spaces=max(settings.capacity_total - real_occupied, 0),
    )
