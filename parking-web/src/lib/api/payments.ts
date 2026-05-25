import { apiPost } from "./client";
import { paymentFixture } from "./fixtures";
import type { SimulatedPayment } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function simulatePayment(
  ticketCode: string,
  lostTicket = false,
): Promise<SimulatedPayment> {
  if (useFixtures) return { ...paymentFixture, ticket_code: ticketCode };

  return apiPost<SimulatedPayment>("/payments/simulate", {
    ticket_code: ticketCode,
    lost_ticket: lostTicket,
    method: lostTicket ? "lost_ticket" : "simulated_stripe",
  });
}
