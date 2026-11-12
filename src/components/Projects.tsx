"use client";

import { useEffect, useState } from "react";
import { getRepos, type Repo } from "@/lib/github";
import { BUILDS, DISPLAY, FEATURES, GITHUB_USER, type Build } from "@/lib/site";
import Certificate from "./Certificate";
import Cover from "./Cover";
import Icon from "./Icons";
import ProjectModal from "./ProjectModal";
import Reveal from "./Reveal";
import Section from "./Section";
import SpotlightCard from "./SpotlightCard";

type Filter = "all" | "course" | "personal";

function relTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}

export default function Projects() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  const [detail, setDetail] = useState<Build | null>(null);

  useEffect(() => {
    let alive = true;
    getRepos().then((data) => alive && setRepos(data));
    // the command palette (Ctrl+K) asks for a project by title
    const onOpen = (e: Event) => {
      const title = (e as CustomEvent<string>).detail;
      const build = BUILDS.find((b) => b.title === title);
      if (build) setDetail(build);
    };
    window.addEventListener("project:open", onOpen);
    return () => {
      alive = false;
      window.removeEventListener("project:open", onOpen);
    };
  }, []);
  const liveOf = (build: Build) => (build.repo ? repos?.find((r) => r.name === build.repo) : undefined);

  const counts = {
    all: BUILDS.length,
    course: BUILDS.filter((b) => b.track === "course").length,
    personal: BUILDS.filter((b) => b.track === "personal").length,
  };
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "course", label: "Course projects" },
    { id: "personal", label: "Personal" },
  ];
  const list = BUILDS.filter((b) => filter === "all" || b.track === filter);
  const limit = DISPLAY.projectsShown > 0 ? DISPLAY.projectsShown : list.length;
  const visible = showAll ? list : list.slice(0, limit);

  return (
    <Section id="projects">
      {counts.course > 0 && counts.personal > 0 && (
        <Reveal className="mb-10 flex justify-center">
          <div role="tablist" aria-label="Filter projects" className="glass flex gap-1 !rounded-full p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={filter === tab.id}
                onClick={() => {
                  setFilter(tab.id);
                  setShowAll(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  filter === tab.id
                    ? "bg-[linear-gradient(90deg,var(--b1),var(--b2))] text-white shadow-[0_8px_24px_-8px_rgb(var(--a1-rgb)/0.8)]"
                    : "text-fg-soft hover:text-white"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">{counts[tab.id]}</span>
              </button>
            ))}
          </div>
        </Reveal>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((build, i) => (
          <li key={`${filter}-${build.title}-${i}`} className="h-full">
            <Reveal delay={(i % 3) * 90} className="h-full">
              <ProjectCard
                build={build}
                live={liveOf(build)}
                onOpen={FEATURES.projectDetails ? () => setDetail(build) : undefined}
              />
            </Reveal>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        {list.length > limit && (
          <button type="button" onClick={() => setShowAll((s) => !s)} className="btn" aria-expanded={showAll}>
            {showAll ? "Show less" : `Show all ${list.length} projects`}
            <Icon name="arrowRight" size={16} className={showAll ? "-rotate-90" : "rotate-90"} />
          </button>
        )}
        <a
          href={`https://github.com/${GITHUB_USER}?tab=repositories`}
          target="_blank"
          rel="noreferrer noopener"
          className="btn"
        >
          <Icon name="github" size={16} /> More on GitHub
        </a>
      </div>
      {detail && (
        <ProjectModal key={detail.title} build={detail} live={liveOf(detail)} onClose={() => setDetail(null)} />
      )}
    </Section>
  );
}

function ProjectCard({ build, live, onOpen }: { build: Build; live?: Repo; onOpen?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const href = live?.html_url ?? (build.repo ? `https://github.com/${GITHUB_USER}/${build.repo}` : null);
  const updated = live ? relTime(live.pushed_at) : null;
  const long = build.blurb.length > 190;
  const shots = [build.image, ...(build.gallery ?? [])].filter(Boolean).length;

  return (
    <SpotlightCard className="lift flex h-full flex-col overflow-hidden">
      <div className="relative">
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open details: ${build.title}`}
            className="peer absolute inset-0 z-10 cursor-pointer"
          />
        )}
        <Cover
          title={build.title}
          image={build.image}
          icon={build.track === "course" ? "graduation" : "rocket"}
          tags={build.stack}
          className="aspect-[16/10] w-full"
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-md">
          {build.track === "course" ? "Course project" : "Personal project"}
        </span>
        {live && live.stargazers_count > 0 && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[0.7rem] font-semibold text-amber backdrop-blur-md">
            <Icon name="star" size={12} /> {live.stargazers_count}
          </span>
        )}
        {onOpen && (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-black opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100">
            {shots > 1 ? (
              <>
                <Icon name="image" size={13} /> {shots} screenshots
              </>
            ) : (
              <>
                <Icon name="eye" size={13} /> View details
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {build.period && <p className="mono text-[0.75rem] text-a2">{build.period}</p>}
        <h3 className="display mt-1.5 text-[1.25rem] font-bold leading-tight tracking-tight text-white">
          {build.title}
        </h3>
        <p className={`mt-3 text-[0.92rem] leading-relaxed text-fg-soft ${long && !expanded ? "line-clamp-4" : ""}`}>
          {build.blurb}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => (onOpen ? onOpen() : setExpanded((e) => !e))}
            className="mt-1.5 self-start text-[0.82rem] font-semibold text-soft-accent hover:text-white"
          >
            {onOpen ? "Read more →" : expanded ? "Show less" : "Read more"}
          </button>
        )}

        {build.stack.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {build.stack.map((tech) => (
              <li key={tech} className="chip">
                {tech}
              </li>
            ))}
          </ul>
        )}

        {(href || updated || build.demo || build.certificate || build.certificateLink) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-6 text-sm">
            {build.demo && (
              <a
                href={build.demo}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-semibold text-a2 hover:text-white"
              >
                <Icon name="globe" size={16} /> Live demo
              </a>
            )}
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-a2"
              >
                <Icon name="github" size={16} /> View code
                <Icon name="arrowRight" size={14} className="transition-transform group-hover:translate-x-1" />
              </a>
            )}
            <Certificate file={build.certificate} link={build.certificateLink} title={build.title} />
            {updated && <span className="ml-auto text-[0.78rem] text-muted">updated {updated}</span>}
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
