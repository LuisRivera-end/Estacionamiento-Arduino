import { apiGet } from "./client";
import type {
  PaginatedEvents,
  PaginatedPayments,
  PaginatedTickets,
  StatusResponse,
  SummaryReport,
} from "./types";

type TicketReportFilters = {
  page?: number;
  pageSize?: number;
  code?: string;
  status?: string;
  paymentStatus?: string;
  lostTicket?: boolean;
};

type PaymentReportFilters = {
  page?: number;
  pageSize?: number;
  ticketCode?: string;
  method?: string;
  status?: string;
};

type EventReportFilters = {
  page?: number;
  pageSize?: number;
  ticketCode?: string;
  eventType?: "entry" | "exit";
  deviceId?: string;
  lostTicket?: boolean;
};

function createQueryString(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    query.set(key, value);
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getStatus(accessToken: string): Promise<StatusResponse> {
  return apiGet<StatusResponse>("/api/v1/status", { accessToken });
}

export async function getSummary(accessToken: string): Promise<SummaryReport> {
  return apiGet<SummaryReport>("/api/v1/admin/reports/summary", { accessToken });
}

export async function getAdminTickets(
  accessToken: string,
  filters: TicketReportFilters = {},
): Promise<PaginatedTickets> {
  const query = createQueryString({
    page: filters.page?.toString(),
    page_size: filters.pageSize?.toString(),
    code: filters.code,
    status: filters.status,
    payment_status: filters.paymentStatus,
    lost_ticket:
      typeof filters.lostTicket === "boolean"
        ? String(filters.lostTicket)
        : undefined,
  });

  return apiGet<PaginatedTickets>(`/api/v1/admin/reports/tickets${query}`, {
    accessToken,
  });
}

export async function getAdminPayments(
  accessToken: string,
  filters: PaymentReportFilters = {},
): Promise<PaginatedPayments> {
  const query = createQueryString({
    page: filters.page?.toString(),
    page_size: filters.pageSize?.toString(),
    ticket_code: filters.ticketCode,
    method: filters.method,
    status: filters.status,
  });

  return apiGet<PaginatedPayments>(`/api/v1/admin/reports/payments${query}`, {
    accessToken,
  });
}

export async function getAdminEvents(
  accessToken: string,
  filters: EventReportFilters = {},
): Promise<PaginatedEvents> {
  const query = createQueryString({
    page: filters.page?.toString(),
    page_size: filters.pageSize?.toString(),
    ticket_code: filters.ticketCode,
    event_type: filters.eventType,
    device_id: filters.deviceId,
    lost_ticket:
      typeof filters.lostTicket === "boolean"
        ? String(filters.lostTicket)
        : undefined,
  });

  return apiGet<PaginatedEvents>(`/api/v1/admin/reports/events${query}`, {
    accessToken,
  });
}
