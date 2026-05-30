"use client";

import { Button, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { SimulationNotice } from "@/components/shared/SimulationNotice";
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
      bg="opsPanel"
      borderColor="opsBorder"
      borderRadius="2xl"
      borderWidth="1px"
      gap="4"
      p={{ base: "5", md: "6" }}
    >
      <Text fontSize="xl" fontWeight="bold">
        Checkout simulado
      </Text>
      <SimulationNotice />
      <Button
        colorPalette="cyan"
        onClick={async () => {
          await simulatePayment(ticketCode, { discount });
          router.push(`/pagar/${ticketCode}/confirmacion`);
        }}
      >
        Confirmar pago simulado
      </Button>
      <Button onClick={() => router.push(`/pagar/${ticketCode}`)} variant="outline">
        Cancelar
      </Button>
    </Stack>
  );
}
