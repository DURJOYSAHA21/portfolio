"use client";

import { useEffect, useRef, useState } from "react";
import { EDUCATION } from "@/lib/site";
import Certificate from "./Certificate";
import Icon from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

const TINTS = ["tint-1", "tint-2", "tint-3"];

/** A timeline whose glowing line fills in as you scroll past it. */
export default function Education() {
  const wrap = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.6;
      setProgress(Math.max(0, Math.min(1, (mid - r.top) / r.height)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Section id="education">
      <ol ref={wrap} className="relative mx-auto max-w-4xl space-y-8 pl-10 sm:pl-16">
        <span aria-hidden="true" className="absolute bottom-2 left-[15px] top-2 w-[2px] rounded-full bg-white/10 sm:left-[23px]" />
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-2 w-[2px] rounded-full bg-[linear-gradient(180deg,var(--a1),var(--a2),var(--a4))] shadow-[0_0_14px_rgb(var(--a1-rgb)/0.9)] transition-[height] duration-150 sm:left-[23px]"
          style={{ height: `calc(${progress * 100}% - 1rem)` }}
        />
        {EDUCATION.map((edu, i) => (
          <li key={`${edu.level}-${i}`} className="relative">
            <span
              aria-hidden="true"
              className={`absolute -left-10 top-6 grid h-8 w-8 place-items-center rounded-full text-white shadow-[0_0_20px_rgb(var(--a1-rgb)/0.55)] ring-4 ring-bg sm:-left-16 sm:h-12 sm:w-12 ${
                TINTS[i % TINTS.length]
              }`}
            >
              <Icon name="graduation" size={i === 0 ? 20 : 16} />
            </span>
            <Reveal delay={i * 80}>
              <SpotlightCard as="div" className="lift p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="mono inline-block rounded-md bg-white/10 px-2 py-0.5 text-[0.72rem] font-semibold text-a2">
                      {edu.level}
                    </span>
                    <h3 className="display mt-2 text-[1.2rem] font-bold leading-snug text-white">{edu.degree}</h3>
                    <p className="mt-1 text-[0.95rem] text-fg-soft">
                      {edu.school}
                      {edu.board && <span className="text-muted"> · {edu.board}</span>}
                    </p>
                  </div>
                  <span className="mono shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.75rem] text-fg-soft">
                    {edu.period}
                  </span>
                </div>
                {edu.result && (
                  <p className="mt-5 flex items-baseline gap-3">
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted">{edu.resultLabel}</span>
                    <span className="display grad-text text-[1.9rem] font-extrabold leading-none">{edu.result}</span>
                  </p>
                )}
                {edu.points.length > 0 && (
                  <ul className="mt-5 space-y-2 text-[0.92rem] leading-relaxed text-fg-soft">
                    {edu.points.map((point, j) => (
                      <li key={j} className="flex gap-2.5">
                        <Icon name="check" size={16} className="mt-1 shrink-0 text-green" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
                {(edu.certificate || edu.certificateLink) && (
                  <div className="mt-5">
                    <Certificate file={edu.certificate} link={edu.certificateLink} title={edu.degree} />
                  </div>
                )}
              </SpotlightCard>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
