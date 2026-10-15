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
  confirmed: "status",
  pending: "status status-pending",
  failed: "status status-failed",
};

export default function DashboardPage() {
  return (
    <main className="px-5 pt-12 md:pt-20">
      <p className="tag mb-4">Manufacturer</p>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-5xl md:text-7xl">
          Registered <em>garments</em>
        </h1>
        <Link href="/register" className="pill pill-solid">
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
          <Link href="/" className="underline underline-offset-4">
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
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="tag border-b border-brand">
            <th className="py-2 pr-4 font-normal">Product ID</th>
            <th className="py-2 pr-4 font-normal">SKU</th>
            <th className="py-2 pr-4 font-normal">Brand</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            <th className="py-2 pr-4 font-normal">Registered on</th>
            <th className="py-2 font-normal">QR code</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ row, qr }) => (
            <tr key={row.pid} className="border-b hairline">
              <td className="py-3 pr-4 font-mono">
                {row.status === "confirmed" ? (
                  <Link href={`/verify/${row.pid}`} className="underline underline-offset-4">
                    {row.pid}
                  </Link>
                ) : (
                  row.pid
                )}
              </td>
              <td className="py-3 pr-4">{row.sku}</td>
              <td className="py-3 pr-4">{row.brand}</td>
              <td className="py-3 pr-4">
                <span className={STATUS_STYLE[row.status]}>{row.status}</span>
              </td>
              <td className="py-3 pr-4">{formatUtc(row.registered_at)}</td>
              <td className="py-3 pr-4">
                {qr ? (
                  <a href={qr} download={`ThreadMark-${row.pid}.png`} className="underline underline-offset-4">
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
