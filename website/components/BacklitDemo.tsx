"use client";

import { useState } from "react";
import Image from "next/image";
import { img } from "@/lib/data";

// "Dim the lights" — a slider that drives the brightness of a backlit
// DESCOR® Translucent ceiling photo. Small, tactile, memorable.
export function BacklitDemo() {
  const [level, setLevel] = useState(85);

  return (
    <div className="on-dark relative overflow-hidden rounded-3xl bg-ink text-paper">
      <div className="relative aspect-[16/10] md:aspect-[21/9]">
        <Image
          src={img.retreat}
          alt="Backlit DESCOR® Translucent ceiling in a wellness retreat"
          fill
          className="object-cover transition-[filter] duration-150"
          style={{ filter: `brightness(${0.25 + (level / 100) * 0.95})` }}
          sizes="(min-width: 1024px) 66vw, 100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-150"
          style={{
            opacity: level / 100,
            background:
              "radial-gradient(60% 45% at 50% 8%, rgba(255,255,255,0.28), transparent 70%)",
          }}
        />
      </div>
      <div className="flex flex-col gap-4 border-t border-white/10 p-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="eyebrow !text-paper/50">Try it · DESCOR® Translucent</p>
          <h3 className="display mt-1 text-lg md:text-xl">Your ceiling is the light source.</h3>
        </div>
        <label className="flex w-full items-center gap-4 text-paper md:w-96">
          <span className="text-lg" aria-hidden>☾</span>
          <input
            type="range"
            min={0}
            max={100}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full text-paper"
            aria-label="Dim the backlit ceiling"
          />
          <span className="text-lg" aria-hidden>☀</span>
        </label>
      </div>
    </div>
  );
}
