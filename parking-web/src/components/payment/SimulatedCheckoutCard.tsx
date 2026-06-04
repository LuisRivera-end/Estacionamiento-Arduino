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
      p={{ base: "6", md: "10" }}
      gap="7"
      transition="all 0.3s ease-in-out"
    >
      <Heading
        size="xl"
        fontFamily="var(--font-outfit)"
        letterSpacing="0.06em"
        color="opsCyan"
      >
        Pasarela de Pago
      </Heading>

      <Box
        bg="opsPanelMuted"
        border="1px solid"
        borderColor="opsBorder"
        p="6"
        borderRadius="xl"
      >
        <Flex align="center" gap="2.5" mb="3.5">
          <Box className="pulse-glow" w="2" h="2" bg="opsCyan" borderRadius="full" />
          <Text
            fontFamily="var(--font-outfit)"
            fontSize="xxs"
            fontWeight="black"
            letterSpacing="0.1em"
            color="opsCyan"
            textTransform="uppercase"
          >
            Conexión Segura
          </Text>
        </Flex>
        <Text color="opsMuted" fontSize="sm" lineHeight="1.6">
          Pasarela de pago digital activa. El pago para el boleto{" "}
          <Text as="span" fontFamily="var(--font-outfit)" fontWeight="bold" color="opsText">
            {ticketCode}
          </Text>{" "}
          se registrará de forma instantánea en la base de datos de control.
        </Text>
      </Box>

      <Button
        bg="opsCyan"
        color="white"
        h="16"
        fontFamily="var(--font-outfit)"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
        borderRadius="xl"
        _hover={{
          bg: "blue.700",
          transform: "translateY(-2px)",
        }}
        transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        onClick={async () => {
          await simulatePayment(ticketCode, { discount });
          router.push(`/pagar/${ticketCode}/confirmacion`);
        }}
      >
        Confirmar pago
      </Button>
      <Button
        variant="outline"
        borderColor="opsBorder"
        h="16"
        fontFamily="var(--font-outfit)"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
        borderRadius="xl"
        _hover={{ bg: "rgba(229, 237, 247, 0.04)" }}
        onClick={() => router.push(`/pagar/${ticketCode}`)}
        transition="all 0.25s"
      >
        Cancelar
      </Button>
    </Stack>
  );
}
