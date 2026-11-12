import type { ReactNode } from "react";
import type { SectionId } from "@/lib/content";
import { ACTIVE_SECTIONS, SECTIONS } from "@/lib/site";
import Highlight from "./Highlight";
import Reveal from "./Reveal";

/** Small label above the heading when the section has no menu label. */
const EYEBROW: Partial<Record<SectionId, string>> = { github: "GitHub", testimonials: "Quotes" };

/** Centered section header: numbered eyebrow, big title (with *gradient* words), subtitle. */
export default function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const { title, kicker, nav } = SECTIONS[id];
  const number = String(ACTIVE_SECTIONS.indexOf(id) + 1).padStart(2, "0");
  const eyebrow = nav || EYEBROW[id] || id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <section id={id} className="relative z-10 scroll-mt-20 py-20 sm:py-28">
      <div className="shell">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <span className="eyebrow">
            <span className="mono text-[0.7rem] text-a2">{number}</span>
            {eyebrow}
          </span>
          <h2 className="display mt-5 text-[clamp(2.1rem,5.5vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em] text-fg">
            <Highlight text={title} />
          </h2>
          {kicker && <p className="mt-4 text-[1.05rem] text-muted">{kicker}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
