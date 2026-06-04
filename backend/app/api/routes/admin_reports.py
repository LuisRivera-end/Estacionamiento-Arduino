from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_staff_user, get_jwt_verifier, get_session_context
from app.connectors.supabase_auth import SupabaseJWTVerifier
from app.db.session import get_session
from app.models.enums import PaymentMethod, PaymentResult, PaymentStatus, TicketStatus
from app.repositories.archived_tickets import ArchivedTicketRepository
from app.repositories.payments import PaymentRepository
from app.repositories.staff import StaffRepository
from app.repositories.tickets import TicketRepository
from app.schemas.reports import (
    AdminEventItemResponse,
    AdminEventsPageResponse,
    AdminPaymentItemResponse,
    AdminPaymentsPageResponse,
    AdminTicketItemResponse,
    AdminTicketsPageResponse,
    SummaryReportResponse,
)
from app.services.admin_reports import get_daily_summary
from app.services.realtime import admin_events_broker

router = APIRouter()

SessionContext = Callable[[], AbstractAsyncContextManager[AsyncSession]]


async def authorize_reports_ws_staff_user(
    access_token: str,
    verifier: SupabaseJWTVerifier,
    session_context: SessionContext,
) -> bool:
    try:
        claims = verifier.verify_access_token(access_token)
    except Exception:
        return False

    async with session_context() as session:
        staff_user = await StaffRepository(session).get_by_user_id(claims.sub)
        return staff_user is not None


