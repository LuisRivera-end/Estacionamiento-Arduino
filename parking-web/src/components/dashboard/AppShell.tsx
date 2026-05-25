import { Box, Flex } from "@chakra-ui/react";

import { SidebarNav } from "./SidebarNav";
import { TopStatusBar } from "./TopStatusBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Flex bg="opsBg" minH="100vh">
      <SidebarNav />
      <Box flex="1" minW="0">
        <TopStatusBar />
        <Box as="main" p={{ base: "5", xl: "6" }}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
