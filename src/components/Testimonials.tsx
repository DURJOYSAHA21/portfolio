import Image from "next/image";
import { TESTIMONIALS, asset } from "@/lib/site";
import Icon from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

const TINTS = ["tint-1", "tint-2", "tint-3", "tint-4"];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** Quotes from teachers, supervisors and teammates — /admin → Testimonials. */
export default function Testimonials() {
  const cols = TESTIMONIALS.length === 1 ? "max-w-2xl mx-auto" : TESTIMONIALS.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <Section id="testimonials">
      <ul className={`grid gap-5 ${cols}`}>
        {TESTIMONIALS.map((t, i) => (
          <li key={`${t.name}-${i}`} className="h-full">
            <Reveal delay={(i % 3) * 90} className="h-full">
              <SpotlightCard as="div" className="lift relative flex h-full flex-col overflow-hidden p-7">
                <Icon
                  name="quote"
                  size={64}
                  strokeWidth={1.2}
                  className="pointer-events-none absolute -right-2 -top-2 text-white/[0.06]"
                />
                <Icon name="quote" size={26} className="text-a2" />
                <blockquote className="mt-4 flex-1 text-[1.02rem] leading-relaxed text-fg">“{t.quote}”</blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  {t.photo ? (
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15">
                      <Image src={asset(t.photo)} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                  ) : (
                    <span
                      className={`display grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                        TINTS[i % TINTS.length]
                      }`}
                    >
                      {initials(t.name) || "?"}
                    </span>
                  )}
                  <div className="min-w-0">
                    {t.link ? (
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="display font-semibold text-white hover:text-a2"
                      >
                        {t.name}
                      </a>
                    ) : (
                      <p className="display font-semibold text-white">{t.name}</p>
                    )}
                    {t.role && <p className="text-[0.82rem] leading-snug text-muted">{t.role}</p>}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
