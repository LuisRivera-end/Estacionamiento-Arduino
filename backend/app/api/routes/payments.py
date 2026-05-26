from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.payments import SimulatedPaymentResponse, SimulatePaymentRequest
from app.services.payments import simulate_payment

router = APIRouter()


@router.post("/payments/simulate", response_model=SimulatedPaymentResponse)
async def simulate_public_payment(
    payload: SimulatePaymentRequest,
    session: AsyncSession = Depends(get_session),
) -> SimulatedPaymentResponse:
    return await simulate_payment(
        session=session,
        ticket_code=payload.ticket_code,
        lost_ticket=payload.lost_ticket,
        method=payload.method,
    )
