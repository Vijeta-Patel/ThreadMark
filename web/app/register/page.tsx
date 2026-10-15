import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register a garment · ThreadMark" };

export default function RegisterPage() {
  return (
    <main className="px-5 pt-12 md:pt-20">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="tag mb-4">Manufacturer</p>
          <h1 className="display text-5xl md:text-7xl">
            Register a <em>garment</em>
          </h1>
          <p className="mt-6 max-w-sm">
            Enter the details once. We fingerprint them, record the fingerprint on the blockchain and give you a QR code
            for the label.
          </p>
        </div>
        <Suspense fallback={<p>Loading…</p>}>
          <RegisterGate />
        </Suspense>
      </div>
    </main>
  );
}

/** Logged-out visitors get the login prompt instead of a form that can only fail with 401. */
async function RegisterGate() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  try {
    await requireUser(new Request(`${base}/register`, { headers: await headers() }));
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
  return <RegisterForm />;
}
