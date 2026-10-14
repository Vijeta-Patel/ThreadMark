import { describe, expect, it } from "vitest";
import { generatePid } from "./pid";

describe("generatePid", () => {
  it("has the TM- prefix and 10 characters from the safe alphabet", () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePid()).toMatch(/^TM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
    }
  });

  it("never produces the look-alike characters I, O, 0 or 1", () => {
    for (let i = 0; i < 200; i++) expect(generatePid().slice(3)).not.toMatch(/[IO01]/);
  });

  it("is random enough that 1000 ids are all different", () => {
    expect(new Set(Array.from({ length: 1000 }, () => generatePid())).size).toBe(1000);
  });

  it("uses the supplied random source", () => {
    expect(generatePid(() => 0)).toBe("TM-AAAAAAAAAA");
  });

  it("can never collide with the fixed seed PIDs, which contain 0 and 1", () => {
    expect(generatePid()).not.toMatch(/^TM-SEED/);
  });
});
