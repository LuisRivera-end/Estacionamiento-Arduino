import { Badge, Box, Text } from "@chakra-ui/react";

export function SimulationNotice() {
  return (
    <Box
      bg="rgba(251,191,36,0.12)"
      borderColor="opsYellow"
      borderRadius="lg"
      borderWidth="1px"
      p={{ base: "3", md: "4" }}
    >
      <Badge colorPalette="yellow" mb="2">
        Pago simulado
      </Badge>
      <Text color="opsText" fontSize="sm" lineHeight="1.6">
        En esta experiencia no se realiza cargo real ni se solicitan datos
        bancarios.
      </Text>
    </Box>
  );
}
