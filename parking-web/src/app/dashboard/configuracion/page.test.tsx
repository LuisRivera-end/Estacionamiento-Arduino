import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { redirectMock, getServerAccessTokenMock, getParkingSettingsMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getServerAccessTokenMock: vi.fn(),
  getParkingSettingsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth/server", () => ({
  getServerAccessToken: getServerAccessTokenMock,
}));

vi.mock("@/lib/api/admin-settings", () => ({
  getParkingSettings: getParkingSettingsMock,
}));

vi.mock("@/components/dashboard/SettingsEditor", () => ({
  SettingsEditor: ({ initialSettings }: { initialSettings: { ticket_expiration_hours: number } }) => (
    <div data-testid="settings-editor">
      {initialSettings.ticket_expiration_hours}
    </div>
  ),
}));

vi.mock("@/components/dashboard/DataTable", () => ({
  DataTable: ({
    rows,
  }: {
    rows: Array<[string, string | number]>;
  }) => (
    <div data-testid="settings-table">
      {rows.map(([label, value]) => (
        <div key={label}>{`${label}: ${value}`}</div>
      ))}
    </div>
  ),
}));

vi.mock("@chakra-ui/react", () => ({
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));

import SettingsPage from "./page";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows ticket expiration in hours", async () => {
    getServerAccessTokenMock.mockResolvedValue("token-123");
    getParkingSettingsMock.mockResolvedValue({
      capacity_total: 40,
      timezone: "America/Mexico_City",
      currency: "MXN",
      parking_name: "Parking Ops",
      ticket_expiration_hours: 24,
    });

    const result = await SettingsPage();
    render(result);

    expect(screen.getByRole("heading", { name: "Configuracion" })).toBeInTheDocument();
    expect(screen.getByTestId("settings-editor")).toHaveTextContent("24");
    expect(screen.getByText("Expiracion boletos (horas): 24")).toBeInTheDocument();
  });
});
