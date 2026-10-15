import { NextResponse } from "next/server";
import { computeHash } from "@/lib/hash";
import { readFromChain } from "@/lib/chain";
import { getGarmentByPid } from "@/lib/garments-store";
import { imagePublicUrl } from "@/lib/supabase";
import type { VerifyResponse } from "@/lib/types";

// Public verification API specified in project requirements, section 9.6:
// GET /api/products/verify/[pid]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pid: string }> }
) {
  try {
    const { pid } = await params;

    if (!pid || pid.trim().length === 0) {
      return NextResponse.json<VerifyResponse>({ status: "not_found", pid: "" }, { status: 404 });
    }

    let garmentRow;
    try {
      garmentRow = await getGarmentByPid(pid);
    } catch (err) {
      console.warn(`[GET /api/products/verify/${pid}] Store lookup error:`, err instanceof Error ? err.message : err);
      garmentRow = null;
    }

    if (!garmentRow) {
      return NextResponse.json<VerifyResponse>({ status: "not_found", pid }, { status: 404 });
    }

    // 1. Recompute the hash from the stored row using lib/hash.ts
    const currentHash = computeHash({
      brand: garmentRow.brand,
      sku: garmentRow.sku,
      fabric: garmentRow.fabric,
      origin: garmentRow.origin,
      manufacturingDate: garmentRow.manufacturing_date,
    });

    // 2. Read on-chain hash
    const chainRecord = await readFromChain(pid);
    const onChainHash = chainRecord?.hashHex ?? null;

    // 3. Compare hashes: verified only if onChainHash exists and matches currentHash
    const isVerified = onChainHash !== null && onChainHash.toLowerCase() === currentHash.toLowerCase();
    const verificationStatus = isVerified ? "verified" : "failed";

    const imageUrl = garmentRow.image_ref ? imagePublicUrl(garmentRow.image_ref) : null;

    const responseBody: VerifyResponse = {
      status: verificationStatus,
      pid: garmentRow.pid,
      product: {
        brand: garmentRow.brand,
        sku: garmentRow.sku,
        fabric: garmentRow.fabric,
        origin: garmentRow.origin,
        manufacturingDate: garmentRow.manufacturing_date,
        imageUrl,
      },
      hash: {
        current: currentHash,
        onChain: onChainHash,
      },
      txHash: chainRecord ? (garmentRow.tx_hash ?? null) : null,
      registeredAt: garmentRow.registered_at,
    };

    return NextResponse.json<VerifyResponse>(responseBody, { status: 200 });
  } catch (error) {
    console.error("[GET /api/products/verify/[pid]] Internal error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}