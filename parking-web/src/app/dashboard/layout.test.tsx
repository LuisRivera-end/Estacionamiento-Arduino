import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  redirectMock,
  bootstrapStaffMock,
  createSupabaseServerClientMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  bootstrapStaffMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/dashboard/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/lib/api/auth", () => ({
  bootstrapStaff: bootstrapStaffMock,
}));

vi.mock("@/lib/auth/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { render, screen } from "@testing-library/react";

import DashboardLayout from "./layout";

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without auth bootstrap when fixture mode is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "fixture");

    const result = await DashboardLayout({
      children: <div>dashboard child</div>,
    });

    render(result);

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("dashboard child")).toBeInTheDocument();
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
    expect(bootstrapStaffMock).not.toHaveBeenCalled();
  });

  it("bootstraps staff with the active session token", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "admin@example.com" } },
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: "token-123" } },
        }),
      },
    });

    const result = await DashboardLayout({
      children: <div>dashboard child</div>,
    });

    render(result);

    expect(createSupabaseServerClientMock).toHaveBeenCalledOnce();
    expect(bootstrapStaffMock).toHaveBeenCalledWith("token-123");
    expect(screen.getByText("dashboard child")).toBeInTheDocument();
  });

  it("redirects to login when there is no authenticated session", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    });

    await expect(
      DashboardLayout({
        children: <div>dashboard child</div>,
      }),
    ).rejects.toThrow("redirect:/login");

    expect(bootstrapStaffMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
