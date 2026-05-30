import NextLink from "next/link";
import { Button, Stack } from "@chakra-ui/react";

import { ErrorState } from "@/components/feedback/ErrorState";
import { PaymentSummaryClient } from "@/components/payment/PaymentSummaryClient";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { calculateTicket, getTicket } from "@/lib/api/tickets";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function TicketSummaryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);
  let ticketData:
    | Awaited<ReturnType<typeof getTicket>>
    | null = null;
  let calculationData:
    | Awaited<ReturnType<typeof calculateTicket>>
    | null = null;
  let errorDescription: string | null = null;

  try {
    const [ticket, calculation] = await Promise.all([
      getTicket(ticketCode),
      calculateTicket(ticketCode, { discount: { type: "none" } }),
    ]);
    ticketData = ticket;
    calculationData = calculation;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message.toLowerCase() : "";
    errorDescription = rawMessage.includes("ticket no encontrado")
      ? "No encontramos el ticket solicitado. Revisa el codigo e intenta nuevamente."
      : "No fue posible consultar la informacion del ticket por ahora.";
  }

  if (errorDescription || !ticketData || !calculationData) {
    return (
      <PaymentShell>
        <Stack gap="6">
          <PaymentStepIndicator current={2} />
          <ErrorState title="Ticket no disponible" description={errorDescription ?? "No fue posible consultar la informacion del ticket por ahora."} />
          <Button asChild colorPalette="cyan" variant="outline" w="fit-content">
            <NextLink href="/pagar">Consultar otro ticket</NextLink>
          </Button>
        </Stack>
      </PaymentShell>
    );
  }

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={2} />
        <PaymentSummaryClient
          initialCalculation={calculationData}
          ticket={ticketData}
          ticketCode={ticketCode}
        />
      </Stack>
    </PaymentShell>
  );
}
