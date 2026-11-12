import { isUnderReview } from "@/lib/content";
import { CONTENT, DISPLAY, GITHUB_USER, PAPER_TOTALS, RESEARCH, RESEARCH_BUILDS, type Paper } from "@/lib/site";
import Certificate from "./Certificate";
import Clamp from "./Clamp";
import CountUp from "./CountUp";
import Cover from "./Cover";
import Icon from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import ShowMore from "./ShowMore";
import SpotlightCard from "./SpotlightCard";

export default function Research() {
  const totals = [
    { label: "Papers submitted", value: PAPER_TOTALS.submitted, tint: "tint-1" },
    { label: "Accepted / presented", value: PAPER_TOTALS.accepted, tint: "tint-3" },
    { label: "Under review", value: PAPER_TOTALS.underReview, tint: "tint-4" },
  ];

  return (
    <Section id="research">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
        {totals.map((t, i) => (
          <Reveal key={t.label} delay={i * 90}>
            <SpotlightCard as="div" className="h-full p-4 text-center sm:p-6">
              <p
                className={`display bg-clip-text text-[clamp(2rem,6vw,3rem)] font-extrabold leading-none text-transparent ${t.tint}`}
              >
                <CountUp value={t.value} />
              </p>
              <p className="mt-2 text-[0.78rem] font-medium text-fg-soft sm:text-sm">{t.label}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
      {CONTENT.researchSummary && (
        <Reveal>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[1.03rem] leading-relaxed text-fg-soft">
            {CONTENT.researchSummary}
          </p>
        </Reveal>
      )}

      <div className="mt-14">
        <ShowMore
          noun="papers"
          shown={DISPLAY.papersShown}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          items={RESEARCH.map((paper, i) => (
            <Reveal key={`${paper.title}-${i}`} delay={(i % 3) * 80} className="h-full">
              <PaperCard paper={paper} />
            </Reveal>
          ))}
        />
      </div>

      {RESEARCH_BUILDS.length > 0 && (
        <div className="mt-16">
          <Reveal>
            <h3 className="display mb-6 flex items-center justify-center gap-3 text-xl font-bold text-white">
              <Icon name="code" className="text-a2" /> Research code
            </h3>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESEARCH_BUILDS.map((build, i) => (
              <li key={`${build.repo}-${i}`} className="h-full">
                <Reveal delay={i * 80} className="h-full">
                  <SpotlightCard className="lift flex h-full flex-col overflow-hidden">
                    <Cover title={build.title} image={build.image} icon="terminal" compact className="h-24 w-full" />
                    <div className="flex flex-1 flex-col p-5">
                      <p className="mono text-[0.72rem] text-a2">{build.label}</p>
                      <h4 className="display mt-1 text-[1rem] font-bold text-white">{build.title}</h4>
                      <Clamp text={build.note} lines={3} className="mt-2 text-[0.86rem] leading-relaxed text-fg-soft" />
                      {build.stack.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {build.stack.map((tech) => (
                            <li key={tech} className="chip !text-[0.7rem]">
                              {tech}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                        {build.repo && (
                          <a
                            href={`https://github.com/${GITHUB_USER}/${build.repo}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-a2"
                          >
                            <Icon name="github" size={15} /> Code
                          </a>
                        )}
                        <Certificate
                          file={build.certificate}
                          link={build.certificateLink}
                          title={build.title}
                          className="ml-auto"
                        />
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

/** Compact paper card: slim cover banner carrying the status, then title, short note, actions. */
function PaperCard({ paper }: { paper: Paper }) {
  const pending = isUnderReview(paper);
  return (
    <SpotlightCard className="lift flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Cover title={paper.title} image={paper.image} icon="flask" compact banner className="h-20 w-full" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold backdrop-blur-md ${
            pending ? "border-amber/40 bg-black/50 text-amber" : "border-green/40 bg-black/50 text-green"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${pending ? "animate-pulse bg-amber" : "bg-green"}`} />
          <span className="inline-block first-letter:uppercase">{paper.status || "Under review"}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mono text-[0.72rem] text-muted">
          {paper.venue}
          {paper.year && !paper.venue.includes(paper.year) && <> · {paper.year}</>}
        </p>
        <h3 className="display mt-1.5 text-[0.98rem] font-bold leading-snug text-white">{paper.title}</h3>
        {paper.note && (
          <Clamp text={paper.note} lines={3} className="mt-2 text-[0.85rem] leading-relaxed text-fg-soft" />
        )}
        {(paper.link || paper.certificate || paper.certificateLink) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            {paper.link && (
              <a
                href={paper.link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-a2"
              >
                Read paper <Icon name="external" size={13} />
              </a>
            )}
            <Certificate file={paper.certificate} link={paper.certificateLink} title={paper.title} className="ml-auto" />
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
