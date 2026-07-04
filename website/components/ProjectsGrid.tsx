"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { projects } from "@/lib/data";
import { Lightbox } from "@/components/Lightbox";

const filters = ["All", "Residential", "Institutional", "Hospitality", "Public & Cultural"] as const;

function category(tag: string): (typeof filters)[number] {
  if (tag.startsWith("Residential")) return "Residential";
  if (tag.startsWith("Institutional")) return "Institutional";
  if (tag.startsWith("Hospitality") || tag.startsWith("F&B")) return "Hospitality";
  return "Public & Cultural";
}

export function ProjectsGrid() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);
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
          <button
            key={p.title}
            onClick={() => setLightbox(shown.indexOf(p))}
            className="group overflow-hidden rounded-3xl border border-ink/10 text-left"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={p.image}
                alt={p.title}
                fill
                className="img-quiet object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="absolute right-4 top-4 rounded-full bg-ink/60 p-2.5 text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Expand size={15} />
              </div>
            </div>
            <div className="p-6">
              <div className="eyebrow">{p.tag}</div>
              <h3 className="display mt-2 text-lg">{p.title}</h3>
              <p className="mt-1 text-sm opacity-55">{p.location}</p>
            </div>
          </button>
        ))}
      </div>
      <Lightbox index={lightbox} items={shown} onClose={() => setLightbox(null)} onNav={setLightbox} />
    </>
  );
}
