import type { GarmentInput } from "./types";
import { isValidDateString } from "./date";

// Input validation for garment registration. Wording is fixed by the project
// requirements, section 9.9; limits come from section 9.8.

export type ValidationResult =
  | { ok: true; value: GarmentInput }
  | { ok: false; fields: Record<string, string> };

const MAX_TEXT = 100;
const MAX_IMAGE_REF = 300;

export const MESSAGES = {
  required: "This field is required",
  badDate: "Use YYYY-MM-DD",
  futureDate: "Date cannot be in the future",
  badSku: "SKU may only contain A–Z, 0–9, - and _",
  skuLength: "SKU must be 3–40 characters",
  pipe: "Must not contain the pipe character",
  tooLong: `Must be at most ${MAX_TEXT} characters`,
  badImage: "Invalid image reference",
  badBody: "Request body must be a JSON object",
} as const;

function str(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

/**
 * Validate registration input. Returns the values trimmed (not lowercased:
 * the stored record keeps what was entered; normalisation happens only when hashing).
 * `now` is injectable for tests.
 */
export function validateGarmentInput(raw: unknown, now: Date = new Date()): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, fields: { body: MESSAGES.badBody } };
  }
  const body = raw as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const text = (name: "brand" | "fabric" | "origin"): string => {
    const v = str(body[name]);
    if (!v) fields[name] = MESSAGES.required;
    else if (v.includes("|")) fields[name] = MESSAGES.pipe;
    else if (v.length > MAX_TEXT) fields[name] = MESSAGES.tooLong;
    return v ?? "";
  };
  const brand = text("brand");
  const fabric = text("fabric");
  const origin = text("origin");

  const sku = str(body.sku) ?? "";
  if (!sku) fields.sku = MESSAGES.required;
  else {
    const normalizedSku = sku.replace(/\s+/g, " ").toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(normalizedSku)) fields.sku = MESSAGES.badSku;
    else if (normalizedSku.length < 3 || normalizedSku.length > 40) fields.sku = MESSAGES.skuLength;
  }

  const manufacturingDate = str(body.manufacturingDate) ?? "";
  if (!manufacturingDate) fields.manufacturingDate = MESSAGES.required;
  else if (!isValidDateString(manufacturingDate)) fields.manufacturingDate = MESSAGES.badDate;
  else if (manufacturingDate > now.toISOString().slice(0, 10)) fields.manufacturingDate = MESSAGES.futureDate;

  let imageRef: string | undefined;
  if (body.imageRef !== undefined && body.imageRef !== null && body.imageRef !== "") {
    const ref = str(body.imageRef);
    if (ref === null || ref.length > MAX_IMAGE_REF || ref.startsWith("/") || ref.includes("..")) {
      fields.imageRef = MESSAGES.badImage;
    } else if (ref) {
      imageRef = ref;
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, value: { brand, sku, fabric, origin, manufacturingDate, ...(imageRef ? { imageRef } : {}) } };
}
