import { apiGet } from "./client";
import { statusFixture, summaryFixture } from "./fixtures";
import type {
  PaginatedEvents,
  PaginatedPayments,
  PaginatedTickets,
  StatusResponse,
  SummaryReport,
} from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

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
  if (useFixtures) return statusFixture;

  return apiGet<StatusResponse>("/api/v1/status", { accessToken });
}

export async function getSummary(accessToken: string): Promise<SummaryReport> {
  if (useFixtures) return summaryFixture;

  return apiGet<SummaryReport>("/api/v1/admin/reports/summary", { accessToken });
}

export async function getAdminTickets(
  accessToken: string,
  filters: TicketReportFilters = {},
): Promise<PaginatedTickets> {
  if (useFixtures) {
    return {
      items: [
        {
          ticket_code: "A1B2C",
          status: "active",
          payment_status: "unpaid",
          entry_at: "2026-05-23T09:10:00-06:00",
          paid_at: null,
          exit_at: null,
          calculated_amount: 0,
          lost_ticket: false,
        },
      ],
      total: 1,
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 25,
    };
  }

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
  if (useFixtures) {
    return {
      items: [
        {
          payment_id: "simulated-payment-id",
          ticket_code: "A1B2C",
          amount: 3,
          method: "simulated_stripe",
          status: "simulated",
          provider_reference: "sim_stripe_20260523_001",
          created_by: "fixture-user",
          created_at: "2026-05-23T10:14:00-06:00",
        },
      ],
      total: 1,
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 25,
    };
  }

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
  if (useFixtures) {
    return {
      items: [
        {
          event_at: "2026-05-23T09:10:00-06:00",
          event_type: "entry",
          ticket_code: "A1B2C",
          device_id: "entrada-01",
          result: "autorizada",
        },
      ],
      total: 1,
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 25,
    };
  }

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
