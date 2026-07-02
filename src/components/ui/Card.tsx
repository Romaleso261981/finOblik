import { type ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}
    >
      {title && <h2 className="text-sm font-semibold text-slate-800 mb-3">{title}</h2>}
      {children}
    </section>
  );
}
