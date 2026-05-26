from pydantic import BaseModel

from app.models.enums import PaymentMethod, PaymentResult


class SimulatePaymentRequest(BaseModel):
    ticket_code: str
    lost_ticket: bool = False
    method: PaymentMethod = PaymentMethod.SIMULATED_STRIPE


class SimulatedPaymentResponse(BaseModel):
    payment_id: str
    ticket_code: str
    status: PaymentResult
    amount: int
    provider_reference: str
