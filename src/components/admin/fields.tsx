"use client";

import { useId, useRef, useState } from "react";
import { PALETTES } from "@/lib/content";
import type { Field } from "./schema";

export const inputClass =
  "w-full rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-[0.92rem] text-fg placeholder:text-muted/50 transition-colors focus:border-gold focus:bg-white/[0.06] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gold)_18%,transparent)]";

export const buttonClass =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.04] px-3.5 py-1.5 text-[0.8rem] font-medium text-fg/90 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export const primaryClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--b1),var(--b2))] px-5 py-2 text-[0.85rem] font-semibold text-white shadow-[0_10px_30px_-12px_var(--a1)] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0";

export type UploadApi = {
  /** Stage a file for the next commit; resolves to the site path to store in the field. */
  stage: (file: File, current: string) => Promise<string>;
  /** URL that previews a site path, including files staged but not yet published. */
  preview: (sitePath: string) => string;
  isStaged: (sitePath: string) => boolean;
};

export function FieldControl({
  field,
  value,
  onChange,
  uploads,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  uploads: UploadApi;
}) {
  const id = useId();
  const text = typeof value === "string" ? value : value == null ? "" : String(value);

  let control: React.ReactNode;
  switch (field.type) {
    case "text":
    case "url":
      control = (
        <>
          <input
            id={id}
            type={field.type === "url" ? "url" : "text"}
            className={inputClass}
            value={text}
            placeholder={field.placeholder}
            list={field.type === "text" && field.suggestions ? `${id}-list` : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.type === "text" && field.suggestions && (
            <datalist id={`${id}-list`}>
              {field.suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </>
      );
      break;
    case "textarea":
      control = (
        <textarea
          id={id}
          className={`${inputClass} resize-y leading-relaxed`}
          rows={field.rows ?? 3}
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "number":
      control = (
        <input
          id={id}
          type="number"
          step={field.step ?? 1}
          className={`${inputClass} mono tabular-nums`}
          value={Number.isFinite(value as number) ? (value as number) : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
      );
      break;
    case "select":
      control = (
        <select
          id={id}
          className={`${inputClass} cursor-pointer`}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        >
          {!field.options.some((o) => o.value === text) && <option value={text}>{text || "—"}</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink">
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "tags":
      control = (
        <TagInput
          id={id}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      );
      break;
    case "paragraphs":
      control = (
        <ParagraphList
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          itemLabel={field.itemLabel}
        />
      );
      break;
    case "palette":
      control = <PalettePicker value={text} onChange={onChange} />;
      break;
    case "color":
      control = <ColorInput id={id} value={text} onChange={onChange} />;
      break;
    case "file":
      control = (
        <FileInput id={id} field={field} value={text} onChange={onChange} uploads={uploads} />
      );
      break;
    case "toggle":
      control = <Toggle id={id} value={value !== false} onChange={onChange} />;
      break;
    case "gallery":
      control = (
        <Gallery value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} uploads={uploads} />
      );
      break;
  }

  return (
    <div className={field.wide ? "sm:col-span-2" : ""}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.82rem] font-medium text-fg/80"
      >
        {field.label}
      </label>
      {control}
      {field.hint && <p className="mt-1.5 text-[0.74rem] leading-snug text-muted/80">{field.hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ tags */

function TagInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const add = (raw: string) => {
    const words = raw
      .split(/[\n,]/)
      .map((w) => w.trim())
      .filter((w) => w && !value.includes(w));
    if (words.length) onChange([...value, ...words]);
    setDraft("");
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div
      className={`${inputClass} flex min-h-[2.6rem] flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-gold`}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          draggable
          onDragStart={() => setDragFrom(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragFrom !== null) move(dragFrom, i);
            setDragFrom(null);
          }}
          title="Drag to reorder"
          className="mono inline-flex cursor-grab items-center gap-1 rounded-lg border border-[color-mix(in_srgb,var(--gold)_35%,transparent)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] py-0.5 pl-2 pr-1 text-[0.74rem] text-fg/90 active:cursor-grabbing"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="grid h-4 w-4 place-items-center rounded-lg text-muted hover:bg-clay/20 hover:text-clay"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        placeholder={value.length ? "" : (placeholder ?? "Type and press Enter")}
        onChange={(e) => {
          if (e.target.value.includes(",")) add(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (/[\n,]/.test(pasted)) {
            e.preventDefault();
            add(draft + pasted);
          }
        }}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-[0.86rem] text-fg placeholder:text-muted/45 focus:outline-none"
      />
    </div>
  );
}

/* ------------------------------------------------------------ paragraphs */

function ParagraphList({
  value,
  onChange,
  itemLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  itemLabel: string;
}) {
  const update = (i: number, text: string) => onChange(value.map((v, j) => (j === i ? text : v)));
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.map((text, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            className={`${inputClass} resize-y leading-relaxed`}
            rows={Math.min(6, Math.max(2, Math.ceil(text.length / 90)))}
            value={text}
            aria-label={`${itemLabel} ${i + 1}`}
            onChange={(e) => update(i, e.target.value)}
          />
          <div className="flex shrink-0 flex-col gap-1">
            <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
              ↑
            </IconButton>
            <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
              ↓
            </IconButton>
            <IconButton
              label={`Remove ${itemLabel}`}
              danger
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ×
            </IconButton>
          </div>
        </div>
      ))}
      <button type="button" className={buttonClass} onClick={() => onChange([...value, ""])}>
        + Add {itemLabel}
      </button>
    </div>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`mono grid h-7 w-7 place-items-center rounded-lg border border-line bg-white/[0.04] text-[0.8rem] text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "hover:border-clay/70 hover:text-clay" : "hover:border-gold/60 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ file */

function FileInput({
  id,
  field,
  value,
  onChange,
  uploads,
}: {
  id: string;
  field: Extract<Field, { type: "file" }>;
  value: string;
  onChange: (v: string) => void;
  uploads: UploadApi;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const staged = value && uploads.isStaged(value);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (file.size > 20 * 1024 * 1024) {
      setError("That file is over 20 MB — compress it first.");
      return;
    }
    if (field.kind === "doc" && file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      setError("Please choose an image or a PDF.");
      return;
    }
    if (field.kind === "pdf" && file.type !== "application/pdf") {
      setError("Please choose a PDF.");
      return;
    }
    if (field.kind === "image" && !file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    setBusy(true);
    try {
      onChange(await uploads.stage(file, value));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file.");
    } finally {
      setBusy(false);
      if (picker.current) picker.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        choose(e.dataTransfer.files[0]);
      }}
      className="flex flex-col gap-4 rounded-lg border border-dashed border-line bg-white/[0.04] p-4 sm:flex-row sm:items-center"
    >
      {field.kind === "image" || (field.kind === "doc" && value && !/\.pdf($|\?)/i.test(value)) ? (
        <div className="h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
          {value && (
            // eslint-disable-next-line @next/next/no-img-element -- previewing arbitrary local files
            <img src={uploads.preview(value)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ) : (
        <div className="mono grid h-16 w-14 shrink-0 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--clay)_50%,transparent)] text-[0.74rem] text-clay">
          {field.kind === "doc" && !value ? "file" : "pdf"}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <input
          id={id}
          className={`${inputClass} mono text-[0.8rem]`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/path/in/public or https://…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonClass} disabled={busy} onClick={() => picker.current?.click()}>
            {busy ? "Reading…" : "↑ Upload new"}
          </button>
          {value && (
            <a
              href={uploads.preview(value)}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonClass}
            >
              Open ↗
            </a>
          )}
          {staged && (
            <span className="mono text-[0.74rem] text-gold">
              ● Staged — publishes on save
            </span>
          )}
          {!staged && <span className="text-[0.72rem] text-muted/70">or drop a file here</span>}
        </div>
        {error && <p className="text-[0.78rem] text-clay">{error}</p>}
      </div>
      <input
        ref={picker}
        type="file"
        accept={field.accept}
        className="hidden"
        onChange={(e) => choose(e.target.files?.[0])}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- toggle */

function Toggle({ id, value, onChange }: { id: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`group inline-flex items-center gap-3 rounded-full border px-1.5 py-1.5 pr-4 text-[0.82rem] font-semibold transition-colors ${
        value ? "border-gold/50 bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-white" : "border-line bg-white/[0.04] text-muted"
      }`}
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? "bg-[linear-gradient(90deg,var(--b1),var(--b2))]" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`}
        />
      </span>
      {value ? "On" : "Off"}
    </button>
  );
}

/* --------------------------------------------------------------- gallery */

function Gallery({
  value,
  onChange,
  uploads,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  uploads: UploadApi;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setBusy(true);
    const next = [...value];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image — skipped.`);
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          setError(`${file.name} is over 20 MB — skipped.`);
          continue;
        }
        next.push(await uploads.stage(file, ""));
      }
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file.");
    } finally {
      setBusy(false);
      if (picker.current) picker.current.value = "";
    }
  };
  const move = (i: number, by: number) => {
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    onChange(next);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        add(e.dataTransfer.files);
      }}
      className="rounded-lg border border-dashed border-line bg-white/[0.04] p-4"
    >
      {value.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((path, i) => (
            <li key={`${path}-${i}`} className="overflow-hidden rounded-lg border border-line bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element -- previewing local files */}
              <img src={uploads.preview(path)} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-1.5">
                <span className="mono px-1 text-[0.7rem] text-muted">
                  {i + 1}
                  {uploads.isStaged(path) && <span className="text-gold"> ●</span>}
                </span>
                <span className="flex gap-1">
                  <IconButton label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>
                    ←
                  </IconButton>
                  <IconButton label="Move right" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                    →
                  </IconButton>
                  <IconButton label="Remove" danger onClick={() => onChange(value.filter((_, j) => j !== i))}>
                    ×
                  </IconButton>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonClass} disabled={busy} onClick={() => picker.current?.click()}>
          {busy ? "Reading…" : "↑ Add screenshots"}
        </button>
        <span className="text-[0.72rem] text-muted/70">
          {value.length ? `${value.length} in the gallery · ` : ""}pick several at once, or drop them here
        </span>
      </div>
      {error && <p className="mt-2 text-[0.78rem] text-clay">{error}</p>}
      <input
        ref={picker}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />
    </div>
  );
}

/* --------------------------------------------------------------- palette */

function PalettePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Palette" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {PALETTES.map((p) => {
        const on = (value || "ocean") === p.value;
        return (
          <div
            key={p.value}
            className={`group relative overflow-hidden rounded-2xl border p-4 transition-all ${
              on
                ? "border-gold bg-white/[0.07] shadow-[0_0_0_4px_color-mix(in_srgb,var(--gold)_18%,transparent)]"
                : "border-line bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
            }`}
          >
            <button
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(p.value)}
              className="absolute inset-0 z-0"
              aria-label={`Use the ${p.label} palette`}
            />
            <div className="pointer-events-none relative z-10 flex h-14 overflow-hidden rounded-xl border border-white/10">
              {p.colors.length ? (
                p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)
              ) : (
                <span className="flex-1 bg-[conic-gradient(from_90deg,#f43f5e,#f59e0b,#84cc16,#06b6d4,#8b5cf6,#f43f5e)]" />
              )}
            </div>
            <div className="pointer-events-none relative z-10 mt-3 flex items-start justify-between gap-2">
              <div>
                <p className="display text-[0.95rem] text-white">{p.label}</p>
                <p className="text-[0.78rem] text-muted">{p.note}</p>
              </div>
              {on && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-[0.68rem] font-semibold text-black">Selected</span>
              )}
            </div>
            <a
              href={`/?palette=${p.value}`}
              target="_blank"
              rel="noreferrer noopener"
              className="relative z-10 mt-3 inline-flex text-[0.78rem] font-medium text-fg/70 hover:text-white"
            >
              Preview on site ↗
            </a>
          </div>
        );
      })}
    </div>
  );
}

function ColorInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line"
        style={{ background: valid ? value : "transparent" }}
      >
        <span className="sr-only">Pick a colour</span>
        <input
          type="color"
          value={valid ? value : "#38bdf8"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="#38bdf8"
        spellCheck={false}
        className={`${inputClass} mono ${valid || !value ? "" : "!border-clay"}`}
      />
    </div>
  );
}
