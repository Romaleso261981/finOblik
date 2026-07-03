"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { TransactionFiltersTrigger } from "@/components/TransactionFiltersTrigger";
import { OperationsTable } from "@/components/OperationsTable";
import { applyTransactionFilters } from "@/lib/utils";
import { DEFAULT_TRANSACTION_FILTERS } from "@/lib/transaction-filters";
import type { TransactionFilters } from "@/types";

export default function OperationsPage() {
  const { orgId } = useAuth();
  const { accounts, categories, transactions, loading } = useOrgDataContext();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, filters, categories),
    [transactions, filters, categories]
  );

  if (!orgId) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Всі операції</h1>
          <p className="text-sm text-muted mt-1">Таблиця надходжень і витрат</p>
        </div>
        <TransactionFiltersTrigger
          filters={filters}
          onApply={setFilters}
          accounts={accounts}
          categories={categories}
          className="self-start shrink-0"
        />
      </header>

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
