import { Box, Flex, HStack, Link, Container } from "@chakra-ui/react";
import NextLink from "next/link";

export function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      bg="opsBg"
      bgGradient="radial(circle at 80% 20%, rgba(6, 182, 212, 0.04), transparent 50%), radial(circle at 20% 80%, rgba(16, 185, 129, 0.025), transparent 50%)"
      color="opsText"
      minH="100vh"
      py={{ base: "8", md: "12" }}
      display="flex"
      alignItems="center"
    >
      <Container maxW="600px">
        <HStack
          className="glass-panel"
          borderRadius="full"
          py="2.5"
          px="6"
          mb="8"
          w="fit-content"
          ml="auto"
          gap="6"
          borderColor="rgba(30, 46, 74, 0.6)"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
        >
          <Link
            asChild
            color="opsCyan"
            fontFamily="var(--font-orbitron)"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            transition="all 0.25s"
            _hover={{
              color: "opsText",
              textShadow: "0 0 8px rgba(6, 182, 212, 0.6)",
            }}
          >
            <NextLink href="/pagar">Pago</NextLink>
          </Link>
          <Link
            asChild
            color="opsCyan"
            fontFamily="var(--font-orbitron)"
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            transition="all 0.25s"
            _hover={{
              color: "opsText",
              textShadow: "0 0 8px rgba(6, 182, 212, 0.6)",
            }}
          >
            <NextLink href="/ayuda">Ayuda</NextLink>
          </Link>
        </HStack>
        <Box animation="fade-in 0.5s ease-out">
          {children}
        </Box>
      </Container>
    </Box>
  );
}

