"use client";

import { useState } from "react";
import { asset, type Honor } from "@/lib/site";
import Certificate from "./Certificate";
import Icon from "./Icons";

const IMG = /\.(png|jpe?g|webp|gif|avif)$/i;

/**
 * Honor card that flips over (hover on desktop, tap on phones) to show the
 * certificate itself — or, without a picture of it, the details and links.
 */
export default function HonorFlip({ item }: { item: Honor }) {
  const [flipped, setFlipped] = useState(false);
  const honor = item.kind !== "certification";
  const picture = IMG.test(item.certificate) ? item.certificate : item.image;
  const year = item.year !== "—" ? item.year : "";

  return (
    <div
      className="flip h-full min-h-[236px]"
      data-flipped={flipped || undefined}
      onClick={() => setFlipped((f) => !f)}
    >
      <div className="flip-inner h-full">
        {/* front */}
        <div className="flip-face glass flex flex-col p-6" inert={flipped}>
          <div className="flex items-start gap-4">
            <span
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white shadow-lg ${
                honor ? "tint-4" : "tint-2"
              }`}
            >
              <Icon name={honor ? "trophy" : "award"} size={24} />
            </span>
            <div className="min-w-0">
              <p className={`text-[0.72rem] font-semibold uppercase tracking-wider ${honor ? "text-amber" : "text-a2"}`}>
                {honor ? "Honor" : "Certification"}
              </p>
              <h3 className="display mt-1 font-bold leading-snug text-white">{item.title}</h3>
            </div>
          </div>
          <p className="mt-4 text-[0.88rem] leading-snug text-fg-soft">{item.issuer}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="mono text-[0.75rem] text-muted">{year}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
              }}
              className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-soft-accent hover:text-white"
            >
              <Icon name="rotate" size={14} /> {picture ? "See certificate" : "Flip"}
            </button>
          </div>
        </div>

        {/* back */}
        <div className="flip-face flip-back glass flex flex-col overflow-hidden" inert={!flipped}>
          {picture ? (
            <div className="relative min-h-0 flex-1 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded certificate photo, any size */}
              <img src={asset(picture)} alt={`Certificate — ${item.title}`} className="absolute inset-0 h-full w-full object-contain p-2" />
            </div>
          ) : (
            <div className="tint-soft flex flex-1 flex-col justify-center p-6 text-center">
              <Icon name={honor ? "trophy" : "award"} size={30} className="mx-auto text-a2" />
              <p className="display mt-3 font-bold leading-snug text-white">{item.title}</p>
              <p className="mt-2 text-[0.85rem] text-fg-soft">
                {item.issuer}
                {year && <> · {year}</>}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(false);
              }}
              className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-fg-soft hover:text-white"
            >
              <Icon name="rotate" size={14} /> Back
            </button>
            <Certificate
              file={item.certificate}
              link={item.link}
              title={item.title}
              label={item.certificate ? "Open" : "Verify"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
