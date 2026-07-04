"use client";

import { useEffect, useRef, useState } from "react";

// Animated cross-section of a DESCOR® installation:
// 1 slab · 2 perimeter profile · 3 fabric tensioning (sag → taut) · 4 light on.
const STEPS = [
  { t: "The room as it is", d: "Any substrate — RCC slab, existing false ceiling, even walls. Nothing is demolished." },
  { t: "Slim aluminium profile", d: "The DESCOR® track is fixed around the perimeter — as little as 20 mm below the slab." },
  { t: "One piece of fabric, tensioned", d: "The seamless textile is spatula-tucked into the track. No heat, no glue, no wet work." },
  { t: "Lights on. Done in a day.", d: "Fixtures trim in with backing rings. Perfectly flat — and it stays that way for decades." },
] as const;

export function InstallAnimation() {
  const [step, setStep] = useState(0);
  const [sag, setSag] = useState(0); // 0 = hidden, 1 = full sag, 0.02 = taut
  const raf = useRef(0);

  // auto-advance until the user interacts
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2600);
    return () => clearInterval(id);
  }, [auto]);

  // animate fabric sag towards target for current step
  useEffect(() => {
    const target = step < 2 ? 1 : 0.03;
    const tick = () => {
      setSag((s) => {
        const next = s + (target - s) * 0.08;
        if (Math.abs(next - target) < 0.005) return target;
        raf.current = requestAnimationFrame(tick);
        return next;
      });
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [step]);

  const fabricVisible = step >= 2;
  const profileVisible = step >= 1;
  const lightsOn = step >= 3;
  const sagDepth = 90 * sag;

  return (
    <div className="on-dark overflow-hidden rounded-3xl bg-ink text-paper">
      <div className="relative">
        <svg viewBox="0 0 800 340" className="block w-full" role="img" aria-label="DESCOR installation cross-section">
          {/* room glow when lights on */}
          <rect
            x="0"
            y="120"
            width="800"
            height="220"
            fill="url(#roomGlow)"
            opacity={lightsOn ? 1 : 0}
            style={{ transition: "opacity 0.9s ease" }}
          />
          <defs>
            <linearGradient id="roomGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <pattern id="hatch" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* concrete slab */}
          <rect x="40" y="24" width="720" height="46" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" />
          <rect x="40" y="24" width="720" height="46" fill="url(#hatch)" />
          <text x="52" y="54" fill="rgba(255,255,255,0.5)" fontSize="13" fontFamily="monospace">
            RCC SLAB
          </text>

          {/* services above (duct) */}
          <rect x="330" y="82" width="150" height="26" rx="4" fill="none" stroke="rgba(255,255,255,0.25)" strokeDasharray="5 5" />
          <text x="342" y="99" fill="rgba(255,255,255,0.35)" fontSize="11" fontFamily="monospace">
            AC / SERVICES
          </text>

          {/* perimeter profiles */}
          <g
            opacity={profileVisible ? 1 : 0}
            style={{ transition: "opacity 0.6s ease, transform 0.6s ease" }}
            transform={profileVisible ? "translate(0,0)" : "translate(0,-14)"}
          >
            <path d="M60 120 h16 v26 h-8 v-14 h-8 z" fill="rgba(255,255,255,0.9)" />
            <path d="M740 120 h-16 v26 h8 v-14 h8 z" fill="rgba(255,255,255,0.9)" />
            <line x1="60" y1="120" x2="60" y2="70" stroke="rgba(255,255,255,0.4)" strokeDasharray="3 4" />
            <line x1="740" y1="120" x2="740" y2="70" stroke="rgba(255,255,255,0.4)" strokeDasharray="3 4" />
            <text x="88" y="140" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="monospace">
              DESCOR® PROFILE · 20&#8202;mm DROP
            </text>
          </g>

          {/* fabric */}
          <path
            d={`M68 132 Q 400 ${132 + sagDepth} 732 132`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={fabricVisible ? 1 : 0}
            style={{ transition: "opacity 0.5s ease" }}
          />
          {fabricVisible && sag <= 0.05 && (
            <text x="330" y="160" fill="rgba(255,255,255,0.65)" fontSize="12" fontFamily="monospace">
              SEAMLESS TEXTILE · TAUT
            </text>
          )}

          {/* recessed lights */}
          {[220, 400, 580].map((x) => (
            <g key={x} opacity={lightsOn ? 1 : 0} style={{ transition: "opacity 0.7s ease" }}>
              <circle cx={x} cy={133} r="7" fill="#ffffff" />
              <polygon points={`${x - 26},220 ${x + 26},220 ${x + 9},140 ${x - 9},140`} fill="rgba(255,255,255,0.14)" />
            </g>
          ))}

          {/* floor line + furniture hint */}
          <line x1="40" y1="316" x2="760" y2="316" stroke="rgba(255,255,255,0.3)" />
          <rect x="330" y="284" width="140" height="32" rx="6" fill="rgba(255,255,255,0.10)" />
          <text x="352" y="305" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="monospace">
            YOUR SOFA STAYS
          </text>
        </svg>

        <div className="absolute left-5 top-5 rounded-full bg-white/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-paper/80">
          Section · not to scale
        </div>
      </div>

      <div className="border-t border-white/10 p-6 md:p-8">
        <div className="grid gap-3 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <button
              key={s.t}
              onClick={() => {
                setAuto(false);
                setStep(i);
              }}
              className={`rounded-2xl border p-4 text-left transition-all ${
                step === i ? "border-paper bg-paper text-ink" : "border-white/15 text-paper/70 hover:border-white/50"
              }`}
            >
              <div className="display text-sm">
                {i + 1}. {s.t}
              </div>
              <div className={`mt-1.5 text-xs leading-relaxed ${step === i ? "opacity-70" : "opacity-50"}`}>{s.d}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
