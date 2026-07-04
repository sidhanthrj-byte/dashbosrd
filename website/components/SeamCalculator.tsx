"use client";

import { useState } from "react";

// Plan-view seam check: DESCOR® comes up to 5.05 m wide, so most rooms are
// one piece. Compare against a 1.2 × 2.4 m gypsum board grid.
const FABRIC_W = 5.05;

export function SeamCalculator() {
  const [len, setLen] = useState(6.0);
  const [wid, setWid] = useState(4.5);
  const [showGypsum, setShowGypsum] = useState(false);

  const short = Math.min(len, wid);
  const long = Math.max(len, wid);
  const strips = Math.max(1, Math.ceil(short / FABRIC_W));
  const seams = strips - 1;
  const boardJoints = Math.ceil(len / 1.2) - 1 + (Math.ceil(wid / 2.4) - 1);

  // plan view scaled into 560 × 340 box
  const scale = Math.min(560 / long, 300 / short);
  const rw = long * scale;
  const rh = short * scale;
  const x0 = (600 - rw) / 2;
  const y0 = (340 - rh) / 2;

  const num = (v: number, set: (n: number) => void) => (
    <input
      type="number"
      min={1}
      max={30}
      step={0.1}
      value={v}
      onChange={(e) => set(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
      className="w-24 rounded-lg border border-ink/15 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-ink"
    />
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink/10 bg-paper-2 px-7 py-5 md:px-10">
        <div>
          <p className="eyebrow">Interactive · Seam check</p>
          <h3 className="display mt-1 text-xl md:text-2xl">Will your room be one seamless piece?</h3>
        </div>
        <div className="flex items-end gap-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-mist">
            Length (m)
            <div className="mt-1">{num(len, setLen)}</div>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-mist">
            Width (m)
            <div className="mt-1">{num(wid, setWid)}</div>
          </label>
        </div>
      </div>

      <div className="grid gap-8 p-7 md:grid-cols-3 md:p-10">
        <div className="md:col-span-2">
          <svg viewBox="0 0 600 340" className="w-full rounded-2xl bg-paper-2">
            {/* room */}
            <rect x={x0} y={y0} width={rw} height={rh} fill="#fff" stroke="#0c0c0c" strokeWidth="2.5" />
            {/* gypsum grid */}
            {showGypsum ? (
              <g stroke="#0c0c0c" strokeOpacity="0.35" strokeDasharray="4 4">
                {Array.from({ length: Math.ceil(long / 1.2) - 1 }, (_, i) => (
                  <line key={`v${i}`} x1={x0 + (i + 1) * 1.2 * scale} y1={y0} x2={x0 + (i + 1) * 1.2 * scale} y2={y0 + rh} />
                ))}
                {Array.from({ length: Math.ceil(short / 2.4) - 1 }, (_, i) => (
                  <line key={`h${i}`} x1={x0} y1={y0 + (i + 1) * 2.4 * scale} x2={x0 + rw} y2={y0 + (i + 1) * 2.4 * scale} />
                ))}
              </g>
            ) : (
              seams > 0 && (
                <g stroke="#0c0c0c" strokeWidth="2">
                  {Array.from({ length: seams }, (_, i) => (
                    <line key={i} x1={x0} y1={y0 + (i + 1) * FABRIC_W * scale} x2={x0 + rw} y2={y0 + (i + 1) * FABRIC_W * scale} />
                  ))}
                </g>
              )
            )}
            {/* dimensions */}
            <text x={x0 + rw / 2} y={y0 - 10} textAnchor="middle" fontFamily="monospace" fontSize="13" fill="#707070">
              {long.toFixed(1)} m
            </text>
            <text
              x={x0 - 12}
              y={y0 + rh / 2}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="13"
              fill="#707070"
              transform={`rotate(-90 ${x0 - 12} ${y0 + rh / 2})`}
            >
              {short.toFixed(1)} m
            </text>
            {/* label */}
            <text x={x0 + rw / 2} y={y0 + rh / 2 + 5} textAnchor="middle" fontFamily="monospace" fontSize="14" fill="#0c0c0c">
              {showGypsum ? `${Math.max(0, boardJoints)}+ BOARD JOINT LINES` : seams === 0 ? "ONE PIECE · 0 SEAMS" : `${strips} STRIPS · ${seams} WELDED SEAM${seams > 1 ? "S" : ""}`}
            </text>
          </svg>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setShowGypsum(false)}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${!showGypsum ? "bg-ink text-paper" : "border border-ink/15 text-mist"}`}
            >
              DESCOR® textile
            </button>
            <button
              onClick={() => setShowGypsum(true)}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${showGypsum ? "bg-ink text-paper" : "border border-ink/15 text-mist"}`}
            >
              Gypsum equivalent
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="display text-6xl">{showGypsum ? Math.max(0, boardJoints) : seams}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-mist">
            {showGypsum ? "gypsum joint lines to tape, sand & repaint" : seams === 0 ? "seams — one perfect plane" : "factory-welded seams"}
          </div>
          <p className="mt-5 text-sm leading-relaxed opacity-65">
            {seams === 0
              ? `Your ${short.toFixed(1)} m span fits inside our 5.05 m seamless width — the whole ceiling arrives as a single piece of fabric.`
              : `Spans over 5.05 m use factory-welded seams that stay flat and invisible — still no site joints, tape or paint.`}{" "}
            Every gypsum joint line, by contrast, is a future crack.
          </p>
        </div>
      </div>
    </div>
  );
}
