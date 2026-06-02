import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        opsBg: { value: "#070b19" },
        opsPanel: { value: "#0f172a" },
        opsPanelMuted: { value: "#1e293b" },
        opsBorder: { value: "#1e293b" },
        opsText: { value: "#f8fafc" },
        opsMuted: { value: "#64748b" },
        opsGreen: { value: "#10b981" },
        opsRed: { value: "#ef4444" },
        opsYellow: { value: "#f59e0b" },
        opsCyan: { value: "#2563eb" },
        cyan: {
          50: { value: "#eff6ff" },
          100: { value: "#dbeafe" },
          200: { value: "#bfdbfe" },
          300: { value: "#93c5fd" },
          400: { value: "#60a5fa" },
          500: { value: "#2563eb" },
          600: { value: "#1d4ed8" },
          700: { value: "#1e40af" },
          800: { value: "#1e3a8a" },
          900: { value: "#172554" },
          950: { value: "#0f172a" },
        },
      },
      fonts: {
        heading: { value: "var(--font-orbitron), var(--font-geist-sans)" },
        body: { value: "var(--font-inter), var(--font-geist-sans)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
