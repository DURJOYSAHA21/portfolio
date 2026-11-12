"use client";

import { useEffect, useState } from "react";
import { FEATURES, NAV_LINKS, PROFILE } from "@/lib/site";
import { openCommandPalette } from "./CommandPalette";
import Icon from "./Icons";

/** Floating glass pill: monogram, section links with an active highlight, "Hire me". */
export default function Nav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.querySelectorAll("main section[id]").forEach((s) => observer.observe(s));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const monogram = `${PROFILE.first[0] ?? ""}${PROFILE.last[0] ?? ""}`;

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3 sm:pt-4">
      <nav
        aria-label="Main"
        className={`flex w-full max-w-[860px] items-center gap-2 rounded-full border px-2 py-2 transition-all duration-500 ${
          scrolled || open
            ? "border-white/10 bg-[rgba(10,11,20,0.72)] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <a href="#top" className="group flex items-center gap-2.5 rounded-full pr-3" aria-label="Back to top">
          <span className="display grid h-9 w-9 place-items-center rounded-full tint-1 text-[0.8rem] font-extrabold text-white shadow-[0_0_24px_-4px_rgb(var(--a1-rgb)/0.9)] transition-transform group-hover:rotate-12">
            {monogram}
          </span>
          <span className="display hidden text-[0.95rem] font-semibold text-fg sm:inline">{PROFILE.first}</span>
        </a>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active === id ? "bg-white/10 text-white" : "text-fg-soft hover:text-white"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {FEATURES.commandPalette && (
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search (Ctrl+K)"
            title="Search (Ctrl+K)"
            className="ml-auto grid h-9 place-items-center rounded-full border border-white/10 px-2.5 text-fg-soft transition-colors hover:border-white/25 hover:text-white md:ml-1"
          >
            <span className="flex items-center gap-2">
              <Icon name="search" size={16} />
              <kbd className="mono hidden text-[0.68rem] text-muted lg:inline">Ctrl K</kbd>
            </span>
          </button>
        )}
        <a
          href="#contact"
          className={`btn btn-glow !px-4 !py-2 text-sm md:ml-2 ${FEATURES.commandPalette ? "" : "ml-auto"}`}
        >
          Hire me
        </a>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menu"
          className="grid h-9 w-9 place-items-center rounded-full text-fg hover:bg-white/10 md:hidden"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </nav>

      {open && (
        <ul
          id="mobile-menu"
          className="glass absolute inset-x-3 top-[4.6rem] flex flex-col gap-1 p-2 md:hidden"
        >
          {NAV_LINKS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-[0.98rem] font-medium text-fg-soft hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
