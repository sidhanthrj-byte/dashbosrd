import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, Home } from "lucide-react";
import { Section, SectionHead, CTA } from "@/components/ui";
import { AudienceGate } from "@/components/AudienceGate";
import { StatBar } from "@/components/StatBar";
import { EstimateWizard } from "@/components/EstimateWizard";
import { Reveal } from "@/components/Reveal";
import { img, centers, variants, testimonials } from "@/lib/data";

const whyPoints = [
  {
    n: "01",
    t: "Seamless up to 5.05 m",
    d: "Woven wide in Germany, so most Indian rooms are covered in a single joint-free piece. No joints means no cracks — ever.",
  },
  {
    n: "02",
    t: "Installed in a day",
    d: "Dry, dust-free tensioning into a slim aluminium track. Furniture stays in the room; a living room is done between breakfast and dinner.",
  },
  {
    n: "03",
    t: "Acoustics built in",
    d: "DESCOR® PREMIUM Acoustic absorbs up to αw 0.90 (Class A) while looking like a plain, elegant ceiling — no foam panels in sight.",
  },
  {
    n: "04",
    t: "Healthy & fire-safe",
    d: "PVC-free, VOC-free, OEKO-TEX® certified, B-s1,d0 fire class. And polyester shrugs off monsoon humidity that ruins POP and gypsum.",
  },
];

