from app.services.pricing import calculate_amount


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

