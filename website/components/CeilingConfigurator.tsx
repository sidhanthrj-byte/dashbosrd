"use client";

import { useState } from "react";

// Place a DESCOR® finish on the ceiling of a vector room and watch the
// space change. Perspective room drawn in SVG; each finish swaps the
// ceiling treatment and ambient light.
const FINISHES = [
  {
    id: "matte",
    label: "PREMIUM Matte",
    chip: "#f5f4f0",
    desc: "The flagship seamless matte — reads as a flawless painted ceiling.",
    spec: "100% PES · B-s1,d0 · up to 505 cm seamless",
  },
  {
    id: "star",
    label: "PREMIUM Star",
    chip: "linear-gradient(120deg,#e8e8e8,#c9c9c9 45%,#efefef)",
    desc: "Aluminium-pigmented weave with a subtle metallic shimmer.",
    spec: "Aluminium pigments · B1 fire class",
  },
  {
    id: "translucent",
    label: "Translucent · backlit",
    chip: "radial-gradient(circle,#ffffff,#dcdcdc)",
    desc: "The whole ceiling becomes an even, glare-free light source.",
    spec: "High transmission · 80–120 mm LED cavity",
  },
  {
    id: "printed",
    label: "PRINTERIEUR® Print",
    chip: "linear-gradient(180deg,#cfe0ee,#f2f7fb)",
    desc: "Any artwork printed edge-to-edge — here, an open sky.",
    spec: "UV print · washable · photorealistic",
  },
  {
    id: "acoustic",
    label: "PREMIUM Acoustic",
    chip: "#efeeea",
    desc: "Looks identical to matte — but absorbs 90% of sound energy.",
    spec: "αw 0.90 · Class A · DIN EN ISO 354",
  },
] as const;

