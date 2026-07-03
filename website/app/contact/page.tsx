import type { Metadata } from "next";
import { MapPin, Phone, Mail, AtSign } from "lucide-react";
import { Section, SectionHead } from "@/components/ui";
import { QuoteForm } from "@/components/QuoteForm";
import { site, centers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact & Quick Quote",
  description:
    "Get a quick quote for DESCOR® textile ceilings, or visit a PONGS India experience center in Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai or Ahmedabad.",
};

export default function ContactPage() {
  return (
    <>
      <Section dark tight>
        <SectionHead
          eyebrow="Contact"
          title="Talk to a human, today."
          lead="Call, WhatsApp, or walk into an experience center. If you send room photos or drawings, you'll have an indicative quote within 48 hours."
        />
        <div className="flex flex-wrap gap-8 text-sm">
          <a className="flex items-center gap-2 text-paper/80 hover:text-paper" href={`tel:${site.phone.replace(/\s/g, "")}`}>
            <Phone size={16} className="text-mist" /> {site.phone}
          </a>
          <a className="flex items-center gap-2 text-paper/80 hover:text-paper" href={`mailto:${site.email}`}>
            <Mail size={16} className="text-mist" /> {site.email}
          </a>
          <a className="flex items-center gap-2 text-paper/80 hover:text-paper" href={site.instagram} target="_blank" rel="noreferrer">
            <AtSign size={16} className="text-mist" /> @pongsindia
          </a>
        </div>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-5">
          <div className="lg:col-span-3" id="quote">
            <SectionHead
              eyebrow="Quick Quote"
              title="Sixty seconds. That's all it takes."
            />
            <QuoteForm />
          </div>
          <div className="lg:col-span-2">
            <SectionHead eyebrow="Experience Centers" title="Come see it in person." />
            <ul className="space-y-4">
              {centers.map((c) => (
                <li key={c.city} className="flex items-start gap-3 rounded-xl border border-ink/10 p-5">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-mist" />
                  <div>
                    <div className="font-bold">{c.city}</div>
                    <div className="text-sm opacity-55">{c.note}</div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs opacity-50">
              Detailed addresses and map links are shared on WhatsApp when you
              book a visit — so we can also block time for a personal walkthrough.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
