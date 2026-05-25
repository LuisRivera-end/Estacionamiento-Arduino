# Frontend Dashboard y Pago Simulado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js frontend for the parking system with an authenticated operations dashboard and a public simulated payment flow by ticket code.

**Architecture:** Create a new `parking-web/` Next.js App Router application using Chakra UI, Supabase SSR auth, typed API services, reusable view components, and fixture-backed development screens. Keep visual components separate from API calls so incomplete FastAPI contracts can be replaced without rewriting pages.

**Tech Stack:** Next.js, TypeScript, Chakra UI, `@chakra-ui/charts`, Recharts, Supabase SSR, Vitest, Testing Library, Playwright.

---

## Source Specs

- `docs/especificacion-sistema-estacionamiento.md`
- `docs/planificacion-frontend-sdd.md`

## File Structure

Create this frontend project under `parking-web/`:

```text
parking-web/
  .env.example
  package.json
  next.config.ts
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  src/
    app/
      layout.tsx
      page.tsx
      providers.tsx
      login/page.tsx
      pagar/page.tsx
      pagar/[code]/page.tsx
      pagar/[code]/checkout/page.tsx
      pagar/[code]/confirmacion/page.tsx
      ticket-extraviado/page.tsx
      dashboard/layout.tsx
      dashboard/page.tsx
      dashboard/eventos/page.tsx
      dashboard/tickets/page.tsx
      dashboard/pagos/page.tsx
      dashboard/tarifas/page.tsx
      dashboard/reportes/page.tsx
      dashboard/backups/page.tsx
      dashboard/configuracion/page.tsx
    components/
      dashboard/AppShell.tsx
      dashboard/SidebarNav.tsx
      dashboard/TopStatusBar.tsx
      dashboard/MetricCard.tsx
      dashboard/ChartCard.tsx
      dashboard/DataTable.tsx
      dashboard/StatusBadge.tsx
      feedback/EmptyState.tsx
      feedback/ErrorState.tsx
      feedback/LoadingPanel.tsx
      payment/PaymentShell.tsx
      payment/PaymentStepIndicator.tsx
      payment/TicketCodeInput.tsx
      payment/PaymentSummaryCard.tsx
      payment/SimulatedCheckoutCard.tsx
      payment/PaymentConfirmationCard.tsx
      shared/SimulationNotice.tsx
    lib/
      api/client.ts
      api/types.ts
      api/fixtures.ts
      api/tickets.ts
      api/payments.ts
      api/reports.ts
      api/backups.ts
      auth/server.ts
      auth/client.ts
      formatters.ts
      theme.ts
    test/
      setup.ts
    e2e/
      payment-flow.spec.ts
```

Responsibility boundaries:

- `src/app/**`: route composition only.
- `src/components/**`: visual components, no direct `fetch`.
- `src/lib/api/**`: HTTP and fixtures, all external contract knowledge.
- `src/lib/auth/**`: Supabase session helpers.
- `src/lib/theme.ts`: visual system for the approved dark operations center.

## Task 1: Scaffold `parking-web`

**Files:**
- Create: `parking-web/package.json`
- Create: `parking-web/.env.example`
- Create: `parking-web/next.config.ts`
- Create: `parking-web/tsconfig.json`
- Create: `parking-web/vitest.config.ts`
- Create: `parking-web/playwright.config.ts`
- Create: `parking-web/src/test/setup.ts`

- [ ] **Step 1: Create the Next.js app**

Run:

```powershell
npx create-next-app@latest parking-web --ts --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected:

```text
Success! Created parking-web
```

- [ ] **Step 2: Install UI, auth, chart and test dependencies**

Run:

```powershell
Set-Location parking-web
npm install @chakra-ui/react @emotion/react @supabase/ssr @supabase/supabase-js recharts @chakra-ui/charts
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright
```

Expected:

```text
added ... packages
```

- [ ] **Step 3: Add environment template**

Create `parking-web/.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 4: Configure Vitest**

Create `parking-web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

Create `parking-web/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Configure Playwright**

Create `parking-web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

- [ ] **Step 6: Add scripts**

Modify `parking-web/package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 7: Verify scaffold**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected:

```text
No lint errors
Test Files  0 passed
Compiled successfully
```

- [ ] **Step 8: Commit**

```powershell
git add parking-web
git commit -m "feat: scaffold frontend app"
```

## Task 2: Define Types, Fixtures and API Client

**Files:**
- Create: `parking-web/src/lib/api/types.ts`
- Create: `parking-web/src/lib/api/fixtures.ts`
- Create: `parking-web/src/lib/api/client.ts`
- Create: `parking-web/src/lib/api/tickets.ts`
- Create: `parking-web/src/lib/api/payments.ts`
- Create: `parking-web/src/lib/api/reports.ts`
- Create: `parking-web/src/lib/api/backups.ts`
- Create: `parking-web/src/lib/formatters.ts`
- Test: `parking-web/src/lib/formatters.test.ts`

- [ ] **Step 1: Write formatter tests**

