import { CONTENT, SKILLS } from "@/lib/site";
import Icon, { type IconName } from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

/** Picks an icon from the group's name; falls back to cycling a set. */
function iconFor(label: string, i: number): IconName {
  const l = label.toLowerCase();
  if (/language/.test(l)) return "code";
  if (/ai|ml|machine|data/.test(l)) return "brain";
  if (/front|ui|web/.test(l)) return "globe";
  if (/back|server|api/.test(l)) return "cpu";
  if (/data ?base|sql/.test(l)) return "database";
  if (/tool|work/.test(l)) return "wrench";
  return (["layers", "sparkles", "terminal"] as IconName[])[i % 3];
}

const TINTS = ["tint-1", "tint-2", "tint-3", "tint-4"];

export default function Skills() {
  return (
    <Section id="skills">
      {CONTENT.skillsIntro && (
        <Reveal>
          <p className="mx-auto -mt-4 mb-12 max-w-2xl text-center text-[1.03rem] leading-relaxed text-fg-soft">
            {CONTENT.skillsIntro}
          </p>
        </Reveal>
      )}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map((group, i) => (
          <li key={`${group.label}-${i}`} className="h-full">
            <Reveal delay={(i % 3) * 90} className="h-full">
              <SpotlightCard as="div" className="lift h-full p-6">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${
                      TINTS[i % TINTS.length]
                    }`}
                  >
                    <Icon name={iconFor(group.label, i)} size={20} />
                  </span>
                  <h3 className="display text-[1.1rem] font-bold text-white">{group.label}</h3>
                  <span className="mono ml-auto text-xs text-muted">{String(group.items.length).padStart(2, "0")}</span>
                </div>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item} className="chip !text-[0.8rem]">
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
