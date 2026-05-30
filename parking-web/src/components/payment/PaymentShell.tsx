"use client";

import { Box, Container, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";

export function PaymentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  
  const isHelpActive = pathname.startsWith("/ayuda");
  const isPayActive = pathname.startsWith("/pagar") || pathname.startsWith("/ticket-extraviado") || pathname === "/";

  // Determine if stepper should be shown and which is the current step
  let currentStep: number | null = null;
  if (pathname === "/pagar") {
    currentStep = 1;
  } else if (pathname.startsWith("/pagar/")) {
    if (pathname.endsWith("/checkout")) {
      currentStep = 3;
    } else if (pathname.endsWith("/confirmacion")) {
      currentStep = 4;
    } else {
      currentStep = 2;
    }
  }

  return (
    <Box
      bg="opsBg"
      bgGradient="radial(circle at 50% 10%, rgba(6, 182, 212, 0.06), transparent 60%), radial(circle at 20% 80%, rgba(16, 185, 129, 0.025), transparent 50%)"
      color="opsText"
      minH="100vh"
      pt={{ base: "12", md: "20" }}
      pb={{ base: "16", md: "24" }}
    >
      <Container maxW="580px" px={{ base: "4", md: "6" }}>
        {/* Stepper is now at the top of the container layout */}
        {currentStep !== null && (
          <Box mb="10" w="full">
            <PaymentStepIndicator current={currentStep} />
          </Box>
        )}

        {/* Tab switcher navigation is below the stepper */}
        <HStack
          className="glass-panel"
          borderRadius="full"
          py="2"
          px="2.5"
          mb="10"
          w="fit-content"
          mx="auto"
          gap="2"
          borderColor="rgba(6, 182, 212, 0.15)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(6, 182, 212, 0.2)"
        >
          <Link
            asChild
            fontFamily="var(--font-orbitron)"
            fontSize="sm"
            fontWeight="900"
            letterSpacing="0.12em"
            textTransform="uppercase"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            px="8"
            py="3"
            borderRadius="full"
            {...(isPayActive
              ? {
                  color: "opsText",
                  bg: "rgba(6, 182, 212, 0.12)",
                  border: "1px solid",
                  borderColor: "rgba(6, 182, 212, 0.4)",
                  textShadow: "0 0 10px rgba(6, 182, 212, 0.8)",
                  boxShadow: "0 4px 12px rgba(6, 182, 212, 0.15)",
                }
              : {
                  color: "opsCyan",
                  opacity: 0.6,
                  border: "1px solid transparent",
                  _hover: {
                    color: "opsText",
                    opacity: 1,
                    textShadow: "0 0 8px rgba(6, 182, 212, 0.5)",
                  },
                })}
          >
            <NextLink href="/pagar">Pago</NextLink>
          </Link>
          <Link
            asChild
            fontFamily="var(--font-orbitron)"
            fontSize="sm"
            fontWeight="900"
            letterSpacing="0.12em"
            textTransform="uppercase"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            px="8"
            py="3"
            borderRadius="full"
            {...(isHelpActive
              ? {
                  color: "opsText",
                  bg: "rgba(6, 182, 212, 0.12)",
                  border: "1px solid",
                  borderColor: "rgba(6, 182, 212, 0.4)",
                  textShadow: "0 0 10px rgba(6, 182, 212, 0.8)",
                  boxShadow: "0 4px 12px rgba(6, 182, 212, 0.15)",
                }
              : {
                  color: "opsCyan",
                  opacity: 0.6,
                  border: "1px solid transparent",
                  _hover: {
                    color: "opsText",
                    opacity: 1,
                    textShadow: "0 0 8px rgba(6, 182, 212, 0.5)",
                  },
                })}
          >
            <NextLink href="/ayuda">Ayuda</NextLink>
          </Link>
        </HStack>

        <Box animation="fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)">
          {children}
        </Box>
      </Container>
    </Box>
  );
}
