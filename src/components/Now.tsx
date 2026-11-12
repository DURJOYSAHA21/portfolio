import { NOW } from "@/lib/site";
import Icon, { ICON_NAMES, type IconName } from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

const TINTS = ["tint-1", "tint-2", "tint-3", "tint-4"];

/** "What I'm doing now" — a short, dated snapshot edited in /admin → Now. */
export default function Now() {
  return (
    <Section id="now">
      <Reveal className="mb-8 flex flex-wrap items-center justify-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green/10 px-3.5 py-1.5 text-[0.8rem] font-semibold text-green">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
          Live status
        </span>
        {NOW.updated && <span className="text-[0.85rem] text-muted">Updated {NOW.updated}</span>}
      </Reveal>
      {NOW.intro && (
        <Reveal>
          <p className="mx-auto mb-10 max-w-2xl text-center text-[1.03rem] leading-relaxed text-fg-soft">{NOW.intro}</p>
        </Reveal>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NOW.items.map((item, i) => {
          const icon = (ICON_NAMES as string[]).includes(item.icon) ? (item.icon as IconName) : "sparkles";
          return (
            <li key={`${item.label}-${i}`} className="h-full">
              <Reveal delay={i * 90} className="h-full">
                <SpotlightCard as="div" className="lift relative h-full overflow-hidden p-6">
                  <span className="mono absolute right-5 top-4 text-[2.6rem] font-bold leading-none text-white/[0.05]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
                      TINTS[i % TINTS.length]
                    }`}
                  >
                    <Icon name={icon} size={20} />
                  </span>
                  <p className="mt-5 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-a2">{item.label}</p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-fg">{item.text}</p>
                </SpotlightCard>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
