"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Ruler, Home } from "lucide-react";
import { getAudience, setAudience, type Audience } from "@/lib/audience";
import { img } from "@/lib/data";

// Full-screen entry choice. Shown once on the landing page; the pick is
// remembered and drives the header persona switch.
export function AudienceGate() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getAudience()) setOpen(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const choose = (a: Audience, href?: string) => {
    setAudience(a);
    setLeaving(true);
    if (href) {
      router.push(href);
      // keep the veil up briefly so the transition feels intentional
      setTimeout(() => setOpen(false), 700);
    } else {
      setTimeout(() => setOpen(false), 350);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-ink transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Choose how you want to explore PONGS INDIA"
    >
      <div className="flex items-center justify-between px-6 py-5 text-paper md:px-10">
        <div className="flex items-baseline gap-2">
          <span className="display text-xl font-bold tracking-[0.18em]">PONGS</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-paper/60">India</span>
        </div>
        <p className="hidden text-[11px] uppercase tracking-[0.28em] text-paper/50 sm:block">
          German textile ceilings & walls
        </p>
      </div>

      <p className="px-6 pb-5 text-center text-sm text-paper/70 md:px-10 md:text-base">
        Welcome. Tell us who you are — we&apos;ll show you exactly what matters to you.
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 md:flex-row">
        {/* Homeowner panel */}
        <button
          onClick={() => choose("homeowner", "/for-homeowners")}
          className="gate-panel group relative overflow-hidden rounded-2xl text-left"
        >
          <Image
            src={img.homeLiving}
            alt="A living room with a seamless textile ceiling"
            fill
            priority
            className="object-cover opacity-60 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-80"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-paper md:p-10">
            <Home size={26} className="text-paper/70" />
            <div className="eyebrow mt-4 !text-paper/60">I&apos;m building or renovating my home</div>
            <div className="display mt-2 text-3xl md:text-5xl">Homeowner</div>
            <p className="mt-3 max-w-md text-sm text-paper/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:text-base">
              Beautiful, healthy ceilings installed in a day — no dust, no cracks, no repainting. Ever.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Enter <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
            </span>
          </div>
        </button>

        {/* Architect panel */}
        <button
          onClick={() => choose("architect", "/for-architects")}
          className="gate-panel group relative overflow-hidden rounded-2xl text-left"
        >
          <Image
            src={img.heroAuditorium}
            alt="DESCOR® acoustic ceiling in an auditorium"
            fill
            priority
            className="object-cover opacity-60 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-80"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-paper md:p-10">
            <Ruler size={26} className="text-paper/70" />
            <div className="eyebrow mt-4 !text-paper/60">I specify, design or build spaces</div>
            <div className="display mt-2 text-3xl md:text-5xl">Architect / Designer</div>
            <p className="mt-3 max-w-md text-sm text-paper/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:text-base">
              Full technical data, certifications, detailing and timelines — everything you need to specify.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Enter <ArrowRight size={16} className="transition-transform group-hover:translate-x-1.5" />
            </span>
          </div>
        </button>
      </div>

      <div className="pb-5 pt-3 text-center">
        <button
          onClick={() => choose("explorer")}
          className="text-xs uppercase tracking-[0.22em] text-paper/40 underline-offset-4 transition-colors hover:text-paper hover:underline"
        >
          Just exploring — show me everything
        </button>
      </div>
    </div>
  );
}
