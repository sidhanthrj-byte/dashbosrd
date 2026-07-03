"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { getAudience, setAudience, type Audience } from "@/lib/audience";

const nav = [
  { href: "/projects", label: "Projects" },
  { href: "/compare", label: "Why DESCOR®" },
  { href: "/contact", label: "Contact" },
];

function PersonaSwitch({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [audience, setLocal] = useState<Audience | null>(null);

  useEffect(() => {
    setLocal(getAudience());
    const sync = () => setLocal(getAudience());
    window.addEventListener("pongs-audience", sync);
    return () => window.removeEventListener("pongs-audience", sync);
  }, [pathname]);

  const active =
    pathname === "/for-homeowners" ? "homeowner" : pathname === "/for-architects" ? "architect" : audience;

  const pick = (a: Audience) => {
    setAudience(a);
    setLocal(a);
    onNavigate?.();
  };

  return (
    <div className="flex items-center rounded-full border border-white/20 p-1 text-[12px] font-semibold">
      <Link
        href="/for-homeowners"
        onClick={() => pick("homeowner")}
        className={`rounded-full px-4 py-1.5 transition-colors ${
          active === "homeowner" ? "bg-paper text-ink" : "text-paper/70 hover:text-paper"
        }`}
      >
        Homeowner
      </Link>
      <Link
        href="/for-architects"
        onClick={() => pick("architect")}
        className={`rounded-full px-4 py-1.5 transition-colors ${
          active === "architect" ? "bg-paper text-ink" : "text-paper/70 hover:text-paper"
        }`}
      >
        Architect
      </Link>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 text-paper backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="display text-xl font-bold tracking-[0.16em]">PONGS</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-paper/60">India</span>
        </Link>

        <div className="hidden lg:block">
          <PersonaSwitch />
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] font-medium tracking-wide transition-colors hover:text-paper ${
                pathname === item.href ? "text-paper underline underline-offset-8" : "text-paper/70"
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

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-ink px-5 pb-6 pt-4 lg:hidden">
          <PersonaSwitch onNavigate={() => setOpen(false)} />
          <div className="mt-3">
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
          </div>
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
