"use client";

import { useState } from "react";
import { FieldControl, IconButton, buttonClass, type UploadApi } from "./fields";
import type { Block, Field, Path } from "./schema";

type Obj = Record<string | number, unknown>;

export function getIn(source: unknown, path: Path): unknown {
  return path.reduce<unknown>((node, key) => (node == null ? undefined : (node as Obj)[key]), source);
}

/** Immutable set: copies only the objects along the path. */
export function setIn<T>(source: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const node = (source ?? {}) as Obj;
  const copy = (Array.isArray(node) ? [...node] : { ...node }) as Obj;
  copy[key] = setIn(node[key], rest, value);
  return copy as T;
}

export type Edit = (path: Path, value: unknown) => void;

export function BlockView({
  block,
  data,
  edit,
  uploads,
}: {
  block: Block;
  data: unknown;
  edit: Edit;
  uploads: UploadApi;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white/[0.03] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]">
      {(block.title || block.description) && (
        <header className="border-b border-line px-5 py-4">
          {block.title && (
            <h2 className="display text-[1.02rem] text-white">
              {block.title}
            </h2>
          )}
          {block.description && (
            <p className="mt-1 text-[0.8rem] leading-snug text-muted">{block.description}</p>
          )}
        </header>
      )}
      <div className="p-5">
        {block.kind === "fields" ? (
          <FieldGrid fields={block.fields} base={block.path} data={data} edit={edit} uploads={uploads} />
        ) : (
          <ListEditor block={block} data={data} edit={edit} uploads={uploads} />
        )}
      </div>
    </section>
  );
}

function FieldGrid({
  fields,
  base,
  data,
  edit,
  uploads,
}: {
  fields: Field[];
  base: Path;
  data: unknown;
  edit: Edit;
  uploads: UploadApi;
}) {
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={getIn(data, [...base, field.key])}
          onChange={(value) => edit([...base, field.key], value)}
          uploads={uploads}
        />
      ))}
    </div>
  );
}

function ListEditor({
  block,
  data,
  edit,
  uploads,
}: {
  block: Extract<Block, { kind: "list" }>;
  data: unknown;
  edit: Edit;
  uploads: UploadApi;
}) {
  const items = (getIn(data, block.path) as Obj[] | undefined) ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const write = (next: Obj[]) => edit(block.path, next);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    write(next);
    if (open === from) setOpen(to);
    else if (open !== null && from < open && to >= open) setOpen(open - 1);
    else if (open !== null && from > open && to <= open) setOpen(open + 1);
  };

  const remove = (i: number) => {
    const name = block.summary(items[i]).title || `this ${block.itemName}`;
    if (!window.confirm(`Delete “${name}”? You can still discard all changes before saving.`)) return;
    write(items.filter((_, j) => j !== i));
    setOpen(null);
  };

  const duplicate = (i: number) => {
    const next = [...items];
    next.splice(i + 1, 0, structuredClone(items[i]));
    write(next);
    setOpen(i + 1);
  };

  const add = () => {
    write([...items, block.blank()]);
    setOpen(items.length);
    setQuery("");
  };

  const q = query.trim().toLowerCase();
  const visible = items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !q || JSON.stringify(item).toLowerCase().includes(q));

  return (
    <div className="space-y-2.5">
      {items.length > 6 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${items.length} ${block.itemName}s…`}
          className="mb-2 w-full rounded-lg border border-line bg-transparent px-3 py-1.5 text-[0.82rem] text-fg placeholder:text-muted/50 focus:border-gold focus:outline-none"
        />
      )}
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[0.85rem] text-muted">
          Nothing here yet.
        </p>
      )}
      {visible.map(({ item, i }) => {
        const { title, meta } = block.summary(item);
        const expanded = open === i;
        const actions = (
          <>
            <IconButton label="Move up" onClick={() => move(i, i - 1)} disabled={i === 0 || !!q}>
              ↑
            </IconButton>
            <IconButton label="Move down" onClick={() => move(i, i + 1)} disabled={i === items.length - 1 || !!q}>
              ↓
            </IconButton>
            <IconButton label="Duplicate" onClick={() => duplicate(i)}>
              ⧉
            </IconButton>
            <IconButton label="Delete" danger onClick={() => remove(i)}>
              ×
            </IconButton>
          </>
        );
        return (
          <div
            key={i}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              setDragOver(i);
            }}
            onDrop={() => {
              if (dragFrom !== null) move(dragFrom, i);
              setDragFrom(null);
              setDragOver(null);
            }}
            className={`overflow-hidden rounded-lg border transition-colors ${
              expanded
                ? "border-[color-mix(in_srgb,var(--gold)_55%,transparent)] bg-white/[0.04]"
                : "border-line bg-white/[0.04] hover:border-[color-mix(in_srgb,var(--gold)_40%,transparent)]"
            } ${dragOver === i && dragFrom !== i ? "ring-2 ring-gold/50" : ""}`}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpen(expanded ? null : i)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(expanded ? null : i);
                }
              }}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              <span
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDragFrom(i);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onClick={(e) => e.stopPropagation()}
                title="Drag to reorder"
                className="mono hidden cursor-grab select-none px-1 text-muted/60 hover:text-gold active:cursor-grabbing sm:block"
              >
                ⋮⋮
              </span>
              <span className="mono w-6 shrink-0 text-[0.66rem] tabular-nums text-gold/80">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9rem] font-semibold text-fg">
                  {title || <em className="font-normal text-muted">untitled {block.itemName}</em>}
                </span>
                {meta && <span className="mono block truncate text-[0.66rem] text-muted">{meta}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="hidden items-center gap-1 sm:flex">{actions}</span>
                <span
                  aria-hidden="true"
                  className={`mono ml-1 text-muted transition-transform ${expanded ? "rotate-90 text-gold" : ""}`}
                >
                  ›
                </span>
              </span>
            </div>
            {expanded && (
              <div className="border-t border-line px-4 py-5">
                {/* on phones the row actions live here, so titles get the full header width */}
                <div className="mb-4 flex gap-1 sm:hidden">{actions}</div>
                <FieldGrid
                  fields={block.fields}
                  base={[...block.path, i]}
                  data={data}
                  edit={edit}
                  uploads={uploads}
                />
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={add} className={`${buttonClass} mt-2`}>
        + Add {block.itemName}
      </button>
    </div>
  );
}
