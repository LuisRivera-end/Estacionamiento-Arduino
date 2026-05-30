import secrets

# Caracteres válidos del teclado matricial 4x4 del Arduino: 0-9 y A-D
ALPHABET = "0123456789ABCD"


def generate_ticket_code(length: int = 6) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
