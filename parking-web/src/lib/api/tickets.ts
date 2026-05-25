import { apiGet, apiPost } from "./client";
import { calculationFixture, ticketFixture } from "./fixtures";
import type { TicketCalculation, TicketResponse } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getTicket(code: string): Promise<TicketResponse> {
  if (useFixtures) return { ...ticketFixture, ticket_code: code };

  return apiGet<TicketResponse>(`/tickets/${code}`);
}

export async function calculateTicket(
  code: string,
  lostTicket = false,
): Promise<TicketCalculation> {
  if (useFixtures) return { ...calculationFixture, ticket_code: code };

  return apiPost<TicketCalculation>(`/tickets/${code}/calculate`, {
    lost_ticket: lostTicket,
  });
}
