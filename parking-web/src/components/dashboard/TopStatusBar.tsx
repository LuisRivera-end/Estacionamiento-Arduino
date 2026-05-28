import { HStack, Text } from "@chakra-ui/react";

import { StatusBadge } from "./StatusBadge";

export function TopStatusBar() {
  return (
    <HStack
      borderBottomColor="opsBorder"
      borderBottomWidth="1px"
      justify="space-between"
      p="4"
    >
      <HStack gap="3">
        <StatusBadge label="API por verificar" tone="warning" />
        <Text color="opsMuted" fontSize="sm">
          Zona horaria: America/Mexico_City
        </Text>
      </HStack>
      <Text color="opsMuted" fontSize="sm">
        Sesión administrativa
      </Text>
    </HStack>
  );
}
