"use client";

import { useEffect, useRef, useState } from "react";
import { PALETTES, type Palette } from "@/lib/content";
import { CONTENT } from "@/lib/site";
import Icon from "./Icons";

/** Visitors' own pick, remembered in this browser only (the saved site palette stays the default). */
export const VISITOR_KEY = "visitor-palette";
const SITE_PALETTE: Palette = CONTENT.theme?.palette ?? "ocean";

export function setVisitorPalette(value: Palette) {
  document.documentElement.dataset.palette = value;
  try {
    if (value === SITE_PALETTE) localStorage.removeItem(VISITOR_KEY);
    else localStorage.setItem(VISITOR_KEY, value);
  } catch {
    /* private mode: the switch still works for this visit */
  }
  window.dispatchEvent(new Event("palette:change"));
}

/** Floating colour dot (bottom-left) that lets visitors try the other palettes. */
export default function PaletteSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(SITE_PALETTE);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setCurrent(document.documentElement.dataset.palette ?? SITE_PALETTE);
    sync();
    window.addEventListener("palette:change", sync);
    return () => window.removeEventListener("palette:change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const options = PALETTES.filter((p) => p.value !== "custom" || SITE_PALETTE === "custom");
  const custom = CONTENT.theme?.custom;

  return (
    <div ref={root} className="fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6">
      {open && (
        <div
          role="radiogroup"
          aria-label="Colour theme"
          className="glass modal-pop absolute bottom-14 left-0 w-56 p-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Colour theme
          </p>
          {options.map((p) => {
            const colors = p.value === "custom" && custom ? [custom.a1, custom.a2, custom.a4, custom.a3] : p.colors;
            const on = current === p.value;
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setVisitorPalette(p.value)}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  on ? "bg-white/10 text-white" : "text-fg-soft hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex -space-x-1.5">
                  {colors.slice(0, 3).map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full border border-black/40" style={{ background: c }} />
                  ))}
                </span>
                <span className="flex-1">{p.label}</span>
                {p.value === SITE_PALETTE && <span className="text-[0.65rem] text-muted">default</span>}
                {on && <Icon name="check" size={14} className="text-a2" />}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Change colour theme"
        title="Change colour theme"
        className="group grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[rgba(10,11,20,0.75)] shadow-lg backdrop-blur-xl transition-transform hover:scale-110"
      >
        <span className="tint-1 grid h-6 w-6 place-items-center rounded-full transition-transform duration-500 group-hover:rotate-[20deg]">
          <Icon name="droplet" size={13} className="text-white" />
        </span>
      </button>
    </div>
  );
}
