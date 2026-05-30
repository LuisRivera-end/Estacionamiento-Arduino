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
          size="md"
          fontFamily="var(--font-orbitron)"
          letterSpacing="0.05em"
          color="opsGreen"
          textShadow="0 0 10px rgba(16, 185, 129, 0.4)"
        >
          Pago Registrado
        </Heading>

        <Text color="opsMuted" fontSize="sm" maxW="320px">
          El cargo simulado se ha procesado. Ya puedes utilizar tu código para validar la salida en el lector de barrera.
        </Text>

        {/* Digital Ticket Block */}
        <Stack bg="rgba(13, 21, 39, 0.55)" border="1px solid" borderColor="opsBorder" p="4" borderRadius="xl" w="full" gap="2">
          <Text color="opsMuted" fontSize="xxs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
            Boleto Autorizado
          </Text>
          <Text
            fontFamily="var(--font-orbitron)"
            fontSize="2xl"
            fontWeight="900"
            color="opsCyan"
            letterSpacing="0.1em"
            textShadow="0 0 8px rgba(6, 182, 212, 0.3)"
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
          h="12"
          mt="2"
          fontFamily="var(--font-orbitron)"
          fontWeight="bold"
          letterSpacing="0.05em"
          textTransform="uppercase"
          bg="opsGreen"
          color="black"
          _hover={{
            bg: "green.300",
            transform: "translateY(-2px)",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
          }}
          transition="all 0.2s"
        >
          <NextLink href="/pagar">Consultar otro boleto</NextLink>
        </Button>
      </Stack>
    </Box>
  );
}

