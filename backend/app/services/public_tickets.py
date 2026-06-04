from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.repositories.parking import ParkingRepository
from app.repositories.tickets import TicketRepository
from app.schemas.tickets import DiscountPayload, TicketCalculationResponse, TicketResponse
from app.services.pricing import (
    PricingSnapshot,
    calculate_duration_minutes,
    calculate_payment_breakdown,
)
from app.services.ticket_expiration import is_ticket_expired


async def get_ticket_response(*, session: AsyncSession, code: str) -> TicketResponse:
    ticket = await TicketRepository(session).get_by_code(normalize_ticket_code(code))
    if ticket is None:
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")

    # Defensive expiration check
    settings = await ParkingRepository(session).get_settings()
    if is_ticket_expired(ticket.entry_at, settings.ticket_expiration_minutes):
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")

    return TicketResponse(
        ticket_code=ticket.code,
        status=ticket.status,
        payment_status=ticket.payment_status,
        entry_at=ticket.entry_at,
        paid_at=ticket.paid_at,
        exit_at=ticket.exit_at,
        lost_ticket=ticket.lost_ticket,
    )


async def calculate_ticket_response(
    *,
    session: AsyncSession,
    code: str,
    lost_ticket: bool,
    discount: DiscountPayload | None,
) -> TicketCalculationResponse:
    ticket = await TicketRepository(session).get_by_code(normalize_ticket_code(code))
    if ticket is None:
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")

    parking_repository = ParkingRepository(session)
    settings = await parking_repository.get_settings()

    # Defensive expiration check
    if is_ticket_expired(ticket.entry_at, settings.ticket_expiration_minutes):
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")

    pricing_rule = await parking_repository.get_active_pricing_rule()

    duration_minutes = calculate_duration_minutes(ticket.entry_at, datetime.now(UTC))
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
    )

    return TicketCalculationResponse(
        ticket_code=ticket.code,
        duration_minutes=duration_minutes,
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        subtotal_amount=breakdown.subtotal_amount,
        discount_type=breakdown.discount_type,
        discount_percent=breakdown.discount_percent,
        discount_amount=breakdown.discount_amount,
        amount=breakdown.amount,
        currency=settings.currency,
        lost_ticket_discount_applied=breakdown.lost_ticket_discount_applied,
    )
