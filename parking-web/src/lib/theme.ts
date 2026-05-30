import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        opsBg: { value: "#070b13" },
        opsPanel: { value: "#0d1527" },
        opsPanelMuted: { value: "#111b30" },
        opsBorder: { value: "#1e2e4a" },
        opsText: { value: "#e5edf7" },
        opsMuted: { value: "#92a4bc" },
        opsGreen: { value: "#10b981" },
        opsRed: { value: "#ef4444" },
        opsYellow: { value: "#f59e0b" },
        opsCyan: { value: "#06b6d4" },
      },
      fonts: {
        heading: { value: "var(--font-orbitron), var(--font-geist-sans)" },
        body: { value: "var(--font-inter), var(--font-geist-sans)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);

