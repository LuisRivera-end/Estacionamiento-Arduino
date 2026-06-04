"""CLI entrypoint to expire stale tickets.

Usage: python -m app.db.expire_tickets
"""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.services.ticket_expiration import expire_stale_tickets

logger = logging.getLogger(__name__)


async def run_expiration() -> None:
    settings = get_settings()
    database_url = settings.effective_supabase_db_url
    if not database_url:
        raise RuntimeError("SUPABASE_DB_URL is not configured")

    engine = create_async_engine(database_url, future=True, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            expired_count = await expire_stale_tickets(session)
            logger.info("Expired %d stale tickets", expired_count)
    finally:
        await engine.dispose()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(run_expiration())


if __name__ == "__main__":
    main()
