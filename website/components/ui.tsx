import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function Section({
  children,
  dark = false,
  tight = false,
  muted = false,
}: {
  children: ReactNode;
  dark?: boolean;
  tight?: boolean;
  muted?: boolean;
}) {
  return (
    <section
      className={`${dark ? "on-dark bg-ink text-paper" : muted ? "bg-paper-2" : ""} ${
        tight ? "py-14" : "py-20 md:py-28"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-12 max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display mt-4 text-3xl md:text-5xl">{title}</h2>
      {lead && <p className="mt-5 text-base leading-relaxed opacity-70 md:text-lg">{lead}</p>}
    </div>
  );
}

export function CTA({
  href,
  children,
  ghost = false,
}: {
  href: string;
  children: ReactNode;
  ghost?: boolean;
}) {
  return (
    <Link href={href} className={ghost ? "btn-ghost" : "btn-solid"}>
      {children} <ArrowRight size={16} />
    </Link>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((f) => (
        <details key={f.q} className="faq group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold md:text-lg">
            {f.q}
            <span className="text-2xl font-light text-mist transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed opacity-70 md:text-base">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
