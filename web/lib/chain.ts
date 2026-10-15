import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import GarmentPassportAbi from "./abi/GarmentPassport.json";

// Shared chain client specified in section 9.5.
// The only file in `web/` that interacts with the smart contract.

export interface ChainRecord {
  hashHex: string;
  timestamp: number;
  registrant: string;
}

export interface RegisterResult {
  txHash: string;
}

interface MockStorage {
  [pid: string]: {
    hashHex: string;
    timestamp: number;
    registrant: string;
    txHash: string;
  };
}

const MOCK_STORAGE_FILE = path.join(process.cwd(), ".mock-chain.json");

function getMockStorage(): MockStorage {
  try {
    if (fs.existsSync(MOCK_STORAGE_FILE)) {
      const content = fs.readFileSync(MOCK_STORAGE_FILE, "utf-8");
      return JSON.parse(content) as MockStorage;
    }
  } catch (err) {
    console.error("[MOCK CHAIN] Error reading mock chain file:", err);
  }
  return {};
}

function saveMockStorage(storage: MockStorage): void {
  try {
    fs.writeFileSync(MOCK_STORAGE_FILE, JSON.stringify(storage, null, 2), "utf-8");
  } catch (err) {
    console.error("[MOCK CHAIN] Error writing mock chain file:", err);
  }
}

/**
 * Register a garment hash on chain.
 * Reverts/throws "garment already exists" on duplicate PID.
 */
export async function registerOnChain(pid: string, hashHex: string): Promise<RegisterResult> {
  const mode = process.env.CHAIN_MODE ?? "mock";

  if (mode === "mock") {
    console.warn(`[MOCK CHAIN] registerOnChain called for PID: ${pid}`);
    if (!pid || pid.trim().length === 0) {
      throw new Error("pid required");
    }

    const storage = getMockStorage();
    if (storage[pid]) {
      throw new Error("garment already exists");
    }

    // mock txHash = 0x + SHA-256 hex of the PID
    const txHash = "0x" + createHash("sha256").update(pid, "utf8").digest("hex");
    const timestamp = Math.floor(Date.now() / 1000);
    const registrant = "0x0000000000000000000000000000000000000001";

    storage[pid] = {
      hashHex: hashHex.toLowerCase().replace(/^0x/, ""),
      timestamp,
      registrant,
      txHash,
    };
    saveMockStorage(storage);

    return { txHash };
  }

  // Real mode using ethers v6
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error("Real chain configuration missing: check SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, and CONTRACT_ADDRESS");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, GarmentPassportAbi, wallet);

  const formattedHash = hashHex.startsWith("0x") ? hashHex : `0x${hashHex}`;
  const tx = await contract.registerGarment(pid, formattedHash);
  const receipt = await tx.wait(1);

  return { txHash: receipt.hash ?? tx.hash };
}

/**
 * Read garment hash, timestamp, and registrant from chain.
 * Returns null if the garment is not registered (timestamp == 0).
 */
export async function readFromChain(pid: string): Promise<ChainRecord | null> {
  const mode = process.env.CHAIN_MODE ?? "mock";

  if (mode === "mock") {
    console.warn(`[MOCK CHAIN] readFromChain called for PID: ${pid}`);
    const storage = getMockStorage();
    const record = storage[pid];
    if (!record) {
      return null;
    }
    return {
      hashHex: record.hashHex,
      timestamp: record.timestamp,
      registrant: record.registrant,
    };
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    throw new Error("Real chain configuration missing: check SEPOLIA_RPC_URL and CONTRACT_ADDRESS");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, GarmentPassportAbi, provider);

  const result = await contract.getGarment(pid);
  const [dataHashBytes32, timestampBigInt, registrantAddress] = result as [string, bigint, string];

  const timestamp = Number(timestampBigInt);
  if (timestamp === 0) {
    return null;
  }

  const cleanHash = dataHashBytes32.toLowerCase().replace(/^0x/, "");
  return {
    hashHex: cleanHash,
    timestamp,
    registrant: registrantAddress,
  };
}
