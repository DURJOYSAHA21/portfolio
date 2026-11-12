"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PALETTES } from "@/lib/content";
import {
  ACTIVE_SECTIONS,
  ARENAS,
  BUILDS,
  CONTACT,
  FEATURES,
  HONORS,
  PROFILE,
  RESEARCH,
  SECTIONS,
  asset,
  plain,
} from "@/lib/site";
import Icon, { type IconName } from "./Icons";
import Modal from "./Modal";
import { setVisitorPalette } from "./PaletteSwitcher";

/** `keep` leaves the palette open after running (e.g. "Copy my email" shows "Copied!"). */
type Item = { group: string; label: string; hint?: string; icon: IconName; run: () => void; keywords?: string; keep?: boolean };

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/** Opens the palette from anywhere (the nav button uses it). */
export const openCommandPalette = () => window.dispatchEvent(new Event("cmdk:open"));

/** Ctrl/⌘ + K (or "/") search over every section, project, paper and award, plus quick actions. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable]");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen);
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    out.push({ group: "Go to", label: "Top of the page", icon: "arrowUp", run: () => window.scrollTo({ top: 0, behavior: "smooth" }) });
    for (const id of ACTIVE_SECTIONS)
      out.push({
        group: "Go to",
        label: SECTIONS[id].nav || plain(SECTIONS[id].title),
        hint: plain(SECTIONS[id].title),
        icon: "arrowRight",
        run: () => go(id),
        keywords: id,
      });
    for (const b of BUILDS)
      out.push({
        group: "Projects",
        label: b.title,
        hint: b.stack.slice(0, 3).join(" · "),
        icon: "rocket",
        keywords: b.stack.join(" "),
        run: () => {
          go("projects");
          if (FEATURES.projectDetails) window.dispatchEvent(new CustomEvent("project:open", { detail: b.title }));
        },
      });
    for (const p of RESEARCH)
      out.push({
        group: "Research",
        label: p.title,
        hint: p.venue,
        icon: "flask",
        run: () => (p.link ? window.open(p.link, "_blank", "noopener") : go("research")),
      });
    for (const a of ARENAS)
      out.push({ group: "Competitions", label: `${a.event} — ${a.title}`, hint: a.year, icon: "trophy", run: () => go("competitions") });
    for (const h of HONORS)
      out.push({ group: "Honors", label: h.title, hint: h.issuer, icon: "award", run: () => go("honors") });

    out.push({
      group: "Actions",
      label: "Copy my email",
      hint: CONTACT.email,
      icon: "copy",
      keep: true,
      run: () => {
        navigator.clipboard?.writeText(CONTACT.email).then(() => setCopied(true));
      },
    });
    out.push({ group: "Actions", label: "Send me an email", icon: "mail", run: () => (window.location.href = `mailto:${CONTACT.email}`) });
    if (PROFILE.cv) out.push({ group: "Actions", label: "Download my CV", icon: "download", run: () => window.open(asset(PROFILE.cv), "_blank") });
    out.push({ group: "Actions", label: "Open my GitHub", icon: "github", run: () => window.open(CONTACT.github, "_blank", "noopener") });
    for (const p of PALETTES.filter((p) => p.value !== "custom"))
      out.push({
        group: "Colour theme",
        label: `Switch to ${p.label}`,
        hint: p.note,
        icon: "droplet",
        keywords: "palette colour color theme",
        run: () => setVisitorPalette(p.value),
      });
    return out;
  }, []);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return items.filter((i) => i.group !== "Research" && i.group !== "Competitions" && i.group !== "Honors");
    return items.filter((i) => {
      const text = `${i.group} ${i.label} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [items, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
    setCopied(false);
  };

  const pick = (item: Item) => {
    if (item.keep) {
      item.run();
      return;
    }
    close();
    // let the dialog unmount (and give scroll back) before jumping
    setTimeout(item.run, 30);
  };

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let lastGroup = "";
  return (
    <Modal open={open} onClose={close} label="Search the site" align="top" className="max-w-xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-4">
        <Icon name="search" className="shrink-0 text-muted" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              pick(results[active]);
            }
          }}
          placeholder="Search projects, papers, sections…"
          aria-label="Search"
          aria-controls="cmdk-list"
          aria-activedescendant={results[active] ? `cmdk-${active}` : undefined}
          style={{ outline: "none" }}
          className="h-14 w-full bg-transparent text-[1rem] text-white placeholder:text-muted"
        />
        <kbd className="mono hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[0.7rem] text-muted sm:block">Esc</kbd>
      </div>
      <ul id="cmdk-list" ref={list} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
        {results.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted">Nothing matches “{query}”.</li>}
        {results.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : "";
          lastGroup = item.group;
          const copiedRow = copied && item.icon === "copy";
          return (
            <li key={`${item.group}-${item.label}-${i}`} role="presentation">
              {header && (
                <p className="px-3 pb-1.5 pt-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{header}</p>
              )}
              <button
                type="button"
                id={`cmdk-${i}`}
                role="option"
                aria-selected={i === active}
                data-index={i}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-white/10 text-white" : "text-fg-soft"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    i === active ? "tint-1 text-white" : "bg-white/5 text-fg-soft"
                  }`}
                >
                  <Icon name={copiedRow ? "check" : item.icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.92rem] font-medium">{copiedRow ? "Copied!" : item.label}</span>
                  {item.hint && <span className="block truncate text-[0.76rem] text-muted">{item.hint}</span>}
                </span>
                {i === active && <Icon name="arrowRight" size={15} className="shrink-0 text-muted" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2.5 text-[0.72rem] text-muted">
        <span>
          <kbd className="mono">↑↓</kbd> move
        </span>
        <span>
          <kbd className="mono">Enter</kbd> open
        </span>
        <span className="ml-auto">
          <kbd className="mono">Ctrl K</kbd> anytime
        </span>
      </div>
    </Modal>
  );
}
