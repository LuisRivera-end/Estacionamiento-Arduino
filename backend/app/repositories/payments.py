from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Select, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PaymentMethod, PaymentResult
from app.models.payment import Payment
from app.models.ticket import Ticket


class PaymentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        ticket_id: str,
        amount: int,
        method,
        status,
        provider_reference: str,
        created_by: str | None,
    ) -> Payment:
        payment = Payment(
            id=str(uuid4()),
            ticket_id=ticket_id,
            amount=amount,
            method=method,
            status=status,
            provider_reference=provider_reference,
            created_by=created_by,
        )
        self.session.add(payment)
        await self.session.flush()
        await self.session.refresh(payment)
        return payment

    async def sum_revenue(self, start_at: datetime, end_at: datetime) -> int:
        statement = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.created_at >= start_at,
            Payment.created_at < end_at,
        )
        return int((await self.session.execute(statement)).scalar_one())

    async def list_recent(self, limit: int = 50) -> list[tuple[Payment, str]]:
        statement: Select[tuple[Payment, str]] = (
            select(Payment, Ticket.code)
            .join(Ticket, Ticket.id == Payment.ticket_id)
            .order_by(desc(Payment.created_at))
            .limit(limit)
        )
        rows = (await self.session.execute(statement)).all()
        return [(payment, ticket_code) for payment, ticket_code in rows]

    async def list_for_admin(
        self,
        *,
        offset: int,
        limit: int,
        ticket_code: str | None = None,
        method: PaymentMethod | None = None,
        status: PaymentResult | None = None,
    ) -> tuple[list[tuple[Payment, str]], int]:
        filters = []

        if ticket_code:
            filters.append(Ticket.code.contains(ticket_code.upper()))
        if method:
            filters.append(Payment.method == method)
        if status:
            filters.append(Payment.status == status)

        items_statement: Select[tuple[Payment, str]] = (
            select(Payment, Ticket.code)
            .join(Ticket, Ticket.id == Payment.ticket_id)
            .order_by(desc(Payment.created_at))
            .offset(offset)
            .limit(limit)
        )
        count_statement = select(func.count()).select_from(Payment).join(
            Ticket, Ticket.id == Payment.ticket_id
        )

        if filters:
            items_statement = items_statement.where(*filters)
            count_statement = count_statement.where(*filters)

        rows = (await self.session.execute(items_statement)).all()
        total = int((await self.session.execute(count_statement)).scalar_one())
        return [(payment, code) for payment, code in rows], total
