from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.models.enums import PaymentMethod, PaymentResult, PaymentStatus, TicketStatus
from app.repositories.audit import AuditRepository
from app.repositories.parking import ParkingRepository
from app.repositories.payments import PaymentRepository
from app.repositories.tickets import TicketRepository
from app.schemas.payments import SimulatedPaymentResponse
from app.schemas.tickets import DiscountPayload
from app.services.pricing import (
    PricingSnapshot,
    calculate_duration_minutes,
    calculate_payment_breakdown,
)
from app.services.realtime import admin_events_broker


async def simulate_payment(
    *,
    session: AsyncSession,
    ticket_code: str,
    lost_ticket: bool,
    method: PaymentMethod,
    discount: DiscountPayload | None,
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
        senior_discount_percent=pricing_rule.senior_discount_percent,
        student_discount_percent=pricing_rule.student_discount_percent,
        student_allowed_domains=pricing_rule.student_allowed_domains,
        senior_discount_applies_to_lost_ticket=pricing_rule.senior_discount_applies_to_lost_ticket,
        student_discount_applies_to_lost_ticket=pricing_rule.student_discount_applies_to_lost_ticket,
    )
    breakdown = calculate_payment_breakdown(
        pricing=pricing,
        duration_minutes=duration_minutes,
        lost_ticket=lost_ticket,
        discount=discount,
        raise_on_lost_ticket_discount_blocked=True,
    )
    selected_method = resolve_payment_method(method=method, lost_ticket=lost_ticket)
    simulation_reference = f"sim_payment_{normalized_code}_{now.strftime('%Y%m%d%H%M%S')}"
    provider_reference = simulation_reference
    payment = await payment_repository.create(
        ticket_id=ticket.id,
        subtotal_amount=breakdown.subtotal_amount,
        discount_type=breakdown.discount_type,
        discount_percent=breakdown.discount_percent,
        discount_amount=breakdown.discount_amount,
        amount=breakdown.amount,
        method=selected_method,
        status=PaymentResult.SIMULATED,
        simulation_reference=simulation_reference,
        provider_reference=provider_reference,
        discount_evidence=breakdown.discount_evidence,
        created_by=created_by,
    )
    ticket.payment_status = PaymentStatus.PAID
    ticket.paid_at = now
    ticket.calculated_amount = breakdown.amount
    ticket.duration_minutes = duration_minutes
    ticket.lost_ticket = lost_ticket

    await audit_repository.log(
        event_type="payment_simulated",
        actor_type="admin" if created_by else "public_payment",
        actor_id=created_by,
        payload={
            "ticket_code": normalized_code,
            "subtotal_amount": breakdown.subtotal_amount,
            "discount_type": str(breakdown.discount_type),
            "discount_percent": breakdown.discount_percent,
            "discount_amount": breakdown.discount_amount,
            "amount": breakdown.amount,
            "lost_ticket": lost_ticket,
        },
        ticket_id=ticket.id,
    )
    await session.commit()
    await admin_events_broker.publish(
        {
            "type": "payment_simulated",
            "ticket_code": ticket.code,
            "amount": breakdown.amount,
            "method": str(selected_method),
            "created_by": created_by,
            "created_at": now.isoformat(),
        }
    )

    return SimulatedPaymentResponse(
        payment_id=payment.id,
        ticket_code=ticket.code,
        status=PaymentResult.SIMULATED,
        subtotal_amount=breakdown.subtotal_amount,
        discount_type=breakdown.discount_type,
        discount_percent=breakdown.discount_percent,
        discount_amount=breakdown.discount_amount,
        amount=breakdown.amount,
        simulation_reference=simulation_reference,
        provider_reference=provider_reference,
    )


def resolve_payment_method(*, method: PaymentMethod, lost_ticket: bool) -> PaymentMethod:
    if method == PaymentMethod.SIMULATED_STRIPE:
        method = PaymentMethod.SIMULATED_PAYMENT
    if lost_ticket and method == PaymentMethod.SIMULATED_PAYMENT:
        return PaymentMethod.LOST_TICKET
    return method
