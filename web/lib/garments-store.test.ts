import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { DuplicateError, findGarmentBySku, getGarmentByPid, insertGarment, listGarments, updateGarment } from "./garments-store";

// A tiny stand-in for the Supabase query builder: every chain method returns the
// same object, and awaiting it (or calling single/maybeSingle) yields `result`.
function fakeDb(result: { data?: unknown; error?: { code?: string; message: string; details?: string } | null }) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  const record = (name: string) => (...args: unknown[]) => {
    calls.push([name, args]);
    return builder;
  };
  for (const m of ["from", "insert", "select", "update", "eq", "order", "limit"]) builder[m] = record(m);
  const settled = Promise.resolve({ data: result.data ?? null, error: result.error ?? null });
  builder.single = () => settled;
  builder.maybeSingle = () => settled;
  builder.then = settled.then.bind(settled);
  return { db: builder as unknown as SupabaseClient, calls };
}

const row = {
  pid: "TM-ABCDEFGH23",
  sku: "WN1",
  brand: "b",
  fabric: "f",
  origin: "o",
  manufacturing_date: "2026-01-10",
  image_ref: null,
  sha256_hash: "a".repeat(64),
  qr_ref: null,
  created_by: null,
};

describe("garments-store", () => {
  it("insertGarment inserts into the garments table and returns the stored row", async () => {
    const { db, calls } = fakeDb({ data: { ...row, status: "pending" } });
    const stored = await insertGarment(row, db);
    expect(stored.status).toBe("pending");
    expect(calls[0]).toEqual(["from", ["garments"]]);
    expect(calls[1]).toEqual(["insert", [row]]);
  });

  it("maps a unique violation on the SKU to DuplicateError('sku')", async () => {
    const { db } = fakeDb({ error: { code: "23505", message: 'duplicate key value violates unique constraint "garments_sku_key"' } });
    await expect(insertGarment(row, db)).rejects.toMatchObject({ name: "DuplicateError", field: "sku" });
  });

  it("maps a unique violation on the primary key to DuplicateError('pid')", async () => {
    const { db } = fakeDb({ error: { code: "23505", message: 'duplicate key value violates unique constraint "garments_pkey"' } });
    await expect(insertGarment(row, db)).rejects.toBeInstanceOf(DuplicateError);
    await expect(insertGarment(row, db)).rejects.toMatchObject({ field: "pid" });
  });

  it("throws a plain error for other database failures", async () => {
    const { db } = fakeDb({ error: { code: "XX000", message: "boom" } });
    await expect(insertGarment(row, db)).rejects.toThrow(/insert failed: boom/);
  });

  it("findGarmentBySku and getGarmentByPid return null when there is no row", async () => {
    const { db } = fakeDb({ data: null });
    expect(await findGarmentBySku("X", db)).toBeNull();
    expect(await getGarmentByPid("TM-X", db)).toBeNull();
  });

  it("updateGarment updates by pid", async () => {
    const { db, calls } = fakeDb({});
    await updateGarment("TM-1", { status: "confirmed", tx_hash: "0xabc" }, db);
    expect(calls).toContainEqual(["update", [{ status: "confirmed", tx_hash: "0xabc" }]]);
    expect(calls).toContainEqual(["eq", ["pid", "TM-1"]]);
  });

  it("listGarments orders newest first and can filter by creator", async () => {
    const { db, calls } = fakeDb({ data: [row] });
    const rows = await listGarments({ createdBy: "user-1", limit: 5 }, db);
    expect(rows).toHaveLength(1);
    expect(calls).toContainEqual(["order", ["registered_at", { ascending: false }]]);
    expect(calls).toContainEqual(["limit", [5]]);
    expect(calls).toContainEqual(["eq", ["created_by", "user-1"]]);
  });
});
