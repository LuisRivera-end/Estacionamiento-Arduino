import { Box, Flex, HStack, Text } from "@chakra-ui/react";

import { StatusBadge } from "./StatusBadge";

export function TopStatusBar() {
  return (
    <Box
      as="header"
      className="glass-panel"
      borderBottomWidth="1px"
      borderTopWidth="0"
      borderLeftWidth="0"
      borderRightWidth="0"
      px={{ base: "5", xl: "6" }}
      py="4"
      position="sticky"
      top="0"
      zIndex="10"
    >
      <Flex justify="space-between" align="center">
        <HStack gap="3">
          <StatusBadge label="API por verificar" tone="warning" />
          <Flex align="center" gap="1.5" bg="rgba(16, 185, 129, 0.08)" px="3" py="1" rounded="full" border="1px solid rgba(16, 185, 129, 0.2)">
            <Box className="pulse-glow" w="1.5" h="1.5" bg="opsGreen" borderRadius="full" />
            <Text color="opsGreen" fontSize="xs" fontWeight="bold" letterSpacing="0.05em" textTransform="uppercase">
              Hardware Sync
            </Text>
          </Flex>
        </HStack>
        <Text color="opsMuted" fontSize="xs" fontWeight="bold" letterSpacing="0.05em" textTransform="uppercase">
          Sesión administrativa
        </Text>
      </Flex>
    </Box>
  );
}

