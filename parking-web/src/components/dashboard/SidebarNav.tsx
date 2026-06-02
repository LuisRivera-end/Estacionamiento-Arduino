"use client";

import { Box, Flex, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["Resumen", "/dashboard"],
  ["Eventos", "/dashboard/eventos"],
  ["Tickets", "/dashboard/tickets"],
  ["Pagos", "/dashboard/pagos"],
  ["Tarifas", "/dashboard/tarifas"],
  ["Reportes", "/dashboard/reportes"],
  ["Backups", "/dashboard/backups"],
  ["Usuarios", "/dashboard/usuarios"],
  ["Configuracion", "/dashboard/configuracion"],
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Box
      as="aside"
      className="glass-panel"
      borderRightWidth="1px"
      minH="100vh"
      p="5"
      w={{ base: "220px", xl: "260px" }}
      display="flex"
      flexDirection="column"
      position="sticky"
      top="0"
    >
      <Flex align="center" gap="2" mb="8">
        <Box
          className="pulse-glow"
          w="2.5"
          h="2.5"
          bg="opsGreen"
          borderRadius="full"
        />
        <Text
          color="opsCyan"
          fontFamily="var(--font-orbitron)"
          fontWeight="900"
          fontSize="lg"
          letterSpacing="0.08em"
        >
          PARKING OPS
        </Text>
      </Flex>
      <Stack gap="1.5">
        {navItems.map(([label, href]) => {
          const isActive = pathname === href;

          return (
            <Link
              asChild
              color={isActive ? "opsCyan" : "opsText"}
              key={href}
              px="4"
              py="2.5"
              rounded="md"
              bg={isActive ? "rgba(37, 99, 235, 0.08)" : "transparent"}
              borderLeft={isActive ? "3px solid #2563eb" : "3px solid transparent"}
              fontWeight={isActive ? "bold" : "normal"}
              transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                bg: isActive ? "rgba(37, 99, 235, 0.12)" : "rgba(37, 99, 235, 0.04)",
                color: "opsCyan",
                borderLeft: "3px solid #2563eb",
                transform: "translateX(2px)",
              }}
            >
              <NextLink href={href}>{label}</NextLink>
            </Link>
          );
        })}
      </Stack>
    </Box>
  );
}

