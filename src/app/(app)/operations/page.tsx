"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ActiveTransactionFilters } from "@/components/ActiveTransactionFilters";
import { AccrualsDeductionsSummary } from "@/components/AccrualsDeductionsSummary";
import { TransactionFiltersTrigger } from "@/components/TransactionFiltersTrigger";
import { OperationsTable } from "@/components/OperationsTable";
import { downloadStatementPdf } from "@/lib/export-statement-pdf";
import { accrualsDeductionsTotals, applyTransactionFilters } from "@/lib/utils";
import { DEFAULT_TRANSACTION_FILTERS } from "@/lib/transaction-filters";
import type { TransactionFilters } from "@/types";

export default function OperationsPage() {
  const { orgId } = useAuth();
  const { accounts, categories, transactions, loading } = useOrgDataContext();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const filtered = useMemo(
    () => applyTransactionFilters(transactions, filters, categories),
    [transactions, filters, categories]
  );

  const totals = useMemo(() => accrualsDeductionsTotals(filtered), [filtered]);

  const filterTrigger = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pdfLoading || filtered.length === 0}
          onClick={async () => {
            setPdfError(null);
            setPdfLoading(true);
            try {
              await downloadStatementPdf({
                transactions: filtered,
                accounts,
                categories,
                filters,
                accruals: totals.accruals,
                deductions: totals.deductions,
                difference: totals.difference,
              });
            } catch (e) {
              setPdfError(e instanceof Error ? e.message : "Не вдалося створити PDF");
            } finally {
              setPdfLoading(false);
            }
          }}
        >
          {pdfLoading ? "PDF…" : "Виписка PDF"}
        </Button>
        <TransactionFiltersTrigger
          filters={filters}
          onApply={setFilters}
          accounts={accounts}
          categories={categories}
        />
      </div>
    ),
    [filters, accounts, categories, filtered, totals, pdfLoading]
  );

  if (!orgId) return null;

  return (
    <Card title={`Операції (${filtered.length})`} action={filterTrigger}>
      <ActiveTransactionFilters
        filters={filters}
        onChange={setFilters}
        accounts={accounts}
        categories={categories}
      />
      {pdfError && <p className="text-sm text-expense mb-2">{pdfError}</p>}
      <AccrualsDeductionsSummary
        compact
        accruals={totals.accruals}
        deductions={totals.deductions}
        difference={totals.difference}
      />
      {loading ? (
        <p className="text-muted text-sm">Завантаження...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm">
          {transactions.length === 0
            ? "Операцій ще немає."
            : "За обраними фільтрами нічого не знайдено. Спробуйте змінити умови."}
        </p>
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
