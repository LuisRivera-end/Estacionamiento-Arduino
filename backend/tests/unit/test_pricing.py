from app.models.enums import DiscountType
from app.schemas.tickets import DiscountPayload
from app.services.pricing import PricingSnapshot, calculate_amount, calculate_payment_breakdown


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
            senior_age=68,
            senior_document_type="INAPAM",
            senior_document_last4="1234",
        ),
    )

    assert breakdown.subtotal_amount == 150
    assert breakdown.discount_percent == 0
    assert breakdown.discount_amount == 0
    assert not breakdown.lost_ticket_discount_applied

