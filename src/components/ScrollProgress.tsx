"use client";

import { useEffect, useRef } from "react";

/** Thin glowing bar along the top edge that fills as the page is read. */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[3px]">
      <div
        ref={bar}
        className="h-full origin-left bg-[linear-gradient(90deg,var(--a1),var(--a2),var(--a4))] shadow-[0_0_12px_var(--a1)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
