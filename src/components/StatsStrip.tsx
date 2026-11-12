import { CONTENT, PAPER_TOTALS } from "@/lib/site";
import CountUp from "./CountUp";
import Icon, { type IconName } from "./Icons";
import Reveal from "./Reveal";
import SpotlightCard from "./SpotlightCard";

/** Stats live in the content file; an "auto: papers" stat is counted from the research list. */
const STATS = CONTENT.stats.map((stat) =>
  stat.auto === "papers"
    ? {
        ...stat,
        value: PAPER_TOTALS.submitted,
        note: `${PAPER_TOTALS.accepted} accepted · ${PAPER_TOTALS.underReview} under review`,
      }
    : stat
);

const ICONS: IconName[] = ["graduation", "flask", "code", "terminal", "trophy", "star"];
const TINTS = ["tint-1", "tint-2", "tint-3", "tint-4"];

export default function StatsStrip() {
  if (!STATS.length) return null;
  return (
    <div className="relative z-10 shell -mt-6 pb-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={`${stat.label}-${i}`} delay={i * 90}>
            <SpotlightCard as="div" className="lift h-full p-5 sm:p-6">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl text-white ${TINTS[i % TINTS.length]}`}
              >
                <Icon name={ICONS[i % ICONS.length]} size={19} />
              </span>
              <p className="display mt-4 text-[clamp(1.8rem,4vw,2.4rem)] font-bold leading-none text-white">
                <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm font-semibold text-fg">{stat.label}</p>
              {stat.note && <p className="mt-0.5 text-[0.8rem] leading-snug text-muted">{stat.note}</p>}
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
