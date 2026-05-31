from pathlib import Path


def test_alembic_revision_ids_fit_default_version_column() -> None:
    versions_dir = Path(__file__).resolve().parents[2] / "app/db/migrations/versions"

    for migration in versions_dir.glob("*.py"):
        namespace: dict[str, object] = {}
        exec(migration.read_text(), namespace)
        revision = namespace["revision"]

        assert isinstance(revision, str)
        assert len(revision) <= 32
