from datetime import UTC, datetime, timedelta

from app.models.enums import DiscountType
from app.schemas.tickets import DiscountPayload
from app.services.pricing import PricingSnapshot, calculate_amount, calculate_payment_breakdown
from app.services.ticket_expiration import is_ticket_expired


def test_calculate_amount_after_tolerance_rounds_up_blocks() -> None:
    amount = calculate_amount(
        duration_minutes=64,
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        lost_ticket=False,
    )

    assert amount == 20


def test_calculate_amount_for_lost_ticket_uses_fixed_fee() -> None:
    amount = calculate_amount(
        duration_minutes=1,
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        lost_ticket=True,
    )

    assert amount == 150


def test_calculate_payment_breakdown_applies_student_discount() -> None:
    pricing = PricingSnapshot(
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        currency="MXN",
        senior_discount_percent=50,
        student_discount_percent=50,
        student_allowed_domains=[".edu", ".edu.mx"],
        senior_discount_applies_to_lost_ticket=False,
        student_discount_applies_to_lost_ticket=False,
    )

    breakdown = calculate_payment_breakdown(
        pricing=pricing,
        duration_minutes=64,
        lost_ticket=False,
        discount=DiscountPayload(type=DiscountType.STUDENT, student_email="test@campus.edu.mx"),
    )

    assert breakdown.subtotal_amount == 20
    assert breakdown.discount_amount == 10
    assert breakdown.amount == 10
    assert breakdown.discount_type == DiscountType.STUDENT


def test_calculate_payment_breakdown_lost_ticket_ignores_disallowed_discount() -> None:
    pricing = PricingSnapshot(
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        currency="MXN",
        senior_discount_percent=50,
        student_discount_percent=50,
        student_allowed_domains=[".edu", ".edu.mx"],
        senior_discount_applies_to_lost_ticket=False,
        student_discount_applies_to_lost_ticket=False,
    )

    breakdown = calculate_payment_breakdown(
        pricing=pricing,
        duration_minutes=10,
        lost_ticket=True,
        discount=DiscountPayload(
            type=DiscountType.SENIOR,
            senior_identifier_type="code",
            senior_identifier_value="INAP-1234",
        ),
    )

    assert breakdown.subtotal_amount == 150
    assert breakdown.discount_percent == 0
    assert breakdown.discount_amount == 0
    assert not breakdown.lost_ticket_discount_applied


def test_senior_discount_with_identifier_type_code() -> None:
    pricing = PricingSnapshot(
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        currency="MXN",
        senior_discount_percent=50,
        student_discount_percent=50,
        student_allowed_domains=[".edu"],
        senior_discount_applies_to_lost_ticket=False,
        student_discount_applies_to_lost_ticket=False,
    )

    breakdown = calculate_payment_breakdown(
        pricing=pricing,
        duration_minutes=64,
        lost_ticket=False,
        discount=DiscountPayload(
            type=DiscountType.SENIOR,
            senior_identifier_type="code",
            senior_identifier_value="INAP-5678",
        ),
    )

    assert breakdown.discount_type == DiscountType.SENIOR
    assert breakdown.discount_percent == 50
    assert breakdown.subtotal_amount == 20
    assert breakdown.discount_amount == 10
    assert breakdown.amount == 10
    assert breakdown.discount_evidence == {
        "identifier_type": "code",
        "identifier_value": "INAP-5678",
    }


def test_senior_discount_with_identifier_type_license_plate() -> None:
    pricing = PricingSnapshot(
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        currency="MXN",
        senior_discount_percent=50,
        student_discount_percent=50,
        student_allowed_domains=[".edu"],
        senior_discount_applies_to_lost_ticket=False,
        student_discount_applies_to_lost_ticket=False,
    )

    breakdown = calculate_payment_breakdown(
        pricing=pricing,
        duration_minutes=64,
        lost_ticket=False,
        discount=DiscountPayload(
            type=DiscountType.SENIOR,
            senior_identifier_type="license_plate",
            senior_identifier_value="ABC-123",
        ),
    )

    assert breakdown.discount_type == DiscountType.SENIOR
    assert breakdown.discount_percent == 50


def test_senior_discount_with_identifier_type_document() -> None:
    pricing = PricingSnapshot(
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        currency="MXN",
        senior_discount_percent=50,
        student_discount_percent=50,
        student_allowed_domains=[".edu"],
        senior_discount_applies_to_lost_ticket=False,
        student_discount_applies_to_lost_ticket=False,
    )

    breakdown = calculate_payment_breakdown(
        pricing=pricing,
        duration_minutes=64,
        lost_ticket=False,
        discount=DiscountPayload(
            type=DiscountType.SENIOR,
            senior_identifier_type="document",
            senior_identifier_value="INE-9876",
        ),
    )

    assert breakdown.discount_type == DiscountType.SENIOR
    assert breakdown.discount_percent == 50


def test_senior_discount_rejects_missing_identifier_value() -> None:
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        DiscountPayload(
            type=DiscountType.SENIOR,
            senior_identifier_type="code",
            senior_identifier_value="",
        )


def test_senior_discount_rejects_invalid_identifier_type() -> None:
    import pytest

    from app.core.errors import AppError

    pricing = PricingSnapshot(
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        currency="MXN",
        senior_discount_percent=50,
        student_discount_percent=50,
        student_allowed_domains=[".edu"],
        senior_discount_applies_to_lost_ticket=False,
        student_discount_applies_to_lost_ticket=False,
    )

    with pytest.raises(AppError):
        calculate_payment_breakdown(
            pricing=pricing,
            duration_minutes=64,
            lost_ticket=False,
            discount=DiscountPayload(
                type=DiscountType.SENIOR,
                senior_identifier_type=None,
                senior_identifier_value="INAP-1234",
            ),
        )


def test_is_ticket_expired_returns_true_when_past_expiration() -> None:
    entry_at = datetime.now(UTC) - timedelta(minutes=100)
    assert is_ticket_expired(entry_at, expiration_minutes=90) is True


def test_is_ticket_expired_returns_false_when_within_window() -> None:
    entry_at = datetime.now(UTC) - timedelta(minutes=30)
    assert is_ticket_expired(entry_at, expiration_minutes=90) is False


def test_is_ticket_expired_returns_false_for_zero_minutes() -> None:
    entry_at = datetime.now(UTC) - timedelta(minutes=30)
    # Edge case: if expiration is set to a value larger than elapsed
    assert is_ticket_expired(entry_at, expiration_minutes=60) is False
