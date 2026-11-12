"use client";

import type { ReactNode } from "react";
import { FEATURES } from "@/lib/site";

/** Max tilt in degrees when "3D tilt cards" is on (/admin → Extra features). */
const TILT = 7;

/** A glass card whose border and sheen light up where the pointer is — and, optionally, tilts toward it. */
export default function SpotlightCard({
  children,
  className = "",
  as: Tag = "article",
  tilt = true,
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "div" | "li";
  /** Set false for cards that animate their own transform (flip cards). */
  tilt?: boolean;
}) {
  const tilting = tilt && FEATURES.tilt;
  return (
    <Tag
      onPointerMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
        if (tilting && e.pointerType === "mouse") {
          el.style.setProperty("--ry", `${((x / r.width - 0.5) * TILT * 2).toFixed(2)}deg`);
          el.style.setProperty("--rx", `${((0.5 - y / r.height) * TILT * 2).toFixed(2)}deg`);
        }
      }}
      onPointerLeave={(e) => {
        if (!tilting) return;
        e.currentTarget.style.setProperty("--rx", "0deg");
        e.currentTarget.style.setProperty("--ry", "0deg");
      }}
      className={`glass spot group ${tilting ? "tilt" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
