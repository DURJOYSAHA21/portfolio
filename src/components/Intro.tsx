"use client";

import { useEffect } from "react";
import { PROFILE } from "@/lib/site";

/** How long the intro stays up before the site fades in (ms). Keep in sync with globals.css. */
const DURATION = 1900;

/**
 * Opening animation: the name assembles letter by letter, a line sweeps
 * under it, then the curtain lifts. Plays once per visit (the head script in
 * layout.tsx decides, so there is no flash); skipped for reduced motion.
 * A CSS fail-safe hides it even if this script never runs.
 */
export default function Intro() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== "play") return;
    try {
      sessionStorage.setItem("intro-seen", "1");
    } catch {
      /* fine — it just plays again next visit */
    }
    const skip = () => (html.dataset.intro = "done");
    const timer = setTimeout(skip, DURATION);
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  const name = `${PROFILE.first} ${PROFILE.last}`;
  return (
    <div aria-hidden="true" className="intro">
      <div className="text-center">
        <p className="display text-[clamp(2.2rem,8vw,5rem)] font-extrabold leading-none tracking-[-0.03em] text-white">
          {[...name].map((ch, i) => (
            <span key={i} className="intro-letter" style={{ animationDelay: `${120 + i * 45}ms` }}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
        <span className="intro-line" />
        <p className="intro-role mono mt-5 text-[0.8rem] uppercase tracking-[0.3em] text-fg-soft">
          {PROFILE.roles?.[0] ?? PROFILE.role}
        </p>
      </div>
    </div>
  );
}
