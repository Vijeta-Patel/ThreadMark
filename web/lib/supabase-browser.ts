import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser Supabase client using the public anon key. Used for uploading garment
// images straight to Storage with the logged-in manufacturer's session.
// When real login lands (P2-B2), the login owner may swap the internals for the
// cookie-based client from @supabase/ssr; keep this function's name and return type.

let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  client = createClient(url, key);
  return client;
}
