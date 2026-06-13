from datetime import datetime

from pydantic import BaseModel


class SyncPushRequest(BaseModel):
    full: bool = False


class SyncTableResult(BaseModel):
    pushed: int
    skipped: int


class SyncPushResponse(BaseModel):
    status: str
    full: bool
    started_at: datetime
    finished_at: datetime
    duration_ms: int
    total_pushed: int
    tables: dict[str, SyncTableResult]
    error: str | None = None


class SyncTableStatus(BaseModel):
    table_name: str
    last_synced_at: datetime | None
    last_run_at: datetime | None
    last_status: str | None
    last_pushed_count: int
    pending_estimate: int


class SyncStatusResponse(BaseModel):
    configured: bool
    remote_reachable: bool | None
    last_run_at: datetime | None
    last_status: str | None
    last_error: str | None
    tables: list[SyncTableStatus]
