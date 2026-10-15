"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

// Shown only while a merchant is signed in (the sb-access-token cookie set at login).
export function LogoutButton() {
  const router = useRouter();
  // Re-read on every render (the header re-renders on each navigation); false on the server.
  const signedIn = useSyncExternalStore(noSubscribe, hasSessionCookie, () => false);

  if (!signedIn) return null;

  async function logout() {
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    try {
      await getBrowserSupabase().auth.signOut();
    } catch {
      // The cookie is already gone, which is what the server checks.
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className="link text-xs tracking-wider uppercase hover:underline underline-offset-4">
      Log out
    </button>
  );
}

function noSubscribe() {
  return () => {};
}

function hasSessionCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith("sb-access-token="));
}
