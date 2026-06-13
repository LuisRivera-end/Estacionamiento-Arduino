"""CLI entrypoint to push local data to the cloud (Supabase).

Usage:
    python -m app.db.sync_push          # incremental push (watermark based)
    python -m app.db.sync_push --full   # push everything (ignores watermarks)

Exit codes:
    0  success
    2  remote unreachable (expected when offline) or sync not configured
    1  any other error
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from app.core.errors import AppError
from app.services.sync_push import run_sync_push

logger = logging.getLogger(__name__)

# Error codes that mean "nothing to do right now", not a real failure.
_SOFT_FAILURES = {"remote_unreachable", "sync_not_configured"}


async def _run(full: bool) -> int:
    try:
        report = await run_sync_push(full=full)
    except AppError as exc:
        if exc.error in _SOFT_FAILURES:
            logger.info("sync_push skipped: %s (%s)", exc.error, exc.message)
            return 2
        logger.error("sync_push error: %s (%s)", exc.error, exc.message)
        return 1

    summary = ", ".join(
        f"{name}={result.pushed}" + (f"/skip{result.skipped}" if result.skipped else "")
        for name, result in report.tables.items()
    )
    logger.info(
        "sync_push ok: total=%d duration=%dms tables={%s}",
        report.total_pushed,
        report.duration_ms,
        summary,
    )
    return 0


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Push local parking data to the cloud DB")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Push every row, ignoring per-table watermarks",
    )
    args = parser.parse_args()
    sys.exit(asyncio.run(_run(args.full)))


if __name__ == "__main__":
    main()
