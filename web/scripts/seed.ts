import fs from "node:fs";
import path from "node:path";
import { computeHash } from "../lib/hash";
import { registerOnChain, readFromChain } from "../lib/chain";
import { getServerSupabase } from "../lib/supabase";
import type { GarmentRow } from "../lib/types";

interface SeedRecord {
  pid: string;
  sku: string;
  brand: string;
  fabric: string;
  origin: string;
  manufacturingDate: string;
  imageRef?: string | null;
  alteredField?: Partial<Record<string, string>>;
}

export async function runSeed(): Promise<void> {
  const fixturePath = path.join(__dirname, "../fixtures/garments.seed.json");
  const seedsRaw = fs.readFileSync(fixturePath, "utf-8");
  const seeds: SeedRecord[] = JSON.parse(seedsRaw);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  let supabase;
  try {
    supabase = getServerSupabase();
  } catch (err) {
    console.warn("[SEED] Warning: Supabase client could not be initialized:", err instanceof Error ? err.message : err);
    console.warn("[SEED] Skipping database upsert. On-chain seeding will still proceed if configured.");
  }

  for (const item of seeds) {
    console.log(`\n[SEED] Processing ${item.pid} (${item.sku})...`);

    // 1. Compute original hash
    const originalHash = computeHash({
      brand: item.brand,
      sku: item.sku,
      fabric: item.fabric,
      origin: item.origin,
      manufacturingDate: item.manufacturingDate,
    });

    let txHash: string | null = null;

    // 2. Register on chain if required (TM-SEED000001 and TM-SEED000002)
    // TM-SEED000003 is explicitly off-chain only (never on chain)
    if (item.pid !== "TM-SEED000003") {
      try {
        const existingChain = await readFromChain(item.pid);
        if (!existingChain) {
          const res = await registerOnChain(item.pid, originalHash);
          txHash = res.txHash;
          console.log(`[SEED] Registered ${item.pid} on chain with txHash: ${txHash}`);
        } else {
          console.log(`[SEED] ${item.pid} already exists on chain.`);
        }
      } catch (chainErr) {
        console.error(`[SEED] Chain registration error for ${item.pid}:`, chainErr);
      }
    } else {
      console.log(`[SEED] Skipping chain registration for ${item.pid} (off-chain only seed).`);
    }

    // 3. Database upsert
    if (supabase) {
      // For TM-SEED000002, apply the altered field to the database row
      const effectiveFabric = item.alteredField?.fabric ?? item.fabric;
      const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/verify/${item.pid}`;

      const dbRow: Partial<GarmentRow> = {
        pid: item.pid,
        sku: item.sku,
        brand: item.brand,
        fabric: effectiveFabric,
        origin: item.origin,
        manufacturing_date: item.manufacturingDate,
        image_ref: item.imageRef ?? null,
        sha256_hash: originalHash,
        tx_hash: txHash,
        status: "confirmed",
        qr_ref: verifyUrl,
      };

      const { error } = await supabase
        .from("garments")
        .upsert(dbRow, { onConflict: "pid" });

      if (error) {
        console.error(`[SEED] Database upsert failed for ${item.pid}:`, error.message);
      } else {
        console.log(`[SEED] Successfully stored ${item.pid} in Supabase.`);
      }
    }
  }

  console.log("\n[SEED] Seeding finished successfully.");
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes("seed")) {
  runSeed().catch((err) => {
    console.error("[SEED] Fatal error:", err);
    process.exit(1);
  });
}
