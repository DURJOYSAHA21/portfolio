"use client";

import { useState } from "react";

const CLAMP = { 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4" } as const;

/** Text cut to a few lines with a "Read more" toggle when it is long. */
export default function Clamp({
  text,
  lines = 3,
  className = "",
}: {
  text: string;
  lines?: 2 | 3 | 4;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const long = text.length > lines * 55;
  return (
    <>
      <p className={`${className} ${long && !open ? CLAMP[lines] : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1 self-start text-[0.8rem] font-semibold text-soft-accent hover:text-white"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </>
  );
}
