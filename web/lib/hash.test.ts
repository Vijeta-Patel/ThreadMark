import { describe, expect, it } from "vitest";
import { computeHash, isValidDateString, normalizeGarment } from "./hash";

// Test vectors from the project requirements, section 9.3 (computed with Python hashlib).
const base = {
  brand: "WeaveNest",
  sku: "WN260101",
  fabric: "Cotton",
  origin: "Karnataka, India",
  manufacturingDate: "2026-01-10",
};

describe("computeHash", () => {
  it("matches vector 1", () => {
    expect(computeHash(base)).toBe("65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b");
  });

  it("gives the same hash for messy input (vector 2)", () => {
    const messy = { brand: "  weavenest ", sku: "wn260101", fabric: "COTTON", origin: "karnataka,  india", manufacturingDate: "2026-01-10" };
    expect(computeHash(messy)).toBe(computeHash(base));
  });

  it("matches vector 3 and differs when the date changes", () => {
    const h = computeHash({ ...base, manufacturingDate: "2026-01-11" });
    expect(h).toBe("82fe61beb991396f19cf6995c50a05b7ac455e7cf8892a6507ce86f2b7b70b52");
    expect(h).not.toBe(computeHash(base));
  });

  it("returns 64 lowercase hex characters", () => {
    expect(computeHash(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is not fooled by moving text between adjacent fields", () => {
    const a = computeHash({ ...base, brand: "AB", sku: "C12" });
    const b = computeHash({ ...base, brand: "A", sku: "BC12" });
    expect(a).not.toBe(b);
  });
});

describe("normalizeGarment", () => {
  it("normalises case and whitespace", () => {
    expect(normalizeGarment({ ...base, brand: "  Weave   Nest ", sku: " wn-1 " })).toEqual({
      brand: "weave nest",
      sku: "WN-1",
      fabric: "cotton",
      origin: "karnataka, india",
      manufacturingDate: "2026-01-10",
    });
  });

  it("rejects empty values", () => {
    expect(() => normalizeGarment({ ...base, fabric: "   " })).toThrow(/fabric/);
  });

  it("rejects the | separator in any field", () => {
    expect(() => normalizeGarment({ ...base, origin: "a|b" })).toThrow(/origin/);
  });

  it("rejects dates that are not real YYYY-MM-DD dates", () => {
    expect(() => normalizeGarment({ ...base, manufacturingDate: "10-01-2026" })).toThrow(/manufacturingDate/);
    expect(() => normalizeGarment({ ...base, manufacturingDate: "2026-02-30" })).toThrow(/manufacturingDate/);
  });

  it("rejects non-string values", () => {
    expect(() => normalizeGarment({ ...base, brand: 5 as unknown as string })).toThrow(/brand/);
  });
});

describe("isValidDateString", () => {
  it("accepts real dates and rejects impossible ones", () => {
    expect(isValidDateString("2024-02-29")).toBe(true);
    expect(isValidDateString("2025-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-1-1")).toBe(false);
  });
});
