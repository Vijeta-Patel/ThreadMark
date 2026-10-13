import { describe, expect, it } from "vitest";
import { MESSAGES, validateGarmentInput } from "./validate";

const now = new Date("2026-10-14T12:00:00Z");
const good = {
  brand: "WeaveNest",
  sku: "WN260101",
  fabric: "Cotton",
  origin: "Karnataka, India",
  manufacturingDate: "2026-01-10",
};

function fieldsOf(raw: unknown) {
  const r = validateGarmentInput(raw, now);
  if (r.ok) throw new Error("expected validation to fail");
  return r.fields;
}

describe("validateGarmentInput", () => {
  it("accepts valid input and trims it without changing case", () => {
    const r = validateGarmentInput({ ...good, brand: "  WeaveNest  " }, now);
    expect(r).toEqual({ ok: true, value: good });
  });

  it("accepts a lowercase SKU (normalised to uppercase only when hashing)", () => {
    const r = validateGarmentInput({ ...good, sku: "wn-26_01" }, now);
    expect(r.ok).toBe(true);
  });

  it("keeps a valid imageRef and drops an empty one", () => {
    const withImage = validateGarmentInput({ ...good, imageRef: "user-1/abc.jpg" }, now);
    expect(withImage).toEqual({ ok: true, value: { ...good, imageRef: "user-1/abc.jpg" } });
    const empty = validateGarmentInput({ ...good, imageRef: "" }, now);
    expect(empty).toEqual({ ok: true, value: good });
  });

  it("reports every missing field", () => {
    expect(fieldsOf({})).toEqual({
      brand: MESSAGES.required,
      fabric: MESSAGES.required,
      origin: MESSAGES.required,
      sku: MESSAGES.required,
      manufacturingDate: MESSAGES.required,
    });
  });

  it("rejects bodies that are not JSON objects", () => {
    expect(fieldsOf(null)).toEqual({ body: MESSAGES.badBody });
    expect(fieldsOf("text")).toEqual({ body: MESSAGES.badBody });
    expect(fieldsOf([])).toEqual({ body: MESSAGES.badBody });
  });

  it("rejects non-string values as missing", () => {
    expect(fieldsOf({ ...good, brand: 5 }).brand).toBe(MESSAGES.required);
  });

  it("rejects the pipe character and over-long text", () => {
    expect(fieldsOf({ ...good, brand: "a|b" }).brand).toBe(MESSAGES.pipe);
    expect(fieldsOf({ ...good, origin: "x".repeat(101) }).origin).toBe(MESSAGES.tooLong);
    expect(validateGarmentInput({ ...good, origin: "x".repeat(100) }, now).ok).toBe(true);
  });

  it("rejects bad SKUs", () => {
    expect(fieldsOf({ ...good, sku: "WN 01" }).sku).toBe(MESSAGES.badSku);
    expect(fieldsOf({ ...good, sku: "WN#01" }).sku).toBe(MESSAGES.badSku);
    expect(fieldsOf({ ...good, sku: "AB" }).sku).toBe(MESSAGES.skuLength);
    expect(fieldsOf({ ...good, sku: "A".repeat(41) }).sku).toBe(MESSAGES.skuLength);
    expect(validateGarmentInput({ ...good, sku: "A".repeat(40) }, now).ok).toBe(true);
  });

  it("rejects bad and future dates", () => {
    expect(fieldsOf({ ...good, manufacturingDate: "10/01/2026" }).manufacturingDate).toBe(MESSAGES.badDate);
    expect(fieldsOf({ ...good, manufacturingDate: "2026-02-30" }).manufacturingDate).toBe(MESSAGES.badDate);
    expect(fieldsOf({ ...good, manufacturingDate: "2026-10-15" }).manufacturingDate).toBe(MESSAGES.futureDate);
    expect(validateGarmentInput({ ...good, manufacturingDate: "2026-10-14" }, now).ok).toBe(true);
  });

  it("rejects unsafe image references", () => {
    expect(fieldsOf({ ...good, imageRef: "/etc/passwd" }).imageRef).toBe(MESSAGES.badImage);
    expect(fieldsOf({ ...good, imageRef: "a/../b.jpg" }).imageRef).toBe(MESSAGES.badImage);
    expect(fieldsOf({ ...good, imageRef: 7 }).imageRef).toBe(MESSAGES.badImage);
  });
});
