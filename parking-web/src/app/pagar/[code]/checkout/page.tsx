import { Stack } from "@chakra-ui/react";

import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { SimulatedCheckoutCard } from "@/components/payment/SimulatedCheckoutCard";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={3} />
        <SimulatedCheckoutCard ticketCode={ticketCode} />
      </Stack>
    </PaymentShell>
  );
}