export default function HomePage() {
  return (
    <>
      <AudienceGate />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="on-dark relative flex min-h-[92vh] items-end bg-ink text-paper">
        <Image
          src={img.heroAuditorium}
          alt="DESCOR® acoustic textile ceiling — Manipal University auditorium, India"
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-24 pt-40">
          <p className="eyebrow text-paper/60">PONGS INDIA · Official Channel Partner of PONGS® Germany</p>
          <h1 className="display mt-6 max-w-5xl text-5xl md:text-8xl">
            The ceiling, reinvented.
            <span className="block text-paper/50">In fabric. In a day.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-paper/80 md:text-lg">
            DESCOR® textile stretch ceilings & walls — seamless up to 5 metres,
            acoustically engineered, PVC-free and fire-certified. Made in
            Germany for 110+ years. 1,000+ projects across India.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <CTA href="/contact#quote">Get a Quick Quote</CTA>
            <CTA href="/projects" ghost>See Our Projects</CTA>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <Section dark tight>
        <StatBar />
      </Section>

      {/* ── Dual path (persistent, compact) ──────────────────── */}
      <Section tight>
        <Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/for-homeowners"
              className="group relative flex min-h-72 items-end overflow-hidden rounded-3xl"
            >
              <Image
                src={img.homeLiving}
                alt="Residential textile ceiling"
                fill
                className="img-quiet object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
              <div className="relative p-8 text-paper md:p-10">
                <Home size={22} className="text-paper/70" />
                <h2 className="display mt-3 text-2xl md:text-3xl">For Homeowners</h2>
                <p className="mt-2 max-w-sm text-sm text-paper/75">
                  No dust, no cracks, no repainting — see what living under a PONGS ceiling feels like.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  Explore <ArrowRight size={15} className="transition-transform group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
            <Link
              href="/for-architects"
              className="group relative flex min-h-72 items-end overflow-hidden rounded-3xl"
            >
              <Image
                src={img.museum}
                alt="Architectural textile installation"
                fill
                className="img-quiet object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
              <div className="relative p-8 text-paper md:p-10">
                <Ruler size={22} className="text-paper/70" />
                <h2 className="display mt-3 text-2xl md:text-3xl">For Architects & Designers</h2>
                <p className="mt-2 max-w-sm text-sm text-paper/75">
                  Specs, certifications, detailing, spec-clause builder — the complete technical hub.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  Enter the hub <ArrowRight size={15} className="transition-transform group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* ── Why — editorial split ─────────────────────────────── */}
      <Section>
        <Reveal>
          <SectionHead
            eyebrow="Why DESCOR®"
            title="Everything gypsum and POP promised. None of what they cost you."
          />
        </Reveal>
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl lg:sticky lg:top-24">
              <Image
                src={img.kitchen}
                alt="Seamless acoustic textile ceiling in a residential kitchen"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute bottom-5 left-5 rounded-full bg-ink/80 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-paper backdrop-blur">
                One piece of fabric. Zero joints.
              </div>
            </div>
          </Reveal>
          <div className="flex flex-col justify-center gap-2">
            {whyPoints.map((p) => (
              <Reveal key={p.n}>
                <div className="group border-t border-ink/10 py-7 transition-colors last:border-b hover:bg-paper-2 md:px-4">
                  <div className="flex items-baseline gap-6">
                    <span className="display text-lg text-silver">{p.n}</span>
                    <div>
                      <h3 className="display text-xl md:text-2xl">{p.t}</h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed opacity-65 md:text-base">{p.d}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal>
              <div className="mt-6 md:px-4">
                <CTA href="/compare" ghost>Compare with gypsum, POP & PVC</CTA>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── Product strip ────────────────────────────────────── */}
      <Section dark>
        <Reveal>
          <SectionHead eyebrow="The DESCOR® System" title="One system. Six ways to transform a space." />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((v, i) => (
            <Reveal key={v.name}>
              <div className="group h-full rounded-3xl border border-white/10 p-7 transition-colors hover:border-white/40">
                <div className="display text-sm text-paper/40">0{i + 1}</div>
                <h3 className="display mt-3 text-lg text-paper">{v.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{v.use}</p>
                <p className="mt-5 border-t border-white/10 pt-3 font-mono text-[11px] leading-relaxed text-paper/45">
                  {v.specs}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-10">
            <CTA href="/for-architects">Full technical specifications</CTA>
          </div>
        </Reveal>
      </Section>

      {/* ── Estimate wizard ──────────────────────────────────── */}
      <Section>
        <Reveal>
          <SectionHead
            eyebrow="Try it now"
            title="Your ceiling, priced in sixty seconds."
            lead="Three taps — space, size, look — and you'll know your indicative budget before you talk to anyone."
          />
          <EstimateWizard />
        </Reveal>
      </Section>

      {/* ── Featured project ─────────────────────────────────── */}
      <Section muted>
        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={img.cafeteria}
                alt="Manipal University cafeteria — DESCOR® acoustic ceiling by PONGS INDIA"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div>
              <p className="eyebrow">Featured Project · India</p>
              <h2 className="display mt-4 text-3xl md:text-5xl">
                Manipal University — featured by PONGS® Germany itself.
              </h2>
              <p className="mt-5 leading-relaxed opacity-70">
                Our acoustic ceilings for Manipal University&apos;s auditorium
                and cafeteria are showcased on the global PONGS® portfolio —
                Indian execution, German standard. Thousands of students sit
                under them every day.
              </p>
              <div className="mt-8">
                <CTA href="/projects" ghost>Browse the project gallery</CTA>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ── Heritage ─────────────────────────────────────────── */}
      <Section dark>
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow !text-paper/50">The PONGS® story</p>
            <h2 className="display mt-4 text-3xl md:text-5xl">
              110+ years of German weaving. Now at home in India.
            </h2>
          </Reveal>
          <div className="space-y-2">
            {[
              ["1913", "The PONGS story begins in Germany — over a century of textile engineering, from thread to finished fabric."],
              ["Today", "22.8+ million m² woven annually in Mühltroff, Germany, on looms up to 6.2 m wide — the world's widest architectural textiles."],
              ["PONGS INDIA", "The official channel partner for India: 1,000+ projects by our own trained crews, six experience centers — Bengaluru (HQ), Mumbai, Delhi NCR, Hyderabad, Chennai, Ahmedabad."],
            ].map(([year, text]) => (
              <Reveal key={year}>
                <div className="flex gap-6 border-t border-white/10 py-6">
                  <div className="display w-36 shrink-0 text-xl text-paper/50">{year}</div>
                  <p className="text-sm leading-relaxed text-paper/75 md:text-base">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <Section>
        <Reveal>
          <SectionHead eyebrow="What clients say" title="Trusted by the people who measure twice." />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Reveal key={t.quote}>
              <figure className="h-full rounded-3xl bg-paper-2 p-8">
                <div className="display text-5xl leading-none text-silver">&ldquo;</div>
                <blockquote className="mt-2 text-sm leading-relaxed opacity-80 md:text-base">{t.quote}</blockquote>
                <figcaption className="mt-6 text-xs font-semibold uppercase tracking-widest">
                  {t.name} · <span className="opacity-50">{t.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── Experience centers + CTA ─────────────────────────── */}
      <Section dark>
        <Reveal>
          <SectionHead
            eyebrow="See it. Touch it. Hear it."
            title="Six experience centers across India."
            lead="A textile ceiling has to be experienced — the seamless surface, the backlit glow, the acoustic hush. Walk in, or ask us to bring samples to your site."
          />
        </Reveal>
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map((c) => (
              <div key={c.city} className="group bg-ink p-7 transition-colors hover:bg-ink-2">
                <div className="display text-2xl">{c.city}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-paper/45">{c.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <CTA href="/contact#quote">Get a Quick Quote</CTA>
            <CTA href="/contact" ghost>Book a center visit</CTA>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
