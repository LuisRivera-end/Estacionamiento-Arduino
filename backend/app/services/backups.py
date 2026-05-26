from uuid import uuid4


def generate_backup_id() -> str:
    return str(uuid4())
