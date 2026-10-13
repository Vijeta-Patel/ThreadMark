import type { RegisterError } from "./types";

// Pure helpers for the registration page (kept apart from React so they can be tested).
// Wording for the first four comes from the project requirements, section 9.9.

export const REGISTER_MESSAGES = {
  duplicateSku: "A garment with this SKU is already registered.",
  chainFailed: "Could not record the garment on the blockchain. Nothing was registered; try again.",
  unauthorized: "Please log in to continue.",
  imageType: "Image must be a JPG, PNG or WebP file under 2 MB",
  uploadFailed: "The image could not be uploaded. You can register without it.",
  generic: "Something went wrong. Please try again.",
} as const;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** File extension for an allowed image type, or null if the type or size is not allowed. */
export function imageExtension(file: { type: string; size: number }): string | null {
  if (file.size > MAX_IMAGE_BYTES) return null;
  return IMAGE_EXTENSIONS[file.type] ?? null;
}

export type RegisterFailure = { message: string; fields: Record<string, string> };

/** Turn a failed API response into what the page shows. */
export function describeRegisterFailure(status: number, body: unknown): RegisterFailure {
  const error = (body && typeof body === "object" ? (body as Partial<RegisterError>) : {}) as Partial<RegisterError>;
  if (status === 400 && error.error === "validation") {
    return { message: "", fields: (error as { fields: Record<string, string> }).fields ?? {} };
  }
  if (status === 401 || error.error === "unauthorized") return { message: REGISTER_MESSAGES.unauthorized, fields: {} };
  if (status === 409 || error.error === "duplicate_sku") return { message: REGISTER_MESSAGES.duplicateSku, fields: {} };
  if (status === 502 || error.error === "chain_failed") return { message: REGISTER_MESSAGES.chainFailed, fields: {} };
  return { message: REGISTER_MESSAGES.generic, fields: {} };
}

/** Link to a transaction in a block explorer, or null when no explorer is configured. */
export function txLink(prefix: string | undefined, txHash: string): string | null {
  return prefix ? `${prefix}${txHash}` : null;
}