export function CeilingConfigurator() {
  const [f, setF] = useState<(typeof FINISHES)[number]>(FINISHES[2]);

  const glow = f.id === "translucent";
  const sky = f.id === "printed";
  const star = f.id === "star";

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper">
      <div className="border-b border-ink/10 bg-paper-2 px-7 py-5 md:px-10">
        <p className="eyebrow">Interactive · Configurator</p>
        <h3 className="display mt-1 text-xl md:text-2xl">Place a finish on the ceiling.</h3>
      </div>
      <div className="grid gap-0 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <svg viewBox="0 0 720 430" className="block w-full">
            <defs>
              <linearGradient id="cfg-star" x1="0" y1="0" x2="1" y2="0.3">
                <stop offset="0%" stopColor="#dedede" />
                <stop offset="45%" stopColor="#bdbdbd" />
                <stop offset="100%" stopColor="#e9e9e9" />
              </linearGradient>
              <radialGradient id="cfg-glow" cx="0.5" cy="0.5" r="0.75">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="80%" stopColor="#e9e9e7" />
                <stop offset="100%" stopColor="#dddddb" />
              </radialGradient>
              <linearGradient id="cfg-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b9d2e8" />
                <stop offset="100%" stopColor="#eef5fb" />
              </linearGradient>
              <linearGradient id="cfg-room" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={glow ? "#fbfbfa" : "#f1f0ec"} />
                <stop offset="100%" stopColor={glow ? "#efefec" : "#dddbd5"} />
              </linearGradient>
              <pattern id="cfg-perf" width="9" height="9" patternUnits="userSpaceOnUse">
                <rect width="9" height="9" fill="#efeeea" />
                <circle cx="4.5" cy="4.5" r="0.8" fill="#c9c7c0" />
              </pattern>
              <pattern id="cfg-wood" width="46" height="430" patternUnits="userSpaceOnUse">
                <rect width="46" height="430" fill="#cdc4b4" />
                <line x1="0" y1="0" x2="0" y2="430" stroke="#bdb3a1" strokeWidth="2" />
              </pattern>
            </defs>

            {/* back wall */}
            <rect x="120" y="120" width="480" height="210" fill="url(#cfg-room)" />
            {/* side walls */}
            <polygon points="120,120 0,40 0,430 120,330" fill={glow ? "#f3f3f1" : "#e7e5e0"} />
            <polygon points="600,120 720,40 720,430 600,330" fill={glow ? "#ededea" : "#dcdad4"} />
            {/* floor */}
            <polygon points="0,430 120,330 600,330 720,430" fill="url(#cfg-wood)" />

            {/* CEILING plane */}
            <polygon
              points="0,40 120,120 600,120 720,40"
              fill={
                f.id === "matte"
                  ? "#f7f6f2"
                  : star
                  ? "url(#cfg-star)"
                  : glow
                  ? "url(#cfg-glow)"
                  : sky
                  ? "url(#cfg-sky)"
                  : "url(#cfg-perf)"
              }
              stroke="#0c0c0c"
              strokeOpacity="0.25"
            />
            {/* printed clouds */}
            {sky && (
              <g fill="#ffffff" opacity="0.85">
                <ellipse cx="240" cy="72" rx="52" ry="14" />
                <ellipse cx="290" cy="62" rx="34" ry="10" />
                <ellipse cx="480" cy="88" rx="60" ry="15" />
                <ellipse cx="530" cy="78" rx="36" ry="10" />
              </g>
            )}
            {/* glow wash */}
            {glow && <polygon points="0,40 120,120 600,120 720,40" fill="#ffffff" opacity="0.55" />}
            {glow && <rect x="120" y="120" width="480" height="210" fill="#ffffff" opacity="0.16" />}

            {/* spotlights for non-backlit */}
            {!glow &&
              [260, 360, 460].map((x) => (
                <g key={x}>
                  <circle cx={x} cy={112} r="5" fill="#0c0c0c" opacity="0.75" />
                  <polygon points={`${x - 16},210 ${x + 16},210 ${x + 6},118 ${x - 6},118`} fill="#fffdf5" opacity="0.35" />
                </g>
              ))}

            {/* furniture: sofa + table */}
            <g>
              <rect x="255" y="292" width="210" height="34" rx="8" fill="#8f8a80" />
              <rect x="262" y="272" width="196" height="26" rx="8" fill="#a39d92" />
              <rect x="300" y="345" width="120" height="14" rx="7" fill="#6f6a61" />
            </g>
            {/* window on back wall */}
            <rect x="150" y="150" width="90" height="110" fill={glow ? "#f6fafe" : "#e9f1f8"} stroke="#9a9a92" strokeWidth="3" />
            <line x1="195" y1="150" x2="195" y2="260" stroke="#9a9a92" strokeWidth="3" />
            {/* plant */}
            <g>
              <rect x="545" y="290" width="26" height="30" fill="#8a8478" />
              <circle cx="558" cy="272" r="22" fill="#7c8a6f" />
            </g>

            {/* seam note */}
            <text x="360" y="30" textAnchor="middle" fontFamily="monospace" fontSize="12" fill="#707070">
              {glow ? "DESCOR® TRANSLUCENT + LED FIELD" : "ONE SEAMLESS PIECE · TENSIONED"}
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink/10 p-6 lg:border-l lg:border-t-0">
          {FINISHES.map((x) => (
            <button
              key={x.id}
              onClick={() => setF(x)}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                f.id === x.id ? "border-ink bg-ink text-paper" : "border-ink/10 hover:border-ink/40"
              }`}
            >
              <span
                className="h-9 w-9 shrink-0 rounded-full border border-ink/15"
                style={{ background: x.chip }}
                aria-hidden
              />
              <span>
                <span className="block text-sm font-bold">{x.label}</span>
                <span className={`mt-0.5 block font-mono text-[10px] uppercase tracking-wide ${f.id === x.id ? "text-paper/50" : "text-mist"}`}>
                  {x.spec}
                </span>
              </span>
            </button>
          ))}
          <p className="mt-2 px-1 text-sm leading-relaxed opacity-65">{f.desc}</p>
        </div>
      </div>
    </div>
  );
}
