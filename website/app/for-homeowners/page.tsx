import type { Metadata } from "next";
import Image from "next/image";
import { Clock3, Sparkles, HeartPulse, Droplets, Paintbrush, BadgeCheck } from "lucide-react";
import { Section, SectionHead, CTA, Faq } from "@/components/ui";
import { BacklitDemo } from "@/components/BacklitDemo";
import { EstimateWizard } from "@/components/EstimateWizard";
import { Reveal } from "@/components/Reveal";
import { img, homeownerFaqs, testimonials, centers } from "@/lib/data";

export const metadata: Metadata = {
  title: "For Homeowners — A Ceiling You'll Never Have to Think About Again",
  description:
    "German textile ceilings for Indian homes: installed in a day with no dust, no cracks ever, no repainting. See real homes, reviews and visit an experience center.",
};

export default function HomeownersPage() {
  return (
    <>
      <section className="on-dark relative bg-ink py-24 text-paper md:py-32">
        <Image
          src={img.homeLiving}
          alt="Luxury living room with seamless DESCOR® textile ceiling"
          fill
          className="object-cover opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5">
          <p className="eyebrow">For Your Home</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            The last ceiling decision you&apos;ll ever make.
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-paper/80">
            Imagine your ceiling finished in one day — no dust sheets, no
            hammering for weeks, no paint smell. And then imagine it never
            cracking, never peeling, never needing paint again. That&apos;s a
            PONGS ceiling. German-made fabric, stretched perfectly flat, for
            the life of your home.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CTA href="/contact#quote">Get a free home consultation</CTA>
            <CTA href="/projects" ghost>See real homes</CTA>
          </div>
        </div>
      </section>

      {/* Benefits in homeowner language */}
      <Section>
        <SectionHead
          eyebrow="What you actually get"
          title="Why families choose fabric over POP and gypsum."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Clock3, t: "Done in a day, not weeks", d: "We install in fully furnished homes. Morning start, evening finish — your sofa never leaves the room." },
            { icon: Sparkles, t: "Not one crack. Ever.", d: "POP and gypsum crack at the joints — you've seen it. Our ceiling is one piece of fabric. There are no joints to crack." },
            { icon: Paintbrush, t: "Never paint again", d: "The colour is woven into the fabric. No repainting every few years, no peeling, no patchy touch-ups." },
            { icon: HeartPulse, t: "Healthier air for your family", d: "PVC-free and certified free of harmful chemicals (OEKO-TEX®, Indoor Air Comfort Gold) — gentle on kids and allergies." },
            { icon: Droplets, t: "Monsoon-proof", d: "Fabric doesn't absorb moisture. No fungus patches, no flaking, no swelling — even in Mumbai and Chennai humidity." },
            { icon: BadgeCheck, t: "German quality, local team", d: "Fabric woven in Germany for 110+ years; installed by our own trained PONGS India crews — 1,000+ projects done." },
          ].map(({ icon: Icon, t, d }) => (
            <Reveal key={t}>
              <div className="group h-full rounded-3xl border border-ink/10 p-7 transition-all hover:-translate-y-1 hover:border-ink/30 hover:shadow-xl hover:shadow-ink/5">
                <Icon className="text-mist transition-colors group-hover:text-ink" size={26} />
                <h3 className="display mt-4 text-lg">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-65">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Interactive backlit demo */}
      <Section tight>
        <Reveal>
          <BacklitDemo />
        </Reveal>
      </Section>

      {/* Visual inspiration */}
      <Section dark>
        <SectionHead
          eyebrow="Imagine it in your home"
          title="Three looks. One system."
          lead="Elegant matte, a soft glowing ceiling of light, or any artwork you love printed edge-to-edge. All installed on the same slim track."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { image: img.kitchen, t: "The Quiet Kitchen", d: "Acoustic fabric that swallows echo — dinner conversations, not dinner noise." },
            { image: img.retreat, t: "The Glowing Retreat", d: "Backlit translucent ceilings turn bathrooms and bedrooms into soft, shadow-free light." },
            { image: img.jungleHome, t: "The Statement Wall", d: "PRINTERIEUR® prints your artwork, photo or pattern seamlessly across walls and ceilings." },
          ].map((c) => (
            <figure key={c.t} className="overflow-hidden rounded-2xl bg-ink-2">
              <div className="relative aspect-[4/3]">
                <Image src={c.image} alt={c.t} fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
              </div>
              <figcaption className="p-6">
                <h3 className="font-bold text-paper">{c.t}</h3>
                <p className="mt-2 text-sm text-paper/65">{c.d}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* How it works — simple */}
      <Section>
        <SectionHead
          eyebrow="How it works"
          title="From 'hello' to a finished ceiling in three easy steps."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["1", "Visit or call us", "Walk into any of our 6 experience centers, or send us your room photos on WhatsApp. You'll see, touch and hear the difference."],
            ["2", "Free measurement & quote", "Our team visits, measures, and gives you a clear itemised quote within 48 hours. No hidden costs, no 'extras' later."],
            ["3", "One-day installation", "Clean, dry, quiet installation with your furniture in place. We vacuum, we hand over, you enjoy it for decades."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl bg-paper-2 p-8">
              <div className="display text-5xl text-mist">{n}</div>
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Reviews */}
      <Section dark>
        <SectionHead eyebrow="Real reviews" title="What homeowners tell us after living with it." />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.quote} className="rounded-2xl bg-ink-2 p-8">
              <div className="text-paper">★★★★★</div>
              <blockquote className="mt-4 text-sm leading-relaxed text-paper/85">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-xs uppercase tracking-widest text-paper">
                {t.name} · <span className="text-paper/50">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Instant estimate */}
      <Section muted>
        <Reveal>
          <SectionHead
            eyebrow="Curious about cost?"
            title="Price your room in sixty seconds."
            lead="No phone number needed, no waiting — pick your room, slide the size, choose a look."
          />
          <EstimateWizard />
        </Reveal>
      </Section>

      {/* FAQ + CTA */}
      <Section>
        <SectionHead eyebrow="Honest answers" title="Questions every homeowner asks us." />
        <Faq items={homeownerFaqs} />
        <div className="mt-14 on-dark rounded-2xl bg-ink p-10 text-center text-paper">
          <h3 className="display text-2xl md:text-4xl">See it before you decide.</h3>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-paper/70">
            Experience centers in {centers.map((c) => c.city).join(", ")}. Walk
            in, touch the fabric, stand under the glowing ceiling — then decide.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <CTA href="/contact#quote">Get a free consultation</CTA>
            <CTA href="/contact" ghost>Find your nearest center</CTA>
          </div>
        </div>
      </Section>
    </>
  );
}
