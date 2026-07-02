"use client";

import { type ReactNode, useEffect } from "react";
import { Button } from "./Button";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-border"
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 id="modal-title" className="font-semibold text-slate-900">
            {title}
          </h3>
          <Button variant="ghost" onClick={onClose} aria-label="Закрити">
            ✕
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
