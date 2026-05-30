import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
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
      className="glass-panel neon-glow-yellow"
      borderRadius="2xl"
      p={{ base: "6", md: "7" }}
      transition="all 0.3s ease-in-out"
    >
      <Stack gap="5">
        <Heading
          size="md"
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.05em"
          color="opsCyan"
          textShadow="0 0 8px rgba(6, 182, 212, 0.3)"
        >
          Resumen de Ticket
        </Heading>

        <Stack gap="3.5" borderBottom="1px solid" borderColor="opsBorder" pb="4">
          <Flex justify="space-between">
            <Text color="opsMuted" fontSize="sm">Código:</Text>
            <Text fontFamily="var(--font-orbitron)" fontWeight="bold" color="opsText" fontSize="sm">
              {ticket.ticket_code}
            </Text>
          </Flex>
          <Flex justify="space-between">
            <Text color="opsMuted" fontSize="sm">Entrada:</Text>
            <Text color="opsText" fontSize="sm">{formatDateTime(ticket.entry_at)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color="opsMuted" fontSize="sm">Duración:</Text>
            <Text color="opsText" fontSize="sm" fontWeight="bold">
              {calculation.duration_minutes} min
            </Text>
          </Flex>
        </Stack>

        <Stack gap="3" borderBottom="1px solid" borderColor="opsBorder" pb="4">
          <Flex justify="space-between">
            <Text color="opsMuted" fontSize="sm">Subtotal:</Text>
            <Text color="opsText" fontSize="sm">
              {formatCurrency(calculation.subtotal_amount, calculation.currency)}
            </Text>
          </Flex>
          {calculation.discount_type !== "none" ? (
            <Flex justify="space-between">
              <Text color="opsGreen" fontSize="sm" fontWeight="medium">
                Descuento ({formatDiscountLabel(calculation)}):
              </Text>
              <Text color="opsGreen" fontSize="sm" fontWeight="bold">
                -{formatCurrency(calculation.discount_amount, calculation.currency)}
              </Text>
            </Flex>
          ) : null}
        </Stack>

        <Flex justify="space-between" align="center" py="1">
          <Text
            color="opsMuted"
            fontSize="sm"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            Total a Pagar:
          </Text>
          <Text
            color="opsYellow"
            fontFamily="var(--font-orbitron)"
            fontSize="3xl"
            fontWeight="900"
            textShadow="0 0 12px rgba(245, 158, 11, 0.4)"
          >
            {formatCurrency(calculation.amount, calculation.currency)}
          </Text>
        </Flex>

        <Button
          asChild
          colorPalette="cyan"
          w="full"
          h="12"
          mt="2"
          fontFamily="var(--font-orbitron)"
          fontWeight="bold"
          letterSpacing="0.05em"
          textTransform="uppercase"
          bg="opsCyan"
          color="black"
          _hover={{
            bg: "cyan.300",
            transform: "translateY(-2px)",
            boxShadow: "0 4px 15px rgba(6, 182, 212, 0.4)",
          }}
          transition="all 0.2s"
        >
          <NextLink href={checkoutHref}>Proceder al Pago</NextLink>
        </Button>
      </Stack>
    </Box>
  );
}

