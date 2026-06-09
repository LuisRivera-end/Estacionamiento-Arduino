"""Admin dev-tools routes — only available in non-production environments."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff_user
from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.db.session import get_session
from app.repositories.audit import AuditRepository
from app.repositories.parking import ParkingRepository
from app.repositories.tickets import TicketRepository
from app.schemas.tickets import EntryTicketResponse
from app.services.realtime import admin_events_broker
from app.services.ticket_codes import generate_ticket_code

router = APIRouter()


@router.post("/dev/ticket", response_model=EntryTicketResponse)
async def create_test_ticket(
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> EntryTicketResponse:
    """Create a test entry ticket without requiring an Arduino device.

    Intended for development and QA workflows. Protected by staff authentication.
    """
    audit_repository = AuditRepository(session)
    parking_repository = ParkingRepository(session)
    ticket_repository = TicketRepository(session)

    state = await parking_repository.lock_state()
    settings = await parking_repository.get_settings()
    available_spaces = settings.capacity_total - state.occupied_spaces

    if available_spaces <= 0:
        raise AppError(409, "parking_full", "Estacionamiento lleno")

    ticket = None
    for _ in range(5):
        code = normalize_ticket_code(generate_ticket_code())
        try:
            ticket = await ticket_repository.create(code=code, entry_device_id=None)
            break
        except IntegrityError:
            await session.rollback()
    if ticket is None:
        raise AppError(500, "ticket_generation_failed", "No fue posible generar un ticket único")

    now = datetime.now(UTC)
    state.occupied_spaces += 1
    state.active_tickets_count += 1
    state.last_entry_at = now

    await audit_repository.log(
        event_type="ticket_created",
        actor_type="admin_dev",
        actor_id=None,
        payload={"ticket_code": ticket.code, "source": "dev_tool"},
        ticket_id=ticket.id,
    )
    await session.commit()
    await session.refresh(ticket)
    await session.refresh(state)
    await admin_events_broker.publish(
        {
            "type": "ticket_created",
            "ticket_code": ticket.code,
            "device_id": None,
            "entry_at": ticket.entry_at.isoformat(),
        }
    )

    return EntryTicketResponse(
        ticket_code=ticket.code,
        entry_at=ticket.entry_at,
        status=ticket.status,
        payment_status=ticket.payment_status,
        available_spaces=max(settings.capacity_total - state.occupied_spaces, 0),
    )
