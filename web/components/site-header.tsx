"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { NAV_ITEMS } from "./nav-items";
import { LogoutButton } from "./logout-button";
import { Wordmark } from "./wordmark";

function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`link text-xs tracking-wider uppercase transition-colors ${
            pathname === item.href ? "font-semibold underline underline-offset-4" : "hover:underline underline-offset-4"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// The landing page shows its own giant wordmark, so the header is left off there.
function HeaderBar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <header className="border-b hairline px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="ThreadMark home" className="shrink-0">
          <Wordmark className="block w-32 md:w-44" />
        </Link>
        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="h-4 w-32" />}>
            <HeaderNav />
          </Suspense>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <HeaderBar />
    </Suspense>
  );
}
