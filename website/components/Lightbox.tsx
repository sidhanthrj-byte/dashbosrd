"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { projects } from "@/lib/data";

export function useLightbox() {
  const [index, setIndex] = useState<number | null>(null);
  return { index, open: (i: number) => setIndex(i), close: () => setIndex(null), setIndex };
}

export function Lightbox({
  index,
  items,
  onClose,
  onNav,
}: {
  index: number | null;
  items: typeof projects;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const nav = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return;
      onNav((index + dir + items.length) % items.length);
    },
    [index, items.length, onNav]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, nav, onClose]);

  if (index === null) return null;
  const p = items[index];

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-ink/95 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 text-paper">
        <div className="eyebrow !text-paper/60">{p.tag}</div>
        <button aria-label="Close" className="rounded-full border border-white/20 p-2 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>
      <div className="relative mx-auto w-full max-w-6xl flex-1 px-5 pb-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-full min-h-64 overflow-hidden rounded-2xl">
          <Image src={p.image} alt={p.title} fill className="object-contain" sizes="100vw" />
        </div>
        <button
          aria-label="Previous project"
          onClick={() => nav(-1)}
          className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-ink/70 p-3 text-paper hover:bg-ink"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          aria-label="Next project"
          onClick={() => nav(1)}
          className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-ink/70 p-3 text-paper hover:bg-ink"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="pb-6 text-center text-paper" onClick={(e) => e.stopPropagation()}>
        <div className="display text-lg">{p.title}</div>
        <div className="mt-1 text-xs text-paper/50">
          {p.location} · {index + 1} / {items.length}
        </div>
      </div>
    </div>
  );
}
