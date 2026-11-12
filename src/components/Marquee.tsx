import { SKILLS } from "@/lib/site";

const WORDS = [...new Set(SKILLS.flatMap((g) => g.items))];

function Row({ words, reverse = false }: { words: string[]; reverse?: boolean }) {
  const track = (
    <div className="marquee-track" aria-hidden="true">
      {words.map((word) => (
        <span
          key={word}
          className="display flex shrink-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[0.95rem] font-semibold text-fg-soft"
        >
          <span className="h-1.5 w-1.5 rounded-full tint-1" />
          {word}
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marquee ${reverse ? "marquee-reverse" : ""}`}>
      {track}
      {track}
    </div>
  );
}

/** Two endless rows of skills drifting in opposite directions. */
export default function Marquee() {
  if (WORDS.length < 4) return null;
  const half = Math.ceil(WORDS.length / 2);
  return (
    <div className="relative z-10 space-y-3 py-10" aria-label={`Skills: ${WORDS.join(", ")}`}>
      <Row words={WORDS.slice(0, half)} />
      <Row words={WORDS.slice(half)} reverse />
    </div>
  );
}
