from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from math import ceil

from app.core.errors import AppError
from app.models.enums import DiscountType
from app.schemas.tickets import DiscountPayload


@dataclass(slots=True)
class PricingSnapshot:
    free_tolerance_minutes: int
    block_minutes: int
    block_amount: int
    lost_ticket_fee: int
    currency: str
    senior_discount_percent: int
    student_discount_percent: int
    student_allowed_domains: list[str]
    senior_discount_applies_to_lost_ticket: bool
    student_discount_applies_to_lost_ticket: bool


@dataclass(slots=True)
class PaymentBreakdown:
    subtotal_amount: int
    discount_type: DiscountType
    discount_percent: int
    discount_amount: int
    amount: int
    lost_ticket_discount_applied: bool
    discount_evidence: dict[str, str] | None


def calculate_duration_minutes(entry_at: datetime, current_time: datetime) -> int:
    if entry_at.tzinfo is None:
        entry_at = entry_at.replace(tzinfo=UTC)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=UTC)
    return max(0, ceil((current_time - entry_at).total_seconds() / 60))


def calculate_amount(
    *,
    duration_minutes: int,
    free_tolerance_minutes: int,
    block_minutes: int,
    block_amount: int,
    lost_ticket_fee: int,
    lost_ticket: bool,
) -> int:
    if lost_ticket:
        return lost_ticket_fee

    if duration_minutes <= free_tolerance_minutes:
        return 0

    extra_minutes = duration_minutes - free_tolerance_minutes
    blocks = ceil(extra_minutes / block_minutes)
    return blocks * block_amount


def calculate_payment_breakdown(
    *,
    pricing: PricingSnapshot,
    duration_minutes: int,
    lost_ticket: bool,
    discount: DiscountPayload | None,
    raise_on_lost_ticket_discount_blocked: bool = False,
) -> PaymentBreakdown:
    subtotal_amount = calculate_amount(
        duration_minutes=duration_minutes,
        free_tolerance_minutes=pricing.free_tolerance_minutes,
        block_minutes=pricing.block_minutes,
        block_amount=pricing.block_amount,
        lost_ticket_fee=pricing.lost_ticket_fee,
        lost_ticket=lost_ticket,
    )
    discount_type, discount_percent, lost_ticket_discount_applied, discount_evidence = (
        resolve_discount(
            pricing=pricing,
            lost_ticket=lost_ticket,
            discount=discount,
            raise_on_lost_ticket_discount_blocked=raise_on_lost_ticket_discount_blocked,
        )
    )
    discount_amount = subtotal_amount * discount_percent // 100
    amount = max(0, subtotal_amount - discount_amount)
    return PaymentBreakdown(
        subtotal_amount=subtotal_amount,
        discount_type=discount_type,
        discount_percent=discount_percent,
        discount_amount=discount_amount,
        amount=amount,
        lost_ticket_discount_applied=lost_ticket_discount_applied,
        discount_evidence=discount_evidence,
    )


def resolve_discount(
    *,
    pricing: PricingSnapshot,
    lost_ticket: bool,
    discount: DiscountPayload | None,
    raise_on_lost_ticket_discount_blocked: bool,
) -> tuple[DiscountType, int, bool, dict[str, str] | None]:
    if discount is None or discount.type == DiscountType.NONE:
        return DiscountType.NONE, 0, False, None

    if discount.type == DiscountType.SENIOR:
        identifier_type = (discount.senior_identifier_type or "").strip().lower()
        identifier_value = (discount.senior_identifier_value or "").strip()
        if identifier_type not in {"code", "license_plate", "document"} or not identifier_value:
            raise AppError(
                422,
                "invalid_discount",
                "Datos invalidos para descuento de adulto mayor",
            )
        discount_percent = clamp_percent(pricing.senior_discount_percent)
        discount_evidence = {
            "identifier_type": identifier_type,
            "identifier_value": identifier_value,
        }
        if lost_ticket and not pricing.senior_discount_applies_to_lost_ticket:
            if raise_on_lost_ticket_discount_blocked:
                raise AppError(
                    409,
                    "discount_not_allowed_for_lost_ticket",
                    "El descuento no aplica para ticket extraviado",
                )
            return DiscountType.SENIOR, 0, False, discount_evidence
        return DiscountType.SENIOR, discount_percent, lost_ticket, discount_evidence

    if discount.type == DiscountType.STUDENT:
        student_email = (discount.student_email or "").strip().lower()
        if "@" not in student_email:
            raise AppError(422, "invalid_discount", "Correo escolar invalido")
        domain = student_email.rsplit("@", 1)[1].strip()
        if not domain or not email_domain_is_allowed(domain, pricing.student_allowed_domains):
            raise AppError(422, "invalid_discount", "Correo escolar invalido")
        discount_percent = clamp_percent(pricing.student_discount_percent)
        discount_evidence = {"student_email_domain": domain}
        if lost_ticket and not pricing.student_discount_applies_to_lost_ticket:
            if raise_on_lost_ticket_discount_blocked:
                raise AppError(
                    409,
                    "discount_not_allowed_for_lost_ticket",
                    "El descuento no aplica para ticket extraviado",
                )
            return DiscountType.STUDENT, 0, False, discount_evidence
        return DiscountType.STUDENT, discount_percent, lost_ticket, discount_evidence

    raise AppError(422, "invalid_discount", "Tipo de descuento no valido")


def email_domain_is_allowed(domain: str, allowed_domains: list[str]) -> bool:
    normalized_domain = domain.lower().strip()
    for raw_pattern in allowed_domains:
        pattern = raw_pattern.lower().strip()
        if not pattern:
            continue
        if pattern.startswith("."):
            if normalized_domain.endswith(pattern):
                return True
            continue
        if normalized_domain == pattern or normalized_domain.endswith(f".{pattern}"):
            return True
    return False


def clamp_percent(value: int) -> int:
    return max(0, min(100, value))
