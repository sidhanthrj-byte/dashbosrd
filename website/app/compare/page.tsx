import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Section, SectionHead, CTA } from "@/components/ui";
import { comparison } from "@/lib/data";

export const metadata: Metadata = {
  title: "DESCOR® vs Gypsum, POP, PVC Stretch & Acoustic Panels",
  description:
    "An honest, side-by-side comparison of DESCOR® textile stretch ceilings against gypsum board, POP, PVC stretch ceilings and acoustic panels for Indian projects.",
};

export default function ComparePage() {
  return (
    <>
      <Section dark tight>
        <SectionHead
          eyebrow="The honest comparison"
          title="Put us next to anything. That's the point."
          lead="Gypsum and POP are fine materials — for the 1990s brief. Here is exactly where a German textile system wins, line by line, so you can judge for yourself. Bring this table to your contractor."
        />
      </Section>

      <Section>
        <div className="overflow-x-auto rounded-2xl border border-ink/10">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="bg-ink text-paper">
                <th className="px-5 py-4 font-semibold">Criterion</th>
                {comparison.columns.map((c, i) => (
                  <th key={c} className={`px-5 py-4 font-semibold ${i === 0 ? "text-brass-2" : "text-paper/70"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {comparison.rows.map((row) => (
                <tr key={row.label} className="align-top">
                  <td className="px-5 py-4 font-bold">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className={`px-5 py-4 ${i === 0 ? "bg-brass/5 font-medium" : "opacity-65"}`}>
                      {i === 0 && <Check size={14} className="mb-1 text-brass" />}
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl bg-paper-2 p-8">
            <h3 className="text-lg font-bold">A note on cost — the honest version.</h3>
            <p className="mt-3 text-sm leading-relaxed opacity-70">
              Per square foot, DESCOR® costs more than gypsum or POP on day
              one. But a gypsum ceiling is repainted every 3–5 years, patched
              at cracks, and redone entirely when it sags or fungus sets in.
              Over 15 years, the textile ceiling — zero paint, zero cracks,
              zero redo — is routinely the cheaper ceiling. And it was
              installed in a day, in your furnished space.
            </p>
          </div>
          <div className="rounded-2xl bg-ink p-8 text-paper">
            <h3 className="text-lg font-bold">vs PVC stretch ceilings, specifically.</h3>
            <p className="mt-3 text-sm leading-relaxed text-paper/70">
              Most "stretch ceilings" sold in India are PVC membranes,
              heat-shrunk on site with gas guns. DESCOR® is a woven polyester
              textile: no PVC, no plasticisers, no on-site heating, no glossy
              plastic look, wider seamless spans, and Class-A acoustics PVC
              physically cannot achieve. Same category, different league.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <CTA href="/contact#quote">Get a like-for-like quote for your project</CTA>
        </div>
      </Section>
    </>
  );
}
