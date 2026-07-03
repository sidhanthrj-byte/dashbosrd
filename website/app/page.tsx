import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Ruler,
  Home,
  Clock3,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Section, SectionHead, CTA } from "@/components/ui";
import { stats, img, centers, variants, testimonials } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-end bg-ink text-paper">
        <Image
          src={img.heroAuditorium}
          alt="DESCOR® acoustic textile ceiling — Manipal University auditorium, India"
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-40">
          <p className="eyebrow">Official Channel Partner · PONGS® Germany</p>
          <h1 className="display mt-4 max-w-4xl text-4xl md:text-7xl">
            The ceiling, reinvented.
            <span className="block text-brass-2">In fabric. In a day.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-paper/80 md:text-lg">
            DESCOR® textile stretch ceilings & walls — seamless up to 5 metres,
            acoustically engineered, PVC-free and fire-certified. Made in
            Germany for 110+ years. Installed across India by PONGS India,
            1,000+ projects and counting.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <CTA href="/contact#quote">Get a Quick Quote</CTA>
            <CTA href="/projects" ghost>See Our Projects</CTA>
          </div>
        </div>
      </section>

      {/* ── Dual path: the core of the site ─────────────────── */}
      <Section tight>
        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/for-architects"
            className="group relative overflow-hidden rounded-2xl bg-ink p-9 text-paper transition-transform hover:-translate-y-1 md:p-12"
          >
            <Ruler className="text-brass" size={30} />
            <p className="eyebrow mt-6">I am an Architect / Interior Designer</p>
            <h2 className="display mt-2 text-2xl md:text-4xl">
              Specifications, certifications, installation details.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-paper/60 md:text-base">
              Full technical data for every DESCOR® variant, fire & acoustic
              certificates, detailing for services integration, timelines and
              commercial terms — everything you need to specify with confidence.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brass-2">
              Enter the technical hub <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/for-homeowners"
            className="group relative overflow-hidden rounded-2xl bg-paper-2 p-9 transition-transform hover:-translate-y-1 md:p-12"
          >
            <Home className="text-brass" size={30} />
            <p className="eyebrow mt-6">I am a Homeowner</p>
            <h2 className="display mt-2 text-2xl md:text-4xl">
              A beautiful, healthy home — without the renovation chaos.
            </h2>
            <p className="mt-4 text-sm leading-relaxed opacity-60 md:text-base">
              See what living under a PONGS ceiling feels like: no dust, no
              cracks, no repainting — ever. Real homes, real reviews, and a
              ceiling that goes up in a single day.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brass">
              Explore for your home <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </Section>

      {/* ── Stats / social proof ─────────────────────────────── */}
      <Section dark tight>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="display text-4xl text-brass-2 md:text-5xl">{s.value}</div>
              <div className="mt-2 text-xs uppercase tracking-widest text-paper/50">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Why textile ──────────────────────────────────────── */}
      <Section>
        <SectionHead
          eyebrow="Why DESCOR®"
          title="Everything gypsum and POP promised. None of what they cost you."
          lead="One piece of German-engineered fabric, tensioned into a slim aluminium track. That single idea removes joints, cracks, dust, paint, and weeks of site work — and adds acoustics, backlighting and print that boards simply can't do."
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Clock3, t: "Installed in a day", d: "Dry, clean installation in furnished, occupied spaces. A living room takes hours; a full home, days — not weeks." },
            { icon: Sparkles, t: "Seamless up to 5.05 m", d: "Woven wide in Germany so most Indian rooms are covered in a single, joint-free piece. No cracks. Ever." },
            { icon: Volume2, t: "Acoustics built in", d: "DESCOR® PREMIUM Acoustic absorbs up to αw 0.90 (Class A) while looking like a plain, elegant ceiling." },
            { icon: ShieldCheck, t: "Healthy & fire-safe", d: "PVC-free, VOC-free, OEKO-TEX® certified, B-s1,d0 fire class. Safe for bedrooms, hospitals and schools." },
            { icon: Ruler, t: "Backlit & printed", d: "Translucent fabrics turn ceilings into soft light. PRINTERIEUR® prints any artwork edge-to-edge." },
            { icon: Home, t: "Humid-city proof", d: "Polyester doesn't warp, flake, or grow fungus — unlike POP and gypsum in Mumbai or Chennai monsoons." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-ink/10 p-7">
              <Icon className="text-brass" size={26} />
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <CTA href="/compare" ghost>Compare with gypsum, POP & PVC</CTA>
        </div>
      </Section>

      {/* ── Product strip ────────────────────────────────────── */}
      <Section dark>
        <SectionHead
          eyebrow="The DESCOR® System"
          title="One system. Six ways to transform a space."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((v) => (
            <div key={v.name} className="rounded-2xl bg-ink-2 p-7">
              <h3 className="text-base font-bold text-brass-2">{v.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/70">{v.use}</p>
              <p className="mt-4 border-t border-white/10 pt-3 text-xs text-paper/45">{v.specs}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <CTA href="/for-architects">Full technical specifications</CTA>
        </div>
      </Section>

      {/* ── Featured project ─────────────────────────────────── */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src={img.cafeteria}
              alt="Manipal University cafeteria — DESCOR® acoustic ceiling by PONGS India"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div>
            <p className="eyebrow">Featured Project · India</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">
              Manipal University — featured by PONGS® Germany itself.
            </h2>
            <p className="mt-5 leading-relaxed opacity-70">
              Our acoustic textile ceilings for Manipal University&apos;s
              auditorium and cafeteria are showcased on the global PONGS®
              projects portfolio — Indian execution, German standard. Thousands
              of students sit under them every day; the rooms sound as good as
              they look.
            </p>
            <div className="mt-8">
              <CTA href="/projects" ghost>Browse the project gallery</CTA>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <Section dark>
        <SectionHead eyebrow="What clients say" title="Trusted by the people who measure twice." />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.quote} className="rounded-2xl bg-ink-2 p-8">
              <blockquote className="text-sm leading-relaxed text-paper/85 md:text-base">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-xs uppercase tracking-widest text-brass-2">
                {t.name} · <span className="text-paper/50">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── Experience centers + CTA ─────────────────────────── */}
      <Section>
        <SectionHead
          eyebrow="See it. Touch it. Hear it."
          title="Six experience centers across India."
          lead="A textile ceiling has to be experienced — the seamless surface, the backlit glow, the acoustic hush. Walk into any of our centers, or ask us to bring samples to your site or studio."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((c) => (
            <div key={c.city} className="flex items-baseline justify-between rounded-xl border border-ink/10 px-6 py-5">
              <span className="text-lg font-bold">{c.city}</span>
              <span className="text-xs uppercase tracking-wider opacity-50">{c.note}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <CTA href="/contact#quote">Get a Quick Quote</CTA>
          <CTA href="/contact" ghost>Book an experience center visit</CTA>
        </div>
      </Section>
    </>
  );
}
