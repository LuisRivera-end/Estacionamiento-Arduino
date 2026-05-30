from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin_user
from app.db.session import get_session
from app.repositories.parking import ParkingRepository
from app.schemas.settings import (
    ParkingSettingsResponse,
    ParkingSettingsUpdateRequest,
    PricingRuleResponse,
    PricingRuleUpdateRequest,
)

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


@router.put("/settings", response_model=ParkingSettingsResponse)
async def update_settings_route(
    payload: ParkingSettingsUpdateRequest,
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> ParkingSettingsResponse:
    settings = await ParkingRepository(session).update_settings(
        capacity_total=payload.capacity_total,
        timezone=payload.timezone,
        currency=payload.currency,
    )
    await session.commit()
    return ParkingSettingsResponse(
        capacity_total=settings.capacity_total,
        timezone=settings.timezone,
        currency=settings.currency,
    )


@router.get("/pricing", response_model=PricingRuleResponse)
async def get_pricing_route(
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> PricingRuleResponse:
    pricing_rule = await ParkingRepository(session).get_active_pricing_rule()
    return PricingRuleResponse(
        name=pricing_rule.name,
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        block_minutes=pricing_rule.block_minutes,
        block_amount=pricing_rule.block_amount,
        lost_ticket_fee=pricing_rule.lost_ticket_fee,
        senior_discount_percent=pricing_rule.senior_discount_percent,
        student_discount_percent=pricing_rule.student_discount_percent,
        student_allowed_domains=pricing_rule.student_allowed_domains,
        senior_discount_applies_to_lost_ticket=pricing_rule.senior_discount_applies_to_lost_ticket,
        student_discount_applies_to_lost_ticket=pricing_rule.student_discount_applies_to_lost_ticket,
        is_active=pricing_rule.is_active,
    )


@router.put("/pricing", response_model=PricingRuleResponse)
async def update_pricing_route(
    payload: PricingRuleUpdateRequest,
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> PricingRuleResponse:
    pricing_rule = await ParkingRepository(session).update_active_pricing_rule(
        name=payload.name,
        free_tolerance_minutes=payload.free_tolerance_minutes,
        block_minutes=payload.block_minutes,
        block_amount=payload.block_amount,
        lost_ticket_fee=payload.lost_ticket_fee,
        senior_discount_percent=payload.senior_discount_percent,
        student_discount_percent=payload.student_discount_percent,
        student_allowed_domains=payload.student_allowed_domains,
        senior_discount_applies_to_lost_ticket=payload.senior_discount_applies_to_lost_ticket,
        student_discount_applies_to_lost_ticket=payload.student_discount_applies_to_lost_ticket,
    )
    await session.commit()
    return PricingRuleResponse(
        name=pricing_rule.name,
        free_tolerance_minutes=pricing_rule.free_tolerance_minutes,
        block_minutes=pricing_rule.block_minutes,
        block_amount=pricing_rule.block_amount,
        lost_ticket_fee=pricing_rule.lost_ticket_fee,
        senior_discount_percent=pricing_rule.senior_discount_percent,
        student_discount_percent=pricing_rule.student_discount_percent,
        student_allowed_domains=pricing_rule.student_allowed_domains,
        senior_discount_applies_to_lost_ticket=pricing_rule.senior_discount_applies_to_lost_ticket,
        student_discount_applies_to_lost_ticket=pricing_rule.student_discount_applies_to_lost_ticket,
        is_active=pricing_rule.is_active,
    )
