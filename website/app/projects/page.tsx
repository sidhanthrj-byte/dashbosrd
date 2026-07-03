import type { Metadata } from "next";
import Image from "next/image";
import { Section, SectionHead, CTA } from "@/components/ui";
import { projects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects — 1,000+ Installations Across India",
  description:
    "DESCOR® textile ceiling and wall projects by PONGS India: auditoriums, homes, restaurants, hospitality and institutions across India.",
};

export default function ProjectsPage() {
  return (
    <>
      <Section dark tight>
        <SectionHead
          eyebrow="Portfolio"
          title="1,000+ projects. Every one seamless."
          lead="A selection from the PONGS® global portfolio, including our Indian flagship installations. Full PONGS India project photography is being added — visit an experience center to see the complete book."
        />
      </Section>
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <figure key={p.title} className="group overflow-hidden rounded-2xl border border-ink/10">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
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
        <div className="mt-12 text-center">
          <CTA href="/contact#quote">Start your project</CTA>
        </div>
      </Section>
    </>
  );
}
