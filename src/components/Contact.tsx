"use client";

import { useState } from "react";
import { CONTACT, CONTENT, GITHUB_USER, PROFILE, asset } from "@/lib/site";
import Highlight from "./Highlight";
import Icon, { type IconName } from "./Icons";
import Reveal from "./Reveal";
import Section from "./Section";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };

  type Detail = { icon: IconName; label: string; value: string; href?: string; note?: string; external?: boolean; download?: boolean };
  const details = [
    { icon: "github", label: "GitHub", value: `@${GITHUB_USER}`, href: CONTACT.github, external: true },
    CONTACT.phone && { icon: "phone", label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
    CONTACT.location && { icon: "pin", label: "Location", value: CONTACT.location, note: CONTACT.timezone },
    PROFILE.cv && { icon: "file", label: "CV", value: CONTENT.contactCopy.cvTitle || "Download", href: asset(PROFILE.cv), download: true },
  ].filter(Boolean) as Detail[];

  return (
    <Section id="contact">
      <Reveal>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[28px] p-[1.5px]">
          {/* spinning gradient border */}
          <div className="spin-slow absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--a1)_60deg,var(--a2)_120deg,transparent_180deg,transparent_360deg)]" />
          <div className="relative rounded-[27px] bg-[radial-gradient(ellipse_at_top,var(--deep),#0a0b14_70%)] px-6 py-12 text-center sm:px-14 sm:py-16">
            <p className="display text-[clamp(1.6rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-white">
              <Highlight text={CONTENT.contactCopy.headline} />
            </p>
            {CONTENT.contactCopy.body && (
              <p className="mx-auto mt-5 max-w-xl text-[1.03rem] leading-relaxed text-fg-soft">{CONTENT.contactCopy.body}</p>
            )}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href={`mailto:${CONTACT.email}`} className="btn btn-glow !px-6 !py-3.5 text-base">
                <Icon name="mail" size={18} /> {CONTACT.email}
              </a>
              <button type="button" onClick={copyEmail} className="btn !py-3.5" aria-live="polite">
                <Icon name={copied ? "check" : "copy"} size={16} /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <ul className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {details.map((d, i) => {
          const body = (
            <>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-a2 transition-colors group-hover:bg-[linear-gradient(135deg,var(--b1),var(--a1))] group-hover:text-white">
                <Icon name={d.icon} size={18} />
              </span>
              <span className="mt-4 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted">{d.label}</span>
              <span className="mt-1 block break-words text-[0.92rem] font-medium text-white">{d.value}</span>
              {d.note && <span className="mt-0.5 block text-[0.78rem] text-muted">{d.note}</span>}
            </>
          );
          return (
            <li key={d.label}>
              <Reveal delay={i * 80} className="h-full">
                {d.href ? (
                  <a
                    href={d.href}
                    className="glass lift group block h-full p-5"
                    {...(d.external && { target: "_blank", rel: "noreferrer noopener" })}
                    {...(d.download && { download: true })}
                  >
                    {body}
                  </a>
                ) : (
                  <div className="glass group h-full p-5">{body}</div>
                )}
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
