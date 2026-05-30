import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import type { TicketCalculation, TicketResponse } from "@/lib/api/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

type PaymentSummaryCardProps = {
  ticket: TicketResponse;
  calculation: TicketCalculation;
  checkoutHref: string;
};

function formatDiscountLabel(calculation: TicketCalculation): string {
  if (calculation.discount_type === "senior") {
    return `Adulto mayor (${calculation.discount_percent}%)`;
  }
  if (calculation.discount_type === "student") {
    return `Estudiante (${calculation.discount_percent}%)`;
  }
  return "Sin descuento";
}

export function PaymentSummaryCard({
  ticket,
  calculation,
  checkoutHref,
}: PaymentSummaryCardProps) {
  return (
    <Box
      bg="opsPanel"
      borderColor="opsBorder"
      borderRadius="2xl"
      borderWidth="1px"
      p={{ base: "5", md: "6" }}
    >
      <Stack gap="3">
        <Heading size="lg">Ticket {ticket.ticket_code}</Heading>
        <Text color="opsMuted">Entrada: {formatDateTime(ticket.entry_at)}</Text>
        <Text>Duracion: {calculation.duration_minutes} minutos</Text>
        <Text>Subtotal: {formatCurrency(calculation.subtotal_amount, calculation.currency)}</Text>
        <Text>
          Descuento: {formatDiscountLabel(calculation)} (-
          {formatCurrency(calculation.discount_amount, calculation.currency)})
        </Text>
        <Text color="opsYellow" fontSize="2xl" fontWeight="bold">
          {formatCurrency(calculation.amount, calculation.currency)}
        </Text>
        <Button asChild colorPalette="cyan">
          <NextLink href={checkoutHref}>Continuar a checkout simulado</NextLink>
        </Button>
      </Stack>
    </Box>
  );
}
