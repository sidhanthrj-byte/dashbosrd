"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Indicative 15-year cost model. Rates are editable defaults, shown to the
// user as assumptions — not a quotation.
const MODEL = {
  descor: { install: 350, repaintEvery: 0, repaint: 0, redoChance: 0 },
  gypsum: { install: 100, repaintEvery: 4, repaint: 30, redoChance: 0.4 },
  pop: { install: 70, repaintEvery: 4, repaint: 30, redoChance: 0.6 },
};

function lifetime(m: { install: number; repaintEvery: number; repaint: number; redoChance: number }, area: number, years = 15) {
  const repaints = m.repaintEvery ? Math.floor(years / m.repaintEvery) : 0;
  return Math.round(area * (m.install + repaints * m.repaint + m.redoChance * m.install));
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

export function CostCalculator() {
  const [area, setArea] = useState(400);

  const rows = [
    ["DESCOR® textile", lifetime(MODEL.descor, area), "Installed once. No paint, no cracks, no redo."],
    ["Gypsum ceiling", lifetime(MODEL.gypsum, area), "Repaint ~every 4 yrs; joints crack; partial redo common."],
    ["POP ceiling", lifetime(MODEL.pop, area), "Repaint ~every 4 yrs; cracking & fungus risk in humidity."],
  ] as const;

  const best = Math.min(...rows.map((r) => r[1] as number));

  return (
    <div className="rounded-2xl border border-ink/10 p-8 md:p-10">
      <p className="eyebrow">Interactive · 15-year cost of ownership</p>
      <h3 className="display mt-3 text-2xl md:text-3xl">What does your ceiling really cost?</h3>
      <div className="mt-8">
        <label className="flex items-baseline justify-between text-sm font-semibold">
          Ceiling area
          <span className="display text-2xl">{area} sq ft</span>
        </label>
        <input
          type="range"
          min={100}
          max={3000}
          step={50}
          value={area}
          onChange={(e) => setArea(Number(e.target.value))}
          className="mt-3 w-full accent-black"
        />
      </div>
      <div className="mt-8 space-y-3">
        {rows.map(([name, cost, note]) => (
          <div
            key={name}
            className={`flex flex-wrap items-baseline justify-between gap-2 rounded-xl px-5 py-4 ${
              cost === best ? "bg-ink text-paper" : "bg-paper-2"
            }`}
          >
            <div>
              <div className="font-bold">{name}</div>
              <div className={`text-xs ${cost === best ? "text-paper/60" : "opacity-55"}`}>{note}</div>
            </div>
            <div className="display text-xl md:text-2xl">{fmt(cost as number)}</div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-relaxed opacity-50">
        Indicative model: DESCOR® ₹350/sq ft installed; gypsum ₹100 + ₹30/sq ft
        repaint every 4 years + 40% partial-redo allowance; POP ₹70 + repaints +
        60% redo allowance. Your actual quote depends on fabric, site and design
        — get exact numbers below.
      </p>
      <Link href="/contact#quote" className="btn-solid mt-6">
        Get an exact quote for {area} sq ft <ArrowRight size={16} />
      </Link>
    </div>
  );
}
