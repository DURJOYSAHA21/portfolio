"use client";

import { useState, type ReactNode } from "react";
import Icon from "./Icons";

/**
 * Shows the first `shown` items and folds the rest behind a button, so long
 * lists keep the page short. Hidden items stay in the HTML for search engines.
 */
export default function ShowMore({
  items,
  shown,
  noun,
  className = "",
}: {
  items: ReactNode[];
  shown: number;
  noun: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const limit = shown > 0 ? shown : items.length;
  const hidden = items.length - limit;

  return (
    <>
      <ul className={className}>
        {items.map((item, i) => (
          <li key={i} className={!open && i >= limit ? "hidden" : "min-w-0"}>
            {item}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <div className="mt-10 flex justify-center">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn">
            {open ? "Show less" : `Show all ${items.length} ${noun}`}
            <Icon name="arrowRight" size={16} className={open ? "-rotate-90" : "rotate-90"} />
          </button>
        </div>
      )}
    </>
  );
}
