from __future__ import annotations

import asyncio
from dataclasses import dataclass

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings

LEGACY_BASELINE_REVISION = "0002_security_and_fk_indexes"


@dataclass(frozen=True)
class MigrationState:
    has_version_table: bool
    has_core_tables: bool
    has_discount_amount: bool


def choose_stamp_revision(state: MigrationState) -> str | None:
    if state.has_version_table or not state.has_core_tables:
        return None
    if state.has_discount_amount:
        return "head"
    return LEGACY_BASELINE_REVISION


async def inspect_migration_state(database_url: str) -> MigrationState:
    engine = create_async_engine(database_url, future=True, pool_pre_ping=True)
    try:
        async with engine.connect() as connection:
            has_version_table = await connection.scalar(
                text("SELECT to_regclass('public.alembic_version') IS NOT NULL")
            )
            has_core_tables = await connection.scalar(
                text(
                    """
                    SELECT to_regclass('public.devices') IS NOT NULL
                      AND to_regclass('public.payments') IS NOT NULL
                    """
                )
            )
            has_discount_amount = await connection.scalar(
                text(
                    """
                    SELECT EXISTS (
                      SELECT 1
                      FROM information_schema.columns
                      WHERE table_schema = 'public'
                        AND table_name = 'payments'
                        AND column_name = 'discount_amount'
                    )
                    """
                )
            )
    finally:
        await engine.dispose()

    return MigrationState(
        has_version_table=bool(has_version_table),
        has_core_tables=bool(has_core_tables),
        has_discount_amount=bool(has_discount_amount),
    )


def run_migrations() -> None:
    settings = get_settings()
    database_url = settings.effective_supabase_db_url
    if not database_url:
        raise RuntimeError("SUPABASE_DB_URL is not configured")

    alembic_config = Config("alembic.ini")
    state = asyncio.run(inspect_migration_state(database_url))
    stamp_revision = choose_stamp_revision(state)
    if stamp_revision is not None:
        command.stamp(alembic_config, stamp_revision)

    command.upgrade(alembic_config, "head")


if __name__ == "__main__":
    run_migrations()
