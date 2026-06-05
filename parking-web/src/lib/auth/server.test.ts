import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookieStoreMock,
  cookiesMock,
  createServerClientMock,
} = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => [{ name: "sb-access-token", value: "token" }]),
    set: vi.fn(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler.");
    }),
  };

  return {
    cookieStoreMock: cookieStore,
    cookiesMock: vi.fn(async () => cookieStore),
    createServerClientMock: vi.fn((_url: string, _key: string, options: { cookies: { getAll: () => unknown; setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void; }; }) => ({
      options,
    })),
  };
});

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { createSupabaseServerClient } from "./server";

describe("createSupabaseServerClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStoreMock.getAll.mockReturnValue([{ name: "sb-access-token", value: "token" }]);
    cookieStoreMock.set.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler.");
    });
  });

  it("exposes request cookies to the Supabase client", async () => {
    const supabase = await createSupabaseServerClient();

    expect(cookiesMock).toHaveBeenCalledOnce();
    expect(createServerClientMock).toHaveBeenCalledOnce();
    expect(supabase.options.cookies.getAll()).toEqual([{ name: "sb-access-token", value: "token" }]);
    expect(cookieStoreMock.getAll).toHaveBeenCalled();
  });

  it("swallows cookie write attempts during Server Component rendering", async () => {
    const supabase = await createSupabaseServerClient();

    expect(() =>
      supabase.options.cookies.setAll([
        { name: "sb-refresh-token", value: "refresh-token", options: { path: "/" } },
      ]),
    ).not.toThrow();
    expect(cookieStoreMock.set).toHaveBeenCalledWith("sb-refresh-token", "refresh-token", {
      path: "/",
    });
  });
});
