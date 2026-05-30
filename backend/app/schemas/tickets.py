from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DiscountType, PaymentStatus, TicketStatus


class TicketResponse(BaseModel):
    ticket_code: str
    status: TicketStatus
    payment_status: PaymentStatus
    entry_at: datetime
    paid_at: datetime | None
    exit_at: datetime | None
    lost_ticket: bool


class DiscountPayload(BaseModel):
    type: DiscountType = DiscountType.NONE
    student_email: str | None = None
    senior_age: int | None = Field(default=None, ge=0, le=130)
    senior_document_type: str | None = Field(default=None, min_length=2, max_length=30)
    senior_document_last4: str | None = Field(default=None, min_length=2, max_length=12)


class TicketCalculationRequest(BaseModel):
    lost_ticket: bool = False
    discount: DiscountPayload | None = None


class TicketCalculationResponse(BaseModel):
    ticket_code: str
    duration_minutes: int
    free_tolerance_minutes: int
    subtotal_amount: int
    discount_type: DiscountType
    discount_percent: int
    discount_amount: int
    amount: int
    currency: str
    lost_ticket_discount_applied: bool


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
