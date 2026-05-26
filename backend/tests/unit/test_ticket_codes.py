from app.services.ticket_codes import generate_ticket_code


def test_generate_ticket_code_shape() -> None:
    ticket_code = generate_ticket_code()

    assert len(ticket_code) == 5
    assert ticket_code.isalnum()
    assert ticket_code == ticket_code.upper()

