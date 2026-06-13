"""Local -> cloud synchronization (push).

Used only in the local Docker mode: the local PostgreSQL is the source of truth
and this service pushes operational + configuration tables to the cloud Supabase
database (REMOTE_DB_URL) whenever there is internet. The push is incremental
(per-table watermark stored in `sync_state`) and idempotent (upserts), so the
60s read overlap and repeated runs are safe.

Failure modes are surfaced as AppError so the API maps them to HTTP codes and the
CLI/scheduler can log them without crashing:
  - sync_not_configured  (503) -> REMOTE_DB_URL missing
  - remote_unreachable   (503) -> could not connect to the cloud DB (no internet)
  - schema_mismatch      (409) -> a target table/column is missing remotely
  - sync_in_progress     (409) -> another push holds the advisory lock
  - sync_failed          (500) -> unexpected error during the push
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Iterator, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any

from sqlalchemy import Table, bindparam, func, select, text, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings, get_settings
from app.core.errors import AppError

# Import model modules so every table is registered on Base.metadata regardless
# of import order (the service reads tables via Base.metadata.tables[name]).
from app.models import (  # noqa: F401
    archived_ticket,
    audit,
    device,
    parking,
    payment,
    sync_state,
    ticket,
)
from app.models.base import Base

logger = logging.getLogger(__name__)

# Session-level advisory lock key (held on the LOCAL db) to prevent concurrent
# pushes between the manual button (backend) and the scheduler container.
ADVISORY_LOCK_KEY = 742001

# Re-read rows slightly before the stored watermark to tolerate clock skew and
# commits that landed out of timestamp order. Safe because upserts are idempotent.
WATERMARK_OVERLAP_SECONDS = 60


class ConflictPolicy(StrEnum):
    UPDATE_ALWAYS = "update_always"  # local always wins (devices, parking_state)
    UPDATE_IF_NEWER = "update_if_newer"  # last-write-wins by a timestamp column
    DO_NOTHING = "do_nothing"  # append-only (payments, audit_logs, archived_tickets)
    PRICING = "pricing"  # special: keep the single active rule consistent


@dataclass(frozen=True)
class TableSpec:
    name: str
    # Column used to select only recent rows. None => always push the full table.
    watermark_column: str | None
    policy: ConflictPolicy
    # Column compared for UPDATE_IF_NEWER (excluded.<col> > target.<col>).
    newer_column: str | None = None


# Push order is FK-safe: parents before children.
SYNC_TABLES: tuple[TableSpec, ...] = (
    TableSpec("devices", None, ConflictPolicy.UPDATE_ALWAYS),
    TableSpec("tickets", "updated_at", ConflictPolicy.UPDATE_IF_NEWER, newer_column="updated_at"),
    TableSpec("payments", "created_at", ConflictPolicy.DO_NOTHING),
    TableSpec("audit_logs", "created_at", ConflictPolicy.DO_NOTHING),
    TableSpec("archived_tickets", "archived_at", ConflictPolicy.DO_NOTHING),
    TableSpec("parking_settings", None, ConflictPolicy.UPDATE_IF_NEWER, newer_column="updated_at"),
    TableSpec("pricing_rules", None, ConflictPolicy.PRICING),
    TableSpec("parking_state", None, ConflictPolicy.UPDATE_ALWAYS),
)


@dataclass
class TableResult:
    pushed: int = 0
    skipped: int = 0


@dataclass
class SyncPushReport:
    status: str
    full: bool
    started_at: datetime
    finished_at: datetime
    duration_ms: int
    total_pushed: int
    tables: dict[str, TableResult] = field(default_factory=dict)
    error: str | None = None

    def to_response_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "full": self.full,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "duration_ms": self.duration_ms,
            "total_pushed": self.total_pushed,
            "tables": {
                name: {"pushed": r.pushed, "skipped": r.skipped} for name, r in self.tables.items()
            },
            "error": self.error,
        }


# ---------------------------------------------------------------------------
# Pure SQL builders (no I/O) — unit-testable by compiling with the pg dialect.
# ---------------------------------------------------------------------------
def _non_pk_columns(table: Table) -> list[str]:
    pk = {c.name for c in table.primary_key.columns}
    return [c.name for c in table.columns if c.name not in pk]


def build_upsert(table: Table, rows: list[dict[str, Any]], spec: TableSpec):
    """Build an INSERT ... ON CONFLICT statement for `rows` per the table policy."""
    stmt = pg_insert(table).values(rows)
    pk_cols = [c.name for c in table.primary_key.columns]

    if spec.policy is ConflictPolicy.DO_NOTHING:
        return stmt.on_conflict_do_nothing(index_elements=pk_cols)

    set_ = {name: stmt.excluded[name] for name in _non_pk_columns(table)}

    if spec.policy is ConflictPolicy.UPDATE_ALWAYS:
        return stmt.on_conflict_do_update(index_elements=pk_cols, set_=set_)

    if spec.policy is ConflictPolicy.UPDATE_IF_NEWER:
        newer = spec.newer_column or "updated_at"
        where = stmt.excluded[newer] > table.c[newer]
        return stmt.on_conflict_do_update(index_elements=pk_cols, set_=set_, where=where)

    # PRICING is handled by _push_pricing (deactivate + unconditional upsert).
    return stmt.on_conflict_do_update(index_elements=pk_cols, set_=set_)


def build_select(table: Table, spec: TableSpec, watermark: datetime | None):
    stmt = select(table)
    if spec.watermark_column and watermark is not None:
        cutoff = watermark - timedelta(seconds=WATERMARK_OVERLAP_SECONDS)
        stmt = stmt.where(table.c[spec.watermark_column] >= cutoff)
    return stmt


def _chunk(seq: Sequence[dict[str, Any]], size: int) -> Iterator[list[dict[str, Any]]]:
    for index in range(0, len(seq), size):
        yield list(seq[index : index + size])


def _compute_watermark(
    spec: TableSpec, rows: list[dict[str, Any]], fallback: datetime | None
) -> datetime | None:
    if spec.watermark_column is None:
        return None
    values = [
        row[spec.watermark_column] for row in rows if row.get(spec.watermark_column) is not None
    ]
    if not values:
        return fallback
    return max(values)


def _pk_repr(table: Table, row: dict[str, Any]) -> str:
    return ",".join(f"{c.name}={row.get(c.name)!r}" for c in table.primary_key.columns)


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------
def _sync_state_table() -> Table:
    return Base.metadata.tables["sync_state"]


async def _get_watermark(local_conn: AsyncConnection, table_name: str) -> datetime | None:
    sst = _sync_state_table()
    return await local_conn.scalar(
        select(sst.c.last_synced_at).where(sst.c.table_name == table_name)
    )


async def _update_sync_state(
    local_conn: AsyncConnection,
    table_name: str,
    last_synced_at: datetime | None,
    *,
    status: str,
    pushed: int,
    error: str | None = None,
) -> None:
    sst = _sync_state_table()
    stmt = pg_insert(sst).values(
        table_name=table_name,
        last_synced_at=last_synced_at,
        last_run_at=func.now(),
        last_status=status,
        last_pushed_count=pushed,
        last_error=error,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["table_name"],
        set_={
            # greatest() ignores NULLs, so the watermark never regresses even
            # when a run pushed no rows (last_synced_at would be NULL).
            "last_synced_at": func.greatest(sst.c.last_synced_at, stmt.excluded.last_synced_at),
            "last_run_at": stmt.excluded.last_run_at,
            "last_status": stmt.excluded.last_status,
            "last_pushed_count": stmt.excluded.last_pushed_count,
            "last_error": stmt.excluded.last_error,
        },
    )
    await local_conn.execute(stmt)
    await local_conn.commit()


async def _open_remote(remote_engine, settings: Settings) -> AsyncConnection:
    timeout = settings.sync_connect_timeout_seconds + 5
    conn = await asyncio.wait_for(remote_engine.connect(), timeout=timeout)
    try:
        await asyncio.wait_for(conn.execute(select(1)), timeout=timeout)
    except BaseException:
        await conn.close()
        raise
    return conn


async def _verify_remote_schema(remote_conn: AsyncConnection) -> None:
    """Ensure every table/column we are about to push exists remotely.

    Tolerant by design: a remote DB one migration behind (e.g. missing only the
    local-only `sync_state` table) is fine, because we never push that table.
    """
    table_names = [spec.name for spec in SYNC_TABLES]
    stmt = text(
        "SELECT table_name, column_name FROM information_schema.columns "
        "WHERE table_schema = 'public' AND table_name IN :names"
    ).bindparams(bindparam("names", expanding=True))
    result = await remote_conn.execute(stmt, {"names": table_names})

    remote_columns: dict[str, set[str]] = {}
    for table_name, column_name in result:
        remote_columns.setdefault(table_name, set()).add(column_name)

    for spec in SYNC_TABLES:
        table = Base.metadata.tables[spec.name]
        present = remote_columns.get(spec.name)
        if not present:
            raise AppError(
                409,
                "schema_mismatch",
                f"La tabla '{spec.name}' no existe en el remoto. "
                "Despliega el backend a Render para migrar la nube y reintenta.",
            )
        missing = {c.name for c in table.columns} - present
        if missing:
            raise AppError(
                409,
                "schema_mismatch",
                f"Faltan columnas en '{spec.name}' del remoto: {sorted(missing)}. "
                "Despliega el backend a Render para migrar la nube y reintenta.",
            )


async def _push_batches(
    remote_conn: AsyncConnection,
    table: Table,
    rows: list[dict[str, Any]],
    spec: TableSpec,
    batch_size: int,
) -> TableResult:
    result = TableResult()
    for batch in _chunk(rows, batch_size):
        stmt = build_upsert(table, batch, spec)
        try:
            execution = await remote_conn.execute(stmt)
            await remote_conn.commit()
            result.pushed += _rowcount(execution.rowcount, len(batch))
        except IntegrityError:
            # Rare: e.g. a ticket `code` collision with a row created in the
            # cloud via the bridge fallback. Retry row-by-row and skip offenders.
            await remote_conn.rollback()
            for row in batch:
                single = build_upsert(table, [row], spec)
                try:
                    execution = await remote_conn.execute(single)
                    await remote_conn.commit()
                    result.pushed += _rowcount(execution.rowcount, 1)
                except IntegrityError:
                    await remote_conn.rollback()
                    result.skipped += 1
                    logger.warning(
                        "sync_push: skipped conflicting row in %s (%s)",
                        table.name,
                        _pk_repr(table, row),
                    )
    return result


async def _push_pricing(
    remote_conn: AsyncConnection, table: Table, rows: list[dict[str, Any]]
) -> TableResult:
    """Sync pricing_rules without violating the partial unique index
    `pricing_rules_one_active (WHERE is_active = true)`.

    In a single transaction: deactivate every remote active rule other than the
    locally-active one, then upsert all local rows unconditionally (local wins).
    """
    active_ids = [row["id"] for row in rows if row.get("is_active")]
    local_active_id = active_ids[0] if active_ids else None

    deactivate = update(table).where(table.c.is_active.is_(True))
    if local_active_id is not None:
        deactivate = deactivate.where(table.c.id != local_active_id)
    deactivate = deactivate.values(is_active=False, updated_at=func.now())
    await remote_conn.execute(deactivate)

    stmt = pg_insert(table).values(rows)
    pk_cols = [c.name for c in table.primary_key.columns]
    set_ = {name: stmt.excluded[name] for name in _non_pk_columns(table)}
    stmt = stmt.on_conflict_do_update(index_elements=pk_cols, set_=set_)
    execution = await remote_conn.execute(stmt)
    await remote_conn.commit()

    return TableResult(pushed=_rowcount(execution.rowcount, len(rows)), skipped=0)


def _rowcount(reported: int | None, fallback: int) -> int:
    if reported is not None and reported >= 0:
        return reported
    return fallback


async def _sync_table(
    local_conn: AsyncConnection,
    remote_conn: AsyncConnection,
    spec: TableSpec,
    *,
    full: bool,
    settings: Settings,
) -> TableResult:
    table = Base.metadata.tables[spec.name]

    watermark = None
    if not full and spec.watermark_column is not None:
        watermark = await _get_watermark(local_conn, spec.name)

    rows = (await local_conn.execute(build_select(table, spec, watermark))).mappings().all()
    row_dicts = [dict(row) for row in rows]

    if not row_dicts:
        await _update_sync_state(local_conn, spec.name, watermark, status="ok", pushed=0)
        return TableResult()

    if spec.policy is ConflictPolicy.PRICING:
        result = await _push_pricing(remote_conn, table, row_dicts)
    else:
        result = await _push_batches(remote_conn, table, row_dicts, spec, settings.sync_batch_size)

    new_watermark = _compute_watermark(spec, row_dicts, fallback=watermark)
    await _update_sync_state(
        local_conn, spec.name, new_watermark, status="ok", pushed=result.pushed
    )
    return result


async def probe_remote(settings: Settings | None = None) -> bool:
    """Best-effort reachability check for the cloud DB (used by GET /status?probe)."""
    settings = settings or get_settings()
    url = settings.effective_remote_db_url
    if not url:
        return False
    engine = create_async_engine(
        url,
        poolclass=NullPool,
        connect_args={"timeout": settings.sync_connect_timeout_seconds},
    )
    try:
        conn = await _open_remote(engine, settings)
        await conn.close()
        return True
    except Exception:  # noqa: BLE001 - any failure means "not reachable"
        return False
    finally:
        await engine.dispose()


async def run_sync_push(*, full: bool = False, settings: Settings | None = None) -> SyncPushReport:
    settings = settings or get_settings()
    started_at = datetime.now(UTC)

    local_url = settings.effective_supabase_db_url
    if not local_url:
        raise AppError(503, "sync_not_configured", "La base de datos local no está configurada")
    remote_url = settings.effective_remote_db_url
    if not remote_url:
        raise AppError(
            503,
            "sync_not_configured",
            "REMOTE_DB_URL no está configurada; la sincronización está deshabilitada",
        )

    local_engine = create_async_engine(local_url, poolclass=NullPool)
    remote_engine = create_async_engine(
        remote_url,
        poolclass=NullPool,
        connect_args={"timeout": settings.sync_connect_timeout_seconds},
    )

    tables: dict[str, TableResult] = {}
    try:
        async with local_engine.connect() as local_conn:
            locked = await local_conn.scalar(select(func.pg_try_advisory_lock(ADVISORY_LOCK_KEY)))
            if not locked:
                raise AppError(409, "sync_in_progress", "Ya hay una sincronización en curso")
            try:
                try:
                    remote_conn = await _open_remote(remote_engine, settings)
                except (OSError, TimeoutError, SQLAlchemyError) as exc:
                    raise AppError(
                        503,
                        "remote_unreachable",
                        "No se pudo conectar al servidor remoto (¿sin internet?)",
                    ) from exc

                # _open_remote already started the connection (awaited connect),
                # so close it manually here instead of re-entering it with
                # `async with`, which would raise "connection is already started".
                try:
                    await _verify_remote_schema(remote_conn)
                    for spec in SYNC_TABLES:
                        tables[spec.name] = await _sync_table(
                            local_conn, remote_conn, spec, full=full, settings=settings
                        )
                finally:
                    await remote_conn.close()
            finally:
                await local_conn.execute(select(func.pg_advisory_unlock(ADVISORY_LOCK_KEY)))
                await local_conn.commit()
    except AppError:
        raise
    except Exception as exc:  # noqa: BLE001 - surface as a clean domain error
        logger.exception("sync_push failed")
        raise AppError(500, "sync_failed", f"Falló la sincronización: {exc}") from exc
    finally:
        await remote_engine.dispose()
        await local_engine.dispose()

    finished_at = datetime.now(UTC)
    total_pushed = sum(result.pushed for result in tables.values())
    return SyncPushReport(
        status="ok",
        full=full,
        started_at=started_at,
        finished_at=finished_at,
        duration_ms=int((finished_at - started_at).total_seconds() * 1000),
        total_pushed=total_pushed,
        tables=tables,
    )
