import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        opsBg: { value: { _dark: "#070b19", _light: "#eef4ff" } },
        opsPanel: { value: { _dark: "#0f172a", _light: "#ffffff" } },
        opsPanelMuted: { value: { _dark: "#1e293b", _light: "#f8faff" } },
        opsBorder: { value: { _dark: "#1e293b", _light: "#c7d9f5" } },
        opsText: { value: { _dark: "#f8fafc", _light: "#0f2057" } },
        opsMuted: { value: { _dark: "#64748b", _light: "#4e6490" } },
        opsGreen: { value: { _dark: "#10b981", _light: "#15803d" } },
        opsRed: { value: { _dark: "#ef4444", _light: "#dc2626" } },
        opsYellow: { value: { _dark: "#f59e0b", _light: "#b45309" } },
        opsCyan: { value: { _dark: "#0ea5e9", _light: "#0ea5e9" } },
      },
    },
    tokens: {
      colors: {
        cyan: {
          50: { value: "#f0f6ff" },
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
        heading: { value: "var(--font-outfit), var(--font-geist-sans)" },
        body: { value: "var(--font-inter), var(--font-geist-sans)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);