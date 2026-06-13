from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_app_settings, require_admin_user
from app.core.config import Settings
from app.db.session import get_session
from app.models.base import Base
from app.models.sync_state import SyncState
from app.schemas.sync import (
    SyncPushRequest,
    SyncPushResponse,
    SyncStatusResponse,
    SyncTableStatus,
)
from app.services.sync_push import (
    SYNC_TABLES,
    WATERMARK_OVERLAP_SECONDS,
    probe_remote,
    run_sync_push,
)

router = APIRouter()


@router.post("/push", response_model=SyncPushResponse)
async def push_to_cloud(
    payload: SyncPushRequest,
    _: tuple = Depends(require_admin_user),
) -> SyncPushResponse:
    # run_sync_push raises AppError (remote_unreachable -> 503, sync_in_progress
    # -> 409, schema_mismatch -> 409, ...) which the global handler maps to JSON.
    report = await run_sync_push(full=payload.full)
    return SyncPushResponse.model_validate(report.to_response_dict())


@router.get("/status", response_model=SyncStatusResponse)
async def sync_status(
    probe: bool = False,
    _: tuple = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_app_settings),
) -> SyncStatusResponse:
    state_rows = (await session.execute(select(SyncState))).scalars().all()
    state_by_table = {row.table_name: row for row in state_rows}

    tables: list[SyncTableStatus] = []
    for spec in SYNC_TABLES:
        table = Base.metadata.tables[spec.name]
        state = state_by_table.get(spec.name)
        watermark = state.last_synced_at if state else None

        if spec.watermark_column and watermark is not None:
            cutoff = watermark - timedelta(seconds=WATERMARK_OVERLAP_SECONDS)
            pending = await session.scalar(
                select(func.count())
                .select_from(table)
                .where(table.c[spec.watermark_column] >= cutoff)
            )
        else:
            # Full tables (and never-synced incremental tables) push everything.
            pending = await session.scalar(select(func.count()).select_from(table))

        tables.append(
            SyncTableStatus(
                table_name=spec.name,
                last_synced_at=watermark,
                last_run_at=state.last_run_at if state else None,
                last_status=state.last_status if state else None,
                last_pushed_count=state.last_pushed_count if state else 0,
                pending_estimate=int(pending or 0),
            )
        )

    runs = [row for row in state_rows if row.last_run_at is not None]
    latest = max(runs, key=lambda row: row.last_run_at) if runs else None
    last_run = latest.last_run_at if latest else None

    remote_reachable: bool | None = None
    if probe:
        remote_reachable = await probe_remote(settings)

    return SyncStatusResponse(
        configured=bool(settings.effective_remote_db_url),
        remote_reachable=remote_reachable,
        last_run_at=last_run,
        last_status=latest.last_status if latest else None,
        last_error=latest.last_error if latest else None,
        tables=tables,
    )
