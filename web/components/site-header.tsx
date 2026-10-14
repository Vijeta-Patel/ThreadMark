"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { Wordmark } from "./wordmark";

const TAGLINE = "Garment authentication & Digital Product Passports";

/** Big wordmark on the home page, a compact bar everywhere else. */
export function SiteHeader() {
  const pathname = usePathname();
  const nav = (
    <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className={pathname === item.href ? "underline underline-offset-4" : "hover:underline underline-offset-4"}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  if (pathname === "/") {
    return (
      <header className="px-5 pt-5">
        <Link href="/" aria-label="ThreadMark home">
          <Wordmark className="block w-full" />
        </Link>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <p>{TAGLINE}</p>
          {nav}
        </div>
      </header>
    );
  }

  return (
    <header className="px-5 pt-5">
      <div className="grid items-baseline gap-2 border-b hairline pb-3 md:grid-cols-2">
        <Link href="/" className="text-2xl font-black tracking-tight">
          Thread<em className="font-normal">Mark</em>
        </Link>
        {nav}
      </div>
    </header>
  );
}
