from __future__ import annotations

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log(
        self,
        *,
        event_type: str,
        actor_type: str,
        actor_id: str | None,
        payload: dict,
        ticket_id: str | None = None,
    ) -> None:
        self.session.add(
            AuditLog(
                id=str(uuid4()),
                event_type=event_type,
                actor_type=actor_type,
                actor_id=actor_id,
                payload=payload,
                ticket_id=ticket_id,
            )
        )
        await self.session.flush()
