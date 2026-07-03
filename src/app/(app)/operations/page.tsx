"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { usePageHeaderActions } from "@/contexts/PageHeaderContext";
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

  const headerFilters = useMemo(
    () => (
      <TransactionFiltersTrigger
        compact
        filters={filters}
        onApply={setFilters}
        accounts={accounts}
        categories={categories}
      />
    ),
    [filters, accounts, categories]
  );

  usePageHeaderActions(headerFilters);

  if (!orgId) return null;

  return (
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
  );
}
