from pydantic import BaseModel

from app.models.enums import DiscountType, PaymentMethod, PaymentResult
from app.schemas.tickets import DiscountPayload


class SimulatePaymentRequest(BaseModel):
    ticket_code: str
    lost_ticket: bool = False
    method: PaymentMethod = PaymentMethod.SIMULATED_PAYMENT
    discount: DiscountPayload | None = None


class SimulatedPaymentResponse(BaseModel):
    payment_id: str
    ticket_code: str
    status: PaymentResult
    subtotal_amount: int
    discount_type: DiscountType
    discount_percent: int
    discount_amount: int
    amount: int
    simulation_reference: str
    provider_reference: str | None = None