Create `parking-web/src/lib/formatters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatCurrency, normalizeTicketCode } from "./formatters";

describe("formatCurrency", () => {
  it("formats MXN amounts without assuming cents", () => {
    expect(formatCurrency(3, "MXN")).toBe("$3.00 MXN");
  });
});

describe("normalizeTicketCode", () => {
  it("trims spaces and uppercases without truncating", () => {
    expect(normalizeTicketCode(" a1b2c3d4 ")).toBe("A1B2C3D4");
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test -- src/lib/formatters.test.ts
```

Expected:

```text
FAIL  src/lib/formatters.test.ts
Cannot find module './formatters'
```

- [ ] **Step 3: Implement formatters**

Create `parking-web/src/lib/formatters.ts`:

```ts
export function normalizeTicketCode(value: string): string {
  return value.trim().toUpperCase();
}

export function formatCurrency(amount: number, currency: string): string {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}
```

- [ ] **Step 4: Define API types**

Create `parking-web/src/lib/api/types.ts`:

```ts
export type TicketStatus = "active" | "paid" | "exited" | "lost" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "exempted" | "refunded";

export type StatusResponse = {
  capacity_total: number;
  occupied_spaces: number;
  available_spaces: number;
  active_tickets: number;
  last_entry_at: string | null;
  last_exit_at: string | null;
};

export type TicketResponse = {
  ticket_code: string;
  status: TicketStatus;
  payment_status: PaymentStatus;
  entry_at: string;
  paid_at: string | null;
  exit_at: string | null;
  lost_ticket: boolean;
};

export type TicketCalculation = {
  ticket_code: string;
  duration_minutes: number;
  free_tolerance_minutes: number;
  amount: number;
  currency: string;
};

export type SimulatedPayment = {
  payment_id: string;
  ticket_code: string;
  status: "simulated";
  amount: number;
  provider_reference: string;
};

export type SummaryReport = {
  entries_today: number;
  exits_today: number;
  paid_tickets: number;
  lost_tickets: number;
  simulated_revenue_today: number;
};

export type BackupExport = {
  backup_id: string;
  status: "requested" | "completed" | "failed";
};
```

- [ ] **Step 5: Add fixtures**

Create `parking-web/src/lib/api/fixtures.ts`:

```ts
import type {
  BackupExport,
  SimulatedPayment,
  StatusResponse,
  SummaryReport,
  TicketCalculation,
  TicketResponse,
} from "./types";

export const statusFixture: StatusResponse = {
  capacity_total: 40,
  occupied_spaces: 12,
  available_spaces: 28,
  active_tickets: 12,
  last_entry_at: "2026-05-23T08:30:00-06:00",
  last_exit_at: "2026-05-23T09:05:00-06:00",
};

export const summaryFixture: SummaryReport = {
  entries_today: 34,
  exits_today: 22,
  paid_tickets: 18,
  lost_tickets: 2,
  simulated_revenue_today: 430,
};

export const ticketFixture: TicketResponse = {
  ticket_code: "A1B2C",
  status: "active",
  payment_status: "unpaid",
  entry_at: "2026-05-23T09:10:00-06:00",
  paid_at: null,
  exit_at: null,
  lost_ticket: false,
};

export const calculationFixture: TicketCalculation = {
  ticket_code: "A1B2C",
  duration_minutes: 64,
  free_tolerance_minutes: 5,
  amount: 3,
  currency: "MXN",
};

export const paymentFixture: SimulatedPayment = {
  payment_id: "simulated-payment-id",
  ticket_code: "A1B2C",
  status: "simulated",
  amount: 3,
  provider_reference: "sim_stripe_20260523_001",
};

export const backupFixture: BackupExport = {
  backup_id: "backup-id",
  status: "requested",
};
```

- [ ] **Step 6: Implement API client**

Create `parking-web/src/lib/api/client.ts`:

```ts
type RequestOptions = RequestInit & {
  useFixture?: boolean;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 7: Implement domain services with fixture fallback**

Create `parking-web/src/lib/api/tickets.ts`:

```ts
import { apiGet, apiPost } from "./client";
import { calculationFixture, ticketFixture } from "./fixtures";
import type { TicketCalculation, TicketResponse } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getTicket(code: string): Promise<TicketResponse> {
  if (useFixtures) return { ...ticketFixture, ticket_code: code };
  return apiGet<TicketResponse>(`/tickets/${code}`);
}

export async function calculateTicket(code: string, lostTicket = false): Promise<TicketCalculation> {
  if (useFixtures) return { ...calculationFixture, ticket_code: code };
  return apiPost<TicketCalculation>(`/tickets/${code}/calculate`, {
    lost_ticket: lostTicket,
  });
}
```

Create `parking-web/src/lib/api/payments.ts`:

```ts
import { apiPost } from "./client";
import { paymentFixture } from "./fixtures";
import type { SimulatedPayment } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function simulatePayment(ticketCode: string, lostTicket = false): Promise<SimulatedPayment> {
  if (useFixtures) {
    return { ...paymentFixture, ticket_code: ticketCode };
  }

  return apiPost<SimulatedPayment>("/payments/simulate", {
    ticket_code: ticketCode,
    lost_ticket: lostTicket,
    method: lostTicket ? "lost_ticket" : "simulated_stripe",
  });
}
```

Create `parking-web/src/lib/api/reports.ts`:

```ts
import { apiGet } from "./client";
import { statusFixture, summaryFixture } from "./fixtures";
import type { StatusResponse, SummaryReport } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function getStatus(): Promise<StatusResponse> {
  if (useFixtures) return statusFixture;
  return apiGet<StatusResponse>("/status");
}

