"use client";

import { useState } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { site } from "@/lib/data";

// 3-step instant estimate. Indicative ranges (₹/sq ft installed) — the
// numbers are deliberately conservative and always framed as a range.
const ROOMS = [
  { id: "living", label: "Living / Dining", icon: "🛋️" },
  { id: "bedroom", label: "Bedroom", icon: "🛏️" },
  { id: "theatre", label: "Home Theatre", icon: "🎬" },
  { id: "office", label: "Office / Studio", icon: "💼" },
  { id: "commercial", label: "Restaurant / Retail", icon: "🍽️" },
  { id: "auditorium", label: "Auditorium / Hall", icon: "🎭" },
] as const;

const FINISHES = [
  { id: "matte", label: "Seamless Matte", desc: "The classic DESCOR® PREMIUM look", rate: [300, 420] },
  { id: "acoustic", label: "Acoustic", desc: "Silence built in — αw 0.90", rate: [420, 600] },
  { id: "backlit", label: "Backlit Light Ceiling", desc: "Translucent fabric + LED field", rate: [550, 850] },
  { id: "printed", label: "Printed Artwork", desc: "PRINTERIEUR® edge-to-edge print", rate: [480, 700] },
] as const;

const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function EstimateWizard() {
  const [step, setStep] = useState(0);
  const [room, setRoom] = useState<(typeof ROOMS)[number] | null>(null);
  const [area, setArea] = useState(200);
  const [finish, setFinish] = useState<(typeof FINISHES)[number] | null>(null);

  const reset = () => {
    setStep(0);
    setRoom(null);
    setFinish(null);
    setArea(200);
  };

  const lo = finish ? area * finish.rate[0] : 0;
  const hi = finish ? area * finish.rate[1] : 0;

  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    `Hi PONGS INDIA! Instant estimate request:\nSpace: ${room?.label}\nArea: ~${area} sq ft\nFinish: ${finish?.label}\nEstimated range shown: ${fmt(lo)} – ${fmt(hi)}\nPlease confirm with an exact quote.`
  )}`;

  return (
    <div className="on-dark overflow-hidden rounded-3xl bg-ink text-paper">
      <div className="flex items-center justify-between border-b border-white/10 px-7 py-5 md:px-10">
        <div>
          <p className="eyebrow !text-paper/50">Interactive · 60-second estimate</p>
          <h3 className="display mt-1 text-xl md:text-2xl">Build your ceiling</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i <= step ? "w-6 bg-paper" : "w-3 bg-paper/25"}`}
            />
          ))}
        </div>
      </div>

      <div className="p-7 md:p-10">
        {step === 0 && (
          <>
            <p className="text-sm text-paper/60">Step 1 — What space are we transforming?</p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRoom(r);
                    setStep(1);
                  }}
                  className="group rounded-2xl border border-white/15 p-5 text-left transition-all hover:border-paper hover:bg-paper hover:text-ink"
                >
                  <span className="text-2xl">{r.icon}</span>
                  <div className="mt-3 text-sm font-semibold">{r.label}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-paper/60">
              Step 2 — Roughly how big is the {room?.label.toLowerCase()} ceiling?
            </p>
            <div className="mt-10 text-center">
              <div className="display text-6xl md:text-7xl">{area}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.25em] text-paper/50">square feet</div>
            </div>
            <input
              type="range"
              min={50}
              max={room?.id === "auditorium" || room?.id === "commercial" ? 10000 : 1500}
              step={25}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="mt-8 w-full text-paper"
            />
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-paper/40">
              <span>50</span>
              <span>{room?.id === "auditorium" || room?.id === "commercial" ? "10,000" : "1,500"}</span>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-solid">
                Next — pick a finish
              </button>
            </div>
          </>
        )}

        {step === 2 && !finish && (
          <>
            <p className="text-sm text-paper/60">Step 3 — Which look do you love?</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFinish(f)}
                  className="rounded-2xl border border-white/15 p-5 text-left transition-all hover:border-paper hover:bg-paper hover:text-ink"
                >
                  <div className="text-sm font-bold">{f.label}</div>
                  <div className="mt-1 text-xs opacity-60">{f.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && finish && (
          <div className="text-center">
            <p className="eyebrow !text-paper/50">
              {room?.label} · {area} sq ft · {finish.label}
            </p>
            <div className="display mt-4 text-4xl md:text-6xl">
              {fmt(lo)} <span className="text-paper/40">–</span> {fmt(hi)}
            </div>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-paper/50">
              Indicative installed range including track, fabric and standard
              integration. Exact pricing depends on site, design and fixtures —
              lock it in with a free measurement.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href={wa} target="_blank" rel="noreferrer" className="btn-solid">
                <MessageCircle size={16} /> Get exact quote on WhatsApp
              </a>
              <button onClick={reset} className="btn-ghost">
                <RotateCcw size={15} /> Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
