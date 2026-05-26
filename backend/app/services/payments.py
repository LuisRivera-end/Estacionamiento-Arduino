from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.models.enums import PaymentResult, PaymentStatus, TicketStatus
from app.repositories.audit import AuditRepository
from app.repositories.parking import ParkingRepository
from app.repositories.payments import PaymentRepository
from app.repositories.tickets import TicketRepository
from app.schemas.payments import SimulatedPaymentResponse
from app.services.pricing import PricingSnapshot, calculate_amount, calculate_duration_minutes
from app.services.realtime import admin_events_broker


async def simulate_payment(
    *,
    session: AsyncSession,
    ticket_code: str,
    lost_ticket: bool,
    method,
    created_by: str | None = None,
) -> SimulatedPaymentResponse:
    normalized_code = normalize_ticket_code(ticket_code)
    ticket_repository = TicketRepository(session)
    parking_repository = ParkingRepository(session)
    payment_repository = PaymentRepository(session)
    audit_repository = AuditRepository(session)

    ticket = await ticket_repository.get_for_update_by_code(normalized_code)
    if ticket is None:
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")
    if ticket.status != TicketStatus.ACTIVE:
        raise AppError(409, "ticket_not_active", "El ticket ya no esta activo")

    pricing_rule = await parking_repository.get_active_pricing_rule()
    settings = await parking_repository.get_settings()
    now = datetime.now(UTC)
    duration_minutes = calculate_duration_minutes(ticket.entry_at, now)
    pricing = PricingSnapshot(
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        block_minutes=pricing_rule.block_minutes,
        block_amount=pricing_rule.block_amount,
        lost_ticket_fee=pricing_rule.lost_ticket_fee,
        currency=settings.currency,
    )
    amount = calculate_amount(
        duration_minutes=duration_minutes,
        free_tolerance_minutes=pricing.free_tolerance_minutes,
        block_minutes=pricing.block_minutes,
        block_amount=pricing.block_amount,
        lost_ticket_fee=pricing.lost_ticket_fee,
        lost_ticket=lost_ticket,
    )
    provider_reference = f"sim_{method}_{normalized_code}_{int(now.timestamp())}"
    payment = await payment_repository.create(
        ticket_id=ticket.id,
        amount=amount,
        method=method,
        status=PaymentResult.SIMULATED,
        provider_reference=provider_reference,
        created_by=created_by,
    )
    ticket.payment_status = PaymentStatus.PAID
    ticket.paid_at = now
    ticket.calculated_amount = amount
    ticket.duration_minutes = duration_minutes
    ticket.lost_ticket = lost_ticket

    await audit_repository.log(
        event_type="payment_simulated",
        actor_type="admin" if created_by else "public_payment",
        actor_id=created_by,
        payload={"ticket_code": normalized_code, "amount": amount, "lost_ticket": lost_ticket},
        ticket_id=ticket.id,
    )
    await session.commit()
    await admin_events_broker.publish(
        {
            "type": "payment_simulated",
            "ticket_code": ticket.code,
            "amount": amount,
            "method": str(method),
            "created_by": created_by,
            "created_at": now.isoformat(),
        }
    )

    return SimulatedPaymentResponse(
        payment_id=payment.id,
        ticket_code=ticket.code,
        status=PaymentResult.SIMULATED,
        amount=amount,
        provider_reference=provider_reference,
    )
