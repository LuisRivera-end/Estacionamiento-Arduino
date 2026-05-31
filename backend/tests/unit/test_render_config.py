from pathlib import Path


def test_parking_api_applies_migrations_before_starting() -> None:
    render_yaml = Path(__file__).resolve().parents[3] / "render.yaml"

    assert "startCommand: alembic upgrade head && uvicorn app.main:app" in render_yaml.read_text()
