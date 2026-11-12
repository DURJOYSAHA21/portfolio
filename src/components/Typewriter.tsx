"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./motion";

/** Types each word, pauses, deletes it, moves to the next. Static under reduced motion. */
export default function Typewriter({ words, className = "" }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || words.length === 0) return;
    const word = words[index % words.length];
    let delay = deleting ? 40 : 85;
    if (!deleting && text === word) delay = 1600;
    if (deleting && text === "") delay = 300;

    const id = setTimeout(() => {
      if (!deleting && text === word) setDeleting(true);
      else if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => i + 1);
      } else setText(word.slice(0, text.length + (deleting ? -1 : 1)));
    }, delay);
    return () => clearTimeout(id);
  }, [text, deleting, index, words, reduced]);

  if (words.length === 0) return null;
  const shown = reduced ? words[0] : text;
  return (
    <span className={className}>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true">
        {shown}
        <span className="caret" />
      </span>
    </span>
  );
}
