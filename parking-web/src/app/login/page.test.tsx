import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { getAuthSetupStatusMock } = vi.hoisted(() => ({
  getAuthSetupStatusMock: vi.fn(),
}));

vi.mock("./LoginPageClient", () => ({
  LoginPageClient: ({
    allowInitialAccountCreation,
  }: {
    allowInitialAccountCreation: boolean;
  }) => (
    <div data-testid="login-page-client">
      {allowInitialAccountCreation ? "allow-create" : "hide-create"}
    </div>
  ),
}));

vi.mock("@/lib/api/auth", () => ({
  getAuthSetupStatus: getAuthSetupStatusMock,
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows initial account creation when setup is still open", async () => {
    getAuthSetupStatusMock.mockResolvedValue({
      allow_initial_account_creation: true,
    });

    const result = await LoginPage();
    render(result);

    expect(screen.getByTestId("login-page-client")).toHaveTextContent("allow-create");
  });

  it("hides initial account creation when a staff user already exists", async () => {
    getAuthSetupStatusMock.mockResolvedValue({
      allow_initial_account_creation: false,
    });

    const result = await LoginPage();
    render(result);

    expect(screen.getByTestId("login-page-client")).toHaveTextContent("hide-create");
  });
});
