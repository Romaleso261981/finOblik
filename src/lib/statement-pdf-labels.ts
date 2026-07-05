import { buildCategoryDisplayMap } from "@/lib/categories";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Account, Category, Transaction, TransactionFilters } from "@/types";

export function describeStatementFilters(
  filters: TransactionFilters,
  accounts: Account[],
  categories: Category[]
): string[] {
  const lines: string[] = [];
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ?? "…";
    const to = filters.dateTo ?? "…";
    lines.push(`Період: ${from} — ${to}`);
  } else {
    lines.push("Період: усі дати");
  }
  if (filters.accountId) {
    const acc = accounts.find((a) => a.id === filters.accountId);
    lines.push(`Рахунок: ${acc?.name ?? filters.accountId}`);
  }
  if (filters.categoryId) {
    const map = buildCategoryDisplayMap(categories);
    lines.push(`Категорія: ${map[filters.categoryId] ?? filters.categoryId}`);
  }
  if (filters.type && filters.type !== "all") {
    lines.push(`Тип: ${filters.type === "income" ? "надходження" : "витрата"}`);
  }
  if (filters.transferredBy?.trim()) {
    lines.push(`Хто перекинув: ${filters.transferredBy.trim()}`);
  }
  if (filters.descriptionSearch?.trim()) {
    lines.push(`Пошук: «${filters.descriptionSearch.trim()}»`);
  }
  return lines;
}

export type StatementRow = {
  date: string;
  amount: string;
  account: string;
  category: string;
  description: string;
  type: "income" | "expense";
};

export function buildStatementRows(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): StatementRow[] {
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const categoryMap = buildCategoryDisplayMap(categories);
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  return sorted.map((t) => ({
    date: formatDate(t.date),
    amount: formatMoney(t.amount),
    account: accountMap[t.accountId] ?? "—",
    category: t.categoryId ? categoryMap[t.categoryId] ?? "—" : "—",
    description:
      t.type === "income" ? t.transferredBy ?? "—" : t.description ?? "—",
    type: t.type,
  }));
}

export function statementFileName(filters: TransactionFilters, accounts: Account[]): string {
  const date = new Date().toISOString().slice(0, 10);
  if (filters.accountId) {
    const acc = accounts.find((a) => a.id === filters.accountId);
    const slug = (acc?.name ?? "rahunok")
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .slice(0, 40);
    return `vypyska-${slug}-${date}.pdf`;
  }
  return `vypyska-${date}.pdf`;
}
