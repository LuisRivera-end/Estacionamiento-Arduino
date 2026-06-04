from __future__ import annotations

from datetime import datetime

from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.archived_ticket import ArchivedTicket
from app.models.enums import ArchiveReason


class ArchivedTicketRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        id: str,
        code: str,
        status: str,
        payment_status: str,
        entry_at: datetime,
        paid_at: datetime | None,
        exit_at: datetime | None,
        duration_minutes: int | None,
        calculated_amount: int,
        lost_ticket: bool,
        entry_device_id: str | None,
        exit_device_id: str | None,
        created_at: datetime,
        updated_at: datetime,
        archived_at: datetime,
        expired_at: datetime | None,
        archive_reason: ArchiveReason,
    ) -> ArchivedTicket:
        archived = ArchivedTicket(
            id=id,
            code=code,
            status=status,
            payment_status=payment_status,
            entry_at=entry_at,
            paid_at=paid_at,
            exit_at=exit_at,
            duration_minutes=duration_minutes,
            calculated_amount=calculated_amount,
            lost_ticket=lost_ticket,
            entry_device_id=entry_device_id,
            exit_device_id=exit_device_id,
            created_at=created_at,
            updated_at=updated_at,
            archived_at=archived_at,
            expired_at=expired_at,
            archive_reason=archive_reason,
        )
        self.session.add(archived)
        await self.session.flush()
        return archived

    async def summary_count(
        self, field_name: str, start_at: datetime, end_at: datetime
    ) -> int:
        field = getattr(ArchivedTicket, field_name)
        statement = (
            select(func.count())
            .select_from(ArchivedTicket)
            .where(and_(field >= start_at, field < end_at))
        )
        return int((await self.session.execute(statement)).scalar_one())

    async def count_lost_tickets(self, start_at: datetime, end_at: datetime) -> int:
        statement = (
            select(func.count())
            .select_from(ArchivedTicket)
            .where(
                ArchivedTicket.lost_ticket.is_(True),
                or_(
                    and_(ArchivedTicket.paid_at >= start_at, ArchivedTicket.paid_at < end_at),
                    and_(ArchivedTicket.entry_at >= start_at, ArchivedTicket.entry_at < end_at),
                ),
            )
        )
        return int((await self.session.execute(statement)).scalar_one())

    async def list_for_admin(
        self,
        *,
        offset: int,
        limit: int,
        code: str | None = None,
        archive_reason: ArchiveReason | None = None,
    ) -> tuple[list[ArchivedTicket], int]:
        filters = []

        if code:
            filters.append(ArchivedTicket.code.contains(code.upper()))
        if archive_reason:
            filters.append(ArchivedTicket.archive_reason == archive_reason)

        items_statement = (
            select(ArchivedTicket)
            .order_by(desc(ArchivedTicket.archived_at))
            .offset(offset)
            .limit(limit)
        )
        count_statement = select(func.count()).select_from(ArchivedTicket)

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
    ) -> list[ArchivedTicket]:
        filters = []

        if code:
            filters.append(ArchivedTicket.code.contains(code.upper()))
        if lost_ticket is not None:
            filters.append(ArchivedTicket.lost_ticket.is_(lost_ticket))
        if entry_device_id:
            filters.append(ArchivedTicket.entry_device_id == entry_device_id)
        if exit_device_id:
            filters.append(ArchivedTicket.exit_device_id == exit_device_id)

        statement = select(ArchivedTicket).order_by(desc(ArchivedTicket.entry_at))
        if filters:
            statement = statement.where(*filters)

        return list((await self.session.execute(statement)).scalars().all())
