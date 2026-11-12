"use client";

import { useEffect, useRef } from "react";

/**
 * The living backdrop: drifting colour glows (CSS), a faint grid, an
 * interactive particle network (canvas) and a soft glow that follows the
 * cursor. Everything stops for visitors who prefer reduced motion.
 */
export default function Background() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // particle colours follow the palette chosen in /admin → Theme
    let line = "56 189 248";
    let dot = "34 211 238";
    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      line = css.getPropertyValue("--a1-rgb").trim() || line;
      dot = css.getPropertyValue("--a2-rgb").trim() || dot;
    };
    readColors();
    // the visitor palette switcher changes <html data-palette> at runtime
    const paletteWatch = new MutationObserver(() => {
      readColors();
      if (reduced) draw();
    });
    paletteWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });

    let w = 0;
    let h = 0;
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let points: P[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(80, (w * h) / 16000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of points) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          // gentle pull toward the cursor
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 180 && d > 1) {
            p.x += (dx / d) * 0.25;
            p.y += (dy / d) * 0.25;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${dot} / 0.7)`;
        ctx.fill();
      }
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgb(${line} / ${0.22 * (1 - d / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const p = points[i];
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 180) {
          ctx.strokeStyle = `rgb(${dot} / ${0.45 * (1 - dm / 180)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      if (!reduced && !document.hidden) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (glow.current) glow.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const onVisible = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) draw();
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      paletteWatch.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div className="aurora">
        <span />
        <span />
        <span />
      </div>
      <div className="grid-overlay" />
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-0 opacity-70" />
      <div
        ref={glow}
        className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgb(var(--a1-rgb)/0.12),transparent_60%)] [@media(pointer:fine)]:block"
        style={{ transform: "translate(-999px,-999px)" }}
      />
    </div>
  );
}
