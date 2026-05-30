import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { TicketCodeInput } from "@/components/payment/TicketCodeInput";

export default function PayPage() {
  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={1} />
        <Heading>Consulta tu ticket</Heading>
        <Text color="opsMuted">
          Ingresa el codigo entregado al entrar al estacionamiento.
        </Text>
        <TicketCodeInput />
        <Link asChild color="opsCyan">
          <NextLink href="/ticket-extraviado">Perdi mi ticket</NextLink>
        </Link>
        <Link asChild color="opsCyan">
          <NextLink href="/ayuda">Necesito ayuda</NextLink>
        </Link>
      </Stack>
    </PaymentShell>
  );
}

