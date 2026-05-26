from datetime import datetime

from pydantic import BaseModel


class SummaryReportResponse(BaseModel):
    entries_today: int
    exits_today: int
    paid_tickets: int
    lost_tickets: int
    simulated_revenue_today: int


class AdminTicketItemResponse(BaseModel):
    ticket_code: str
    status: str
    payment_status: str
    entry_at: datetime
    paid_at: datetime | None
    exit_at: datetime | None
    calculated_amount: int
    lost_ticket: bool


class AdminPaymentItemResponse(BaseModel):
    payment_id: str
    ticket_code: str
    amount: int
    method: str
    status: str
    provider_reference: str | None
    created_by: str | None
    created_at: datetime


class AdminEventItemResponse(BaseModel):
    event_at: datetime
    event_type: str
    ticket_code: str
    device_id: str | None
    result: str


class AdminTicketsPageResponse(BaseModel):
    items: list[AdminTicketItemResponse]
    total: int
    page: int
    page_size: int


class AdminPaymentsPageResponse(BaseModel):
    items: list[AdminPaymentItemResponse]
    total: int
    page: int
    page_size: int


class AdminEventsPageResponse(BaseModel):
    items: list[AdminEventItemResponse]
    total: int
    page: int
    page_size: int
