"use client";

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
  };
}

export function Modal({
  open,
  title,
  onClose,
  children,
  sheet = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  sheet?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Закрити"
        onClick={onClose}
      />
      <div
        className={`absolute inset-0 flex pointer-events-none ${
          sheet
            ? "bottom-0 flex-col justify-end sm:inset-0 sm:flex-row sm:items-center sm:justify-center sm:p-4"
            : "items-center justify-center p-4"
        }`}
      >
        <div
          className={`pointer-events-auto grid w-full max-w-lg grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-white shadow-xl border border-border ${
            sheet
              ? "max-h-[min(85dvh,640px)] rounded-t-2xl sm:rounded-xl pb-[env(safe-area-inset-bottom)]"
              : "max-h-[min(calc(100dvh-2rem),640px)] rounded-xl"
          }`}
          role="dialog"
          aria-modal
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <h3 id="modal-title" className="font-semibold text-slate-900 pr-2">
              {title}
            </h3>
            <Button variant="ghost" onClick={onClose} aria-label="Закрити">
              ✕
            </Button>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
            <div className="p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
