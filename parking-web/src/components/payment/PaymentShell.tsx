"use client";

import { useEffect, useState } from "react";
import { Box, Container, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";

function ColorModeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("chakra-color-mode");
    setIsDark(stored !== "light");
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("chakra-color-mode", next);
    // Chakra v3 usa este atributo en <html> para aplicar el modo
    document.documentElement.dataset.theme = next;
  }
}
export function PaymentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  const isHelpActive = pathname.startsWith("/ayuda");
  const isPayActive =
    pathname.startsWith("/pagar") ||
    pathname.startsWith("/ticket-extraviado") ||
    pathname === "/";

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
      bgGradient="none"
      color="opsText"
      minH="100vh"
      pt={{ base: "12", md: "20" }}
      pb={{ base: "16", md: "24" }}
    >
      <Container maxW="580px" px={{ base: "4", md: "6" }}>
        {currentStep !== null && (
          <Box mb="10" w="full">
            <PaymentStepIndicator current={currentStep} />
          </Box>
        )}

        <HStack
          className="glass-panel"
          borderRadius="full"
          py="2"
          px="2.5"
          mb="10"
          w="fit-content"
          mx="auto"
          gap="2"
          borderColor="opsBorder"
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
                  bg: "rgba(37, 99, 235, 0.08)",
                  border: "1px solid",
                  borderColor: "rgba(37, 99, 235, 0.3)",
                }
              : {
                  color: "opsCyan",
                  opacity: 0.6,
                  border: "1px solid transparent",
                  _hover: { color: "opsText", opacity: 1 },
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
                  bg: "rgba(37, 99, 235, 0.08)",
                  border: "1px solid",
                  borderColor: "rgba(37, 99, 235, 0.3)",
                }
              : {
                  color: "opsCyan",
                  opacity: 0.6,
                  border: "1px solid transparent",
                  _hover: { color: "opsText", opacity: 1 },
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