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
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
        <p className="mt-2 text-sm text-gray-600">
          No garment is registered with this Product ID.
        </p>
        <div className="mt-4 text-xs font-mono text-gray-500">PID: {pid}</div>
        <div className="mt-6">
          <Link href="/verify" className="pill text-sm">
            Try another PID
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = result.status === "verified";
  const statusBannerClass = isVerified
    ? "border-green-500 bg-green-50 text-green-900"
    : "border-red-500 bg-red-50 text-red-900";

  const statusHeading = isVerified ? "✓ PRODUCT VERIFIED" : "⚠ VERIFICATION FAILED";
  const statusMessage = isVerified
    ? "The product information matches the registered blockchain record."
    : "The product information does not match the registered blockchain record. Do not trust this product.";

  const product = result.product;

  return (
    <>
      {/* 1. Status Banner */}
      <section className={`rounded-lg border-2 p-6 shadow-sm ${statusBannerClass}`}>
        <h1 className="text-xl font-bold tracking-tight">{statusHeading}</h1>
        <p className="mt-2 text-sm leading-relaxed">{statusMessage}</p>
      </section>

      {/* 2. Digital Product Passport Details */}
      <section className="card mt-6">
        <h2 className="display text-xl font-semibold">Digital Product Passport</h2>

        {/* Optional Image */}
        {product.imageUrl && (
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={`${product.brand} - ${product.sku}`}
              className="h-64 w-full object-cover"
            />
          </div>
        )}

        {/* Passport labels in exact order per section 9.9:
            Product ID, Brand, SKU, Fabric, Origin, Manufacturing date, Registered on, Blockchain transaction, Image */}
        <dl className="mt-6 divide-y divide-gray-100 text-sm">
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">Product ID</dt>
            <dd className="font-mono font-semibold text-gray-900">{result.pid}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">Brand</dt>
            <dd className="text-gray-900 font-medium">{product.brand}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">SKU</dt>
            <dd className="font-mono text-gray-900">{product.sku}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">Fabric</dt>
            <dd className="text-gray-900">{product.fabric}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">Origin</dt>
            <dd className="text-gray-900">{product.origin}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">Manufacturing date</dt>
            <dd className="text-gray-900">{product.manufacturingDate}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500 font-medium">Registered on</dt>
            <dd className="text-gray-900">{formatUtc(result.registeredAt)}</dd>
          </div>
          <div className="py-3 flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-gray-500 font-medium">Blockchain transaction</dt>
            <dd className="text-gray-900 font-mono text-xs break-all">
              {result.txHash ? (
                explorerPrefix ? (
                  <a
                    href={`${explorerPrefix.replace(/\/+$/, "")}/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {result.txHash}
                  </a>
                ) : (
                  <span>{result.txHash}</span>
                )
              ) : (
                <span className="text-gray-400 italic">No blockchain record</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 text-center">
        <Link href="/verify" className="text-xs text-gray-500 underline hover:text-black">
          ← Verify another garment
        </Link>
      </div>
    </>
  );
}

export default function VerifyPage(props: VerifyPageProps) {
  return (
    <main className="mx-auto max-w-lg px-5 pt-10 pb-20">
      <Suspense fallback={<p className="text-center text-sm text-gray-500">Checking passport...</p>}>
        <VerifyContent {...props} />
      </Suspense>
    </main>
  );
}