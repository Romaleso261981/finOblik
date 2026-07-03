"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TransactionFiltersPanel } from "@/components/TransactionFilters";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
} from "@/lib/transaction-filters";
import type { Account, Category, TransactionFilters } from "@/types";

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TransactionFiltersTrigger({
  filters,
  onApply,
  accounts,
  categories,
  showTransferredBy = true,
  showType = true,
  className = "",
  compact = false,
}: {
  filters: TransactionFilters;
  onApply: (f: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
  showTransferredBy?: boolean;
  showType?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TransactionFilters>(filters);

  const activeCount = countActiveFilters(filters, {
    includeType: showType,
    includeTransferredBy: showTransferredBy,
  });

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft(DEFAULT_TRANSACTION_FILTERS);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${
          compact ? "relative h-10 w-10 shrink-0 p-0" : "px-3 py-2"
        } ${className}`}
        aria-label={
          activeCount > 0
            ? `Фільтри, застосовано ${activeCount}`
            : "Відкрити фільтри"
        }
      >
        <FilterIcon />
        {!compact && <span>Фільтри</span>}
        {activeCount > 0 && (
          <span
            className={`inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white ${
              compact ? "absolute -top-1 -right-1 h-[1.125rem]" : "px-1.5 py-0.5 text-xs"
            }`}
          >
            {activeCount}
          </span>
        )}
      </button>

      <Modal open={open} title="Фільтри" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <TransactionFiltersPanel
            filters={draft}
            onChange={setDraft}
            accounts={accounts}
            categories={categories}
            showTransferredBy={showTransferredBy}
            showType={showType}
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={reset} className="sm:mr-auto">
              Скинути
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Скасувати
              </Button>
              <Button type="button" onClick={apply}>
                Застосувати
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
