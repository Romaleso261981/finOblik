"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  LEGACY_IMPORT_META,
  LEGACY_NOTES_IMPORT,
  type LegacyImportRow,
} from "@/data/legacy-notes-import";
import {
  MISHA_PROJECTANT_ACCOUNT_NAME,
  MISHA_PROJECTANT_INCOMES,
  MISHA_PROJECTANT_INCOMES_TOTAL,
} from "@/data/misha-projectant-incomes";
import { bulkImportTransactions, parseImportJson } from "@/lib/bulk-import";
import { backfillIncomeTaxes } from "@/lib/firestore";
import { ensureDefaultIncomeTaxCategory } from "@/lib/ensure-default-categories";
import { incomeAccruesTax } from "@/lib/income-tax";
import { formatDate, formatMoney } from "@/lib/utils";

export default function ImportPage() {
  const { orgId, user } = useAuth();
  const { accounts, categories, transactions } = useOrgDataContext();
  const [accountName, setAccountName] = useState("Готівка");
  const [customAccountId, setCustomAccountId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const preview = LEGACY_NOTES_IMPORT;
  const reviewRows = useMemo(() => preview.filter((r) => r.needsReview), [preview]);

  const runImport = async (
    rows: LegacyImportRow[],
    opts?: { accountName?: string; accountId?: string }
  ) => {
    if (!orgId || !user) return;
    setRunning(true);
    setError(null);
    setStatus(null);
    setProgress(null);
    try {
      const name = opts?.accountName ?? accountName;
      const accId =
        opts?.accountId ??
        (customAccountId || undefined);
      const result = await bulkImportTransactions({
        orgId,
        createdBy: user.uid,
        accountId: accId,
        accountName: name,
        accounts,
        categories,
        rows,
        onProgress: (done, total) => setProgress({ done, total }),
      });

      const parts = [`Імпортовано ${result.imported} операцій.`];
      if (result.accountCreated) parts.push(`Створено рахунок «${name}».`);
      if (result.categoriesCreated.length) {
        parts.push(`Нові категорії: ${result.categoriesCreated.join(", ")}.`);
      }
      setStatus(parts.join(" "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка імпорту");
    } finally {
      setRunning(false);
    }
  };

  const importNotes = () => runImport(LEGACY_NOTES_IMPORT);

  const mishaAccount = useMemo(
    () =>
      accounts.find(
        (a) =>
          a.name.localeCompare(MISHA_PROJECTANT_ACCOUNT_NAME, "uk", {
            sensitivity: "accent",
          }) === 0
      ),
    [accounts]
  );

  const importMishaIncomes = () =>
    runImport(MISHA_PROJECTANT_INCOMES, {
      accountName: MISHA_PROJECTANT_ACCOUNT_NAME,
      accountId: mishaAccount?.id,
    });

  const importJson = () => {
    try {
      const rows = parseImportJson(jsonText);
      runImport(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Невірний JSON");
    }
  };

  const incomesMissingTax = useMemo(() => {
    const linked = new Set(
      transactions
        .filter((t) => t.type === "expense" && t.linkedIncomeId)
        .map((t) => t.linkedIncomeId as string)
    );
    return transactions.filter(
      (t) =>
        t.type === "income" &&
        incomeAccruesTax(categories, t.categoryId) &&
        !t.taxExpenseId &&
        !linked.has(t.id)
    ).length;
  }, [transactions, categories]);

  const backfillTaxes = async () => {
    if (!orgId || !user) return;
    setRunning(true);
    setError(null);
    setStatus(null);
    try {
      const taxCategoryId = await ensureDefaultIncomeTaxCategory(orgId, categories);
      const created = await backfillIncomeTaxes(
        orgId,
        transactions,
        taxCategoryId,
        categories,
        user.uid
      );
      setStatus(
        created > 0
          ? `Додано ${created} витрат «Податок 7%» для нарахувань без податку.`
          : "Усі нарахування вже мають податкові витрати."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setRunning(false);
    }
  };

  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Імпорт записів</h1>
        <p className="text-sm text-muted mt-1">
          Перенесіть старі нотатки в Firestore одним натисканням
        </p>
      </header>

      <Card title="Податок 7% від нарахувань">
        <p className="text-sm text-slate-700 mb-3">
          Для надходжень категорії «Перерахунок на рахунок» автоматично створюється витрата 7% у
          «Податки (7%)». Готівка та інші категорії — без податку. Для старих перерахувань без
          податку натисніть кнопку нижче.
        </p>
        {incomesMissingTax > 0 ? (
          <p className="text-xs text-amber-800 mb-3">
            Нарахувань «Перерахунок на рахунок» без податку: <strong>{incomesMissingTax}</strong>
          </p>
        ) : (
          <p className="text-xs text-muted mb-3">Податок проставлено для усіх перерахувань на рахунок.</p>
        )}
        <Button variant="secondary" onClick={backfillTaxes} disabled={running || incomesMissingTax === 0}>
          {running ? "Обробка..." : "Додати 7% до нарахувань без податку"}
        </Button>
      </Card>

      <Card title={`Нарахування: ${MISHA_PROJECTANT_ACCOUNT_NAME}`}>
        <p className="text-sm text-slate-700 mb-3">
          {MISHA_PROJECTANT_INCOMES.length} надходжень на суму{" "}
          <strong className="text-income">{formatMoney(MISHA_PROJECTANT_INCOMES_TOTAL)}</strong>{" "}
          (травень–липень 2026). Категорія: «Перерахунок на рахунок». До кожного рядка додається витрата 7% податку.
        </p>
        {mishaAccount ? (
          <p className="text-xs text-muted mb-3">
            Рахунок знайдено: <strong>{mishaAccount.name}</strong>
          </p>
        ) : (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
            Рахунок «{MISHA_PROJECTANT_ACCOUNT_NAME}» буде створено автоматично, якщо його ще немає.
          </p>
        )}
        <div className="overflow-x-auto mb-4 max-h-48 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-muted">
                <th className="py-1.5 px-2">Дата</th>
                <th className="py-1.5 px-2">Сума</th>
              </tr>
            </thead>
            <tbody>
              {MISHA_PROJECTANT_INCOMES.map((r, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-1 px-2 whitespace-nowrap">{formatDate(new Date(r.date))}</td>
                  <td className="py-1 px-2 text-income font-medium">{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button onClick={importMishaIncomes} disabled={running}>
          {running ? "Імпорт..." : "Імпортувати нарахування"}
        </Button>
      </Card>

      <Card title="Ваші нотатки (вже розібрані)">
        <p className="text-sm text-slate-700 mb-3">
          {LEGACY_IMPORT_META.rowCount} витрат на суму{" "}
          <strong>{formatMoney(LEGACY_IMPORT_META.totalExpenses)}</strong>.
          {LEGACY_IMPORT_META.reviewCount > 0 && (
            <>
              {" "}
              <span className="text-amber-700">
                {LEGACY_IMPORT_META.reviewCount} запис(и) варто перевірити після імпорту.
              </span>
            </>
          )}
        </p>
        {reviewRows.length > 0 && (
          <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3 space-y-1">
            {reviewRows.map((r, i) => (
              <li key={i}>
                {formatMoney(r.amount)} — {r.description}
                {r.comment ? ` (${r.comment})` : ""}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted mb-4">
          Не імпортується: «Мастив лотки бригада11» — сума не вказана.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 max-w-lg mb-4">
          {accounts.length > 0 ? (
            <Select
              label="Рахунок для всіх операцій"
              value={customAccountId}
              onChange={(e) => setCustomAccountId(e.target.value)}
            >
              <option value="">Створити / використати «{accountName}»</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              label="Рахунок (буде створено, якщо немає)"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            >
              <option value="Готівка">Готівка</option>
              <option value="Карта">Карта</option>
              <option value="ФОП">ФОП</option>
            </Select>
          )}
        </div>

        <Button onClick={importNotes} disabled={running}>
          {running ? "Імпорт..." : "Імпортувати ці записи"}
        </Button>
        {progress && (
          <p className="text-sm text-muted mt-2">
            {progress.done} / {progress.total}
          </p>
        )}
      </Card>

      <Card title="Або вставте свій JSON">
        <p className="text-xs text-muted mb-2">
          Формат: масив обʼєктів з полями type, date (yyyy-MM-dd), amount, category,
          description, опційно comment.
        </p>
        <textarea
          className="w-full min-h-32 rounded-lg border border-border p-3 text-sm font-mono"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='[{"type":"expense","date":"2026-06-01","amount":500,"category":"Обіди","description":"..."}]'
        />
        <Button className="mt-3" variant="secondary" onClick={importJson} disabled={running || !jsonText.trim()}>
          Імпортувати JSON
        </Button>
      </Card>

      <Card title="Попередній перегляд (перші 15)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted border-b">
                <th className="py-1 pr-2">Дата</th>
                <th className="py-1 pr-2">Сума</th>
                <th className="py-1 pr-2">Категорія</th>
                <th className="py-1">Опис</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 15).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1 pr-2 whitespace-nowrap">{r.date}</td>
                  <td className="py-1 pr-2">{formatMoney(r.amount)}</td>
                  <td className="py-1 pr-2">{r.category}</td>
                  <td className="py-1">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {status && <p className="text-sm text-income">{status}</p>}
      {error && <p className="text-sm text-expense">{error}</p>}
    </div>
  );
}
