"use client";

import { useEffect, useState } from "react";
import { useInView, useReducedMotion } from "./motion";

/** Counts up to `value` once it scrolls into view. Renders the final value on the server. */
export default function CountUp({
  value,
  decimals = 0,
  suffix = "",
  className = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduced]);

  const n = shown ?? value;
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {decimals ? n.toFixed(decimals) : Math.round(n)}
      {suffix}
    </span>
  );
}
