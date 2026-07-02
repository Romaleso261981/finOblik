import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { Transaction, TransactionFilters } from "@/types";

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return format(date, "d MMM yyyy", { locale: uk });
}

export function formatDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function applyTransactionFilters(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.type && filters.type !== "all" && t.type !== filters.type) {
      return false;
    }
    if (filters.accountId && t.accountId !== filters.accountId) return false;
    if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
    if (
      filters.transferredBy &&
      !(t.transferredBy ?? "")
        .toLowerCase()
        .includes(filters.transferredBy.toLowerCase())
    ) {
      return false;
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      if (t.date < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (t.date > to) return false;
    }
    return true;
  });
}

export function sumByType(transactions: Transaction[], type: "income" | "expense") {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function balancesByAccount(
  transactions: Transaction[],
  accountIds: string[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const id of accountIds) balances[id] = 0;
  for (const t of transactions) {
    if (!balances[t.accountId] && balances[t.accountId] !== 0) {
      balances[t.accountId] = 0;
    }
    if (t.type === "income") balances[t.accountId] += t.amount;
    else balances[t.accountId] -= t.amount;
  }
  return balances;
}

export function expensesByCategory(
  transactions: Transaction[],
  categoryNames: Record<string, string>
): { categoryId: string; name: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense" || !t.categoryId) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      name: categoryNames[categoryId] ?? "Без категорії",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}
