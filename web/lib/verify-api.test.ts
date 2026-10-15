import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../app/api/products/verify/[pid]/route";
import * as chain from "./chain";
import * as store from "./garments-store";
import type { GarmentRow } from "./types";

vi.mock("./garments-store", () => ({
  getGarmentByPid: vi.fn(),
}));

vi.mock("./chain", () => ({
  readFromChain: vi.fn(),
}));

describe("GET /api/products/verify/[pid]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 not_found when garment does not exist in store", async () => {
    vi.mocked(store.getGarmentByPid).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/products/verify/TM-SEED000099");
    const response = await GET(req, { params: Promise.resolve({ pid: "TM-SEED000099" }) });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ status: "not_found", pid: "TM-SEED000099" });
  });

  it("returns 200 verified when stored data hash matches on-chain hash", async () => {
    const validRow: GarmentRow = {
      pid: "TM-SEED000001",
      sku: "WN260101",
      brand: "WeaveNest",
      fabric: "Cotton",
      origin: "Karnataka, India",
      manufacturing_date: "2026-01-10",
      image_ref: null,
      sha256_hash: "65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b",
      tx_hash: "0xbb5132dd5facd754eddee7d8c310bbcb811fd706ae4bf021da5baac5abc1ef22",
      status: "confirmed",
      qr_ref: "http://localhost:3000/verify/TM-SEED000001",
      created_by: null,
      registered_at: "2026-01-10T12:00:00Z",
    };

    vi.mocked(store.getGarmentByPid).mockResolvedValue(validRow);
    vi.mocked(chain.readFromChain).mockResolvedValue({
      hashHex: "65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b",
      timestamp: 1768046400,
      registrant: "0x0000000000000000000000000000000000000001",
    });

    const req = new Request("http://localhost:3000/api/products/verify/TM-SEED000001");
    const response = await GET(req, { params: Promise.resolve({ pid: "TM-SEED000001" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("verified");
    expect(body.pid).toBe("TM-SEED000001");
    expect(body.hash.current).toBe("65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b");
    expect(body.hash.onChain).toBe("65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b");
  });

  it("returns 200 failed when stored data has been altered", async () => {
    const alteredRow: GarmentRow = {
      pid: "TM-SEED000002",
      sku: "WN260102",
      brand: "WeaveNest",
      fabric: "Polyester", // Altered in DB from Cotton
      origin: "Karnataka, India",
      manufacturing_date: "2026-01-10",
      image_ref: null,
      sha256_hash: "65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b",
      tx_hash: "0x75fd1bd474b4312a0a006b2dbcfc489f249ce97360b03a79bc88ca48bbe7fade",
      status: "confirmed",
      qr_ref: "http://localhost:3000/verify/TM-SEED000002",
      created_by: null,
      registered_at: "2026-01-10T12:00:00Z",
    };

    vi.mocked(store.getGarmentByPid).mockResolvedValue(alteredRow);
    vi.mocked(chain.readFromChain).mockResolvedValue({
      hashHex: "65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b",
      timestamp: 1768046400,
      registrant: "0x0000000000000000000000000000000000000001",
    });

    const req = new Request("http://localhost:3000/api/products/verify/TM-SEED000002");
    const response = await GET(req, { params: Promise.resolve({ pid: "TM-SEED000002" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("failed");
    expect(body.pid).toBe("TM-SEED000002");
    expect(body.hash.current).not.toBe(body.hash.onChain);
  });

  it("returns 200 failed when record exists in DB but never registered on chain", async () => {
    const offChainRow: GarmentRow = {
      pid: "TM-SEED000003",
      sku: "WN260103",
      brand: "WeaveNest",
      fabric: "Silk",
      origin: "Varanasi, India",
      manufacturing_date: "2026-01-05",
      image_ref: null,
      sha256_hash: "abcd",
      tx_hash: null,
      status: "confirmed",
      qr_ref: "http://localhost:3000/verify/TM-SEED000003",
      created_by: null,
      registered_at: "2026-01-05T12:00:00Z",
    };

    vi.mocked(store.getGarmentByPid).mockResolvedValue(offChainRow);
    vi.mocked(chain.readFromChain).mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/products/verify/TM-SEED000003");
    const response = await GET(req, { params: Promise.resolve({ pid: "TM-SEED000003" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("failed");
    expect(body.pid).toBe("TM-SEED000003");
    expect(body.hash.onChain).toBeNull();
  });
});