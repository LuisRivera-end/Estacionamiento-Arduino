import { HStack, Text } from "@chakra-ui/react";

const steps = ["Consultar", "Revisar", "Simular pago", "Confirmar"];

export function PaymentStepIndicator({ current }: { current: number }) {
  return (
    <HStack
      color="opsMuted"
      flexWrap="wrap"
      fontSize="sm"
      gap={{ base: "2", md: "3" }}
    >
      {steps.map((step, index) => {
        const isCurrent = index + 1 === current;

        return (
          <Text
            color={isCurrent ? "opsCyan" : "opsMuted"}
            fontWeight={isCurrent ? "bold" : "normal"}
            key={step}
          >
            {index + 1}. {step}
          </Text>
        );
      })}
    </HStack>
  );
}
