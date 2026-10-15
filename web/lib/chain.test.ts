import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { registerOnChain, readFromChain } from "./chain";
import { makeQrDataUrl } from "./qr";

describe("lib/chain.ts (mock mode)", () => {
  const mockFile = path.join(process.cwd(), ".mock-chain.json");

  beforeEach(() => {
    process.env.CHAIN_MODE = "mock";
    if (fs.existsSync(mockFile)) {
      fs.unlinkSync(mockFile);
    }
  });

  it("registers on mock chain and reads back the exact hash", async () => {
    const pid = "TM-TEST001";
    const hash = "65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b";

    const { txHash } = await registerOnChain(pid, hash);
    expect(txHash).toMatch(/^0x[0-9a-f]{64}$/);

    const record = await readFromChain(pid);
    expect(record).not.toBeNull();
    expect(record?.hashHex).toBe(hash);
    expect(record?.registrant).toBe("0x0000000000000000000000000000000000000001");
    expect(record?.timestamp).toBeGreaterThan(0);
  });

  it("returns null for unknown PID", async () => {
    const record = await readFromChain("TM-UNKNOWN");
    expect(record).toBeNull();
  });

  it("throws on duplicate registration", async () => {
    const pid = "TM-DUPLICATE";
    const hash = "65c56b8b182f23a89cfd6ccd5c3f0cda8bf2d955ec6ca1a20fa4f94dd41db19b";

    await registerOnChain(pid, hash);
    await expect(registerOnChain(pid, hash)).rejects.toThrow("garment already exists");
  });
});

describe("lib/qr.ts", () => {
  it("generates a real base64 data URL for QR codes", async () => {
    const dataUrl = await makeQrDataUrl("http://localhost:3000/verify/TM-TEST001");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
