"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export function PaymentConfirmationCard({
  ticketCode,
  simulationReference,
}: {
  ticketCode: string;
  simulationReference: string | null;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds <= 0) {
      router.replace("/pagar");
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, router]);

  return (
    <Box
      className="glass-panel neon-glow-green"
      borderRadius="2xl"
      p={{ base: "6", md: "8" }}
      transition="all 0.3s ease-in-out"
    >
      <Stack gap="6" align="center" textAlign="center">
        {/* Glowing Success Badge */}
        <Flex
          w="16"
          h="16"
          borderRadius="full"
          bg="rgba(16, 185, 129, 0.08)"
          border="2px solid"
          borderColor="opsGreen"
          boxShadow="0 0 20px rgba(16, 185, 129, 0.45)"
          align="center"
          justify="center"
          className="pulse-glow"
          mb="2"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </Flex>

        <Heading
          size="xl"
          fontFamily="var(--font-outfit)"
          letterSpacing="0.06em"
          color="opsGreen"
        >
          Pago Registrado
        </Heading>

        <Text color="opsMuted" fontSize="sm" maxW="400px" lineHeight="1.6">
          El pago se ha registrado exitosamente. Ya puedes utilizar tu código para validar la salida en el lector de barrera.
        </Text>

        {/* Digital Ticket Block */}
        <Stack
          bg="opsPanelMuted"
          border="1px solid"
          borderColor="opsBorder"
          p="4"
          borderRadius="xl"
          w="full"
          gap="2"
        >
          <Text
            color="opsMuted"
            fontSize="xxs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            Boleto Autorizado
          </Text>
          <Text
            fontFamily="var(--font-outfit)"
            fontSize="2xl"
            fontWeight="900"
            color="opsCyan"
            letterSpacing="0.1em"
          >
            {ticketCode}
          </Text>
        </Stack>

        {simulationReference ? (
          <Flex direction="column" gap="1" w="full" align="center">
            <Text
              color="opsMuted"
              fontSize="xxs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              Referencia de Transacción
            </Text>
            <Text fontFamily="var(--font-outfit)" fontSize="xs" color="opsMuted">
              {simulationReference}
            </Text>
          </Flex>
        ) : null}

        {/* Countdown */}
        <Flex
          align="center"
          gap="2"
          bg="rgba(16, 185, 129, 0.06)"
          border="1px solid"
          borderColor="rgba(16, 185, 129, 0.2)"
          borderRadius="xl"
          px="4"
          py="3"
          w="full"
          justify="center"
        >
          {/* Spinner SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <Text fontSize="sm" color="opsGreen" fontFamily="var(--font-orbitron)" letterSpacing="0.05em">
            Redirigiendo en {seconds}s, espere...
          </Text>
        </Flex>

        <Button
          asChild
          colorPalette="green"
          w="full"
          h="16"
          mt="2"
          fontFamily="var(--font-outfit)"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
          bg="opsGreen"
          color="white"
          borderRadius="xl"
          _hover={{
            bg: "green.600",
            transform: "translateY(-2px)",
          }}
          transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        >
          <NextLink href="/pagar">Consultar otro boleto</NextLink>
        </Button>
      </Stack>
    </Box>
  );
}