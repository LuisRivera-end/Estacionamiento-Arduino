from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.models.enums import DeviceType, PaymentStatus, TicketStatus
from app.repositories.audit import AuditRepository
from app.repositories.devices import DeviceRepository
from app.repositories.parking import ParkingRepository
from app.repositories.tickets import TicketRepository
from app.schemas.tickets import ExitValidationResponse
from app.services.entry_flow import _count_expired
from app.services.pricing import calculate_amount, calculate_duration_minutes
from app.services.realtime import admin_events_broker
from app.services.ticket_expiration import is_ticket_expired


async def validate_exit(
    *,
    session: AsyncSession,
    ticket_code: str,
    device_id: str,
) -> ExitValidationResponse:
    normalized_code = normalize_ticket_code(ticket_code)
    audit_repository = AuditRepository(session)
    device_repository = DeviceRepository(session)
    parking_repository = ParkingRepository(session)
    ticket_repository = TicketRepository(session)

    device = await device_repository.get_active_device(device_id, DeviceType.EXIT)
    if device is None:
        raise AppError(403, "unknown_device", "La caseta de salida no esta registrada")

    ticket = await ticket_repository.get_for_update_by_code(normalized_code)
    if ticket is None:
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")
    if ticket.status == TicketStatus.EXITED:
        raise AppError(409, "ticket_already_exited", "El ticket ya fue usado para salir")

    # Defensive expiration check
    settings = await parking_repository.get_settings()
    if is_ticket_expired(ticket.entry_at, settings.ticket_expiration_minutes):
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")

    state = await parking_repository.lock_state()
    pricing_rule = await parking_repository.get_active_pricing_rule()

    now = datetime.now(UTC)
    duration_minutes = calculate_duration_minutes(ticket.entry_at, now)
    amount = calculate_amount(
        duration_minutes=duration_minutes,
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        block_minutes=pricing_rule.block_minutes,
        block_amount=pricing_rule.block_amount,
        lost_ticket_fee=pricing_rule.lost_ticket_fee,
        lost_ticket=ticket.lost_ticket,
    )

    if ticket.payment_status == PaymentStatus.UNPAID and amount > 0:
        await audit_repository.log(
            event_type="exit_blocked",
            actor_type="arduino_exit",
            actor_id=device_id,
            payload={"ticket_code": normalized_code, "reason": "payment_required"},
            ticket_id=ticket.id,
        )
        await session.commit()
        return ExitValidationResponse(
            authorized=False,
            reason="payment_required",
            message="Pago pendiente",
        )

    if ticket.payment_status == PaymentStatus.UNPAID and amount == 0:
        ticket.payment_status = PaymentStatus.EXEMPTED

    ticket.status = TicketStatus.EXITED
    ticket.exit_at = now
    ticket.duration_minutes = duration_minutes
    ticket.calculated_amount = max(ticket.calculated_amount, amount)
    ticket.exit_device_id = device.id

    state.occupied_spaces = max(state.occupied_spaces - 1, 0)
    state.active_tickets_count = max(state.active_tickets_count - 1, 0)
    state.last_exit_at = now

    await audit_repository.log(
        event_type="exit_authorized",
        actor_type="arduino_exit",
        actor_id=device_id,
        payload={"ticket_code": normalized_code},
        ticket_id=ticket.id,
    )
    await session.commit()
    await admin_events_broker.publish(
        {
            "type": "exit_authorized",
            "ticket_code": ticket.code,
            "device_id": device_id,
            "exit_at": ticket.exit_at.isoformat() if ticket.exit_at else None,
        }
    )

    # Discount expired tickets to match admin panel logic
    expired_count = await _count_expired(ticket_repository, settings.ticket_expiration_minutes)
    real_occupied = max(state.occupied_spaces - expired_count, 0)

    return ExitValidationResponse(
        authorized=True,
        message="Salida autorizada",
        ticket_code=ticket.code,
        exit_at=ticket.exit_at,
        available_spaces=max(settings.capacity_total - real_occupied, 0),
    )
