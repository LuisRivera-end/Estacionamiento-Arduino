from app.api.deps import get_jwt_verifier
from app.core.config import Settings


def test_effective_supabase_db_url_normalizes_plain_postgres_url() -> None:
    settings = Settings(
        supabase_db_url="postgresql://postgres:secret@db.example.com:5432/postgres",
    )

    assert (
        settings.effective_supabase_db_url
        == "postgresql+asyncpg://postgres:secret@db.example.com:5432/postgres"
    )


def test_effective_supabase_db_url_keeps_async_driver_url() -> None:
    settings = Settings(
        supabase_db_url="postgresql+asyncpg://postgres:secret@db.example.com:5432/postgres",
    )

    assert (
        settings.effective_supabase_db_url
        == "postgresql+asyncpg://postgres:secret@db.example.com:5432/postgres"
    )


def test_get_jwt_verifier_is_cached() -> None:
    get_jwt_verifier.cache_clear()

    first = get_jwt_verifier()
    second = get_jwt_verifier()

    assert first is second
