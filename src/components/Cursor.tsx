"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, summary";

/**
 * A soft ring that trails the mouse and swells over anything clickable. The
 * normal cursor stays visible; touch screens and reduced-motion visitors never
 * see the ring.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced || !ring.current || !dot.current) return;
    const r = ring.current;
    const d = dot.current;

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;
    let shown = false;

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      r.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      if (Math.abs(target.x - pos.x) > 0.1 || Math.abs(target.y - pos.y) > 0.1) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      d.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      if (!shown) {
        shown = true;
        pos.x = target.x;
        pos.y = target.y;
        r.dataset.on = d.dataset.on = "true";
      }
      const hot = (e.target as Element)?.closest?.(INTERACTIVE);
      r.dataset.hot = hot ? "true" : "";
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      shown = false;
      r.dataset.on = d.dataset.on = "";
    };
    const onDown = () => (r.dataset.down = "true");
    const onUp = () => (r.dataset.down = "");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={ring} aria-hidden="true" className="cursor-ring">
        <span />
      </div>
      <div ref={dot} aria-hidden="true" className="cursor-dot">
        <span />
      </div>
    </>
  );
}
