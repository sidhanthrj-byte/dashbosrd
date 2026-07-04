"use client";

import { useState } from "react";
import Image from "next/image";
import { img } from "@/lib/data";

// "Dim the lights" — a slider that drives the brightness of a real backlit
// DESCOR® Translucent + PRINTERIEUR® ceiling. Small, tactile, memorable.
export function BacklitDemo() {
  const [level, setLevel] = useState(90);

  return (
    <div className="on-dark relative overflow-hidden rounded-3xl bg-ink text-paper">
      <div className="relative aspect-[16/10] md:aspect-[21/9]">
        <Image
          src={img.lightCeiling}
          alt="Backlit printed DESCOR® Translucent ceiling — a palm sky indoors"
          fill
          className="object-cover transition-[filter] duration-200"
          style={{
            objectPosition: "center top",
            filter: `brightness(${0.18 + (level / 100) * 0.92}) saturate(${0.55 + (level / 100) * 0.55})`,
          }}
          sizes="(min-width: 1024px) 66vw, 100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: 1 - level / 100,
            background: "linear-gradient(to bottom, rgba(5,5,8,0.55), rgba(5,5,8,0.25) 55%, rgba(5,5,8,0.45))",
          }}
        />
        <div className="absolute left-5 top-5 rounded-full bg-ink/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/80 backdrop-blur">
          Real project · printed light ceiling, orthodontic clinic
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-white/10 p-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="eyebrow !text-paper/50">Try it · DESCOR® Translucent + PRINTERIEUR®</p>
          <h3 className="display mt-1 text-lg md:text-xl">
            The ceiling <em className="not-italic underline decoration-1 underline-offset-4">is</em> the light. Dim it yourself.
          </h3>
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
