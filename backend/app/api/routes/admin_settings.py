from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin_user
from app.db.session import get_session
from app.repositories.parking import ParkingRepository
from app.schemas.settings import ParkingSettingsResponse

router = APIRouter()


@router.get("/settings", response_model=ParkingSettingsResponse)
async def get_settings_route(
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> ParkingSettingsResponse:
    settings = await ParkingRepository(session).get_settings()
    return ParkingSettingsResponse(
        capacity_total=settings.capacity_total,
        timezone=settings.timezone,
        currency=settings.currency,
    )
