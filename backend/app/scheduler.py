"""In-container scheduler for the local Docker mode.

Replaces the two Render cron jobs when operating locally:
  - expires stale tickets every EXPIRE_INTERVAL_SECONDS (mirrors the */5 cron),
  - pushes local data to the cloud every SYNC_INTERVAL_MINUTES (best effort).

Every job runs inside try/except so a transient failure (no internet, DB blip)
never tears down the loop. Run with: python -m app.scheduler
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable

from app.core.config import get_settings
from app.core.errors import AppError
from app.db.expire_tickets import run_expiration
from app.services.sync_push import run_sync_push

logger = logging.getLogger(__name__)

EXPIRE_INTERVAL_SECONDS = 300
MIN_SYNC_INTERVAL_SECONDS = 60

# Sync "failures" that just mean "nothing to do right now" — logged as info.
SOFT_SYNC_FAILURES = {"remote_unreachable", "sync_not_configured"}


async def _run_sync_once() -> None:
    report = await run_sync_push(full=False)
    summary = ", ".join(f"{name}={result.pushed}" for name, result in report.tables.items())
    logger.info(
        "sync_push: total=%d duration=%dms tables={%s}",
        report.total_pushed,
        report.duration_ms,
        summary,
    )


async def _loop(name: str, interval_seconds: int, job: Callable[[], Awaitable[None]]) -> None:
    while True:
        try:
            await job()
        except AppError as exc:
            if exc.error in SOFT_SYNC_FAILURES:
                logger.info("%s skipped: %s (%s)", name, exc.error, exc.message)
            else:
                logger.error("%s error: %s (%s)", name, exc.error, exc.message)
        except Exception:  # noqa: BLE001 - keep the loop alive no matter what
            logger.exception("%s crashed; continuing", name)
        await asyncio.sleep(interval_seconds)


async def main_async() -> None:
    settings = get_settings()

    tasks = [
        asyncio.create_task(
            _loop("expire_tickets", EXPIRE_INTERVAL_SECONDS, run_expiration),
            name="expire_tickets",
        )
    ]

    if settings.effective_remote_db_url:
        sync_interval = max(MIN_SYNC_INTERVAL_SECONDS, settings.sync_interval_minutes * 60)
        tasks.append(
            asyncio.create_task(
                _loop("sync_push", sync_interval, _run_sync_once),
                name="sync_push",
            )
        )
        logger.info(
            "scheduler started: expire every %ds, sync every %ds",
            EXPIRE_INTERVAL_SECONDS,
            sync_interval,
        )
    else:
        logger.info(
            "scheduler started: expire every %ds; sync disabled (REMOTE_DB_URL not set)",
            EXPIRE_INTERVAL_SECONDS,
        )

    await asyncio.gather(*tasks)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
