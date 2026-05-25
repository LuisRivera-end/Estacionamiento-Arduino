import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command:
      "npm run dev -- --hostname 127.0.0.1 --port 3100",
    env: {
      NEXT_PUBLIC_API_BASE_URL: "fixture",
      NEXT_PUBLIC_SUPABASE_URL: "fixture",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture",
    },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
