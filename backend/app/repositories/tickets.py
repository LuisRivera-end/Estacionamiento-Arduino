from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentStatus, TicketStatus
from app.models.ticket import Ticket


class TicketRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_code(self, code: str) -> Ticket | None:
        statement: Select[tuple[Ticket]] = select(Ticket).where(Ticket.code == code)
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_for_update_by_code(self, code: str) -> Ticket | None:
        statement: Select[tuple[Ticket]] = (
            select(Ticket).where(Ticket.code == code).with_for_update()
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def create(self, *, code: str, entry_device_id: str | None) -> Ticket:
        ticket = Ticket(
            id=str(uuid4()),
            code=code,
            status=TicketStatus.ACTIVE,
            payment_status=PaymentStatus.UNPAID,
            entry_device_id=entry_device_id,
        )
        self.session.add(ticket)
        await self.session.flush()
        await self.session.refresh(ticket)
        return ticket

    async def summary_count(self, field_name: str, start_at: datetime, end_at: datetime) -> int:
        field = getattr(Ticket, field_name)
        statement = (
            select(func.count())
            .select_from(Ticket)
            .where(and_(field >= start_at, field < end_at))
        )
        return int((await self.session.execute(statement)).scalar_one())

    async def count_paid_tickets(self, start_at: datetime, end_at: datetime) -> int:
        statement = (
            select(func.count())
            .select_from(Ticket)
            .where(
                Ticket.payment_status == PaymentStatus.PAID,
                Ticket.paid_at >= start_at,
                Ticket.paid_at < end_at,
            )
        )
        return int((await self.session.execute(statement)).scalar_one())

    async def count_lost_tickets(self, start_at: datetime, end_at: datetime) -> int:
        statement = (
            select(func.count())
            .select_from(Ticket)
            .where(
                Ticket.lost_ticket.is_(True),
                or_(
                    and_(Ticket.paid_at >= start_at, Ticket.paid_at < end_at),
                    and_(Ticket.entry_at >= start_at, Ticket.entry_at < end_at),
                ),
            )
        )
        return int((await self.session.execute(statement)).scalar_one())
