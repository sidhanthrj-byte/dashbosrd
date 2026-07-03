"use client";

import { useState } from "react";
import { MessageCircle, Mail } from "lucide-react";
import { site } from "@/lib/data";

// No backend yet: the form composes a structured enquiry and hands it to
// WhatsApp or email. Swap `handleSend` for an API route when one exists.
export function QuoteForm() {
  const [form, setForm] = useState({
    name: "",
    city: "Bengaluru",
    audience: "Homeowner",
    space: "",
    area: "",
    message: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const body = [
    `New enquiry from pongsindia website`,
    `Name: ${form.name}`,
    `I am a(n): ${form.audience}`,
    `City: ${form.city}`,
    `Space type: ${form.space}`,
    `Approx. area: ${form.area}`,
    `Message: ${form.message}`,
  ].join("\n");

  const inputCls =
    "w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brass";

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="eyebrow">Your name</label>
        <input required className={`mt-2 ${inputCls}`} value={form.name} onChange={set("name")} placeholder="Full name" />
      </div>
      <div>
        <label className="eyebrow">You are a…</label>
        <select className={`mt-2 ${inputCls}`} value={form.audience} onChange={set("audience")}>
          <option>Homeowner</option>
          <option>Architect</option>
          <option>Interior Designer</option>
          <option>Contractor / Builder</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label className="eyebrow">City</label>
        <select className={`mt-2 ${inputCls}`} value={form.city} onChange={set("city")}>
          {["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Ahmedabad", "Other"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="eyebrow">Space type</label>
        <input className={`mt-2 ${inputCls}`} value={form.space} onChange={set("space")} placeholder="Living room, office, auditorium…" />
      </div>
      <div>
        <label className="eyebrow">Approximate area (sq ft)</label>
        <input className={`mt-2 ${inputCls}`} value={form.area} onChange={set("area")} placeholder="e.g. 400" />
      </div>
      <div className="md:col-span-2">
        <label className="eyebrow">Anything else?</label>
        <textarea rows={3} className={`mt-2 ${inputCls}`} value={form.message} onChange={set("message")} placeholder="Backlit ceiling? Acoustic brief? Timeline?" />
      </div>
      <div className="flex flex-wrap gap-4 md:col-span-2">
        <a
          href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(body)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-brass px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-brass-2"
        >
          <MessageCircle size={16} /> Send on WhatsApp
        </a>
        <a
          href={`mailto:${site.email}?subject=${encodeURIComponent("Quote request — " + form.name)}&body=${encodeURIComponent(body)}`}
          className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-7 py-3.5 text-sm font-semibold transition-colors hover:border-brass hover:text-brass"
        >
          <Mail size={16} /> Send by Email
        </a>
      </div>
      <p className="text-xs opacity-50 md:col-span-2">
        We reply within one business day with a call-back and, if you share
        room photos or drawings, an indicative quote within 48 hours.
      </p>
    </form>
  );
}
