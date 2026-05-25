import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        opsBg: { value: "#08111f" },
        opsPanel: { value: "#101b2f" },
        opsPanelMuted: { value: "#16243a" },
        opsBorder: { value: "#243654" },
        opsText: { value: "#e5edf7" },
        opsMuted: { value: "#92a4bc" },
        opsGreen: { value: "#7dd3a7" },
        opsRed: { value: "#f87171" },
        opsYellow: { value: "#fbbf24" },
        opsCyan: { value: "#67e8f9" },
      },
      fonts: {
        heading: { value: "var(--font-geist-sans)" },
        body: { value: "var(--font-geist-sans)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
