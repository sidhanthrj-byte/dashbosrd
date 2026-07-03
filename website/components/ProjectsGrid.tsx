"use client";

import { useState } from "react";
import Image from "next/image";
import { projects } from "@/lib/data";

const filters = ["All", "Residential", "Institutional", "Hospitality", "Public & Cultural"] as const;

function category(tag: string): (typeof filters)[number] {
  if (tag.startsWith("Residential")) return "Residential";
  if (tag.startsWith("Institutional")) return "Institutional";
  if (tag.startsWith("Hospitality") || tag.startsWith("F&B")) return "Hospitality";
  return "Public & Cultural";
}

export function ProjectsGrid() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const shown = projects.filter((p) => active === "All" || category(p.tag) === active);

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              active === f
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 text-mist hover:border-ink hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <figure key={p.title} className="group overflow-hidden rounded-2xl border border-ink/10">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="img-quiet object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </div>
            <figcaption className="p-6">
              <div className="eyebrow">{p.tag}</div>
              <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
              <p className="mt-1 text-sm opacity-55">{p.location}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
