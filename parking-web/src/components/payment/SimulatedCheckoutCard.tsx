"use client";

import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { simulatePayment } from "@/lib/api/payments";
import type { DiscountRequest } from "@/lib/api/types";

export function SimulatedCheckoutCard({
  ticketCode,
  discount,
}: {
  ticketCode: string;
  discount: DiscountRequest;
}) {
  const router = useRouter();

  return (
    <Stack
      className="glass-panel neon-glow-cyan"
      borderRadius="2xl"
      p="6"
      gap="5"
      transition="all 0.3s ease-in-out"
    >
      <Heading
        size="md"
        fontFamily="var(--font-orbitron)"
        letterSpacing="0.05em"
        color="opsCyan"
        textShadow="0 0 8px rgba(6, 182, 212, 0.3)"
      >
        Checkout Simulado
      </Heading>

      <Box
        bg="rgba(6, 182, 212, 0.04)"
        border="1px solid"
        borderColor="rgba(6, 182, 212, 0.15)"
        p="4"
        borderRadius="xl"
      >
        <Flex align="center" gap="2.5" mb="2">
          <Box className="pulse-glow" w="2" h="2" bg="opsCyan" borderRadius="full" />
          <Text
            fontFamily="var(--font-orbitron)"
            fontSize="xxs"
            fontWeight="black"
            letterSpacing="0.1em"
            color="opsCyan"
            textTransform="uppercase"
          >
            Conexión Segura
          </Text>
        </Flex>
        <Text color="opsMuted" fontSize="xs" lineHeight="1.6">
          Entorno de simulación de pasarela activo. El pago para el boleto{" "}
          <Text as="span" fontFamily="var(--font-orbitron)" fontWeight="bold" color="opsText">
            {ticketCode}
          </Text>{" "}
          se registrará de forma instantánea en la base de datos de control.
        </Text>
      </Box>

      <Button
        bg="opsCyan"
        color="black"
        h="12"
        fontFamily="var(--font-orbitron)"
        fontWeight="bold"
        letterSpacing="0.05em"
        textTransform="uppercase"
        _hover={{
          bg: "cyan.300",
          transform: "translateY(-2px)",
          boxShadow: "0 4px 15px rgba(6, 182, 212, 0.4)",
        }}
        transition="all 0.2s"
        onClick={async () => {
          await simulatePayment(ticketCode, { discount });
          router.push(`/pagar/${ticketCode}/confirmacion`);
        }}
      >
        Confirmar pago simulado
      </Button>
      <Button
        variant="outline"
        borderColor="opsBorder"
        h="12"
        fontFamily="var(--font-orbitron)"
        fontWeight="bold"
        letterSpacing="0.05em"
        textTransform="uppercase"
        _hover={{ bg: "rgba(229, 237, 247, 0.04)" }}
        onClick={() => router.push(`/pagar/${ticketCode}`)}
      >
        Cancelar
      </Button>
    </Stack>
  );
}


