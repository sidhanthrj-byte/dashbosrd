import type { Metadata } from "next";
import { Section, SectionHead, CTA } from "@/components/ui";
import { ProjectsGrid } from "@/components/ProjectsGrid";

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
        <ProjectsGrid />
        <div className="mt-12 text-center">
          <CTA href="/contact#quote">Start your project</CTA>
        </div>
      </Section>
    </>
  );
}
