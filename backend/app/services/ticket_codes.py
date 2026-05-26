import secrets
import string

ALPHABET = string.ascii_uppercase + string.digits


def generate_ticket_code(length: int = 5) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
