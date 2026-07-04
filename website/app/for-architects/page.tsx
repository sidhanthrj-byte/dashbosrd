import type { Metadata } from "next";
import Image from "next/image";
import { FileDown, Building2 } from "lucide-react";
import { Section, SectionHead, CTA, Faq } from "@/components/ui";
import { SpecBuilder } from "@/components/SpecBuilder";
import { InstallAnimation } from "@/components/InstallAnimation";
import { SeamCalculator } from "@/components/SeamCalculator";
import { AcousticDemo } from "@/components/AcousticDemo";
import { Reveal } from "@/components/Reveal";
import { variants, certifications, installSteps, architectFaqs, img } from "@/lib/data";

export const metadata: Metadata = {
  title: "For Architects & Interior Designers — Technical Hub",
  description:
    "DESCOR® technical specifications, fire & acoustic certifications, installation details, services integration and timelines for architects and interior designers in India.",
};

export default function ArchitectsPage() {
  return (
    <>
      <section className="on-dark relative bg-ink py-24 text-paper md:py-32">
        <Image
          src={img.museum}
          alt="Large-span architectural textile installation"
          fill
          className="object-cover opacity-25"
          sizes="100vw"
        />
        <div className="relative mx-auto max-w-7xl px-5">
          <p className="eyebrow">The Technical Hub</p>
          <h1 className="display mt-4 max-w-4xl text-4xl md:text-6xl">
            Specify a ceiling that behaves exactly as drawn.
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-paper/75">
            Everything you need on one page: variant data, certifications,
            substrate and services detailing, realistic timelines. DWG blocks,
            datasheets and physical samples on request — same-day from our six
            experience centers.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CTA href="/contact#quote">Request specs & samples</CTA>
            <CTA href="/projects" ghost>Reference projects</CTA>
          </div>
        </div>
      </section>

      {/* Spec builder — the architect's toy */}
      <Section>
        <Reveal>
          <SectionHead
            eyebrow="Interactive · Spec builder"
            title="Pick the application. Copy the clause."
            lead="Choose your project type and get the recommended DESCOR® system with a ready-to-paste specification clause for your BOQ or tender document."
          />
          <SpecBuilder />
        </Reveal>
      </Section>

      {/* Variants with full specs */}
      <Section muted>
        <SectionHead
          eyebrow="Product Data"
          title="The DESCOR® range, variant by variant."
          lead="All fabrics are woven and finished by PONGS® in Mühltroff, Germany. PVC-free, formaldehyde-free and VOC-free across the range."
        />
        <div className="overflow-x-auto rounded-2xl border border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink text-paper">
              <tr>
                <th className="px-6 py-4 font-semibold">Variant</th>
                <th className="px-6 py-4 font-semibold">Primary application</th>
                <th className="px-6 py-4 font-semibold">Key specifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {variants.map((v) => (
                <tr key={v.name} className="align-top">
                  <td className="px-6 py-5 font-bold text-mist">{v.name}</td>
                  <td className="px-6 py-5 opacity-75">{v.use}</td>
                  <td className="px-6 py-5 opacity-75">{v.specs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid gap-5 rounded-2xl bg-paper-2 p-8 md:grid-cols-3">
          {[
            ["Roll width", "Up to 505 cm seamless (select fabrics to 620 cm) — most rooms in one piece."],
            ["System depth", "From 20 mm below slab/services. Backlit builds: 80–120 mm recommended."],
            ["Weight", "~200–300 g/m² fabric on aluminium perimeter profile — negligible structural load."],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="eyebrow">{k}</div>
              <p className="mt-2 text-sm leading-relaxed opacity-70">{v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Seam calculator */}
      <Section>
        <Reveal>
          <SectionHead
            eyebrow="Plan check"
            title="Type your room. Count the seams."
            lead="Our fabric is woven up to 5.05 m wide — put your actual room dimensions in and see the plan, then flip to the gypsum equivalent for contrast."
          />
          <SeamCalculator />
        </Reveal>
      </Section>

      {/* Acoustic demo */}
      <Section muted>
        <Reveal>
          <SectionHead
            eyebrow="Acoustics"
            title="Don't read the absorption data. Hear it."
            lead="One clap, three ceilings. Turn your sound on — the decay you hear uses each material's real reverberation behaviour."
          />
          <AcousticDemo />
        </Reveal>
      </Section>

      {/* Certifications */}
      <Section dark>
        <SectionHead
          eyebrow="Compliance"
          title="Certified where it matters."
          lead="Full certificates and test reports are available for your project documentation — ask and we'll send the PDFs the same day."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {certifications.map((c) => (
            <div key={c.name} className="rounded-xl bg-ink-2 p-6">
              <div className="text-sm font-bold text-paper">{c.name}</div>
              <p className="mt-2 text-xs leading-relaxed text-paper/60">{c.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Installation */}
      <Section>
        <SectionHead
          eyebrow="Installation"
          title="Four steps. One day per space. Zero wet work."
          lead="Installation is by PONGS India trained crews on the German DESCOR® profile system — not third-party contractors."
        />
        <Reveal>
          <div className="mb-10">
            <InstallAnimation />
          </div>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {installSteps.map((s) => (
            <div key={s.step} className="rounded-2xl border border-ink/10 p-7">
              <div className="display text-4xl text-mist">{s.step}</div>
              <h3 className="mt-4 text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-65">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 on-dark rounded-2xl bg-ink p-8 text-paper md:flex md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Building2 className="mt-1 shrink-0 text-mist" />
            <p className="max-w-2xl text-sm leading-relaxed text-paper/80">
              <strong className="text-paper">Typical project timeline:</strong>{" "}
              site survey → quotation in 48 hours → installation in 2–3 weeks
              for stocked fabrics (6–8 weeks for printed/special orders).
              Services integration — linear diffusers, magnetic track,
              sprinklers, sensors — detailed with backing rings as standard.
            </p>
          </div>
          <div className="mt-6 shrink-0 md:ml-8 md:mt-0">
            <CTA href="/contact#quote">Discuss a project</CTA>
          </div>
        </div>
      </Section>

      {/* Downloads strip */}
      <Section dark tight>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <FileDown className="text-mist" size={28} />
            <div>
              <h3 className="text-lg font-bold">Datasheets, DWG details & certificates</h3>
              <p className="text-sm text-paper/60">
                We share the full technical library on request — plus physical sample kits couriered to your studio.
              </p>
            </div>
          </div>
          <CTA href="/contact#quote">Request the technical library</CTA>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <SectionHead eyebrow="Architect FAQ" title="The questions we get on every first call." />
        <Faq items={architectFaqs} />
      </Section>
    </>
  );
}
