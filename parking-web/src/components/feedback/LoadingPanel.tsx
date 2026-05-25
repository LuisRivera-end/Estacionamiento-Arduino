import { HStack, Spinner, Text } from "@chakra-ui/react";

export function LoadingPanel({
  label = "Cargando informacion",
}: {
  label?: string;
}) {
  return (
    <HStack color="opsMuted" gap="3" p={{ base: "5", md: "6" }}>
      <Spinner size="sm" />
      <Text>{label}</Text>
    </HStack>
  );
}
