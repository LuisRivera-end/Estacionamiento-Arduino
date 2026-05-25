import { Box, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

const navItems = [
  ["Resumen", "/dashboard"],
  ["Eventos", "/dashboard/eventos"],
  ["Tickets", "/dashboard/tickets"],
  ["Pagos", "/dashboard/pagos"],
  ["Tarifas", "/dashboard/tarifas"],
  ["Reportes", "/dashboard/reportes"],
  ["Backups", "/dashboard/backups"],
  ["Configuracion", "/dashboard/configuracion"],
] as const;

export function SidebarNav() {
  return (
    <Box
      as="aside"
      bg="opsPanel"
      borderColor="opsBorder"
      borderRightWidth="1px"
      minH="100vh"
      p="5"
      w={{ base: "220px", xl: "260px" }}
    >
      <Text color="opsGreen" fontWeight="bold" mb="6">
        PARKING OPS
      </Text>
      <Stack gap="2">
        {navItems.map(([label, href]) => (
          <Link
            asChild
            color="opsText"
            key={href}
            px="3"
            py="2"
            rounded="md"
            _hover={{ bg: "opsPanelMuted", color: "opsCyan" }}
          >
            <NextLink href={href}>{label}</NextLink>
          </Link>
        ))}
      </Stack>
    </Box>
  );
}
