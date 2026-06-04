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

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 1000,
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: `1px solid ${isDark ? "#1e293b" : "#c7d9f5"}`,
        background: isDark ? "#0f172a" : "#ffffff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s, border-color 0.2s",
        boxShadow: isDark
          ? "0 2px 8px rgba(0,0,0,0.5)"
          : "0 2px 8px rgba(14,42,115,0.12)",
      }}
    >
      {isDark ? (
        // Sol → presionar cambia a claro
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Luna → presionar cambia a oscuro
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
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
      <ColorModeToggle />

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
            fontFamily="var(--font-outfit)"
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
            fontFamily="var(--font-outfit)"
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