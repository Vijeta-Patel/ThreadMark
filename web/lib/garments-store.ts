import type { SupabaseClient } from "@supabase/supabase-js";
import type { GarmentRow, GarmentStatus } from "./types";
import { getServerSupabase } from "./supabase";

// All reads and writes of the `garments` table. Server-side only.

const TABLE = "garments";

export class DuplicateError extends Error {
  constructor(public readonly field: "sku" | "pid") {
    super(`duplicate ${field}`);
    this.name = "DuplicateError";
  }
}

export interface NewGarment {
  pid: string;
  sku: string;
  brand: string;
  fabric: string;
  origin: string;
  manufacturing_date: string;
  image_ref: string | null;
  sha256_hash: string;
  qr_ref: string | null;
  created_by: string | null;
}

export interface GarmentPatch {
  status?: GarmentStatus;
  tx_hash?: string;
  qr_ref?: string;
}

interface DbError {
  code?: string;
  message: string;
  details?: string;
}

function fail(action: string, error: DbError): never {
  throw new Error(`garments ${action} failed: ${error.message}`);
}

/** Insert a new row (status starts as `pending`). Throws DuplicateError on a unique violation. */
export async function insertGarment(row: NewGarment, db: SupabaseClient = getServerSupabase()): Promise<GarmentRow> {
  const { data, error } = await db.from(TABLE).insert(row).select().single();
  if (error) {
    if (error.code === "23505") {
      const text = `${error.message} ${error.details ?? ""}`;
      throw new DuplicateError(/sku/i.test(text) ? "sku" : "pid");
    }
    fail("insert", error);
  }
  return data as GarmentRow;
}

export async function findGarmentBySku(sku: string, db: SupabaseClient = getServerSupabase()): Promise<GarmentRow | null> {
  const { data, error } = await db.from(TABLE).select().eq("sku", sku).maybeSingle();
  if (error) fail("lookup by sku", error);
  return (data as GarmentRow | null) ?? null;
}

export async function getGarmentByPid(pid: string, db: SupabaseClient = getServerSupabase()): Promise<GarmentRow | null> {
  const { data, error } = await db.from(TABLE).select().eq("pid", pid).maybeSingle();
  if (error) fail("lookup by pid", error);
  return (data as GarmentRow | null) ?? null;
}

/** Remove a row. Used only to clear a `failed` registration so the SKU can be registered again. */
export async function deleteGarment(pid: string, db: SupabaseClient = getServerSupabase()): Promise<void> {
  const { error } = await db.from(TABLE).delete().eq("pid", pid);
  if (error) fail("delete", error);
}

export async function updateGarment(pid: string, patch: GarmentPatch, db: SupabaseClient = getServerSupabase()): Promise<void> {
  const { error } = await db.from(TABLE).update(patch).eq("pid", pid);
  if (error) fail("update", error);
}

/** Newest first. Pass `createdBy` to list only one manufacturer's garments. */
export async function listGarments(
  options: { createdBy?: string | null; limit?: number } = {},
  db: SupabaseClient = getServerSupabase(),
): Promise<GarmentRow[]> {
  let query = db.from(TABLE).select().order("registered_at", { ascending: false }).limit(options.limit ?? 100);
  if (options.createdBy) query = query.eq("created_by", options.createdBy);
  const { data, error } = await query;
  if (error) fail("list", error);
  return (data ?? []) as GarmentRow[];
}
