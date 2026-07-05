import { type ReactNode } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          {title ? (
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
