import Link from "next/link";
import { site, centers } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-[0.18em]">PONGS</span>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-mist">India</span>
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
      <div className="border-t border-white/10 py-6 text-center text-xs text-paper/40">
        © {new Date().getFullYear()} PONGS India · DESCOR®, PONGS® and PRINTERIEUR® are registered trademarks of PONGS® Group, Germany.
      </div>
    </footer>
  );
}