export async function getSummary(): Promise<SummaryReport> {
  if (useFixtures) return summaryFixture;
  return apiGet<SummaryReport>("/reports/summary");
}
```

Create `parking-web/src/lib/api/backups.ts`:

```ts
import { apiPost } from "./client";
import { backupFixture } from "./fixtures";
import type { BackupExport } from "./types";

const useFixtures = process.env.NEXT_PUBLIC_API_BASE_URL === "fixture";

export async function requestBackup(requestedBy: string): Promise<BackupExport> {
  if (useFixtures) return backupFixture;
  return apiPost<BackupExport>("/backups/export", {
    scope: "full",
    requested_by: requestedBy,
  });
}
```

- [ ] **Step 8: Verify tests**

Run:

```powershell
npm run test -- src/lib/formatters.test.ts
```

Expected:

```text
PASS  src/lib/formatters.test.ts
```

- [ ] **Step 9: Commit**

```powershell
git add parking-web/src/lib parking-web/src/test parking-web/vitest.config.ts
git commit -m "feat: add frontend api foundation"
```

## Task 3: Theme, Providers and Shared Components

**Files:**
- Create: `parking-web/src/lib/theme.ts`
- Modify: `parking-web/src/app/providers.tsx`
- Modify: `parking-web/src/app/layout.tsx`
- Create: `parking-web/src/components/shared/SimulationNotice.tsx`
- Create: `parking-web/src/components/feedback/EmptyState.tsx`
- Create: `parking-web/src/components/feedback/ErrorState.tsx`
- Create: `parking-web/src/components/feedback/LoadingPanel.tsx`
- Create: `parking-web/src/components/dashboard/StatusBadge.tsx`
- Test: `parking-web/src/components/shared/SimulationNotice.test.tsx`

- [ ] **Step 1: Write component test**

Create `parking-web/src/components/shared/SimulationNotice.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Providers } from "@/app/providers";
import { SimulationNotice } from "./SimulationNotice";

