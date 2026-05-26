from __future__ import annotations

from datetime import datetime, time, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.parking import ParkingRepository
from app.repositories.payments import PaymentRepository
from app.repositories.tickets import TicketRepository
from app.schemas.reports import SummaryReportResponse
from app.schemas.status import StatusResponse
from app.services.reports import build_status_response, build_summary_response


def day_window(now: datetime) -> tuple[datetime, datetime]:
    start = datetime.combine(now.date(), time.min, tzinfo=now.tzinfo)
    return start, start + timedelta(days=1)


async def get_status_summary(session: AsyncSession) -> StatusResponse:
    parking_repository = ParkingRepository(session)
    settings = await parking_repository.get_settings()
    state = await parking_repository.get_state()
    return build_status_response(
        capacity_total=settings.capacity_total,
        occupied_spaces=state.occupied_spaces,
        active_tickets=state.active_tickets_count,
        last_entry_at=state.last_entry_at,
        last_exit_at=state.last_exit_at,
    )


async def get_daily_summary(session: AsyncSession, now: datetime) -> SummaryReportResponse:
    ticket_repository = TicketRepository(session)
    payment_repository = PaymentRepository(session)
    start_at, end_at = day_window(now)
    return build_summary_response(
        entries_today=await ticket_repository.summary_count("entry_at", start_at, end_at),
        exits_today=await ticket_repository.summary_count("exit_at", start_at, end_at),
        paid_tickets=await ticket_repository.count_paid_tickets(start_at, end_at),
        lost_tickets=await ticket_repository.count_lost_tickets(start_at, end_at),
        simulated_revenue_today=await payment_repository.sum_revenue(start_at, end_at),
    )
