import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register a garment · ThreadMark" };

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-semibold">Register a garment</h1>
      <RegisterForm />
    </main>
  );
}
