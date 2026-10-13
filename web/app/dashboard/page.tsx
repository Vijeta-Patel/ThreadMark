import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { formatUtc } from "@/lib/format";
import { listGarments } from "@/lib/garments-store";
import { makeQrDataUrl } from "@/lib/qr"; // owned by Aditi (QR helper)
import type { GarmentRow, GarmentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Registered garments · ThreadMark" };

const STATUS_STYLE: Record<GarmentStatus, string> = {
  confirmed: "border-green-600 text-green-700",
  pending: "border-gray-500 text-gray-600",
  failed: "border-red-600 text-red-700",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Registered garments</h1>
        <Link href="/register" className="rounded border border-gray-500 px-3 py-1.5">
          Register a garment
        </Link>
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <GarmentList />
      </Suspense>
    </main>
  );
}

/** The auth contract takes a Request, so rebuild one from the incoming headers. */
async function currentUserId(): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const request = new Request(`${base}/dashboard`, { headers: await headers() });
  return (await requireUser(request)).id;
}

async function GarmentList() {
  let userId: string | null;
  try {
    userId = await currentUserId();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return (
        <p role="alert">
          Please log in to continue.{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      );
    }
    throw error;
  }

  let rows: GarmentRow[];
  try {
    rows = await listGarments({ createdBy: userId });
  } catch (error) {
    console.error("[dashboard]", error instanceof Error ? error.message : "unknown error");
    return <p role="alert">Could not load garments. Please try again.</p>;
  }
  if (rows.length === 0) return <p>No garments registered yet.</p>;

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const items = await Promise.all(
    rows.map(async (row) => ({
      row,
      // Only confirmed garments have a usable passport, so only they get a QR code.
      qr: row.status === "confirmed" ? await makeQrDataUrl(row.qr_ref ?? `${base}/verify/${row.pid}`) : null,
    })),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-500">
            <th className="p-2">Product ID</th>
            <th className="p-2">SKU</th>
            <th className="p-2">Brand</th>
            <th className="p-2">Status</th>
            <th className="p-2">Registered on</th>
            <th className="p-2">QR code</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ row, qr }) => (
            <tr key={row.pid} className="border-b border-gray-700">
              <td className="p-2 font-mono">
                {row.status === "confirmed" ? (
                  <Link href={`/verify/${row.pid}`} className="underline">
                    {row.pid}
                  </Link>
                ) : (
                  row.pid
                )}
              </td>
              <td className="p-2">{row.sku}</td>
              <td className="p-2">{row.brand}</td>
              <td className="p-2">
                <span className={`rounded border px-2 py-0.5 ${STATUS_STYLE[row.status]}`}>{row.status}</span>
              </td>
              <td className="p-2">{formatUtc(row.registered_at)}</td>
              <td className="p-2">
                {qr ? (
                  <a href={qr} download={`ThreadMark-${row.pid}.png`} className="underline">
                    Download QR
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
