import { Box, Flex } from "@chakra-ui/react";

import { DashboardRealtimeSync } from "./DashboardRealtimeSync";
import { SidebarNav } from "./SidebarNav";
import { TopStatusBar } from "./TopStatusBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      bg="opsBg"
      bgGradient="radial(circle at 80% 20%, rgba(6, 182, 212, 0.04), transparent 50%), radial(circle at 20% 80%, rgba(16, 185, 129, 0.025), transparent 50%)"
      minH="100vh"
    >
      <SidebarNav />
      <Box flex="1" minW="0" display="flex" flexDirection="column">
        <DashboardRealtimeSync />
        <TopStatusBar />
        <Box as="main" p={{ base: "5", xl: "6" }} flex="1">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

