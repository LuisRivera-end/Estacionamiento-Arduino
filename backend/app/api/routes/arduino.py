from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_entry_device, require_exit_device
from app.db.session import get_session
from app.schemas.tickets import (
    EntryTicketRequest,
    EntryTicketResponse,
    ExitValidationRequest,
    ExitValidationResponse,
)
from app.services.entry_flow import create_entry_ticket
from app.services.exit_flow import validate_exit

router = APIRouter()


@router.post("/entry/tickets", response_model=EntryTicketResponse)
async def create_ticket_for_entry(
    payload: EntryTicketRequest,
    _: str = Depends(require_entry_device),
    session: AsyncSession = Depends(get_session),
) -> EntryTicketResponse:
    return await create_entry_ticket(session=session, device_id=payload.device_id)


@router.post("/exit/validate", response_model=ExitValidationResponse)
async def validate_ticket_exit(
    payload: ExitValidationRequest,
    _: str = Depends(require_exit_device),
    session: AsyncSession = Depends(get_session),
) -> ExitValidationResponse:
    return await validate_exit(
        session=session,
        ticket_code=payload.ticket_code,
        device_id=payload.device_id,
    )
