import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatUtc } from "@/lib/format";
import { computeHash } from "@/lib/hash";
import { readFromChain } from "@/lib/chain";
import { getGarmentByPid } from "@/lib/garments-store";
import { imagePublicUrl } from "@/lib/supabase";
import type { VerifyResponse } from "@/lib/types";

interface VerifyPageProps {
  params: Promise<{ pid: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { pid } = await params;
  return {
    title: `Verify ${pid} · ThreadMark`,
  };
}

async function getVerificationData(pid: string): Promise<VerifyResponse> {
  let garmentRow;
  try {
    garmentRow = await getGarmentByPid(pid);
  } catch (err) {
    console.warn(`[Verify Page ${pid}] Store lookup error:`, err instanceof Error ? err.message : err);
    garmentRow = null;
  }

  if (!garmentRow) {
    return { status: "not_found", pid };
  }

  const currentHash = computeHash({
    brand: garmentRow.brand,
    sku: garmentRow.sku,
    fabric: garmentRow.fabric,
    origin: garmentRow.origin,
    manufacturingDate: garmentRow.manufacturing_date,
  });

  const chainRecord = await readFromChain(pid);
  const onChainHash = chainRecord?.hashHex ?? null;

  const isVerified = onChainHash !== null && onChainHash.toLowerCase() === currentHash.toLowerCase();
  const verificationStatus = isVerified ? "verified" : "failed";
  const imageUrl = garmentRow.image_ref ? imagePublicUrl(garmentRow.image_ref) : null;

  return {
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
}

async function VerifyContent({ params }: VerifyPageProps) {
  const { pid } = await params;
  const result = await getVerificationData(pid);

  const explorerPrefix = process.env.NEXT_PUBLIC_EXPLORER_TX_URL ?? "";

  if (result.status === "not_found") {
    return (
      <section className="border border-gray-300 bg-gray-50 p-6 md:p-8">
        <p className="tag mb-3">Passport check</p>
        <h1 className="display text-4xl md:text-5xl">Product Not Found</h1>
        <p className="mt-3">No garment is registered with this Product ID.</p>
        <p className="tag mt-4">PID: {pid}</p>
        <Link href="/" className="pill mt-6">
          Scan another garment
        </Link>
      </section>
    );
  }

  const isVerified = result.status === "verified";
  const statusBannerClass = isVerified
    ? "border-2 border-green-600 bg-green-50 text-green-900"
    : "border-2 border-brand bg-red-50 text-brand";

  const statusHeading = isVerified ? "✓ PRODUCT VERIFIED" : "⚠ VERIFICATION FAILED";
  const statusMessage = isVerified
    ? "The product information matches the registered blockchain record."
    : "The product information does not match the registered blockchain record. Do not trust this product.";

  const product = result.product;
  const txUrl = result.txHash && explorerPrefix ? `${explorerPrefix.replace(/\/+$/, "")}/${result.txHash}` : null;

  // Passport labels in exact order per section 9.9:
  // Product ID, Brand, SKU, Fabric, Origin, Manufacturing date, Registered on, Blockchain transaction, Image
  const rows: Array<{ label: string; value: React.ReactNode; mono?: boolean }> = [
    { label: "Product ID", value: result.pid, mono: true },
    { label: "Brand", value: product.brand },
    { label: "SKU", value: product.sku, mono: true },
    { label: "Fabric", value: product.fabric },
    { label: "Origin", value: product.origin },
    { label: "Manufacturing date", value: product.manufacturingDate },
    { label: "Registered on", value: formatUtc(result.registeredAt) },
    {
      label: "Blockchain transaction",
      mono: true,
      value: result.txHash ? (
        txUrl ? (
          <a href={txUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {result.txHash}
          </a>
        ) : (
          result.txHash
        )
      ) : (
        <em>No blockchain record</em>
      ),
    },
  ];

  return (
    <>
      {/* 1. Status banner */}
      <section className={`p-6 md:p-8 ${statusBannerClass}`}>
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{statusHeading}</h1>
        <p className="mt-2">{statusMessage}</p>
      </section>

      {/* 2. Digital Product Passport */}
      <section className="mt-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="tag mb-3">ThreadMark</p>
          <h2 className="display text-4xl md:text-5xl">
            Digital Product <em>Passport</em>
          </h2>
          {product.imageUrl && (
            <div className="mt-6 border hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={`${product.brand} - ${product.sku}`} className="aspect-square w-full object-cover" />
            </div>
          )}
        </div>
        <dl>
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 border-t hairline py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="tag shrink-0">{row.label}</dt>
              <dd className={`break-all sm:text-right ${row.mono ? "font-mono text-sm" : ""}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Link href="/" className="pill mt-10">
        Scan another garment
      </Link>
    </>
  );
}

export default function VerifyPage(props: VerifyPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-10 pb-10 md:pt-16">
      <Suspense fallback={<p className="tag">Checking passport…</p>}>
        <VerifyContent {...props} />
      </Suspense>
    </main>
  );
}