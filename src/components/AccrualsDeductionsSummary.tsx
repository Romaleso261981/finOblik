"use client";

import { formatMoney } from "@/lib/utils";

export function AccrualsDeductionsSummary({
  accruals,
  deductions,
  difference,
  compact = false,
}: {
  accruals: number;
  deductions: number;
  difference: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm border-b border-border pb-3 mb-4">
        <span>
          <span className="text-muted">Нарахування: </span>
          <span className="font-semibold text-income">{formatMoney(accruals)}</span>
        </span>
        <span>
          <span className="text-muted">Відрахування: </span>
          <span className="font-semibold text-expense">{formatMoney(deductions)}</span>
        </span>
        <span>
          <span className="text-muted">Різниця: </span>
          <span
            className={`font-semibold ${difference >= 0 ? "text-slate-900" : "text-expense"}`}
          >
            {formatMoney(difference)}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted uppercase tracking-wide">Нарахування</p>
        <p className="text-2xl font-bold text-income mt-1">{formatMoney(accruals)}</p>
        <p className="text-xs text-muted mt-1">Усі надходження за період / фільтром</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted uppercase tracking-wide">Відрахування</p>
        <p className="text-2xl font-bold text-expense mt-1">{formatMoney(deductions)}</p>
        <p className="text-xs text-muted mt-1">Усі витрати за період / фільтром</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted uppercase tracking-wide">Різниця</p>
        <p
          className={`text-2xl font-bold mt-1 ${difference >= 0 ? "text-slate-900" : "text-expense"}`}
        >
          {formatMoney(difference)}
        </p>
        <p className="text-xs text-muted mt-1">Нарахування − відрахування</p>
      </div>
    </div>
  );
}
