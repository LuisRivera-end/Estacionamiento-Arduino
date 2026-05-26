from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from math import ceil


@dataclass(slots=True)
class PricingSnapshot:
    free_tolerance_minutes: int
    block_minutes: int
    block_amount: int
    lost_ticket_fee: int
    currency: str


def calculate_duration_minutes(entry_at: datetime, current_time: datetime) -> int:
    if entry_at.tzinfo is None:
        entry_at = entry_at.replace(tzinfo=UTC)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=UTC)
    return max(0, ceil((current_time - entry_at).total_seconds() / 60))


def calculate_amount(
    *,
    duration_minutes: int,
    free_tolerance_minutes: int,
    block_minutes: int,
    block_amount: int,
    lost_ticket_fee: int,
    lost_ticket: bool,
) -> int:
    if lost_ticket:
        return lost_ticket_fee

    if duration_minutes <= free_tolerance_minutes:
        return 0

    extra_minutes = duration_minutes - free_tolerance_minutes
    blocks = ceil(extra_minutes / block_minutes)
    return blocks * block_amount