describe("SimulationNotice", () => {
  it("communicates that payments are simulated", () => {
    render(
      <Providers>
        <SimulationNotice />
      </Providers>,
    );

    expect(screen.getByText(/pago simulado/i)).toBeInTheDocument();
    expect(screen.getByText(/no se realiza cargo real/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement theme**

Create `parking-web/src/lib/theme.ts`:

```ts
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
```

- [ ] **Step 3: Implement providers**

Create or replace `parking-web/src/app/providers.tsx`:

```tsx
"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
```

- [ ] **Step 4: Wire root layout**

Modify `parking-web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parking Ops",
  description: "Dashboard operativo y pago simulado para estacionamiento inteligente",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Implement shared components**

Create `parking-web/src/components/shared/SimulationNotice.tsx`:

```tsx
import { Badge, Box, Text } from "@chakra-ui/react";

export function SimulationNotice() {
  return (
    <Box borderWidth="1px" borderColor="opsYellow" borderRadius="lg" bg="rgba(251,191,36,0.12)" p="3">
      <Badge colorPalette="yellow" mb="2">Pago simulado</Badge>
      <Text color="opsText" fontSize="sm">
        Esta experiencia no realiza cargo real ni solicita datos bancarios.
      </Text>
    </Box>
  );
}
```

Create `parking-web/src/components/feedback/EmptyState.tsx`:

```tsx
import { Box, Heading, Text } from "@chakra-ui/react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Box borderWidth="1px" borderColor="opsBorder" borderRadius="xl" bg="opsPanel" p="6">
      <Heading size="md" color="opsText">{title}</Heading>
      <Text mt="2" color="opsMuted">{description}</Text>
    </Box>
  );
}
```

Create `parking-web/src/components/feedback/ErrorState.tsx`:

```tsx
import { Box, Heading, Text } from "@chakra-ui/react";

type ErrorStateProps = {
  title?: string;
  description: string;
};

export function ErrorState({ title = "No se pudo cargar la informacion", description }: ErrorStateProps) {
  return (
    <Box borderWidth="1px" borderColor="opsRed" borderRadius="xl" bg="rgba(248,113,113,0.12)" p="6">
      <Heading size="md" color="opsText">{title}</Heading>
      <Text mt="2" color="opsMuted">{description}</Text>
    </Box>
  );
}
```

Create `parking-web/src/components/feedback/LoadingPanel.tsx`:

```tsx
import { HStack, Spinner, Text } from "@chakra-ui/react";

export function LoadingPanel({ label = "Cargando informacion" }: { label?: string }) {
  return (
    <HStack color="opsMuted" p="6">
      <Spinner size="sm" />
      <Text>{label}</Text>
    </HStack>
  );
}
```

Create `parking-web/src/components/dashboard/StatusBadge.tsx`:

```tsx
import { Badge } from "@chakra-ui/react";

type StatusBadgeProps = {
  label: string;
  tone: "success" | "warning" | "danger" | "info" | "muted";
};

const paletteByTone: Record<StatusBadgeProps["tone"], string> = {
  success: "green",
  warning: "yellow",
  danger: "red",
  info: "cyan",
  muted: "gray",
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Badge colorPalette={paletteByTone[tone]}>{label}</Badge>;
}
```

- [ ] **Step 6: Verify component test**

Run:

```powershell
npm run test -- src/components/shared/SimulationNotice.test.tsx
npm run build
```

Expected:

```text
PASS  src/components/shared/SimulationNotice.test.tsx
Compiled successfully
```

- [ ] **Step 7: Commit**

```powershell
git add parking-web/src/app parking-web/src/components parking-web/src/lib/theme.ts
git commit -m "feat: add frontend theme and shared components"
```

## Task 4: Dashboard Shell and Auth Foundation

**Files:**
- Create: `parking-web/src/lib/auth/server.ts`
- Create: `parking-web/src/lib/auth/client.ts`
- Create: `parking-web/src/components/dashboard/AppShell.tsx`
- Create: `parking-web/src/components/dashboard/SidebarNav.tsx`
- Create: `parking-web/src/components/dashboard/TopStatusBar.tsx`
- Modify: `parking-web/src/app/dashboard/layout.tsx`
- Modify: `parking-web/src/app/login/page.tsx`

- [ ] **Step 1: Implement Supabase helpers**

Create `parking-web/src/lib/auth/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

Create `parking-web/src/lib/auth/client.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  );
}
```

- [ ] **Step 2: Implement dashboard shell**

Create `parking-web/src/components/dashboard/SidebarNav.tsx`:

```tsx
import NextLink from "next/link";
import { Box, Link, Stack, Text } from "@chakra-ui/react";

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
    <Box as="aside" w="260px" bg="opsPanel" borderRightWidth="1px" borderColor="opsBorder" p="5">
      <Text fontWeight="bold" color="opsGreen" mb="6">PARKING OPS</Text>
      <Stack gap="2">
        {navItems.map(([label, href]) => (
          <Link asChild key={href} color="opsText" _hover={{ color: "opsCyan" }}>
            <NextLink href={href}>{label}</NextLink>
          </Link>
        ))}
      </Stack>
    </Box>
  );
}
```

Create `parking-web/src/components/dashboard/TopStatusBar.tsx`:

```tsx
import { HStack, Text } from "@chakra-ui/react";
import { StatusBadge } from "./StatusBadge";

export function TopStatusBar() {
  return (
    <HStack justify="space-between" borderBottomWidth="1px" borderColor="opsBorder" p="4">
      <HStack>
        <StatusBadge label="API por verificar" tone="warning" />
        <Text color="opsMuted" fontSize="sm">Zona horaria: America/Mexico_City</Text>
      </HStack>
      <Text color="opsMuted" fontSize="sm">Sesion administrativa</Text>
    </HStack>
  );
}
```

Create `parking-web/src/components/dashboard/AppShell.tsx`:

```tsx
import { Box, Flex } from "@chakra-ui/react";
import { SidebarNav } from "./SidebarNav";
import { TopStatusBar } from "./TopStatusBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Flex minH="100vh" bg="opsBg">
      <SidebarNav />
      <Box flex="1">
        <TopStatusBar />
        <Box as="main" p="6">{children}</Box>
      </Box>
    </Flex>
  );
}
```

- [ ] **Step 3: Wire dashboard layout**

Create `parking-web/src/app/dashboard/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/AppShell";
import { createSupabaseServerClient } from "@/lib/auth/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user && process.env.NEXT_PUBLIC_SUPABASE_URL !== "fixture") {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Implement login screen**

Create `parking-web/src/app/login/page.tsx`:

```tsx
import { Box, Button, Heading, Input, Stack, Text } from "@chakra-ui/react";

export default function LoginPage() {
  return (
    <Box minH="100vh" bg="opsBg" color="opsText" display="grid" placeItems="center" p="6">
      <Stack gap="4" w="full" maxW="420px" bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="2xl" p="6">
        <Heading size="lg">Acceso operativo</Heading>
        <Text color="opsMuted">Ingresa con una cuenta administrativa de Supabase.</Text>
        <Input aria-label="Correo" type="email" />
        <Input aria-label="Contrasena" type="password" />
        <Button colorPalette="cyan">Entrar</Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 5: Verify shell**

Run:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="fixture"
$env:NEXT_PUBLIC_SUPABASE_URL="fixture"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="fixture"
npm run build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 6: Commit**

```powershell
git add parking-web/src/lib/auth parking-web/src/components/dashboard parking-web/src/app/dashboard parking-web/src/app/login
git commit -m "feat: add dashboard shell and auth foundation"
```

## Task 5: Public Payment Flow

**Files:**
- Create: `parking-web/src/components/payment/PaymentShell.tsx`
- Create: `parking-web/src/components/payment/PaymentStepIndicator.tsx`
- Create: `parking-web/src/components/payment/TicketCodeInput.tsx`
- Create: `parking-web/src/components/payment/PaymentSummaryCard.tsx`
- Create: `parking-web/src/components/payment/SimulatedCheckoutCard.tsx`
- Create: `parking-web/src/components/payment/PaymentConfirmationCard.tsx`
- Modify: `parking-web/src/app/pagar/page.tsx`
- Modify: `parking-web/src/app/pagar/[code]/page.tsx`
- Modify: `parking-web/src/app/pagar/[code]/checkout/page.tsx`
- Modify: `parking-web/src/app/pagar/[code]/confirmacion/page.tsx`
- Modify: `parking-web/src/app/ticket-extraviado/page.tsx`
- Test: `parking-web/e2e/payment-flow.spec.ts`

- [ ] **Step 1: Write e2e test**

Create `parking-web/e2e/payment-flow.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("public user can complete simulated payment flow", async ({ page }) => {
  await page.goto("/pagar");
  await page.getByLabel("Codigo de ticket").fill("a1b2c");
  await page.getByRole("button", { name: "Consultar ticket" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C$/);
  await expect(page.getByText("A1B2C")).toBeVisible();
  await page.getByRole("link", { name: "Continuar a checkout simulado" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C\/checkout$/);
  await page.getByRole("button", { name: "Confirmar pago simulado" }).click();

  await expect(page).toHaveURL(/\/pagar\/A1B2C\/confirmacion$/);
  await expect(page.getByText(/pago simulado registrado/i)).toBeVisible();
});
```

- [ ] **Step 2: Implement payment components**

Create `parking-web/src/components/payment/PaymentShell.tsx`:

```tsx
import { Box, Container } from "@chakra-ui/react";

export function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <Box minH="100vh" bg="opsBg" color="opsText" py="10">
      <Container maxW="720px">{children}</Container>
    </Box>
  );
}
```

Create `parking-web/src/components/payment/PaymentStepIndicator.tsx`:

```tsx
import { HStack, Text } from "@chakra-ui/react";

const steps = ["Consultar", "Revisar", "Simular pago", "Confirmar"];

export function PaymentStepIndicator({ current }: { current: number }) {
  return (
    <HStack gap="3" color="opsMuted" fontSize="sm">
      {steps.map((step, index) => (
        <Text key={step} color={index + 1 === current ? "opsCyan" : "opsMuted"} fontWeight={index + 1 === current ? "bold" : "normal"}>
          {index + 1}. {step}
        </Text>
      ))}
    </HStack>
  );
}
```

Create `parking-web/src/components/payment/TicketCodeInput.tsx`:

```tsx
"use client";

import { Button, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeTicketCode } from "@/lib/formatters";

export function TicketCodeInput() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <Stack
      as="form"
      gap="3"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeTicketCode(code);
        if (normalized) router.push(`/pagar/${normalized}`);
      }}
    >
      <Input
        aria-label="Codigo de ticket"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        aria-describedby="ticket-code-help"
      />
      <Text id="ticket-code-help" color="opsMuted" fontSize="sm">
        Usa el codigo alfanumerico del ticket. Ejemplo: A1B2C.
      </Text>
      <Button type="submit" colorPalette="cyan">Consultar ticket</Button>
    </Stack>
  );
}
```

Create `parking-web/src/components/payment/PaymentSummaryCard.tsx`:

```tsx
import NextLink from "next/link";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import type { TicketCalculation, TicketResponse } from "@/lib/api/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export function PaymentSummaryCard({ ticket, calculation }: { ticket: TicketResponse; calculation: TicketCalculation }) {
  return (
    <Box bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="2xl" p="6">
      <Stack gap="3">
        <Heading size="lg">Ticket {ticket.ticket_code}</Heading>
        <Text color="opsMuted">Entrada: {formatDateTime(ticket.entry_at)}</Text>
        <Text>Duracion: {calculation.duration_minutes} minutos</Text>
        <Text fontSize="2xl" fontWeight="bold">{formatCurrency(calculation.amount, calculation.currency)}</Text>
        <Button asChild colorPalette="cyan">
          <NextLink href={`/pagar/${ticket.ticket_code}/checkout`}>Continuar a checkout simulado</NextLink>
        </Button>
      </Stack>
    </Box>
  );
}
```

Create `parking-web/src/components/payment/SimulatedCheckoutCard.tsx`:

```tsx
"use client";

import { Button, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { simulatePayment } from "@/lib/api/payments";
import { SimulationNotice } from "@/components/shared/SimulationNotice";

export function SimulatedCheckoutCard({ ticketCode }: { ticketCode: string }) {
  const router = useRouter();

  return (
    <Stack bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="2xl" p="6" gap="4">
      <Text fontSize="xl" fontWeight="bold">Checkout simulado</Text>
      <SimulationNotice />
      <Button
        colorPalette="cyan"
        onClick={async () => {
          await simulatePayment(ticketCode);
          router.push(`/pagar/${ticketCode}/confirmacion`);
        }}
      >
        Confirmar pago simulado
      </Button>
    </Stack>
  );
}
```

Create `parking-web/src/components/payment/PaymentConfirmationCard.tsx`:

```tsx
import { Box, Heading, Text } from "@chakra-ui/react";

export function PaymentConfirmationCard({ ticketCode }: { ticketCode: string }) {
  return (
    <Box bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="2xl" p="6">
      <Heading size="lg">Pago simulado registrado</Heading>
      <Text mt="3" color="opsMuted">Ticket {ticketCode}</Text>
      <Text mt="3">Ya puedes ingresar el codigo en la salida del estacionamiento.</Text>
    </Box>
  );
}
```

- [ ] **Step 3: Implement payment pages**

Create `parking-web/src/app/pagar/page.tsx`:

```tsx
import NextLink from "next/link";
import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { TicketCodeInput } from "@/components/payment/TicketCodeInput";
import { SimulationNotice } from "@/components/shared/SimulationNotice";

export default function PayPage() {
  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={1} />
        <Heading>Consulta tu ticket</Heading>
        <Text color="opsMuted">Ingresa el codigo entregado al entrar al estacionamiento.</Text>
        <TicketCodeInput />
        <Link asChild color="opsCyan"><NextLink href="/ticket-extraviado">Perdi mi ticket</NextLink></Link>
        <SimulationNotice />
      </Stack>
    </PaymentShell>
  );
}
```

Create `parking-web/src/app/pagar/[code]/page.tsx`:

```tsx
import { Stack } from "@chakra-ui/react";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { PaymentSummaryCard } from "@/components/payment/PaymentSummaryCard";
import { calculateTicket, getTicket } from "@/lib/api/tickets";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function TicketSummaryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);
  const [ticket, calculation] = await Promise.all([
    getTicket(ticketCode),
    calculateTicket(ticketCode),
  ]);

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={2} />
        <PaymentSummaryCard ticket={ticket} calculation={calculation} />
      </Stack>
    </PaymentShell>
  );
}
```

Create `parking-web/src/app/pagar/[code]/checkout/page.tsx`:

```tsx
import { Stack } from "@chakra-ui/react";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { SimulatedCheckoutCard } from "@/components/payment/SimulatedCheckoutCard";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function CheckoutPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={3} />
        <SimulatedCheckoutCard ticketCode={ticketCode} />
      </Stack>
    </PaymentShell>
  );
}
```

Create `parking-web/src/app/pagar/[code]/confirmacion/page.tsx`:

```tsx
import { Stack } from "@chakra-ui/react";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { PaymentStepIndicator } from "@/components/payment/PaymentStepIndicator";
import { PaymentConfirmationCard } from "@/components/payment/PaymentConfirmationCard";
import { normalizeTicketCode } from "@/lib/formatters";

export default async function PaymentConfirmationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticketCode = normalizeTicketCode(code);

  return (
    <PaymentShell>
      <Stack gap="6">
        <PaymentStepIndicator current={4} />
        <PaymentConfirmationCard ticketCode={ticketCode} />
      </Stack>
    </PaymentShell>
  );
}
```

Create `parking-web/src/app/ticket-extraviado/page.tsx`:

```tsx
import { Heading, Stack, Text } from "@chakra-ui/react";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { SimulationNotice } from "@/components/shared/SimulationNotice";

export default function LostTicketPage() {
  return (
    <PaymentShell>
      <Stack gap="5">
        <Heading>Ticket extraviado</Heading>
        <Text color="opsMuted">
          El operador debe confirmar la tarifa de extravio. El pago se registrara como simulado y quedara marcado para reportes.
        </Text>
        <SimulationNotice />
      </Stack>
    </PaymentShell>
  );
}
```

- [ ] **Step 4: Verify flow**

Run:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="fixture"
npm run build
npm run e2e
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Commit**

```powershell
git add parking-web/src/components/payment parking-web/src/app/pagar parking-web/src/app/ticket-extraviado parking-web/e2e
git commit -m "feat: add public simulated payment flow"
```

## Task 6: Dashboard Summary

**Files:**
- Create: `parking-web/src/components/dashboard/MetricCard.tsx`
- Create: `parking-web/src/components/dashboard/ChartCard.tsx`
- Modify: `parking-web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Implement dashboard cards**

Create `parking-web/src/components/dashboard/MetricCard.tsx`:

```tsx
import { Box, Text } from "@chakra-ui/react";

type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: "default" | "green" | "yellow" | "red" | "cyan";
};

const colorByTone = {
  default: "opsText",
  green: "opsGreen",
  yellow: "opsYellow",
  red: "opsRed",
  cyan: "opsCyan",
};

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  return (
    <Box bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="xl" p="5">
      <Text color="opsMuted" fontSize="sm">{label}</Text>
      <Text color={colorByTone[tone]} fontSize="3xl" fontWeight="bold">{value}</Text>
    </Box>
  );
}
```

Create `parking-web/src/components/dashboard/ChartCard.tsx`:

```tsx
import { Box, Heading } from "@chakra-ui/react";

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="xl" p="5">
      <Heading size="md" color="opsText" mb="4">{title}</Heading>
      {children}
    </Box>
  );
}
```

- [ ] **Step 2: Implement summary page**

Create `parking-web/src/app/dashboard/page.tsx`:

```tsx
import { Grid, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getStatus, getSummary } from "@/lib/api/reports";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default async function DashboardPage() {
  const [status, summary] = await Promise.all([getStatus(), getSummary()]);

  return (
    <Grid gap="6">
      <Heading color="opsText">Resumen operativo</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
        <MetricCard label="Disponibles" value={status.available_spaces} tone="green" />
        <MetricCard label="Ocupados" value={status.occupied_spaces} tone="cyan" />
        <MetricCard label="Tickets activos" value={status.active_tickets} />
        <MetricCard label="Ingresos simulados" value={formatCurrency(summary.simulated_revenue_today, "MXN")} tone="yellow" />
        <MetricCard label="Entradas hoy" value={summary.entries_today} />
        <MetricCard label="Salidas hoy" value={summary.exits_today} />
        <MetricCard label="Tickets pagados" value={summary.paid_tickets} tone="green" />
        <MetricCard label="Extraviados" value={summary.lost_tickets} tone="red" />
      </SimpleGrid>
      <ChartCard title="Actividad reciente">
        <Text color="opsMuted">Ultima entrada: {formatDateTime(status.last_entry_at)}</Text>
        <Text color="opsMuted">Ultima salida: {formatDateTime(status.last_exit_at)}</Text>
      </ChartCard>
    </Grid>
  );
}
```

- [ ] **Step 3: Verify summary**

Run:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="fixture"
npm run build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 4: Commit**

```powershell
git add parking-web/src/components/dashboard parking-web/src/app/dashboard/page.tsx
git commit -m "feat: add dashboard summary"
```

## Task 7: Dashboard Secondary Views

**Files:**
- Create: `parking-web/src/components/dashboard/DataTable.tsx`
- Modify: `parking-web/src/app/dashboard/eventos/page.tsx`
- Modify: `parking-web/src/app/dashboard/tickets/page.tsx`
- Modify: `parking-web/src/app/dashboard/pagos/page.tsx`
- Modify: `parking-web/src/app/dashboard/tarifas/page.tsx`
- Modify: `parking-web/src/app/dashboard/reportes/page.tsx`
- Modify: `parking-web/src/app/dashboard/backups/page.tsx`
- Modify: `parking-web/src/app/dashboard/configuracion/page.tsx`

- [ ] **Step 1: Implement shared table wrapper**

Create `parking-web/src/components/dashboard/DataTable.tsx`:

```tsx
import { Box, Table } from "@chakra-ui/react";

type DataTableProps = {
  headers: string[];
  rows: Array<Array<string | number>>;
};

export function DataTable({ headers, rows }: DataTableProps) {
  return (
    <Box overflowX="auto" bg="opsPanel" borderWidth="1px" borderColor="opsBorder" borderRadius="xl">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            {headers.map((header) => (
              <Table.ColumnHeader key={header}>{header}</Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => (
            <Table.Row key={index}>
              {row.map((cell, cellIndex) => (
                <Table.Cell key={cellIndex}>{cell}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
```

- [ ] **Step 2: Add Eventos page**

Create `parking-web/src/app/dashboard/eventos/page.tsx`:

```tsx
import { Grid, Heading } from "@chakra-ui/react";
import { DataTable } from "@/components/dashboard/DataTable";

export default function EventsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Entradas y salidas</Heading>
      <DataTable
        headers={["Fecha", "Tipo", "Ticket", "Dispositivo", "Resultado"]}
        rows={[
          ["2026-05-23 09:10", "Entrada", "A1B2C", "entrada-01", "Autorizada"],
          ["2026-05-23 10:20", "Salida", "A1B2C", "salida-01", "Pago pendiente"],
        ]}
      />
    </Grid>
  );
}
```

- [ ] **Step 3: Add Tickets, Pagos, Tarifas, Reportes, Backups and Configuracion pages**

Create `parking-web/src/app/dashboard/tickets/page.tsx`:

```tsx
import { Grid, Heading } from "@chakra-ui/react";
import { DataTable } from "@/components/dashboard/DataTable";

export default function TicketsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Tickets</Heading>
      <DataTable headers={["Codigo", "Estado", "Pago", "Entrada", "Monto"]} rows={[["A1B2C", "Activo", "Pendiente", "09:10", "$3.00 MXN"]]} />
    </Grid>
  );
}
```

Create `parking-web/src/app/dashboard/pagos/page.tsx`:

```tsx
import { Grid, Heading } from "@chakra-ui/react";
import { DataTable } from "@/components/dashboard/DataTable";
import { SimulationNotice } from "@/components/shared/SimulationNotice";

export default function PaymentsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Pagos simulados</Heading>
      <SimulationNotice />
      <DataTable headers={["Ticket", "Monto", "Metodo", "Estado", "Referencia"]} rows={[["A1B2C", "$3.00 MXN", "Stripe simulado", "Simulado", "sim_stripe_20260523_001"]]} />
    </Grid>
  );
}
```

Create `parking-web/src/app/dashboard/tarifas/page.tsx`:

```tsx
import { Grid, Heading } from "@chakra-ui/react";
import { DataTable } from "@/components/dashboard/DataTable";

export default function PricingPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Tarifas</Heading>
      <DataTable headers={["Regla", "Valor"]} rows={[["Tolerancia", "5 minutos"], ["Bloque", "30 minutos"], ["Monto", "$3.00 MXN"], ["Extravio", "Configurable"]]} />
    </Grid>
  );
}
```

Create `parking-web/src/app/dashboard/reportes/page.tsx`:

```tsx
import { Grid, Heading } from "@chakra-ui/react";
import { ChartCard } from "@/components/dashboard/ChartCard";

export default function ReportsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Reportes</Heading>
      <ChartCard title="Ingresos, tickets y actividad">
        Las graficas se conectaran a `/reports/summary`, `/reports/revenue` y `/reports/tickets`.
      </ChartCard>
    </Grid>
  );
}
```

Create `parking-web/src/app/dashboard/backups/page.tsx`:

```tsx
import { Button, Grid, Heading } from "@chakra-ui/react";
import { DataTable } from "@/components/dashboard/DataTable";

export default function BackupsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Backups</Heading>
      <Button colorPalette="cyan" w="fit-content">Solicitar backup manual</Button>
      <DataTable headers={["Fecha", "Estado", "Solicitante"]} rows={[["2026-05-23", "Solicitado", "admin"]]} />
    </Grid>
  );
}
```

Create `parking-web/src/app/dashboard/configuracion/page.tsx`:

```tsx
import { Grid, Heading } from "@chakra-ui/react";
import { DataTable } from "@/components/dashboard/DataTable";

