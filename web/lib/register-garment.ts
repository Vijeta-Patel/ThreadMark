import { computeHash, normalizeGarment } from "./hash";
import { validateGarmentInput } from "./validate";
import { DuplicateError, type GarmentPatch, type NewGarment } from "./garments-store";
import type { GarmentRow, RegisterError, RegisterSuccess } from "./types";

// Core of POST /api/garments (project requirements, section 9.6).
// Dependencies are passed in so this can be tested without Supabase or a chain.

export interface RegisterDeps {
  store: {
    findGarmentBySku(sku: string): Promise<GarmentRow | null>;
    insertGarment(row: NewGarment): Promise<GarmentRow>;
    updateGarment(pid: string, patch: GarmentPatch): Promise<void>;
  };
  chain: { registerOnChain(pid: string, hashHex: string): Promise<{ txHash: string }> };
  makeQrDataUrl(url: string): Promise<string>;
  generatePid(): string;
  baseUrl: string;
  now?: () => Date;
}

export interface RegisterResult {
  status: 201 | 400 | 409 | 502;
  body: RegisterSuccess | RegisterError;
}

const MAX_PID_ATTEMPTS = 5;

export async function registerGarment(deps: RegisterDeps, userId: string | null, rawBody: unknown): Promise<RegisterResult> {
  const checked = validateGarmentInput(rawBody, deps.now?.());
  if (!checked.ok) return { status: 400, body: { error: "validation", fields: checked.fields } };
  const input = checked.value;

  // The SKU is stored in its normalised (uppercase) form so that "wn-1" and "WN-1"
  // cannot both be registered. The hash does not depend on this choice.
  const sku = normalizeGarment(input).sku;
  const hash = computeHash(input);

  if (await deps.store.findGarmentBySku(sku)) return { status: 409, body: { error: "duplicate_sku" } };

  let pid = "";
  let verifyUrl = "";
  let inserted = false;
  for (let attempt = 0; attempt < MAX_PID_ATTEMPTS && !inserted; attempt++) {
    pid = deps.generatePid();
    verifyUrl = `${deps.baseUrl.replace(/\/+$/, "")}/verify/${pid}`;
    try {
      await deps.store.insertGarment({
        pid,
        sku,
        brand: input.brand,
        fabric: input.fabric,
        origin: input.origin,
        manufacturing_date: input.manufacturingDate,
        image_ref: input.imageRef ?? null,
        sha256_hash: hash,
        qr_ref: verifyUrl,
        created_by: userId,
      });
      inserted = true;
    } catch (error) {
      if (!(error instanceof DuplicateError)) throw error;
      if (error.field === "sku") return { status: 409, body: { error: "duplicate_sku" } }; // lost a race
      // duplicate PID: pick another one
    }
  }
  if (!inserted) throw new Error(`could not generate a unique product id after ${MAX_PID_ATTEMPTS} attempts`);

  const { txHash } = await deps.chain.registerOnChain(pid, hash);
  await deps.store.updateGarment(pid, { status: "confirmed", tx_hash: txHash });
  const qrDataUrl = await deps.makeQrDataUrl(verifyUrl);

  return { status: 201, body: { pid, sku, hash, txHash, status: "confirmed", verifyUrl, qrDataUrl } };
}
