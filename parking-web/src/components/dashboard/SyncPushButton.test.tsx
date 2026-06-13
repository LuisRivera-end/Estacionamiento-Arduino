import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { refreshMock, getBrowserAccessTokenMock, pushSyncMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  getBrowserAccessTokenMock: vi.fn(),
  pushSyncMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/auth/client", () => ({
  getBrowserAccessToken: getBrowserAccessTokenMock,
}));

vi.mock("@/lib/api/sync", () => ({
  pushSync: pushSyncMock,
}));

vi.mock("@chakra-ui/react", () => ({
  Button: ({
    children,
    onClick,
    loading,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    loading?: boolean;
  }) => (
    <button disabled={loading} onClick={onClick}>
      {children}
    </button>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { SyncPushButton } from "./SyncPushButton";

describe("SyncPushButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pushes and shows a success summary", async () => {
    getBrowserAccessTokenMock.mockResolvedValue("token-123");
    pushSyncMock.mockResolvedValue({
      status: "ok",
      full: false,
      started_at: "2026-06-13T00:00:00Z",
      finished_at: "2026-06-13T00:00:01Z",
      duration_ms: 1200,
      total_pushed: 7,
      tables: {
        devices: { pushed: 2, skipped: 0 },
        tickets: { pushed: 5, skipped: 0 },
      },
      error: null,
    });

    render(<SyncPushButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sincronizar ahora" }));

    expect(pushSyncMock).toHaveBeenCalledWith("token-123");
    expect(
      await screen.findByText(/Sincronización completa: 7 filas en 2 tablas/),
    ).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the backend error message on failure", async () => {
    getBrowserAccessTokenMock.mockResolvedValue("token-123");
    pushSyncMock.mockRejectedValue(
      new Error("No se pudo conectar al servidor remoto (¿sin internet?)"),
    );

    render(<SyncPushButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sincronizar ahora" }));

    expect(await screen.findByText(/sin internet/)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("warns when there is no active session", async () => {
    getBrowserAccessTokenMock.mockResolvedValue(null);

    render(<SyncPushButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sincronizar ahora" }));

    expect(await screen.findByText(/Sesión no válida/)).toBeInTheDocument();
    expect(pushSyncMock).not.toHaveBeenCalled();
  });
});
