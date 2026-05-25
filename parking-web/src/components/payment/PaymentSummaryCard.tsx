import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import type { TicketCalculation, TicketResponse } from "@/lib/api/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export function PaymentSummaryCard({
  ticket,
  calculation,
}: {
  ticket: TicketResponse;
  calculation: TicketCalculation;
}) {
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
        <Text color="opsYellow" fontSize="2xl" fontWeight="bold">
          {formatCurrency(calculation.amount, calculation.currency)}
        </Text>
        <Button asChild colorPalette="cyan">
          <NextLink href={`/pagar/${ticket.ticket_code}/checkout`}>
            Continuar a checkout simulado
          </NextLink>
        </Button>
      </Stack>
    </Box>
  );
}
