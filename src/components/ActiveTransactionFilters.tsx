"use client";

import type { Account, Category, TransactionFilters } from "@/types";
import { buildCategoryDisplayMap } from "@/lib/categories";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
} from "@/lib/transaction-filters";

type Chip = { key: keyof TransactionFilters | "type"; label: string };

function buildFilterChips(
  filters: TransactionFilters,
  accounts: Account[],
  categories: Category[]
): Chip[] {
  const chips: Chip[] = [];
  const catMap = buildCategoryDisplayMap(categories);

  if (filters.type && filters.type !== "all") {
    chips.push({
      key: "type",
      label: filters.type === "income" ? "Надходження" : "Витрата",
    });
  }
  if (filters.dateFrom) {
    chips.push({ key: "dateFrom", label: `Від ${filters.dateFrom}` });
  }
  if (filters.dateTo) {
    chips.push({ key: "dateTo", label: `До ${filters.dateTo}` });
  }
  if (filters.accountId) {
    const acc = accounts.find((a) => a.id === filters.accountId);
    chips.push({ key: "accountId", label: acc?.name ?? "Рахунок" });
  }
  if (filters.categoryId) {
    chips.push({
      key: "categoryId",
      label: catMap[filters.categoryId] ?? "Категорія",
    });
  }
  if (filters.transferredBy?.trim()) {
    chips.push({ key: "transferredBy", label: `Хто: ${filters.transferredBy.trim()}` });
  }
  if (filters.descriptionSearch?.trim()) {
    chips.push({
      key: "descriptionSearch",
      label: `Текст: «${filters.descriptionSearch.trim()}»`,
    });
  }
  return chips;
}

export function ActiveTransactionFilters({
  filters,
  onChange,
  accounts,
  categories,
  showType = true,
  showTransferredBy = true,
}: {
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
  showType?: boolean;
  showTransferredBy?: boolean;
}) {
  const activeCount = countActiveFilters(filters, {
    includeType: showType,
    includeTransferredBy: showTransferredBy,
  });
  if (activeCount === 0) return null;

  const chips = buildFilterChips(filters, accounts, categories);

  const removeChip = (key: Chip["key"]) => {
    if (key === "type") {
      onChange({ ...filters, type: "all" });
      return;
    }
    onChange({ ...filters, [key]: undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-border">
      <span className="text-xs font-medium text-muted">Фільтри:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeChip(chip.key)}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs text-brand-800 hover:bg-brand-100"
          title="Прибрати фільтр"
        >
          <span className="truncate">{chip.label}</span>
          <span aria-hidden className="text-brand-600 shrink-0">
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(DEFAULT_TRANSACTION_FILTERS)}
        className="text-xs text-muted hover:text-slate-800 underline"
      >
        Скинути всі
      </button>
    </div>
  );
}
