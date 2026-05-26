from datetime import datetime

from pydantic import BaseModel

from app.models.enums import PaymentStatus, TicketStatus


class TicketResponse(BaseModel):
    ticket_code: str
    status: TicketStatus
    payment_status: PaymentStatus
    entry_at: datetime
    paid_at: datetime | None
    exit_at: datetime | None
    lost_ticket: bool


class TicketCalculationRequest(BaseModel):
    lost_ticket: bool = False


class TicketCalculationResponse(BaseModel):
    ticket_code: str
    duration_minutes: int
    free_tolerance_minutes: int
    amount: int
    currency: str


class EntryTicketRequest(BaseModel):
    device_id: str


class EntryTicketResponse(BaseModel):
    ticket_code: str
    entry_at: datetime
    status: TicketStatus
    payment_status: PaymentStatus
    available_spaces: int


class ExitValidationRequest(BaseModel):
    ticket_code: str
    device_id: str


class ExitValidationResponse(BaseModel):
    authorized: bool
    message: str
    ticket_code: str | None = None
    exit_at: datetime | None = None
    available_spaces: int | None = None
    reason: str | None = None
