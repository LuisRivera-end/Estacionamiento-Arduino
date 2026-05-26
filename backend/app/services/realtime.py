from __future__ import annotations

import asyncio
from collections.abc import Iterable


class AdminEventsBroker:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[dict]] = set()
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue[dict]:
        queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.add(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[dict]) -> None:
        async with self._lock:
            self._subscribers.discard(queue)

    async def publish(self, event: dict) -> None:
        async with self._lock:
            subscribers: Iterable[asyncio.Queue[dict]] = tuple(self._subscribers)

        for queue in subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                # If one subscriber is stalled, skip that event for that connection.
                continue


admin_events_broker = AdminEventsBroker()