export default function SettingsPage() {
  return (
    <Grid gap="5">
      <Heading color="opsText">Configuracion</Heading>
      <DataTable headers={["Parametro", "Valor"]} rows={[["Capacidad", "40"], ["Zona horaria", "America/Mexico_City"], ["Moneda", "MXN"], ["Entrada", "entrada-01"], ["Salida", "salida-01"]]} />
    </Grid>
  );
}
```

- [ ] **Step 4: Verify secondary views**

Run:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="fixture"
npm run build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 5: Commit**

```powershell
git add parking-web/src/app/dashboard parking-web/src/components/dashboard/DataTable.tsx
git commit -m "feat: add dashboard secondary views"
```

## Task 8: Final Verification and Documentation Alignment

**Files:**
- Modify: `docs/README.md`
- Verify: `docs/planificacion-frontend-sdd.md`
- Verify: `parking-web/**`

- [ ] **Step 1: Link frontend plan from docs README**

Add these lines to `docs/README.md` under "Documentos principales":

```md
- [Planificacion frontend SDD](./planificacion-frontend-sdd.md)
- [Plan tecnico frontend](./superpowers/plans/2026-05-25-frontend-dashboard-pago.md)
```

- [ ] **Step 2: Run all frontend checks**

Run:

```powershell
Set-Location parking-web
$env:NEXT_PUBLIC_API_BASE_URL="fixture"
$env:NEXT_PUBLIC_SUPABASE_URL="fixture"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="fixture"
npm run lint
npm run test
npm run build
npm run e2e
```

Expected:

```text
No lint errors
Test Files ... passed
Compiled successfully
... passed
```

- [ ] **Step 3: Manual browser verification**

Run:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000/pagar
http://localhost:3000/dashboard
```

Expected:

```text
/pagar shows the public ticket payment flow.
/dashboard shows the dark operations summary with fixture metrics.
No page asks for license plate, camera input or real card data.
```

- [ ] **Step 4: Commit**

```powershell
git add docs/README.md docs/superpowers/plans/2026-05-25-frontend-dashboard-pago.md parking-web
git commit -m "docs: add frontend implementation plan"
```

## Self-Review Checklist

- Spec coverage: dashboard authenticated views, public payment flow, simulated Stripe notice, no plate/camera dependency, Supabase SSR auth, API service isolation, loading/error/empty components, manual backups and reports are represented.
- Red flag scan: no incomplete sections, vague steps or unspecified implementation details should remain.
- Type consistency: ticket code fields use `ticket_code`; amounts use `amount` plus `currency`; payment simulation uses `/payments/simulate`; status endpoint uses `/status`.
- Scope control: this plan creates the frontend app only. It does not implement FastAPI, Supabase schema, Arduino firmware or real Stripe.
