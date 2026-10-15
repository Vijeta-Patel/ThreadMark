import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireUser, UnauthorizedError } from "./auth";
import * as supabaseModule from "./supabase";

vi.mock("./supabase", () => ({
  getServerSupabase: vi.fn(),
}));

describe("lib/auth.ts requireUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws UnauthorizedError when no header or cookie is present", async () => {
    const request = new Request("http://localhost:3000/api/garments");
    await expect(requireUser(request)).rejects.toThrow(UnauthorizedError);
  });

  it("authenticates successfully via Bearer token", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    vi.mocked(supabaseModule.getServerSupabase).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new Request("http://localhost:3000/api/garments", {
      headers: { authorization: "Bearer valid-token" },
    });

    const user = await requireUser(request);
    expect(user).toEqual({ id: "user-123" });
    expect(mockGetUser).toHaveBeenCalledWith("valid-token");
  });

  it("authenticates successfully via cookie", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-456" } },
      error: null,
    });

    vi.mocked(supabaseModule.getServerSupabase).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new Request("http://localhost:3000/api/garments", {
      headers: { cookie: "other=1; sb-access-token=cookie-token; more=2" },
    });

    const user = await requireUser(request);
    expect(user).toEqual({ id: "user-456" });
    expect(mockGetUser).toHaveBeenCalledWith("cookie-token");
  });

  it("throws UnauthorizedError if supabase token validation fails", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });

    vi.mocked(supabaseModule.getServerSupabase).mockReturnValue({
      auth: { getUser: mockGetUser },
    } as any);

    const request = new Request("http://localhost:3000/api/garments", {
      headers: { authorization: "Bearer invalid-token" },
    });

    await expect(requireUser(request)).rejects.toThrow(UnauthorizedError);
  });
});