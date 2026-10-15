"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { NAV_ITEMS } from "./nav-items";
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
            pathname === item.href ? "text-red-700 font-semibold" : "text-gray-600 hover:text-black"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-gray-100 px-5 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Wordmark />
        </Link>
        <Suspense fallback={<div className="h-4 w-32" />}>
          <HeaderNav />
        </Suspense>
      </div>
    </header>
  );
}