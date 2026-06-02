import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export function PaymentConfirmationCard({
  ticketCode,
  simulationReference,
}: {
  ticketCode: string;
  simulationReference: string | null;
}) {
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
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.06em"
          color="opsGreen"
          textShadow="0 0 12px rgba(16, 185, 129, 0.45)"
        >
          Pago Registrado
        </Heading>

        <Text color="opsMuted" fontSize="sm" maxW="400px" lineHeight="1.6">
          El pago se ha registrado exitosamente. Ya puedes utilizar tu código para validar la salida en el lector de barrera.
        </Text>

        {/* Digital Ticket Block */}
        <Stack bg="opsPanelMuted" border="1px solid" borderColor="opsBorder" p="4" borderRadius="xl" w="full" gap="2">
          <Text color="opsMuted" fontSize="xxs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
            Boleto Autorizado
          </Text>
          <Text
            fontFamily="var(--font-orbitron)"
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
            <Text color="opsMuted" fontSize="xxs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
              Referencia de Transacción
            </Text>
            <Text fontFamily="var(--font-orbitron)" fontSize="xs" color="opsMuted">
              {simulationReference}
            </Text>
          </Flex>
        ) : null}

        <Button
          asChild
          colorPalette="green"
          w="full"
          h="16"
          mt="2"
          fontFamily="var(--font-orbitron)"
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

