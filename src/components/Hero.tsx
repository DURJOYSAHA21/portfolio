import Image from "next/image";
import { CONTACT, CONTENT, PAPER_TOTALS, PROFILE, asset } from "@/lib/site";
import Icon from "./Icons";
import Typewriter from "./Typewriter";

/** Two floating badges beside the portrait, taken from the first stats. */
const BADGES = CONTENT.stats.slice(0, 2).map((s) => ({
  value:
    s.auto === "papers"
      ? String(PAPER_TOTALS.submitted)
      : `${s.decimals ? s.value.toFixed(s.decimals) : Math.round(s.value)}${s.suffix}`,
  label: s.label,
}));

export default function Hero() {
  return (
    <section id="top" className="relative z-10 flex min-h-[100svh] items-center overflow-x-clip pb-20 pt-28 sm:pt-32">
      <div className="shell grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 text-center lg:text-left">
          {PROFILE.status && (
            <p className="enter eyebrow" style={{ animationDelay: "0ms" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
              </span>
              {PROFILE.status}
            </p>
          )}

          <p className="enter mt-7 text-lg text-fg-soft" style={{ animationDelay: "120ms" }}>
            Hi there <span className="wave inline-block">👋</span> I&apos;m
          </p>
          <h1 className="display mt-2 font-extrabold leading-[0.92] tracking-[-0.045em]">
            <span className="enter block text-[clamp(3.2rem,10vw,6.8rem)] text-fg" style={{ animationDelay: "200ms" }}>
              {PROFILE.first}
            </span>
            <span className="enter grad-text block text-[clamp(3.2rem,10vw,6.8rem)]" style={{ animationDelay: "300ms" }}>
              {PROFILE.last}
            </span>
          </h1>

          {PROFILE.roles.length > 0 && (
            <p className="enter mono mt-6 text-[clamp(1.05rem,2.6vw,1.5rem)] text-fg" style={{ animationDelay: "420ms" }}>
              <span className="text-a2">&gt; </span>
              <Typewriter words={PROFILE.roles} />
            </p>
          )}

          <p
            className="enter mx-auto mt-6 max-w-xl text-[1.06rem] leading-relaxed text-fg-soft lg:mx-0"
            style={{ animationDelay: "520ms" }}
          >
            {PROFILE.tagline}
          </p>

          <div
            className="enter mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            style={{ animationDelay: "640ms" }}
          >
            <a href="#projects" className="btn btn-glow">
              View my work <Icon name="arrowRight" size={16} />
            </a>
            {PROFILE.cv && (
              <a href={asset(PROFILE.cv)} download className="btn">
                Download CV <Icon name="download" size={16} />
              </a>
            )}
            <a
              href={CONTACT.github}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="btn !p-3"
            >
              <Icon name="github" />
            </a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Email" className="btn !p-3">
              <Icon name="mail" />
            </a>
          </div>
        </div>

        {PROFILE.photo && (
          <div className="enter relative mx-auto w-[min(78vw,25rem)]" style={{ animationDelay: "250ms" }}>
            <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgb(var(--a1-rgb)/0.4),transparent_65%)] blur-2xl" />
            <div className="relative aspect-square">
              <div className="spin-slow absolute -inset-[6px] rounded-full bg-[conic-gradient(from_0deg,var(--a1),var(--a2),var(--a4),var(--a3),var(--a1))]" />
              <div className="absolute -inset-[2px] rounded-full bg-bg" />
              <div className="absolute inset-[6px] overflow-hidden rounded-full bg-bg-2">
                <Image
                  src={asset(PROFILE.photo)}
                  alt={PROFILE.photoAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 400px, 78vw"
                  className="object-cover"
                  style={{ objectPosition: PROFILE.photoPosition || "50% 30%" }}
                />
              </div>
            </div>

            {BADGES.map((badge, i) => (
              <div
                key={badge.label}
                className={`glass absolute flex items-center gap-3 !rounded-2xl px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] ${
                  i === 0 ? "float-a -left-4 top-[12%] sm:-left-10" : "float-b -right-4 bottom-[10%] sm:-right-8"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-xl text-white ${
                    i === 0 ? "tint-1" : "tint-2"
                  }`}
                >
                  <Icon name={i === 0 ? "graduation" : "flask"} size={18} />
                </span>
                <span className="text-left">
                  <span className="display block text-lg font-bold leading-none text-white">{badge.value}</span>
                  <span className="mt-1 block text-[0.72rem] text-muted">{badge.label}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <a
        href="#about"
        aria-label="Scroll down"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block"
      >
        <span className="flex h-10 w-6 justify-center rounded-full border-2 border-white/25 pt-2">
          <span className="h-2 w-1 animate-bounce rounded-full bg-white/70" />
        </span>
      </a>
    </section>
  );
}
