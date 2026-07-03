"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { TransactionFiltersPanel } from "@/components/TransactionFilters";
import { OperationsTable } from "@/components/OperationsTable";
import { applyTransactionFilters } from "@/lib/utils";
import type { TransactionFilters } from "@/types";

export default function OperationsPage() {
  const { orgId } = useAuth();
  const { accounts, categories, transactions, loading } = useOrgDataContext();
  const [filters, setFilters] = useState<TransactionFilters>({ type: "all" });

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, filters, categories),
    [transactions, filters, categories]
  );

  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Всі операції</h1>
        <p className="text-sm text-muted mt-1">Таблиця надходжень і витрат з фільтрами</p>
      </header>

      <Card title="Фільтри">
        <TransactionFiltersPanel
          filters={filters}
          onChange={setFilters}
          accounts={accounts}
          categories={categories}
        />
      </Card>

      <Card title={`Операції (${filtered.length})`}>
        {loading ? (
          <p className="text-muted text-sm">Завантаження...</p>
        ) : (
          <OperationsTable
            transactions={filtered}
            accounts={accounts}
            categories={categories}
            orgId={orgId}
          />
        )}
      </Card>
    </div>
  );
}
