"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { usePageHeaderActions } from "@/contexts/PageHeaderContext";
import { Card } from "@/components/ui/Card";
import { TransactionFiltersTrigger } from "@/components/TransactionFiltersTrigger";
import {
  applyTransactionFilters,
  accrualsDeductionsByAccount,
  accrualsDeductionsTotals,
  balancesByAccount,
  expensesByCategory,
  formatMoney,
} from "@/lib/utils";
import { AccrualsDeductionsSummary } from "@/components/AccrualsDeductionsSummary";
import { buildCategoryDisplayMap } from "@/lib/categories";
import { DEFAULT_TRANSACTION_FILTERS } from "@/lib/transaction-filters";
import { loadFromStorage, saveToStorage, userScopedKey } from "@/lib/persistence";
import type { TransactionFilters } from "@/types";

export default function DashboardPage() {
  const { orgId, user } = useAuth();
  const { accounts, categories, transactions, loading } = useOrgDataContext();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);

  useEffect(() => {
    if (!user) return;
    const stored = loadFromStorage<TransactionFilters>(userScopedKey(user.uid, "filters.dashboard"));
    if (stored) setFilters({ ...DEFAULT_TRANSACTION_FILTERS, ...stored });
  }, [user]);

  const setFiltersPersisted = useCallback((next: TransactionFilters) => {
    setFilters(next);
    if (!user) return;
    saveToStorage(userScopedKey(user.uid, "filters.dashboard"), next);
  }, [user]);

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, filters, categories),
    [transactions, filters, categories]
  );

  const totals = useMemo(() => accrualsDeductionsTotals(filtered), [filtered]);

  const byAccountFlow = useMemo(
    () => accrualsDeductionsByAccount(filtered, accounts),
    [filtered, accounts]
  );

  const accountBalances = useMemo(
    () => balancesByAccount(transactions, accounts.map((a) => a.id)),
    [transactions, accounts]
  );

  const categoryNames = useMemo(
    () => buildCategoryDisplayMap(categories),
    [categories]
  );

  const byCategory = useMemo(
    () => expensesByCategory(filtered, categoryNames),
    [filtered, categoryNames]
  );

  const headerFilters = useMemo(
    () => (
      <TransactionFiltersTrigger
        filters={filters}
        onApply={setFiltersPersisted}
        accounts={accounts}
        categories={categories}
      />
    ),
    [filters, setFiltersPersisted, accounts, categories]
  );

  usePageHeaderActions(headerFilters);

  if (!orgId) return null;

  if (loading) {
    return <p className="text-muted">Завантаження...</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AccrualsDeductionsSummary
        accruals={totals.accruals}
        deductions={totals.deductions}
        difference={totals.difference}
      />

      <Card title="Нарахування та відрахування по рахунках">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted">Додайте рахунки в розділі «Рахунки».</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-3 font-medium">Рахунок</th>
                  <th className="py-2 pr-3 font-medium text-right">Нарахування</th>
                  <th className="py-2 pr-3 font-medium text-right">Відрахування</th>
                  <th className="py-2 font-medium text-right">Різниця</th>
                </tr>
              </thead>
              <tbody>
                {byAccountFlow.map((row) => (
                  <tr key={row.accountId} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3">{row.name}</td>
                    <td className="py-2 pr-3 text-right text-income tabular-nums">
                      {formatMoney(row.accruals)}
                    </td>
                    <td className="py-2 pr-3 text-right text-expense tabular-nums">
                      {formatMoney(row.deductions)}
                    </td>
                    <td
                      className={`py-2 text-right font-medium tabular-nums ${
                        row.difference >= 0 ? "text-slate-900" : "text-expense"
                      }`}
                    >
                      {formatMoney(row.difference)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-2 pr-3">Разом</td>
                  <td className="py-2 pr-3 text-right text-income tabular-nums">
                    {formatMoney(totals.accruals)}
                  </td>
                  <td className="py-2 pr-3 text-right text-expense tabular-nums">
                    {formatMoney(totals.deductions)}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      totals.difference >= 0 ? "text-slate-900" : "text-expense"
                    }`}
                  >
                    {formatMoney(totals.difference)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted mt-3">
          Враховуються фільтри зверху (дата, рахунок, категорія тощо).
        </p>
      </Card>

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
