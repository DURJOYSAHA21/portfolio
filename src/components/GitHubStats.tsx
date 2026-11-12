"use client";

import { useEffect, useRef, useState } from "react";
import { getContributions, getRepos, getUser, type Contributions, type GitHubUser, type Repo } from "@/lib/github";
import { CONTACT } from "@/lib/site";
import CountUp from "./CountUp";
import Icon, { type IconName } from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

const LEVELS = ["bg-white/[0.06]", "lvl-1", "lvl-2", "lvl-3", "lvl-4"];
const LANG_COLORS = ["var(--a1)", "var(--a2)", "var(--a4)", "var(--a3)", "rgb(255 255 255 / 0.35)"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Data = { user: GitHubUser | null; repos: Repo[] | null; calendar: Contributions | null };

/** Live numbers from GitHub: totals, the contribution calendar and top languages. */
export default function GitHubStats() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getUser(), getRepos(), getContributions()]).then(([user, repos, calendar]) => {
      if (alive) setData({ user, repos, calendar });
    });
    return () => {
      alive = false;
    };
  }, []);

  const own = data?.repos?.filter((r) => !r.fork) ?? [];
  const stars = own.reduce((n, r) => n + r.stargazers_count, 0);
  const tiles: { label: string; value: number | undefined; icon: IconName; tint: string }[] = [
    { label: "Contributions this year", value: data?.calendar?.total, icon: "flame", tint: "tint-1" },
    { label: "Public repositories", value: data?.user?.public_repos ?? (data?.repos ? own.length : undefined), icon: "book", tint: "tint-2" },
    { label: "Stars earned", value: data?.repos ? stars : undefined, icon: "star", tint: "tint-3" },
    { label: "Followers", value: data?.user?.followers, icon: "users", tint: "tint-4" },
  ];
  const failed = data && !data.user && !data.repos && !data.calendar;

  return (
    <Section id="github">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <Reveal key={t.label} delay={i * 80}>
            <SpotlightCard as="div" className="lift h-full p-5">
              <span className={`grid h-10 w-10 place-items-center rounded-xl text-white ${t.tint}`}>
                <Icon name={t.icon} size={19} />
              </span>
              <p className="display mt-4 text-[clamp(1.7rem,4vw,2.2rem)] font-bold leading-none text-white">
                {t.value === undefined ? (
                  <span className={`inline-block h-8 w-16 rounded-lg bg-white/10 ${data ? "" : "animate-pulse"}`} />
                ) : (
                  <CountUp value={t.value} />
                )}
              </p>
              <p className="mt-2 text-sm font-medium text-fg-soft">{t.label}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <Reveal className="min-w-0">
          <SpotlightCard as="div" tilt={false} className="h-full p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="display font-bold text-white">Contribution calendar</h3>
              <span className="text-[0.78rem] text-muted">last 12 months</span>
            </div>
            {data?.calendar ? (
              <Calendar days={data.calendar.days} />
            ) : (
              <div className={`mt-5 h-[118px] rounded-xl bg-white/[0.04] ${data ? "" : "animate-pulse"}`}>
                {data && (
                  <p className="grid h-full place-items-center text-sm text-muted">The calendar could not load right now.</p>
                )}
              </div>
            )}
          </SpotlightCard>
        </Reveal>

        <Reveal delay={90}>
          <SpotlightCard as="div" tilt={false} className="h-full p-5 sm:p-6">
            <h3 className="display font-bold text-white">Top languages</h3>
            {own.length ? <Languages repos={own} /> : <div className="mt-5 h-24 animate-pulse rounded-xl bg-white/[0.04]" />}
          </SpotlightCard>
        </Reveal>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        {failed && <p className="text-sm text-muted">GitHub is not answering right now — the numbers will be back on the next visit.</p>}
        <a href={CONTACT.github} target="_blank" rel="noreferrer noopener" className="btn">
          <Icon name="github" size={16} /> Follow on GitHub
        </a>
      </div>
    </Section>
  );
}

function Calendar({ days }: { days: Contributions["days"] }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // newest weeks on the right — start scrolled there on narrow screens
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, []);

  // pad the first week so each column runs Sunday → Saturday
  const first = new Date(`${days[0].date}T00:00:00`).getDay();
  const cells: (Contributions["days"][number] | null)[] = [...Array(first).fill(null), ...days];
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <>
      <div ref={scroller} className="mt-5 overflow-x-auto pb-2">
        <div className="flex min-w-[620px] flex-col gap-1.5">
          <div className="flex gap-[3px] text-[0.65rem] text-muted">
            {weeks.map((week, i) => {
              const day = week.find(Boolean);
              const d = day ? new Date(`${day.date}T00:00:00`) : null;
              const label = d && d.getDate() <= 7 ? MONTHS[d.getMonth()] : "";
              return (
                <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
                  {label}
                </span>
              );
            })}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col gap-[3px]">
                {week.map((day, j) =>
                  day ? (
                    <span
                      key={day.date}
                      title={`${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`}
                      className={`heat aspect-square w-full rounded-[3px] ${LEVELS[day.level]}`}
                      style={{ animationDelay: `${i * 12}ms` }}
                    />
                  ) : (
                    <span key={`pad-${j}`} className="aspect-square w-full" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[0.7rem] text-muted">
        Less
        {LEVELS.map((c) => (
          <span key={c} className={`h-[10px] w-[10px] rounded-[3px] ${c}`} />
        ))}
        More
      </div>
    </>
  );
}

function Languages({ repos }: { repos: Repo[] }) {
  const counts = new Map<string, number>();
  for (const r of repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (!total) return <p className="mt-4 text-sm text-muted">No languages detected yet.</p>;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4).reduce((n, [, c]) => n + c, 0);
  const rows = rest ? [...top, ["Other", rest] as [string, number]] : top;

  return (
    <>
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/5">
        {rows.map(([lang, n], i) => (
          <span key={lang} style={{ width: `${(n / total) * 100}%`, background: LANG_COLORS[i] }} className="h-full" />
        ))}
      </div>
      <ul className="mt-5 space-y-2.5">
        {rows.map(([lang, n], i) => (
          <li key={lang} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: LANG_COLORS[i] }} />
            <span className="text-fg">{lang}</span>
            <span className="mono ml-auto text-[0.78rem] text-muted">{Math.round((n / total) * 100)}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[0.72rem] text-muted">By number of repositories.</p>
    </>
  );
}
