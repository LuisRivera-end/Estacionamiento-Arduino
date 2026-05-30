import { normalizeTicketCode } from "../formatters";
import { apiGet, apiPost } from "./client";
import { calculationFixture, ticketFixture } from "./fixtures";
import type { DiscountRequest, TicketCalculation, TicketResponse } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getTicket(code: string): Promise<TicketResponse> {
  const ticketCode = normalizeTicketCode(code);

  if (useFixtures) return { ...ticketFixture, ticket_code: ticketCode };

  return apiGet<TicketResponse>(`/api/v1/public/tickets/${encodeURIComponent(ticketCode)}`);
}

export async function calculateTicket(
  code: string,
  options: { lostTicket?: boolean; discount?: DiscountRequest } = {},
): Promise<TicketCalculation> {
  const ticketCode = normalizeTicketCode(code);
  const lostTicket = options.lostTicket ?? false;
  const discount = options.discount ?? { type: "none" as const };

  if (useFixtures) return { ...calculationFixture, ticket_code: ticketCode };

  return apiPost<TicketCalculation>(
    `/api/v1/public/tickets/${encodeURIComponent(ticketCode)}/calculate`,
    {
      lost_ticket: lostTicket,
      discount,
    },
  );
}
