import { Box, Heading, Text } from "@chakra-ui/react";

export function PaymentConfirmationCard({ ticketCode }: { ticketCode: string }) {
  return (
    <Box
      bg="opsPanel"
      borderColor="opsBorder"
      borderRadius="2xl"
      borderWidth="1px"
      p={{ base: "5", md: "6" }}
    >
      <Heading size="lg">Pago simulado registrado</Heading>
      <Text color="opsMuted" mt="3">
        Ticket {ticketCode}
      </Text>
      <Text mt="3">
        Ya puedes ingresar el codigo en la salida del estacionamiento.
      </Text>
    </Box>
  );
}
