"use client";

import { useEffect, useRef, useState } from "react";
import { stats } from "@/lib/data";

function CountUp({ value }: { value: string }) {
  // Animate the numeric part of strings like "1,000+", "5.05 m", "110+", "6".
  const match = value.match(/[\d.,]+/);
  const target = match ? parseFloat(match[0].replace(/,/g, "")) : 0;
  const decimals = match && match[0].includes(".") ? 2 : 0;
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  const rendered = match
    ? value.replace(
        match[0],
        n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      )
    : value;

  return <span ref={ref}>{rendered}</span>;
}

export function StatBar() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="border-l border-white/15 pl-5">
          <div className="display text-4xl md:text-6xl">
            <CountUp value={s.value} />
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-paper/50">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
