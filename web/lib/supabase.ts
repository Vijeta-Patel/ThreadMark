import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_BUCKET } from "./storage";

// Server-side Supabase client using the service-role key.
// Import this only from server code (route handlers, server components).
// The key lives in SUPABASE_SERVICE_ROLE_KEY, which has no NEXT_PUBLIC_ prefix,
// so Next.js never sends it to the browser.

export { IMAGE_BUCKET };

let client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Public URL of an image stored in the `garment-images` bucket, or null if there is none. */
export function imagePublicUrl(imageRef: string | null | undefined): string | null {
  if (!imageRef) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const path = imageRef.split("/").map(encodeURIComponent).join("/");
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
