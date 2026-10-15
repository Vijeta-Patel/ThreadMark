"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

// Merchant (manufacturer) email + password login. Accounts are created by hand in Supabase.
export function MerchantLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = getBrowserSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Set access token cookie so server routes can verify it
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        router.push("/register");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="merchant-heading" className="w-full max-w-sm">
      <p className="tag mb-3">For merchants</p>
      <h2 id="merchant-heading" className="display text-4xl">
        Merchant <em>login</em>
      </h2>
      <p className="mt-2 text-sm">Register garments, upload photos and print QR labels.</p>

      {errorMsg && (
        <p role="alert" className="status status-failed mt-4 normal-case">
          {errorMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="block">
          <span className="tag">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field"
          />
        </label>
        <label className="block">
          <span className="tag">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field"
          />
        </label>
        <button type="submit" disabled={loading} className="pill pill-solid mt-2 self-start">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
