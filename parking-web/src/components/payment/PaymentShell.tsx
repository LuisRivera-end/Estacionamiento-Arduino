import { Box, Container } from "@chakra-ui/react";

export function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <Box bg="opsBg" color="opsText" minH="100vh" py={{ base: "8", md: "10" }}>
      <Container maxW="720px">{children}</Container>
    </Box>
  );
}
