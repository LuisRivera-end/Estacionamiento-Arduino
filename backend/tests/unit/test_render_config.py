from pathlib import Path


def test_parking_api_applies_migrations_before_starting() -> None:
    render_yaml = Path(__file__).resolve().parents[3] / "render.yaml"

    assert (
        "startCommand: python -m app.db.migrate && uvicorn app.main:app" in render_yaml.read_text()
    )


def test_alembic_env_supports_async_database_url() -> None:
    alembic_env = Path(__file__).resolve().parents[2] / "app/db/migrations/env.py"

    assert "async_engine_from_config" in alembic_env.read_text()
