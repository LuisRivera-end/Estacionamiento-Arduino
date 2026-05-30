import { Stack } from "@chakra-ui/react";

import { PaymentConfirmationCard } from "@/components/payment/PaymentConfirmationCard";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function PaymentConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  const ticketCode = normalizeTicketCode(code);
  const rawSimulationReference = resolvedSearchParams.simulation_reference;
  const simulationReference = Array.isArray(rawSimulationReference)
    ? rawSimulationReference[0]
    : rawSimulationReference;

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={4} />
        <PaymentConfirmationCard
          simulationReference={simulationReference ?? null}
          ticketCode={ticketCode}
        />
      </Stack>
    </PaymentShell>
  );
}
