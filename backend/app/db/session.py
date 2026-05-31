from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


def init_engine(database_url: str | None = None) -> AsyncEngine:
    global engine, SessionLocal

    if engine is not None and SessionLocal is not None:
        return engine

    settings = get_settings()
    resolved_database_url = database_url or settings.effective_supabase_db_url
    if not resolved_database_url:
        raise RuntimeError("SUPABASE_DB_URL is not configured")

    engine = create_async_engine(
        resolved_database_url,
        future=True,
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=1,
        pool_timeout=5,
        pool_recycle=300,
    )
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    return engine


async def get_session() -> AsyncIterator[AsyncSession]:
    if SessionLocal is None:
        init_engine()

    assert SessionLocal is not None
    async with SessionLocal() as session:
        yield session
