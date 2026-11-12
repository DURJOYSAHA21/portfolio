"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Open dialogs, newest last — Escape closes only the top one. */
const stack: object[] = [];

/**
 * Full-screen dialog in a portal: Escape and a click on the backdrop close it,
 * page scroll is locked while open and focus returns to the opener afterwards.
 */
export default function Modal({
  open,
  onClose,
  label,
  children,
  className = "max-w-4xl",
  align = "center",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  /** "top" suits search boxes that grow downwards. */
  align?: "center" | "top";
}) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const me = {};
    stack.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === me) close.current();
    };
    window.addEventListener("keydown", onKey);
    // focus the first control inside, or the box itself
    requestAnimationFrame(() => {
      const target = box.current?.querySelector<HTMLElement>("[data-autofocus]") ?? box.current;
      target?.focus();
    });
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(me), 1);
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className={`modal-in fixed inset-0 z-[70] flex justify-center bg-black/75 p-3 backdrop-blur-md sm:p-8 ${
        align === "top" ? "items-start pt-[12vh]" : "items-center"
      }`}
    >
      <div
        ref={box}
        tabIndex={-1}
        className={`glass modal-pop flex max-h-full w-full flex-col overflow-hidden !rounded-3xl outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
