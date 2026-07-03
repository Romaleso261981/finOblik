"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Account, Category, TransactionFilters } from "@/types";
import { formatCategoryPath, getRootCategories } from "@/lib/categories";

export function TransactionFiltersPanel({
  filters,
  onChange,
  accounts,
  categories,
  showTransferredBy = true,
  showType = true,
}: {
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
  showTransferredBy?: boolean;
  showType?: boolean;
}) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {showType && (
        <Select
          label="Тип"
          value={filters.type ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              type: e.target.value as TransactionFilters["type"],
            })
          }
        >
          <option value="all">Усі</option>
          <option value="income">Надходження</option>
          <option value="expense">Витрата</option>
        </Select>
      )}
      <Input
        label="Дата від"
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
      />
      <Input
        label="Дата до"
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
      />
      <Select
        label="Рахунок"
        value={filters.accountId ?? ""}
        onChange={(e) =>
          onChange({ ...filters, accountId: e.target.value || undefined })
        }
      >
        <option value="">Усі рахунки</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
      <Select
        label="Категорія"
        value={filters.categoryId ?? ""}
        onChange={(e) =>
          onChange({ ...filters, categoryId: e.target.value || undefined })
        }
      >
        <option value="">Усі категорії</option>
        {getRootCategories(categories).map((root) => (
          <option key={root.id} value={root.id}>
            {root.name} (усі)
          </option>
        ))}
        {categories
          .filter((c) => c.parentId)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {formatCategoryPath(categories, c.id)}
            </option>
          ))}
      </Select>
      {showTransferredBy && (
        <Input
          label="Хто перекинув"
          placeholder="Пошук..."
          value={filters.transferredBy ?? ""}
          onChange={(e) =>
            onChange({ ...filters, transferredBy: e.target.value || undefined })
          }
        />
      )}
    </div>
  );
}
