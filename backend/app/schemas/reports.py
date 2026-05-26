from pydantic import BaseModel


class SummaryReportResponse(BaseModel):
    entries_today: int
    exits_today: int
    paid_tickets: int
    lost_tickets: int
    simulated_revenue_today: int
