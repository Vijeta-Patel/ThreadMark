import { describe, expect, it } from "vitest";
import { pidFromQrText } from "./scan";

describe("pidFromQrText", () => {
  it("reads the PID from a verification URL", () => {
    expect(pidFromQrText("https://threadmark-dpp.vercel.app/verify/TM-ABCDEFGH23")).toBe("TM-ABCDEFGH23");
    expect(pidFromQrText("http://localhost:3000/verify/TM-SEED000001/")).toBe("TM-SEED000001");
  });

  it("accepts a bare PID in any case, with whitespace", () => {
    expect(pidFromQrText("  tm-abcdefgh23\n")).toBe("TM-ABCDEFGH23");
  });

  it("rejects text that is not a ThreadMark code", () => {
    expect(pidFromQrText("")).toBeNull();
    expect(pidFromQrText("https://example.com/menu")).toBeNull();
    expect(pidFromQrText("https://example.com/verify/not-a-pid")).toBeNull();
    expect(pidFromQrText("hello world")).toBeNull();
  });
});
