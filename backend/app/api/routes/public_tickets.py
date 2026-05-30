from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.tickets import (
    TicketCalculationRequest,
    TicketCalculationResponse,
    TicketResponse,
)
from app.services.public_tickets import calculate_ticket_response, get_ticket_response

router = APIRouter()


@router.get("/tickets/{code}", response_model=TicketResponse)
async def get_public_ticket(
    code: str,
    session: AsyncSession = Depends(get_session),
) -> TicketResponse:
    return await get_ticket_response(session=session, code=code)


@router.post("/tickets/{code}/calculate", response_model=TicketCalculationResponse)
async def calculate_public_ticket(
    code: str,
    payload: TicketCalculationRequest,
    session: AsyncSession = Depends(get_session),
) -> TicketCalculationResponse:
    return await calculate_ticket_response(
        session=session,
        code=code,
        lost_ticket=payload.lost_ticket,
        discount=payload.discount,
    )
