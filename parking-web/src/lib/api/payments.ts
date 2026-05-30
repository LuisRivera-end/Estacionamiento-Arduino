import { normalizeTicketCode } from "../formatters";
import { apiPost } from "./client";
import { paymentFixture } from "./fixtures";
import type { DiscountRequest, SimulatedPayment } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function simulatePayment(
  ticketCode: string,
  options: { lostTicket?: boolean; discount?: DiscountRequest } = {},
): Promise<SimulatedPayment> {
  const normalizedTicketCode = normalizeTicketCode(ticketCode);
  const lostTicket = options.lostTicket ?? false;
  const discount = options.discount ?? { type: "none" as const };

  if (useFixtures) {
    return {
      ...paymentFixture,
      ticket_code: normalizedTicketCode,
      simulation_reference: lostTicket
        ? `sim_payment_${normalizedTicketCode}_lost`
        : paymentFixture.simulation_reference,
      provider_reference: lostTicket
        ? `sim_payment_${normalizedTicketCode}_lost`
        : paymentFixture.provider_reference,
    };
  }

  return apiPost<SimulatedPayment>("/api/v1/public/payments/simulate", {
    ticket_code: normalizedTicketCode,
    lost_ticket: lostTicket,
    method: lostTicket ? "lost_ticket" : "simulated_payment",
    discount,
  });
}
