"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";

// Reverberation demo: pick a ceiling, fire a clap, watch (and hear) the
// decay. RT60 values are illustrative of typical untreated vs Class-A rooms.
const MATERIALS = [
  { id: "pop", label: "POP / Gypsum ceiling", rt60: 1.9, aw: "αw ≈ 0.05 · reflective", note: "Sound bounces — the echo hangs for almost 2 seconds." },
  { id: "pvc", label: "PVC stretch ceiling", rt60: 1.6, aw: "αw ≈ 0.10 · reflective", note: "A hard plastic membrane reflects nearly everything." },
  { id: "descor", label: "DESCOR® PREMIUM Acoustic", rt60: 0.5, aw: "αw 0.90 · Class A (DIN EN ISO 354)", note: "Micro-perforated textile absorbs the energy — the room goes quiet." },
] as const;

export function AcousticDemo() {
  const [mat, setMat] = useState<(typeof MATERIALS)[number]>(MATERIALS[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const startRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const clap = () => {
    // audio: short noise burst decaying with the material's RT60
    try {
      const ctx = (audioRef.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());
      const dur = mat.rt60;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp((-6.9 * t) / dur) * 0.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
    } catch {
      /* no audio available */
    }
    startRef.current = performance.now();
    cancelAnimationFrame(animRef.current);
    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const W = (canvas.width = canvas.offsetWidth * 2);
    const H = (canvas.height = canvas.offsetHeight * 2);
    const elapsed = (performance.now() - startRef.current) / 1000;
    const dur = mat.rt60;

    ctx2.clearRect(0, 0, W, H);
    const bars = 90;
    for (let i = 0; i < bars; i++) {
      const t = (i / bars) * (dur * 1.15);
      const amp = Math.exp((-6.9 * t) / dur);
      const active = elapsed >= t && elapsed < dur * 1.3;
      const jitter = 0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1);
      const h = Math.max(3, amp * jitter * H * 0.82);
      const x = (i / bars) * W;
      ctx2.fillStyle = active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)";
      ctx2.fillRect(x, (H - h) / 2, Math.max(2, W / bars - 4), h);
    }
    if (elapsed < dur * 1.4) animRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    startRef.current = -10000; // draw idle state
    draw();
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mat]);

  return (
    <div className="on-dark overflow-hidden rounded-3xl bg-ink text-paper">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-7 py-5 md:px-10">
        <div>
          <p className="eyebrow !text-paper/50">Interactive · Room acoustics</p>
          <h3 className="display mt-1 text-xl md:text-2xl">Same clap. Different ceiling.</h3>
        </div>
        <button onClick={clap} className="btn-solid">
          <Volume2 size={16} /> Clap 👏
        </button>
      </div>
      <div className="grid gap-0 md:grid-cols-3">
        <div className="flex flex-col gap-2 border-b border-white/10 p-6 md:border-b-0 md:border-r">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMat(m)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                mat.id === m.id ? "border-paper bg-paper text-ink" : "border-white/15 text-paper/70 hover:border-white/50"
              }`}
            >
              <div className="text-sm font-bold">{m.label}</div>
              <div className={`mt-1 font-mono text-[11px] ${mat.id === m.id ? "opacity-60" : "opacity-40"}`}>{m.aw}</div>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 p-6 md:p-8">
          <canvas ref={canvasRef} className="h-44 w-full md:h-52" aria-hidden />
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
            <p className="max-w-md text-sm leading-relaxed text-paper/65">{mat.note}</p>
            <div className="text-right">
              <div className="display text-3xl">{mat.rt60.toFixed(1)}s</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-paper/45">indicative reverb decay</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
