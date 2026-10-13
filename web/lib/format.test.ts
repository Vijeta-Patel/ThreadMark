import { describe, expect, it } from "vitest";
import { formatUtc } from "./format";

describe("formatUtc", () => {
  it("formats an ISO timestamp as YYYY-MM-DD HH:mm UTC", () => {
    expect(formatUtc("2026-10-14T09:05:33.123Z")).toBe("2026-10-14 09:05 UTC");
  });
  it("converts offsets to UTC", () => {
    expect(formatUtc("2026-10-14T23:30:00+05:30")).toBe("2026-10-14 18:00 UTC");
  });
  it("returns the input unchanged when it is not a date", () => {
    expect(formatUtc("not a date")).toBe("not a date");
  });
});
