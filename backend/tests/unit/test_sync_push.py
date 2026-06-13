from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.dialects import postgresql

from app.models.base import Base
from app.services.sync_push import (
    SYNC_TABLES,
    WATERMARK_OVERLAP_SECONDS,
    ConflictPolicy,
    TableSpec,
    _compute_watermark,
    _non_pk_columns,
    build_select,
    build_upsert,
)


def _spec(name: str) -> TableSpec:
    return next(spec for spec in SYNC_TABLES if spec.name == name)


def _table(name: str):
    return Base.metadata.tables[name]


def _compiled(stmt) -> str:
    return str(stmt.compile(dialect=postgresql.dialect())).lower()


def test_sync_tables_order_is_fk_safe() -> None:
    order = [spec.name for spec in SYNC_TABLES]
    assert order.index("devices") < order.index("tickets")
    assert order.index("tickets") < order.index("payments")
    assert order.index("tickets") < order.index("audit_logs")
    assert order.index("tickets") < order.index("archived_tickets")


def test_excluded_tables_are_not_synced() -> None:
    names = {spec.name for spec in SYNC_TABLES}
    assert "staff_users" not in names
    assert "backup_exports" not in names
    assert "sync_state" not in names
    assert "alembic_version" not in names


def test_do_nothing_policy_for_append_only_tables() -> None:
    for name in ("payments", "audit_logs", "archived_tickets"):
        sql = _compiled(build_upsert(_table(name), [{"id": "x"}], _spec(name)))
        assert "on conflict" in sql
        assert "do nothing" in sql


def test_update_always_policy_has_no_where() -> None:
    sql = _compiled(build_upsert(_table("devices"), [{"id": "x"}], _spec("devices")))
    assert "do update set" in sql
    assert "where" not in sql


def test_update_if_newer_compares_timestamp() -> None:
    spec = _spec("tickets")
    assert spec.policy is ConflictPolicy.UPDATE_IF_NEWER
    sql = _compiled(
        build_upsert(_table("tickets"), [{"id": "t1", "updated_at": datetime.now(UTC)}], spec)
    )
    assert "do update set" in sql
    assert "where" in sql
    assert "updated_at" in sql


def test_non_pk_columns_excludes_primary_key() -> None:
    assert "id" not in _non_pk_columns(_table("devices"))
    assert "device_id" in _non_pk_columns(_table("devices"))


def test_pricing_rules_uses_special_policy() -> None:
    assert _spec("pricing_rules").policy is ConflictPolicy.PRICING


def test_build_select_applies_watermark_overlap() -> None:
    spec = _spec("tickets")
    watermark = datetime(2026, 6, 13, 12, 0, 0, tzinfo=UTC)
    sql = _compiled(build_select(_table("tickets"), spec, watermark))
    assert "where" in sql
    assert "updated_at" in sql


def test_build_select_full_table_has_no_filter() -> None:
    sql = _compiled(build_select(_table("devices"), _spec("devices"), None))
    assert "where" not in sql


def test_compute_watermark_returns_max_timestamp() -> None:
    spec = _spec("tickets")
    base = datetime(2026, 6, 13, 12, 0, 0, tzinfo=UTC)
    rows = [
        {"updated_at": base},
        {"updated_at": base + timedelta(minutes=5)},
        {"updated_at": base + timedelta(minutes=1)},
    ]
    assert _compute_watermark(spec, rows, fallback=None) == base + timedelta(minutes=5)


def test_compute_watermark_full_table_is_none() -> None:
    assert _compute_watermark(_spec("devices"), [{"id": "x"}], fallback=None) is None


def test_watermark_overlap_constant() -> None:
    assert WATERMARK_OVERLAP_SECONDS == 60