@router.get("/summary", response_model=SummaryReportResponse)
async def report_summary(
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> SummaryReportResponse:
    return await get_daily_summary(session, datetime.now(UTC))


@router.get("/tickets", response_model=AdminTicketsPageResponse)
async def report_tickets(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    code: str | None = Query(default=None),
    status: TicketStatus | None = Query(default=None),
    payment_status: PaymentStatus | None = Query(default=None),
    lost_ticket: bool | None = Query(default=None),
    include_archived: bool = Query(default=True),
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> AdminTicketsPageResponse:
    offset = (page - 1) * page_size
    tickets, total = await TicketRepository(session).list_for_admin(
        offset=offset,
        limit=page_size,
        code=code,
        status=status,
        payment_status=payment_status,
        lost_ticket=lost_ticket,
    )
    items: list[AdminTicketItemResponse] = [
        AdminTicketItemResponse(
            ticket_code=ticket.code,
            status=ticket.status,
            payment_status=ticket.payment_status,
            entry_at=ticket.entry_at,
            paid_at=ticket.paid_at,
            exit_at=ticket.exit_at,
            calculated_amount=ticket.calculated_amount,
            lost_ticket=ticket.lost_ticket,
        )
        for ticket in tickets
    ]

    # Append archived tickets if requested and there's room on this page
    if include_archived:
        archived_repo = ArchivedTicketRepository(session)
        archived_remaining = page_size - len(items)
        if archived_remaining > 0:
            archived_offset = max(0, offset - total)
            archived_tickets, archived_total = await archived_repo.list_for_admin(
                offset=max(0, archived_offset),
                limit=archived_remaining,
                code=code,
            )
            for at in archived_tickets:
                items.append(
                    AdminTicketItemResponse(
                        ticket_code=at.code,
                        status=at.status,
                        payment_status=at.payment_status,
                        entry_at=at.entry_at,
                        paid_at=at.paid_at,
                        exit_at=at.exit_at,
                        calculated_amount=at.calculated_amount,
                        lost_ticket=at.lost_ticket,
                        archive_reason=str(at.archive_reason),
                        archived_at=at.archived_at,
                    )
                )
            total += archived_total

    return AdminTicketsPageResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/payments", response_model=AdminPaymentsPageResponse)
async def report_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    ticket_code: str | None = Query(default=None),
    method: PaymentMethod | None = Query(default=None),
    status: PaymentResult | None = Query(default=None),
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> AdminPaymentsPageResponse:
    offset = (page - 1) * page_size
    payments, total = await PaymentRepository(session).list_for_admin(
        offset=offset,
        limit=page_size,
        ticket_code=ticket_code,
        method=method,
        status=status,
    )
    items = [
        AdminPaymentItemResponse(
            payment_id=payment.id,
            ticket_code=ticket_code,
            subtotal_amount=payment.subtotal_amount,
            discount_type=payment.discount_type,
            discount_percent=payment.discount_percent,
            discount_amount=payment.discount_amount,
            amount=payment.amount,
            method=payment.method,
            simulation_reference=payment.simulation_reference,
            status=payment.status,
            provider_reference=payment.provider_reference,
            created_by=payment.created_by,
            created_at=payment.created_at,
        )
        for payment, ticket_code in payments
    ]
    return AdminPaymentsPageResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/events", response_model=AdminEventsPageResponse)
async def report_events(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=200),
    ticket_code: str | None = Query(default=None),
    event_type: Literal["entry", "exit"] | None = Query(default=None),
    device_id: str | None = Query(default=None),
    lost_ticket: bool | None = Query(default=None),
    _: tuple = Depends(get_current_staff_user),
    session: AsyncSession = Depends(get_session),
) -> AdminEventsPageResponse:
    # Active tickets
    tickets = await TicketRepository(session).list_for_events(
        code=ticket_code,
        lost_ticket=lost_ticket,
        entry_device_id=device_id if event_type in (None, "entry") else None,
        exit_device_id=device_id if event_type in (None, "exit") else None,
    )
    # Archived tickets
    archived_tickets = await ArchivedTicketRepository(session).list_for_events(
        code=ticket_code,
        lost_ticket=lost_ticket,
        entry_device_id=device_id if event_type in (None, "entry") else None,
        exit_device_id=device_id if event_type in (None, "exit") else None,
    )

    events: list[AdminEventItemResponse] = []

    # Events from active tickets
    for ticket in tickets:
        if event_type in (None, "entry"):
            if device_id is None or ticket.entry_device_id == device_id:
                events.append(
                    AdminEventItemResponse(
                        event_at=ticket.entry_at,
                        event_type="entry",
                        ticket_code=ticket.code,
                        device_id=ticket.entry_device_id,
                        result="autorizada",
                    )
                )
        if event_type in (None, "exit") and ticket.exit_at:
            if device_id is None or ticket.exit_device_id == device_id:
                events.append(
                    AdminEventItemResponse(
                        event_at=ticket.exit_at,
                        event_type="exit",
                        ticket_code=ticket.code,
                        device_id=ticket.exit_device_id,
                        result="procesada",
                    )
                )

    # Events from archived tickets
    for at in archived_tickets:
        if event_type in (None, "entry"):
            if device_id is None or at.entry_device_id == device_id:
                events.append(
                    AdminEventItemResponse(
                        event_at=at.entry_at,
                        event_type="entry",
                        ticket_code=at.code,
                        device_id=at.entry_device_id,
                        result="autorizada",
                    )
                )
        if event_type in (None, "exit") and at.exit_at:
            if device_id is None or at.exit_device_id == device_id:
                events.append(
                    AdminEventItemResponse(
                        event_at=at.exit_at,
                        event_type="exit",
                        ticket_code=at.code,
                        device_id=at.exit_device_id,
                        result="procesada",
                    )
                )

    events.sort(key=lambda event: event.event_at, reverse=True)
    total = len(events)
    start = (page - 1) * page_size
    end = start + page_size
    items = events[start:end]
    return AdminEventsPageResponse(items=items, total=total, page=page, page_size=page_size)


@router.websocket("/ws")
async def reports_ws(
    websocket: WebSocket,
    access_token: str = Query(..., min_length=10),
    verifier: SupabaseJWTVerifier = Depends(get_jwt_verifier),
    session_context: SessionContext = Depends(get_session_context),
) -> None:
    if not await authorize_reports_ws_staff_user(access_token, verifier, session_context):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    queue = await admin_events_broker.subscribe()

    try:
        await websocket.send_json({"type": "connected"})
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        await admin_events_broker.unsubscribe(queue)
