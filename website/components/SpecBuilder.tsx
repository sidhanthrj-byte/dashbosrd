"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Architects pick an application; we recommend the variant and generate a
// ready-to-paste specification clause.
const APPS = [
  {
    id: "auditorium",
    label: "Auditorium / Multiplex",
    variant: "DESCOR® PREMIUM Acoustic",
    points: ["αw 0.90 · absorber Class A (DIN EN ISO 354, E-50)", "B-s1,d0 / B1 fire class", "Seamless widths up to 505 cm", "Invisible micro-perforation"],
    clause:
      "Ceiling finish: PONGS DESCOR® PREMIUM Acoustic textile stretch ceiling system (100% PES, micro-perforated, PVC-free), tensioned single-piece into concealed perimeter aluminium DESCOR® profile. Acoustic absorption αw 0.90 (Class A) per DIN EN ISO 354 (E-50 mounting). Reaction to fire B-s1,d0 per DIN EN 13501-1. Installed by PONGS INDIA authorised crew incl. backing rings at all service penetrations.",
  },
  {
    id: "residence",
    label: "Residence / Villa",
    variant: "DESCOR® PREMIUM",
    points: ["Seamless matte surface, no joints", "PVC-free, OEKO-TEX®, Indoor Air Comfort Gold", "20 mm minimum system depth", "1-day dry installation per space"],
    clause:
      "Ceiling finish: PONGS DESCOR® PREMIUM textile stretch ceiling (100% PES, PU-coated, PVC- and VOC-free, OEKO-TEX® Standard 100), single-piece seamless up to 505 cm width, tensioned into perimeter aluminium DESCOR® profile at min. 20 mm below soffit. Reaction to fire B-s1,d0 per DIN EN 13501-1. Dry, dust-free installation in finished interiors by PONGS INDIA authorised crew.",
  },
  {
    id: "backlit",
    label: "Backlit Feature / Wellness",
    variant: "DESCOR® Translucent",
    points: ["Even light diffusion, no hotspots at 80–120 mm", "No white/black breakage", "Moisture-proof — pools & spas", "Fabric removable for lamp access"],
    clause:
      "Luminous ceiling: PONGS DESCOR® Translucent textile membrane tensioned into perimeter aluminium DESCOR® profile over LED field (recommended cavity 80–120 mm for uniform diffusion), single-piece seamless. PVC-free polyester, reaction to fire B1. Membrane releasable and re-tensionable for luminaire maintenance. Installed by PONGS INDIA authorised crew.",
  },
  {
    id: "workspace",
    label: "Workspace / Office",
    variant: "DESCOR® PREMIUM Acoustic + Fleece",
    points: ["Speech-frequency absorption without panel look", "Integrates linear diffusers & magnetic track", "Re-openable for services access", "Fast fit-out: floors done in days"],
    clause:
      "Ceiling finish: PONGS DESCOR® PREMIUM Acoustic textile stretch ceiling with acoustic fleece backing, tensioned into concealed perimeter aluminium DESCOR® profile. Acoustic absorption up to αw 0.90 (DIN EN ISO 354). Reaction to fire B-s1,d0 per DIN EN 13501-1. Proprietary backing rings at all luminaires, diffusers and detectors; membrane re-openable for services access. Installed by PONGS INDIA authorised crew.",
  },
  {
    id: "fnb",
    label: "F&B / Retail Statement",
    variant: "PRINTERIEUR® on DESCOR®",
    points: ["Any artwork, edge-to-edge, photorealistic", "Washable UV print", "Optionally acoustic base fabric", "Swap the fabric, keep the track"],
    clause:
      "Feature ceiling/wall: PONGS PRINTERIEUR® UV-printed DESCOR® textile (custom artwork, edge-to-edge), tensioned single-piece into perimeter aluminium DESCOR® profile. PVC-free polyester base, reaction to fire B1 per DIN 4102 / B-s1,d0 per DIN EN 13501-1. Fabric exchangeable on existing track for future rebrands. Installed by PONGS INDIA authorised crew.",
  },
] as const;

export function SpecBuilder() {
  const [app, setApp] = useState<(typeof APPS)[number]>(APPS[0]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(app.clause);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10">
      <div className="flex flex-wrap gap-2 border-b border-ink/10 bg-paper-2 p-5">
        {APPS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setApp(a);
              setCopied(false);
            }}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              app.id === a.id ? "bg-ink text-paper" : "bg-paper text-mist hover:text-ink"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="grid gap-8 p-7 md:grid-cols-2 md:p-10">
        <div>
          <p className="eyebrow">Recommended system</p>
          <h3 className="display mt-2 text-2xl md:text-3xl">{app.variant}</h3>
          <ul className="mt-6 space-y-3">
            {app.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm leading-relaxed opacity-75">
                <Check size={15} className="mt-0.5 shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col rounded-2xl bg-ink p-6 text-paper">
          <p className="eyebrow !text-paper/50">Specification clause · ready to paste</p>
          <p className="mt-3 flex-1 font-mono text-[13px] leading-relaxed text-paper/80">{app.clause}</p>
          <button
            onClick={copy}
            className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-full bg-paper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-silver"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied to clipboard" : "Copy spec clause"}
          </button>
        </div>
      </div>
    </div>
  );
}
