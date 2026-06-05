import { Box, Flex } from "@chakra-ui/react";

import { DashboardRealtimeSync } from "./DashboardRealtimeSync";
import { SidebarNav } from "./SidebarNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      bg="opsBg"
      minH="100vh"
    >
      <SidebarNav />
      <Box flex="1" minW="0" display="flex" flexDirection="column">
        <DashboardRealtimeSync />
        <Box as="main" p={{ base: "5", xl: "6" }} flex="1">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

