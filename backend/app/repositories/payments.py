from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment


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
