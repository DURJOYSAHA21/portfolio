"use client";

import { useState } from "react";
import { asset } from "@/lib/site";
import Icon from "./Icons";
import Modal from "./Modal";

const isPdf = (path: string) => /\.pdf($|\?)/i.test(path);

/**
 * "Certificate" action for any card. With an uploaded file it opens a viewer
 * (image or PDF) with download and verify buttons; with only a link it opens
 * the link in a new tab. Renders nothing when neither is set.
 */
export default function Certificate({
  file,
  link,
  title,
  label = "Certificate",
  className = "",
}: {
  file?: string;
  link?: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!file && !link) return null;

  const chip = `inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--a1-rgb)/0.4)] bg-[rgb(var(--a1-rgb)/0.1)] px-3 py-1.5 text-[0.8rem] font-semibold text-white transition-colors hover:bg-[rgb(var(--a1-rgb)/0.22)] ${className}`;

  if (!file) {
    return (
      <a href={link} target="_blank" rel="noreferrer noopener" className={chip} onClick={(e) => e.stopPropagation()}>
        <Icon name="award" size={15} /> {label} <Icon name="external" size={12} />
      </a>
    );
  }

  const src = asset(file);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={chip}
        aria-haspopup="dialog"
      >
        <Icon name="award" size={15} /> {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label={`${label}: ${title}`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
          <span className="tint-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white">
            <Icon name="award" size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-muted">{label}</p>
            <p className="display truncate text-[0.95rem] font-bold text-white">{title}</p>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-fg hover:bg-white/10"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-black/40">
          {isPdf(file) ? (
            <iframe src={src} title={title} className="h-[70vh] w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- any uploaded size, shown whole
            <img src={src} alt={`${label} — ${title}`} className="mx-auto max-h-[72vh] w-auto object-contain" />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-3.5">
          {link && (
            <a href={link} target="_blank" rel="noreferrer noopener" className="btn !py-2 text-sm">
              Verify online <Icon name="external" size={14} />
            </a>
          )}
          <a href={src} target="_blank" rel="noreferrer noopener" className="btn !py-2 text-sm">
            Open full size <Icon name="external" size={14} />
          </a>
          <a href={src} download className="btn btn-glow !py-2 text-sm">
            Download <Icon name="download" size={14} />
          </a>
        </div>
      </Modal>
    </>
  );
}
