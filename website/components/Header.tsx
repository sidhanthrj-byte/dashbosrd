"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";

const nav = [
  { href: "/for-architects", label: "For Architects & Designers" },
  { href: "/for-homeowners", label: "For Homeowners" },
  { href: "/projects", label: "Projects" },
  { href: "/compare", label: "Why DESCOR®" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-paper backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="text-xl font-bold tracking-[0.18em]">PONGS</span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-mist">India</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] font-medium tracking-wide transition-colors hover:text-paper ${
                pathname === item.href ? "text-paper" : "text-paper/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact#quote"
            className="rounded-full bg-paper px-5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-silver"
          >
            Get a Quote
          </Link>
        </nav>

        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-ink px-5 pb-6 pt-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/5 py-3 text-sm font-medium text-paper/90"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact#quote"
            onClick={() => setOpen(false)}
            className="mt-4 flex items-center justify-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink"
          >
            <Phone size={15} /> Get a Quote
          </Link>
        </nav>
      )}
    </header>
  );
}
