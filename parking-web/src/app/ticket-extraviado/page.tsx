import { Heading, Stack, Text } from "@chakra-ui/react";

import { PaymentShell } from "@/components/payment/PaymentShell";
import { SimulationNotice } from "@/components/shared/SimulationNotice";

export default function LostTicketPage() {
  return (
    <PaymentShell>
      <Stack gap="5">
        <Heading>Ticket extraviado</Heading>
        <Text color="opsMuted">
          El operador debe confirmar la tarifa de extravio. El pago se
          registrara como simulado y quedara marcado para reportes.
        </Text>
        <SimulationNotice />
      </Stack>
    </PaymentShell>
  );
}
