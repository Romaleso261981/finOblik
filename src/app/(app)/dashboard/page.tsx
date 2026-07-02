"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { TransactionFiltersPanel } from "@/components/TransactionFilters";
import {
  applyTransactionFilters,
  balancesByAccount,
  expensesByCategory,
  formatMoney,
  sumByType,
} from "@/lib/utils";
import type { TransactionFilters } from "@/types";

export default function DashboardPage() {
  const { orgId } = useAuth();
  const { accounts, categories, transactions, loading } = useOrgDataContext();
  const [filters, setFilters] = useState<TransactionFilters>({ type: "all" });

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, filters),
    [transactions, filters]
  );

  const income = sumByType(filtered, "income");
  const expense = sumByType(filtered, "expense");
  const balance = income - expense;

  const accountBalances = useMemo(
    () => balancesByAccount(transactions, accounts.map((a) => a.id)),
    [transactions, accounts]
  );

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const byCategory = useMemo(
    () => expensesByCategory(filtered, categoryNames),
    [filtered, categoryNames]
  );

  if (!orgId) return null;

  if (loading) {
    return <p className="text-muted">Завантаження...</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Огляд</h1>
        <p className="text-sm text-muted mt-1">
          Підсумки з урахуванням фільтрів нижче
        </p>
      </header>

      <Card title="Фільтри">
        <TransactionFiltersPanel
          filters={filters}
          onChange={setFilters}
          accounts={accounts}
          categories={categories}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide">Надходження</p>
          <p className="text-2xl font-bold text-income mt-1">{formatMoney(income)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide">Витрати</p>
          <p className="text-2xl font-bold text-expense mt-1">{formatMoney(expense)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted uppercase tracking-wide">Залишок</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(balance)}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Залишок по рахунках">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted">Додайте рахунки в розділі «Рахунки».</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between text-sm border-b border-border pb-2 last:border-0"
                >
                  <span>{a.name}</span>
                  <span className="font-medium">{formatMoney(accountBalances[a.id] ?? 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Витрати по категоріях">
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted">Немає витрат за обраними фільтрами.</p>
          ) : (
            <ul className="space-y-2">
              {byCategory.map((row) => (
                <li
                  key={row.categoryId}
                  className="flex justify-between text-sm border-b border-border pb-2 last:border-0"
                >
                  <span>{row.name}</span>
                  <span className="font-medium text-expense">{formatMoney(row.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
