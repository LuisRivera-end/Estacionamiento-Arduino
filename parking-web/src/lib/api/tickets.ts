import { normalizeTicketCode } from "../formatters";
import { apiGet, apiPost } from "./client";
import { calculationFixture, ticketFixture } from "./fixtures";
import type { TicketCalculation, TicketResponse } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getTicket(code: string): Promise<TicketResponse> {
  const ticketCode = normalizeTicketCode(code);

  if (useFixtures) return { ...ticketFixture, ticket_code: ticketCode };

  return apiGet<TicketResponse>(`/tickets/${encodeURIComponent(ticketCode)}`);
}

export async function calculateTicket(
  code: string,
  lostTicket = false,
): Promise<TicketCalculation> {
  const ticketCode = normalizeTicketCode(code);

  if (useFixtures) return { ...calculationFixture, ticket_code: ticketCode };

  return apiPost<TicketCalculation>(`/tickets/${encodeURIComponent(ticketCode)}/calculate`, {
    lost_ticket: lostTicket,
  });
}
