from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.parking import ParkingRepository

router = APIRouter()


class ParkingNameResponse(BaseModel):
    parking_name: str


@router.get("/parking-name", response_model=ParkingNameResponse)
async def get_parking_name(
    session: AsyncSession = Depends(get_session),
) -> ParkingNameResponse:
    settings = await ParkingRepository(session).get_settings()
    return ParkingNameResponse(parking_name=settings.parking_name)
