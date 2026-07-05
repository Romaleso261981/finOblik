import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { Transaction, TransactionFilters, Category } from "@/types";
import { categoryMatchesFilter } from "@/lib/categories";

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
  filters: TransactionFilters,
  categories?: Category[]
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.type && filters.type !== "all" && t.type !== filters.type) {
      return false;
    }
    if (filters.accountId && t.accountId !== filters.accountId) return false;
    if (filters.categoryId) {
      const matchDirect = t.categoryId === filters.categoryId;
      const matchTree =
        categories &&
        t.categoryId &&
        categoryMatchesFilter(categories, t.categoryId, filters.categoryId);
      if (!matchDirect && !matchTree) return false;
    }
    if (
      filters.transferredBy &&
      !(t.transferredBy ?? "")
        .toLowerCase()
        .includes(filters.transferredBy.toLowerCase())
    ) {
      return false;
    }
    if (filters.descriptionSearch?.trim()) {
      const q = filters.descriptionSearch.trim().toLowerCase();
      const hay = `${t.description ?? ""} ${t.comment ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
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

/** Нарахування (надходження) та відрахування (витрати) по рахунках */
export function accrualsDeductionsByAccount(
  transactions: Transaction[],
  accounts: { id: string; name: string }[]
): {
  accountId: string;
  name: string;
  accruals: number;
  deductions: number;
  difference: number;
}[] {
  return accounts
    .map((a) => {
      const rows = transactions.filter((t) => t.accountId === a.id);
      const accruals = sumByType(rows, "income");
      const deductions = sumByType(rows, "expense");
      return {
        accountId: a.id,
        name: a.name,
        accruals,
        deductions,
        difference: accruals - deductions,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function accrualsDeductionsTotals(transactions: Transaction[]) {
  const accruals = sumByType(transactions, "income");
  const deductions = sumByType(transactions, "expense");
  return { accruals, deductions, difference: accruals - deductions };
}
