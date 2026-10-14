import { afterEach, describe, expect, it, vi } from "vitest";
import { imagePublicUrl } from "./supabase";

afterEach(() => vi.unstubAllEnvs());

describe("imagePublicUrl", () => {
  it("builds the public bucket URL and encodes each path segment", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co/");
    expect(imagePublicUrl("user-1/my pic.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/garment-images/user-1/my%20pic.jpg",
    );
  });

  it("returns null when there is no image or no Supabase URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(imagePublicUrl(null)).toBeNull();
    expect(imagePublicUrl("")).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(imagePublicUrl("a/b.jpg")).toBeNull();
  });
});
