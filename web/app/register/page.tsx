import type { Metadata } from "next";
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
        <RegisterForm />
      </div>
    </main>
  );
}
