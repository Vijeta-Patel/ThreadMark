// Shared types. Shapes come from the project requirements, sections 9.4 (database)
// and 9.6 (API contracts). Do not change them without all three team members agreeing.

export type GarmentStatus = "pending" | "confirmed" | "failed";

/** What the manufacturer submits. */
export interface GarmentInput {
  brand: string;
  sku: string;
  fabric: string;
  origin: string;
  manufacturingDate: string; // YYYY-MM-DD
  imageRef?: string; // Supabase Storage path, optional
}

/** The five hashed fields after normalisation (the image is not hashed). */
export interface NormalizedGarment {
  brand: string;
  sku: string;
  fabric: string;
  origin: string;
  manufacturingDate: string;
}

/** A row of the `garments` table (database/schema.sql). */
export interface GarmentRow {
  pid: string;
  sku: string;
  brand: string;
  fabric: string;
  origin: string;
  manufacturing_date: string; // YYYY-MM-DD
  image_ref: string | null;
  sha256_hash: string; // 64 lowercase hex
  tx_hash: string | null;
  status: GarmentStatus;
  qr_ref: string | null; // the verification URL the QR code encodes
  created_by: string | null;
  registered_at: string; // ISO 8601
}

/** POST /api/garments, 201 */
export interface RegisterSuccess {
  pid: string;
  sku: string;
  hash: string; // 64 lowercase hex, no 0x prefix
  txHash: string;
  status: "confirmed";
  verifyUrl: string;
  qrDataUrl: string; // PNG data URL
}

/** POST /api/garments, error bodies */
export type RegisterError =
  | { error: "validation"; fields: Record<string, string> }
  | { error: "unauthorized" }
  | { error: "duplicate_sku" }
  | { error: "chain_failed"; pid: string };

export type VerifyStatus = "verified" | "failed" | "not_found";

export interface VerifyProduct {
  brand: string;
  sku: string;
  fabric: string;
  origin: string;
  manufacturingDate: string;
  imageUrl: string | null;
}

/** GET /api/products/verify/[pid]: 200 for verified/failed, 404 for not_found */
export type VerifyResponse =
  | {
      status: "verified" | "failed";
      pid: string;
      product: VerifyProduct;
      // onChain is null when the row exists but the chain has no record for the PID
      hash: { current: string; onChain: string | null };
      txHash: string | null;
      registeredAt: string;
    }
  | { status: "not_found"; pid: string };
