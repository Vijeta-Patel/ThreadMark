import { requireUser, UnauthorizedError } from "@/lib/auth";
import { registerOnChain } from "@/lib/chain"; // owned by Aditi (chain client)
import { makeQrDataUrl } from "@/lib/qr"; // owned by Aditi (QR helper)
import { findGarmentBySku, insertGarment, updateGarment } from "@/lib/garments-store";
import { generatePid } from "@/lib/pid";
import { registerGarment } from "@/lib/register-garment";

export async function POST(request: Request) {
  let userId: string | null;
  try {
    userId = (await requireUser(request)).id;
  } catch (error) {
    if (error instanceof UnauthorizedError) return Response.json({ error: "unauthorized" }, { status: 401 });
    throw error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined; // not valid JSON: reported as a validation error
  }

  try {
    const result = await registerGarment(
      {
        store: { findGarmentBySku, insertGarment, updateGarment },
        chain: { registerOnChain },
        makeQrDataUrl,
        generatePid,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
      },
      userId,
      body,
    );
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error("[POST /api/garments]", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
