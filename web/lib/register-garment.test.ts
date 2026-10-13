import { describe, expect, it, vi } from "vitest";
import { computeHash } from "./hash";
import { DuplicateError } from "./garments-store";
import { registerGarment, type RegisterDeps } from "./register-garment";
import type { GarmentRow } from "./types";

const good = { brand: "WeaveNest", sku: "wn260101", fabric: "Cotton", origin: "Karnataka, India", manufacturingDate: "2026-01-10" };
const now = () => new Date("2026-10-14T12:00:00Z");

function makeDeps() {
  const deps = {
    store: {
      findGarmentBySku: vi.fn(async () => null as GarmentRow | null),
      insertGarment: vi.fn(async (row) => ({ ...row, tx_hash: null, status: "pending", registered_at: "x" }) as GarmentRow),
      updateGarment: vi.fn(async () => {}),
      deleteGarment: vi.fn(async () => {}),
    },
    chain: { registerOnChain: vi.fn(async () => ({ txHash: "0xabc" })) },
    makeQrDataUrl: vi.fn(async (url: string) => `data:image/png;base64,QR(${url})`),
    generatePid: vi.fn(() => "TM-ABCDEFGH23"),
    baseUrl: "https://threadmark.example/",
    now,
  } satisfies RegisterDeps;
  return deps;
}

