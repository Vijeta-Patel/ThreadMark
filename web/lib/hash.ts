import { createHash } from "node:crypto";
import type { NormalizedGarment } from "./types";

// Single implementation of the hash rule in the project requirements, section 9.3.
// Registration and verification must both call these functions; nobody re-implements them.

type HashableGarment = {
  brand: string;
  sku: string;
  fabric: string;
  origin: string;
  manufacturingDate: string;
};

/** Trim and collapse runs of whitespace to a single space. */
function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** True for a real calendar date written exactly as YYYY-MM-DD. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function requireText(name: string, value: unknown): string {
  if (typeof value !== "string") throw new Error(`${name} must be a string`);
  return value;
}

/**
 * Normalise the five hashed fields. Brand, fabric and origin are lowercased;
 * the SKU is uppercased; the date must already be YYYY-MM-DD.
 * Throws if a field is empty after trimming or contains the `|` separator.
 */
export function normalizeGarment(input: HashableGarment): NormalizedGarment {
  const normalized: NormalizedGarment = {
    brand: clean(requireText("brand", input.brand)).toLowerCase(),
    sku: clean(requireText("sku", input.sku)).toUpperCase(),
    fabric: clean(requireText("fabric", input.fabric)).toLowerCase(),
    origin: clean(requireText("origin", input.origin)).toLowerCase(),
    manufacturingDate: requireText("manufacturingDate", input.manufacturingDate),
  };

  for (const [name, value] of Object.entries(normalized)) {
    if (value.length === 0) throw new Error(`${name} must not be empty`);
    if (value.includes("|")) throw new Error(`${name} must not contain "|"`);
  }
  if (!isValidDateString(normalized.manufacturingDate)) {
    throw new Error("manufacturingDate must be a real date written as YYYY-MM-DD");
  }
  return normalized;
}

/**
 * SHA-256 of brand|sku|fabric|origin|manufacturingDate (normalised, UTF-8),
 * as 64 lowercase hex characters. The image is not part of the hash.
 * Throws if the input is invalid (see normalizeGarment).
 */
export function computeHash(input: HashableGarment): string {
  const n = normalizeGarment(input);
  const text = [n.brand, n.sku, n.fabric, n.origin, n.manufacturingDate].join("|");
  return createHash("sha256").update(text, "utf8").digest("hex");
}
