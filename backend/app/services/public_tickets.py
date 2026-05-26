from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import normalize_ticket_code
from app.repositories.parking import ParkingRepository
from app.repositories.tickets import TicketRepository
from app.schemas.tickets import TicketCalculationResponse, TicketResponse
from app.services.pricing import calculate_amount, calculate_duration_minutes


async def get_ticket_response(*, session: AsyncSession, code: str) -> TicketResponse:
    ticket = await TicketRepository(session).get_by_code(normalize_ticket_code(code))
    if ticket is None:
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
) -> TicketCalculationResponse:
    ticket = await TicketRepository(session).get_by_code(normalize_ticket_code(code))
    if ticket is None:
        raise AppError(404, "ticket_not_found", "Ticket no encontrado")

    parking_repository = ParkingRepository(session)
    pricing_rule = await parking_repository.get_active_pricing_rule()
    settings = await parking_repository.get_settings()

    duration_minutes = calculate_duration_minutes(ticket.entry_at, datetime.now(UTC))
    amount = calculate_amount(
        duration_minutes=duration_minutes,
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        block_minutes=pricing_rule.block_minutes,
        block_amount=pricing_rule.block_amount,
        lost_ticket_fee=pricing_rule.lost_ticket_fee,
        lost_ticket=lost_ticket,
    )
    return TicketCalculationResponse(
        ticket_code=ticket.code,
        duration_minutes=duration_minutes,
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        amount=amount,
        currency=settings.currency,
    )

