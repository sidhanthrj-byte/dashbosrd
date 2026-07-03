import Link from "next/link";
import { site, centers } from "@/lib/data";

export function Footer() {
  return (
    <footer className="on-dark overflow-hidden bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="display text-xl font-bold tracking-[0.16em]">PONGS</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-paper/60">India</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-paper/60">
            Official channel partner of PONGS® Germany for architectural
            textiles in India. DESCOR® textile stretch ceilings & walls —
            engineered in Mühltroff, installed across India.
          </p>
        </div>

        <div>
          <h4 className="eyebrow">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-paper/70">
            <li><Link className="hover:text-paper" href="/for-architects">For Architects & Designers</Link></li>
            <li><Link className="hover:text-paper" href="/for-homeowners">For Homeowners</Link></li>
            <li><Link className="hover:text-paper" href="/projects">Projects</Link></li>
            <li><Link className="hover:text-paper" href="/compare">DESCOR® vs Alternatives</Link></li>
            <li><Link className="hover:text-paper" href="/contact">Contact & Quick Quote</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow">Experience Centers</h4>
          <ul className="mt-4 space-y-2 text-sm text-paper/70">
            {centers.map((c) => (
              <li key={c.city}>
                {c.city}
                {c.city === "Bengaluru" && <span className="ml-2 text-[10px] uppercase tracking-wider text-mist">HQ</span>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow">Get in Touch</h4>
          <ul className="mt-4 space-y-2 text-sm text-paper/70">
            <li><a className="hover:text-paper" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></li>
            <li><a className="hover:text-paper" href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><a className="hover:text-paper" href={site.instagram} target="_blank" rel="noreferrer">Instagram @pongsindia</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div
          aria-hidden
          className="display -mb-[2vw] select-none whitespace-nowrap text-center text-[13.5vw] font-bold leading-none tracking-[-0.04em] text-paper/10"
        >
          PONGS INDIA
        </div>
      </div>
      <div className="relative border-t border-white/10 py-6 text-center text-xs text-paper/40">
        © {new Date().getFullYear()} PONGS INDIA · DESCOR®, PONGS® and PRINTERIEUR® are registered trademarks of PONGS® Group, Germany.
      </div>
    </footer>
  );
}
