"use client";

import { useEffect, useState } from "react";
import type { Repo } from "@/lib/github";
import { GITHUB_USER, asset, type Build } from "@/lib/site";
import Certificate from "./Certificate";
import Cover from "./Cover";
import Icon from "./Icons";
import Modal from "./Modal";

/** Project pop-up: screenshot gallery, the full story, stack and every link. */
export default function ProjectModal({
  build,
  live,
  onClose,
}: {
  build: Build | null;
  live?: Repo;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const shots = build ? [build.image, ...(build.gallery ?? [])].filter(Boolean) : [];
  const count = shots.length;

  useEffect(() => {
    if (!build || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [build, count]);

  if (!build) return null;
  const href = live?.html_url ?? (build.repo ? `https://github.com/${GITHUB_USER}/${build.repo}` : "");
  const current = shots[Math.min(index, count - 1)];

  return (
    <Modal open label={build.title} onClose={onClose} className="max-w-5xl">
      <div className="min-h-0 overflow-y-auto">
        <div className="relative bg-black/40">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded screenshots of any size, shown whole
            <img
              key={current}
              src={asset(current)}
              alt={`${build.title} — screenshot ${index + 1} of ${count}`}
              className="modal-pop mx-auto max-h-[52vh] w-full object-contain"
            />
          ) : (
            <Cover
              title={build.title}
              icon={build.track === "course" ? "graduation" : "rocket"}
              tags={build.stack}
              className="aspect-[21/9] w-full"
            />
          )}
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous screenshot"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                <Icon name="chevronLeft" />
              </button>
              <button
                type="button"
                aria-label="Next screenshot"
                onClick={() => setIndex((i) => (i + 1) % count)}
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                <Icon name="chevronRight" />
              </button>
              <span className="mono absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.72rem] text-white">
                {index + 1} / {count}
              </span>
            </>
          )}
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur hover:bg-black/70"
          >
            <Icon name="close" />
          </button>
        </div>

        {count > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-5 py-3">
            {shots.map((shot, i) => (
              <button
                key={`${shot}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show screenshot ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity ${
                  i === index ? "border-a1" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnails */}
                <img src={asset(shot)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_220px]">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[0.78rem]">
              <span className="chip">{build.track === "course" ? "Course project" : "Personal project"}</span>
              {build.period && <span className="mono text-a2">{build.period}</span>}
            </p>
            <h3 className="display mt-3 text-[clamp(1.5rem,3.5vw,2.1rem)] font-bold leading-tight text-white">
              {build.title}
            </h3>
            <div className="mt-4 space-y-3 text-[0.98rem] leading-relaxed text-fg-soft">
              {build.blurb
                .split(/\n+/)
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>

          <aside className="space-y-6">
            {build.stack.length > 0 && (
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted">Built with</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {build.stack.map((tech) => (
                    <li key={tech} className="chip">
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {live && (live.stargazers_count > 0 || live.language) && (
              <div className="flex gap-4 text-sm text-fg-soft">
                {live.stargazers_count > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="star" size={15} className="text-amber" /> {live.stargazers_count}
                  </span>
                )}
                {live.language && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="code" size={15} className="text-a2" /> {live.language}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {build.demo && (
                <a href={build.demo} target="_blank" rel="noreferrer noopener" className="btn btn-glow justify-center">
                  <Icon name="globe" size={16} /> Live demo
                </a>
              )}
              {href && (
                <a href={href} target="_blank" rel="noreferrer noopener" className="btn justify-center">
                  <Icon name="github" size={16} /> View code
                </a>
              )}
              <Certificate
                file={build.certificate}
                link={build.certificateLink}
                title={build.title}
                className="justify-center !py-2.5"
              />
            </div>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
