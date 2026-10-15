"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEntryPage() {
  const [pid, setPid] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = pid.trim();
    if (trimmed) {
      router.push(`/verify/${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-12 pb-20">
      <div className="card">
        <h1 className="display text-2xl font-bold">Verify Garment</h1>
        <p className="mt-3 text-sm text-gray-600">
          Scan the QR code on the garment, or enter a Product ID
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="pid" className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Product ID
            </label>
            <input
              id="pid"
              type="text"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              placeholder="e.g. TM-SEED000001"
              required
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <button type="submit" className="pill pill-solid w-full">
            Verify Garment
          </button>
        </form>
      </div>
    </main>
  );
}