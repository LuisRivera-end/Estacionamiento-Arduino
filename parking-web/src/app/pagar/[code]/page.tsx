import { Stack } from "@chakra-ui/react";

import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { PaymentSummaryCard } from "@/components/payment/PaymentSummaryCard";
import { calculateTicket, getTicket } from "@/lib/api/tickets";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function TicketSummaryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);
  const [ticket, calculation] = await Promise.all([
    getTicket(ticketCode),
    calculateTicket(ticketCode),
  ]);

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={2} />
        <PaymentSummaryCard calculation={calculation} ticket={ticket} />
      </Stack>
    </PaymentShell>
  );
}
