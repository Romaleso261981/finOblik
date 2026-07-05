import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { StatementPdfDocument } from "@/lib/StatementPdfDocument";
import {
  buildStatementRows,
  describeStatementFilters,
  statementFileName,
} from "@/lib/statement-pdf-labels";
import { formatMoney } from "@/lib/utils";
import type { Account, Category, Transaction, TransactionFilters } from "@/types";

export async function downloadStatementPdf(options: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  filters: TransactionFilters;
  accruals: number;
  deductions: number;
  difference: number;
}) {
  const { transactions, accounts, categories, filters, accruals, deductions, difference } =
    options;

  const filterLines = describeStatementFilters(filters, accounts, categories);
  const rows = buildStatementRows(transactions, accounts, categories);
  const generatedAt = format(new Date(), "d MMM yyyy, HH:mm", { locale: uk });

  const doc = (
    <StatementPdfDocument
      generatedAt={generatedAt}
      filterLines={filterLines}
      accruals={formatMoney(accruals)}
      deductions={formatMoney(deductions)}
      difference={formatMoney(difference)}
      rows={rows}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = statementFileName(filters, accounts);
  a.click();
  URL.revokeObjectURL(url);
}
