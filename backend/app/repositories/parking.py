from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parking import ParkingSettings, ParkingState, PricingRule


class ParkingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_settings(self) -> ParkingSettings:
        statement: Select[tuple[ParkingSettings]] = select(ParkingSettings).where(
            ParkingSettings.id == 1
        )
        return (await self.session.execute(statement)).scalar_one()

    async def get_state(self) -> ParkingState:
        statement: Select[tuple[ParkingState]] = select(ParkingState).where(
            ParkingState.id == 1
        )
        return (await self.session.execute(statement)).scalar_one()

    async def lock_state(self) -> ParkingState:
        statement: Select[tuple[ParkingState]] = (
            select(ParkingState).where(ParkingState.id == 1).with_for_update()
        )
        return (await self.session.execute(statement)).scalar_one()

    async def get_active_pricing_rule(self) -> PricingRule:
        statement: Select[tuple[PricingRule]] = (
            select(PricingRule).where(PricingRule.is_active.is_(True)).limit(1)
        )
        return (await self.session.execute(statement)).scalar_one()
