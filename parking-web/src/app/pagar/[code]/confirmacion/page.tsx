import { Stack } from "@chakra-ui/react";

import { PaymentConfirmationCard } from "@/components/payment/PaymentConfirmationCard";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function PaymentConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={4} />
        <PaymentConfirmationCard ticketCode={ticketCode} />
      </Stack>
    </PaymentShell>
  );
}
