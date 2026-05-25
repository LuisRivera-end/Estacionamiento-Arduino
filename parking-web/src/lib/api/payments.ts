import { normalizeTicketCode } from "../formatters";
import { apiPost } from "./client";
import { paymentFixture } from "./fixtures";
import type { SimulatedPayment } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function simulatePayment(
  ticketCode: string,
  lostTicket = false,
): Promise<SimulatedPayment> {
  const normalizedTicketCode = normalizeTicketCode(ticketCode);

  if (useFixtures) {
    return {
      ...paymentFixture,
      ticket_code: normalizedTicketCode,
      provider_reference: lostTicket
        ? `sim_lost_ticket_${normalizedTicketCode}`
        : paymentFixture.provider_reference,
    };
  }

  return apiPost<SimulatedPayment>("/payments/simulate", {
    ticket_code: normalizedTicketCode,
    lost_ticket: lostTicket,
    method: lostTicket ? "lost_ticket" : "simulated_stripe",
  });
}
