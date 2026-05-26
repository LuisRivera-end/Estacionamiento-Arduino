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
from app.services.ticket_codes import generate_ticket_code


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
    available_spaces = settings.capacity_total - state.occupied_spaces

    if available_spaces <= 0:
        await audit_repository.log(
            event_type="parking_full",
            actor_type="arduino_entry",
            actor_id=device_id,
            payload={
                "capacity_total": settings.capacity_total,
                "occupied_spaces": state.occupied_spaces,
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

    return EntryTicketResponse(
        ticket_code=ticket.code,
        entry_at=ticket.entry_at,
        status=TicketStatus(ticket.status),
        payment_status=PaymentStatus(ticket.payment_status),
        available_spaces=max(settings.capacity_total - state.occupied_spaces, 0),
    )
