from __future__ import annotations

from app.schemas.reports import SummaryReportResponse
from app.schemas.status import StatusResponse


def build_status_response(
    *,
    capacity_total: int,
    occupied_spaces: int,
    active_tickets: int,
    last_entry_at,
    last_exit_at,
) -> StatusResponse:
    return StatusResponse(
        capacity_total=capacity_total,
        occupied_spaces=occupied_spaces,
        available_spaces=max(capacity_total - occupied_spaces, 0),
        active_tickets=active_tickets,
        last_entry_at=last_entry_at,
        last_exit_at=last_exit_at,
    )


def build_summary_response(
    *,
    entries_today: int,
    exits_today: int,
    paid_tickets: int,
    lost_tickets: int,
    simulated_revenue_today: int,
) -> SummaryReportResponse:
    return SummaryReportResponse(
        entries_today=entries_today,
        exits_today=exits_today,
        paid_tickets=paid_tickets,
        lost_tickets=lost_tickets,
        simulated_revenue_today=simulated_revenue_today,
    )
