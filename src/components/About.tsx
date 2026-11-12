import { CONTENT } from "@/lib/site";
import Highlight from "./Highlight";
import Icon, { type IconName } from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

const ABOUT = CONTENT.about;
const FACT_ICONS: IconName[] = ["graduation", "target", "layers", "rocket", "globe", "sparkles"];
const FACT_TINTS = ["tint-1", "tint-2", "tint-3", "tint-4"];

export default function About() {
  return (
    <Section id="about">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Reveal>
          <SpotlightCard as="div" className="h-full p-7 sm:p-10">
            <p className="display text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-snug tracking-tight text-white">
              <Highlight text={ABOUT.headline} />
            </p>
            <div className="mt-6 space-y-4 text-[1.03rem] leading-relaxed text-fg-soft">
              {ABOUT.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            {ABOUT.tags.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {ABOUT.tags.map((tag) => (
                  <li key={tag} className="chip">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </SpotlightCard>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {ABOUT.facts.map((fact, i) => (
            <Reveal key={`${fact.label}-${i}`} delay={100 + i * 90}>
              <SpotlightCard as="div" className="lift flex h-full items-start gap-4 p-5">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg ${
                    FACT_TINTS[i % FACT_TINTS.length]
                  }`}
                >
                  <Icon name={FACT_ICONS[i % FACT_ICONS.length]} size={20} />
                </span>
                <div>
                  <p className="text-[0.8rem] font-semibold uppercase tracking-wider text-muted">{fact.label}</p>
                  <p className="mt-1 text-[0.98rem] leading-snug text-white">{fact.value}</p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