describe("registerGarment", () => {
  it("registers a garment: 201 with every field in the contract", async () => {
    const deps = makeDeps();
    const result = await registerGarment(deps, "user-1", good);
    const hash = computeHash(good);
    expect(result.status).toBe(201);
    expect(result.body).toEqual({
      pid: "TM-ABCDEFGH23",
      sku: "WN260101",
      hash,
      txHash: "0xabc",
      status: "confirmed",
      verifyUrl: "https://threadmark.example/verify/TM-ABCDEFGH23",
      qrDataUrl: "data:image/png;base64,QR(https://threadmark.example/verify/TM-ABCDEFGH23)",
    });
  });

  it("saves the row as entered (SKU uppercased), then writes PID and hash to the chain, then confirms", async () => {
    const deps = makeDeps();
    await registerGarment(deps, "user-1", { ...good, imageRef: "user-1/a.jpg" });
    const hash = computeHash(good);
    expect(deps.store.insertGarment).toHaveBeenCalledWith({
      pid: "TM-ABCDEFGH23",
      sku: "WN260101",
      brand: "WeaveNest",
      fabric: "Cotton",
      origin: "Karnataka, India",
      manufacturing_date: "2026-01-10",
      image_ref: "user-1/a.jpg",
      sha256_hash: hash,
      qr_ref: "https://threadmark.example/verify/TM-ABCDEFGH23",
      created_by: "user-1",
    });
    expect(deps.chain.registerOnChain).toHaveBeenCalledWith("TM-ABCDEFGH23", hash);
    expect(deps.store.updateGarment).toHaveBeenCalledWith("TM-ABCDEFGH23", { status: "confirmed", tx_hash: "0xabc" });
    const order = [
      deps.store.insertGarment.mock.invocationCallOrder[0],
      deps.chain.registerOnChain.mock.invocationCallOrder[0],
      deps.store.updateGarment.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("rejects invalid input with 400 and touches nothing", async () => {
    const deps = makeDeps();
    const result = await registerGarment(deps, null, { ...good, brand: "" });
    expect(result).toEqual({ status: 400, body: { error: "validation", fields: { brand: "This field is required" } } });
    expect(deps.store.findGarmentBySku).not.toHaveBeenCalled();
    expect(deps.store.insertGarment).not.toHaveBeenCalled();
    expect(deps.chain.registerOnChain).not.toHaveBeenCalled();
  });

  it("treats a missing or non-object body as a validation error", async () => {
    const result = await registerGarment(makeDeps(), null, undefined);
    expect(result.status).toBe(400);
  });

  it("answers 409 duplicate_sku when the SKU exists, regardless of letter case", async () => {
    const deps = makeDeps();
    deps.store.findGarmentBySku.mockResolvedValueOnce({ pid: "TM-OLD", status: "confirmed" } as GarmentRow);
    const result = await registerGarment(deps, null, good);
    expect(result).toEqual({ status: 409, body: { error: "duplicate_sku" } });
    expect(deps.store.findGarmentBySku).toHaveBeenCalledWith("WN260101");
    expect(deps.store.insertGarment).not.toHaveBeenCalled();
    expect(deps.chain.registerOnChain).not.toHaveBeenCalled();
  });

  it("answers 409 when two requests race and the database rejects the SKU", async () => {
    const deps = makeDeps();
    deps.store.insertGarment.mockRejectedValueOnce(new DuplicateError("sku"));
    const result = await registerGarment(deps, null, good);
    expect(result).toEqual({ status: 409, body: { error: "duplicate_sku" } });
    expect(deps.chain.registerOnChain).not.toHaveBeenCalled();
  });

  it("picks another PID when the first one collides", async () => {
    const deps = makeDeps();
    deps.generatePid.mockReturnValueOnce("TM-AAAAAAAAAA").mockReturnValueOnce("TM-BBBBBBBBBB");
    deps.store.insertGarment.mockRejectedValueOnce(new DuplicateError("pid"));
    const result = await registerGarment(deps, null, good);
    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ pid: "TM-BBBBBBBBBB" });
    expect(deps.chain.registerOnChain).toHaveBeenCalledWith("TM-BBBBBBBBBB", computeHash(good));
  });

  it("gives up with an error after five PID collisions", async () => {
    const deps = makeDeps();
    deps.store.insertGarment.mockRejectedValue(new DuplicateError("pid"));
    await expect(registerGarment(deps, null, good)).rejects.toThrow(/unique product id/);
    expect(deps.store.insertGarment).toHaveBeenCalledTimes(5);
    expect(deps.chain.registerOnChain).not.toHaveBeenCalled();
  });

  it("chain failure: 502, row marked failed, no confirmation, no QR", async () => {
    const deps = makeDeps();
    deps.chain.registerOnChain.mockRejectedValueOnce(new Error("rpc down"));
    const result = await registerGarment(deps, null, good);
    expect(result).toEqual({ status: 502, body: { error: "chain_failed", pid: "TM-ABCDEFGH23" } });
    expect(deps.store.updateGarment).toHaveBeenCalledTimes(1);
    expect(deps.store.updateGarment).toHaveBeenCalledWith("TM-ABCDEFGH23", { status: "failed" });
    expect(deps.makeQrDataUrl).not.toHaveBeenCalled();
  });

  it("chain failure is still a 502 when marking the row failed also fails", async () => {
    const deps = makeDeps();
    deps.chain.registerOnChain.mockRejectedValueOnce(new Error("rpc down"));
    deps.store.updateGarment.mockRejectedValueOnce(new Error("db down"));
    const result = await registerGarment(deps, null, good);
    expect(result.status).toBe(502);
    expect(deps.makeQrDataUrl).not.toHaveBeenCalled();
  });

  it("a retry after a failed registration clears the failed row and succeeds", async () => {
    const deps = makeDeps();
    deps.store.findGarmentBySku.mockResolvedValueOnce({ pid: "TM-FAILED0001", status: "failed" } as GarmentRow);
    const result = await registerGarment(deps, null, good);
    expect(result.status).toBe(201);
    expect(deps.store.deleteGarment).toHaveBeenCalledWith("TM-FAILED0001");
  });

  it("pending and confirmed rows still block the SKU and are never deleted", async () => {
    for (const status of ["pending", "confirmed"] as const) {
      const deps = makeDeps();
      deps.store.findGarmentBySku.mockResolvedValueOnce({ pid: "TM-OTHER00001", status } as GarmentRow);
      const result = await registerGarment(deps, null, good);
      expect(result).toEqual({ status: 409, body: { error: "duplicate_sku" } });
      expect(deps.store.deleteGarment).not.toHaveBeenCalled();
    }
  });

  it("stores no creator when nobody is logged in yet", async () => {
    const deps = makeDeps();
    await registerGarment(deps, null, good);
    expect(deps.store.insertGarment).toHaveBeenCalledWith(expect.objectContaining({ created_by: null, image_ref: null }));
  });
});
