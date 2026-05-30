import { Box, HStack, Link, Container } from "@chakra-ui/react";
import NextLink from "next/link";

export function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <Box bg="opsBg" color="opsText" minH="100vh" py={{ base: "8", md: "10" }}>
      <Container maxW="720px">
        <HStack justify="flex-end" mb="4" gap="4">
          <Link asChild color="opsCyan">
            <NextLink href="/pagar">Pago</NextLink>
          </Link>
          <Link asChild color="opsCyan">
            <NextLink href="/ayuda">Ayuda</NextLink>
          </Link>
        </HStack>
        {children}
      </Container>
    </Box>
  );
}
