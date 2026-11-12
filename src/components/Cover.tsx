import Image from "next/image";
import { asset } from "@/lib/site";
import Icon, { type IconName } from "./Icons";

/**
 * Card picture. Shows the uploaded image when there is one; otherwise draws
 * artwork from the title — a colour mix, a pattern, the initials and the first
 * few technologies — so every card has a distinct, honest visual.
 */
/** Every ordered pick of 3 from the palette's accents (/admin → Theme), so cards differ but stay on-palette. */
const ACCENTS = ["var(--b1)", "var(--a2)", "var(--a3)", "var(--a4)", "var(--a1)"];
const PALETTES: string[][] = [];
for (const a of ACCENTS) for (const b of ACCENTS) for (const c of ACCENTS) if (a !== b && b !== c && a !== c) PALETTES.push([a, b, c]);

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const initials = (title: string) =>
  title
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function Pattern({ variant, id }: { variant: number; id: string }) {
  if (variant === 0)
    return (
      <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" fill="white" />
      </pattern>
    );
  if (variant === 1)
    return (
      <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="white" strokeWidth="1" />
      </pattern>
    );
  return (
    <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="0.8" />
    </pattern>
  );
}

export default function Cover({
  title,
  image,
  icon,
  tags = [],
  className = "",
  compact = false,
  banner = false,
}: {
  title: string;
  image?: string;
  icon: IconName;
  tags?: string[];
  className?: string;
  compact?: boolean;
  /** Short strip across the top of a card: icon sits on the right, no initials. */
  banner?: boolean;
}) {
  if (image) {
    return (
      <div className={`relative overflow-hidden bg-bg-2 ${className}`}>
        <Image
          src={asset(image)}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, 100vw"
          className="cover-img object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,7,13,0.65)] via-transparent to-transparent" />
      </div>
    );
  }

  const h = hash(title);
  const [c1, c2, c3] = PALETTES[h % PALETTES.length];
  const variant = (h >> 4) % 3;
  const pid = `p${h.toString(36)}`;
  // kept clear of the top corners, where cards put their badges
  const spots = ["left-[7%] bottom-[14%]", "right-[7%] top-[34%]", "left-[9%] top-[38%]"];

  return (
    <div
      aria-hidden="true"
      className={`cover ${className}`}
      style={{ "--c1": c1, "--c2": c2, "--c3": c3 } as React.CSSProperties}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.13]">
        <defs>
          <Pattern variant={variant} id={pid} />
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>

      {!banner && (
        <span
          className={`display absolute -bottom-[0.18em] -right-[0.04em] select-none font-extrabold leading-none text-white/[0.09] ${
            compact ? "text-[5.5rem]" : "text-[8.5rem]"
          }`}
        >
          {initials(title)}
        </span>
      )}

      <div className={`absolute inset-0 grid ${banner ? "place-items-center justify-end pr-4" : "place-items-center"}`}>
        <span
          className={`grid place-items-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] ${
            compact ? "h-11 w-11" : "h-16 w-16"
          }`}
        >
          <Icon name={icon} size={compact ? 20 : 28} />
        </span>
      </div>

      {!compact &&
        tags.slice(0, 3).map((tag, i) => (
          <span
            key={tag}
            className={`absolute ${spots[i]} ${i % 2 ? "float-b" : "float-a"} rounded-full border border-white/20 bg-black/25 px-2.5 py-0.5 text-[0.68rem] font-medium text-white/90 backdrop-blur-sm`}
          >
            {tag}
          </span>
        ))}
    </div>
  );
}
