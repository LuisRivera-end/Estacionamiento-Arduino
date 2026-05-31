import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { PaymentShell } from "@/components/payment/PaymentShell";

export default function LostTicketPage() {
  return (
    <PaymentShell>
      <Stack
        className="glass-panel neon-glow-cyan"
        borderRadius="2xl"
        p={{ base: "6", md: "8" }}
        gap="6"
        transition="all 0.3s ease-in-out"
      >
        <Heading
          size="lg"
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.06em"
          color="opsCyan"
          textShadow="0 0 8px rgba(6, 182, 212, 0.35)"
        >
          Ticket Extraviado
        </Heading>

        <Text color="opsMuted" fontSize="sm" lineHeight="1.6">
          El operador en caseta debe confirmar la tarifa de extravío. Tu pago se registrará y el ticket quedará validado para reportes y salida del sistema.
        </Text>

        <Button
          asChild
          colorPalette="cyan"
          variant="outline"
          borderColor="opsCyan"
          color="opsCyan"
          h="14"
          mt="2"
          borderRadius="xl"
          fontFamily="var(--font-orbitron)"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
          _hover={{
            bg: "rgba(6, 182, 212, 0.12)",
            borderColor: "opsCyan",
            boxShadow: "0 0 10px rgba(6, 182, 212, 0.3)",
          }}
          transition="all 0.25s"
        >
          <NextLink href="/pagar">Volver a la consulta</NextLink>
        </Button>
      </Stack>
    </PaymentShell>
  );
}
