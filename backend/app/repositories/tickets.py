from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Select, and_, desc, func, or_, select
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
            select(func.count()).select_from(Ticket).where(and_(field >= start_at, field < end_at))
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

    async def list_recent(self, limit: int = 50) -> list[Ticket]:
        statement: Select[tuple[Ticket]] = (
            select(Ticket).order_by(desc(Ticket.entry_at)).limit(limit)
        )
        return list((await self.session.execute(statement)).scalars().all())

    async def list_for_admin(
        self,
        *,
        offset: int,
        limit: int,
        code: str | None = None,
        status: TicketStatus | None = None,
        payment_status: PaymentStatus | None = None,
        lost_ticket: bool | None = None,
    ) -> tuple[list[Ticket], int]:
        filters = []

        if code:
            filters.append(Ticket.code.contains(code.upper()))
        if status:
            filters.append(Ticket.status == status)
        if payment_status:
            filters.append(Ticket.payment_status == payment_status)
        if lost_ticket is not None:
            filters.append(Ticket.lost_ticket.is_(lost_ticket))

        items_statement = select(Ticket).order_by(desc(Ticket.entry_at)).offset(offset).limit(limit)
        count_statement = select(func.count()).select_from(Ticket)

        if filters:
            items_statement = items_statement.where(*filters)
            count_statement = count_statement.where(*filters)

        items = list((await self.session.execute(items_statement)).scalars().all())
        total = int((await self.session.execute(count_statement)).scalar_one())
        return items, total

    async def list_for_events(
        self,
        *,
        code: str | None = None,
        lost_ticket: bool | None = None,
        entry_device_id: str | None = None,
        exit_device_id: str | None = None,
    ) -> list[Ticket]:
        filters = []

        if code:
            filters.append(Ticket.code.contains(code.upper()))
        if lost_ticket is not None:
            filters.append(Ticket.lost_ticket.is_(lost_ticket))
        if entry_device_id:
            filters.append(Ticket.entry_device_id == entry_device_id)
        if exit_device_id:
            filters.append(Ticket.exit_device_id == exit_device_id)

        statement = select(Ticket).order_by(desc(Ticket.entry_at))
        if filters:
            statement = statement.where(*filters)

        return list((await self.session.execute(statement)).scalars().all())

    async def delete(self, ticket: Ticket) -> None:
        await self.session.delete(ticket)
        await self.session.flush()

    async def get_expired_active_tickets(
        self, expiration_minutes: int, now: datetime
    ) -> list[Ticket]:
        from datetime import timedelta

        cutoff = now - timedelta(minutes=expiration_minutes)
        statement: Select[tuple[Ticket]] = (
            select(Ticket)
            .where(
                Ticket.status == TicketStatus.ACTIVE,
                Ticket.entry_at <= cutoff,
            )
            .with_for_update()
        )
        return list((await self.session.execute(statement)).scalars().all())

    async def count_expired_active(self, expiration_minutes: int, now: datetime) -> int:
        """Count active tickets past the expiration window (read-only, no lock)."""
        from datetime import timedelta

        cutoff = now - timedelta(minutes=expiration_minutes)
        statement = (
            select(func.count())
            .select_from(Ticket)
            .where(
                Ticket.status == TicketStatus.ACTIVE,
                Ticket.entry_at <= cutoff,
            )
        )
        return int((await self.session.execute(statement)).scalar_one())

