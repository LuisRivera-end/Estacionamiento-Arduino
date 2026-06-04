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

    async def update_settings(
        self,
        *,
        capacity_total: int,
        timezone: str,
        currency: str,
        parking_name: str,
        ticket_expiration_minutes: int,
    ) -> ParkingSettings:
        settings = await self.get_settings()
        settings.capacity_total = capacity_total
        settings.timezone = timezone
        settings.currency = currency
        settings.parking_name = parking_name
        settings.ticket_expiration_minutes = ticket_expiration_minutes
        await self.session.flush()
        await self.session.refresh(settings)
        return settings

    async def update_active_pricing_rule(
        self,
        *,
        name: str,
        free_tolerance_minutes: int,
        block_minutes: int,
        block_amount: int,
        lost_ticket_fee: int,
        senior_discount_percent: int,
        student_discount_percent: int,
        student_allowed_domains: list[str],
        senior_discount_applies_to_lost_ticket: bool,
        student_discount_applies_to_lost_ticket: bool,
    ) -> PricingRule:
        pricing_rule = await self.get_active_pricing_rule()
        pricing_rule.name = name
        pricing_rule.free_tolerance_minutes = free_tolerance_minutes
        pricing_rule.block_minutes = block_minutes
        pricing_rule.block_amount = block_amount
        pricing_rule.lost_ticket_fee = lost_ticket_fee
        pricing_rule.senior_discount_percent = senior_discount_percent
        pricing_rule.student_discount_percent = student_discount_percent
        pricing_rule.student_allowed_domains = student_allowed_domains
        pricing_rule.senior_discount_applies_to_lost_ticket = (
            senior_discount_applies_to_lost_ticket
        )
        pricing_rule.student_discount_applies_to_lost_ticket = (
            student_discount_applies_to_lost_ticket
        )
        await self.session.flush()
        await self.session.refresh(pricing_rule)
        return pricing_rule
