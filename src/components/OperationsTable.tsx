"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  CategoryPicker,
  resolveCategoryId,
  splitCategorySelection,
} from "@/components/CategoryPicker";
import { deleteTransaction, syncIncomeTaxExpense, updateTransaction } from "@/lib/firestore";
import { ensureDefaultIncomeTaxCategory } from "@/lib/ensure-default-categories";
import { getFirebaseDb, transactionsCollection } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { formatDate, formatDateInput, formatMoney } from "@/lib/utils";
import {
  buildCategoryDisplayMap,
  findIncomeTaxCategory,
  incomeRootNeedsSubcategory,
  isPublicProcurementRootCategory,
  isSalaryRootCategory,
  rootNeedsSubcategory,
} from "@/lib/categories";
import type { Account, Category, Transaction, TransactionType } from "@/types";

type SortColumn = "date" | "amount" | "account" | "category" | "description";
type SortDirection = "asc" | "desc";

function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className = "",
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = activeColumn === column;
  return (
    <th className={`px-3 py-2 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${
          active ? "text-slate-900" : ""
        }`}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {active && (
          <span className="text-brand-600 text-xs leading-none" aria-hidden>
            {direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </button>
    </th>
  );
}

function sortTransactions(
  rows: Transaction[],
  column: SortColumn,
  direction: SortDirection,
  accountMap: Record<string, string>,
  categoryMap: Record<string, string>
): Transaction[] {
  const dir = direction === "asc" ? 1 : -1;
  const sorted = [...rows];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "date":
        cmp = a.date.getTime() - b.date.getTime();
        break;
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "account":
        cmp = (accountMap[a.accountId] ?? "").localeCompare(accountMap[b.accountId] ?? "", "uk");
        break;
      case "category":
        cmp = (categoryMap[a.categoryId ?? ""] ?? "").localeCompare(
          categoryMap[b.categoryId ?? ""] ?? "",
          "uk"
        );
        break;
      case "description": {
        const da = a.type === "income" ? a.transferredBy ?? "" : a.description ?? "";
        const db = b.type === "income" ? b.transferredBy ?? "" : b.description ?? "";
        cmp = da.localeCompare(db, "uk");
        break;
      }
    }
    return cmp * dir;
  });
  return sorted;
}

export function OperationsTable({
  transactions,
  accounts,
  categories,
  orgId,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  orgId: string;
}) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const accountMap = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );
  const categoryMap = useMemo(() => buildCategoryDisplayMap(categories), [categories]);

  const sortedTransactions = useMemo(
    () => sortTransactions(transactions, sortColumn, sortDirection, accountMap, categoryMap),
    [transactions, sortColumn, sortDirection, accountMap, categoryMap]
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "date" ? "desc" : "asc");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteTransaction(orgId, deleting);
      setDeleting(null);
      setSelected(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Не вдалося видалити");
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleting(null);
    setDeleteError(null);
  };

  if (!transactions.length) {
    return (
      <p className="text-sm text-muted py-8 text-center">Операцій поки немає.</p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <SortableHeader
                label="Дата"
                column="date"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Сума"
                column="amount"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Рахунок"
                column="account"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Категорія"
                column="category"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Опис / хто перекинув"
                column="description"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t) => (
              <tr
                key={t.id}
                className="border-t border-border cursor-pointer hover:bg-brand-50/60 transition-colors"
                onClick={() => setSelected(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(t);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Відкрити деталі операції"
              >
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(t.date)}</td>
                <td
                  className={`px-3 py-2 font-semibold whitespace-nowrap tabular-nums ${
                    t.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {formatMoney(t.amount)}
                </td>
                <td className="px-3 py-2">{accountMap[t.accountId] ?? "—"}</td>
                <td className="px-3 py-2">
                  {t.categoryId ? categoryMap[t.categoryId] ?? "—" : "—"}
                </td>
                <td className="px-3 py-2 max-w-xs truncate">
                  {t.type === "income"
                    ? t.transferredBy ?? "—"
                    : t.description ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <TransactionDetailModal
          transaction={selected}
          accountMap={accountMap}
          categoryMap={categoryMap}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          onDelete={() => {
            setDeleting(selected);
            setSelected(null);
          }}
        />
      )}

      {editing && (
        <EditTransactionModal
          transaction={editing}
          accounts={accounts}
          categories={categories}
          orgId={orgId}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <Modal open title="Видалити операцію?" onClose={closeDeleteModal}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Цю дію <strong>не можна скасувати</strong>. Запис буде остаточно видалено з обліку.
            </p>
            <div className="rounded-lg border border-border bg-slate-50 px-3 py-3 text-sm space-y-1">
              <p>
                <span className="text-muted">Дата: </span>
                {formatDate(deleting.date)}
              </p>
              <p>
                <span className="text-muted">Тип: </span>
                {deleting.type === "income" ? "Надходження" : "Витрата"}
              </p>
              <p>
                <span className="text-muted">Сума: </span>
                <span className="font-medium">{formatMoney(deleting.amount)}</span>
              </p>
            </div>
            {deleteError && <p className="text-sm text-expense">{deleteError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={closeDeleteModal} disabled={deleteLoading}>
                Скасувати
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? "Видалення…" : "Так, видалити"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-border last:border-0">
      <dt className="text-muted text-sm sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-900 font-medium">{value}</dd>
    </div>
  );
}

function TransactionDetailModal({
  transaction,
  accountMap,
  categoryMap,
  onClose,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  accountMap: Record<string, string>;
  categoryMap: Record<string, string>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = transaction.type === "income";

  return (
    <Modal open title="Деталі операції" onClose={onClose}>
      <dl className="mb-6">
        <DetailRow label="Дата" value={formatDate(transaction.date)} />
        <DetailRow
          label="Тип"
          value={
            <span className={isIncome ? "text-income" : "text-expense"}>
              {isIncome ? "Надходження" : "Витрата"}
            </span>
          }
        />
        <DetailRow label="Сума" value={formatMoney(transaction.amount)} />
        <DetailRow label="Рахунок" value={accountMap[transaction.accountId] ?? "—"} />
        <DetailRow
          label="Категорія"
          value={
            transaction.categoryId ? categoryMap[transaction.categoryId] ?? "—" : "—"
          }
        />
        {isIncome ? (
          <DetailRow label="Хто перекинув" value={transaction.transferredBy ?? "—"} />
        ) : (
          <DetailRow label="Опис" value={transaction.description ?? "—"} />
        )}
        <DetailRow label="Коментар" value={transaction.comment?.trim() ? transaction.comment : "—"} />
      </dl>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
        <Button variant="secondary" onClick={onClose} className="sm:min-w-[7rem]">
          Закрити
        </Button>
        <Button variant="edit" onClick={onEdit} className="sm:min-w-[7rem]">
          Редагувати
        </Button>
        <Button variant="danger" onClick={onDelete} className="sm:min-w-[7rem]">
          Видалити
        </Button>
      </div>
    </Modal>
  );
}

function EditTransactionModal({
  transaction,
  accounts,
  categories,
  orgId,
  onClose,
}: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  orgId: string;
  onClose: () => void;
}) {
  const initialCategory = useMemo(
    () => splitCategorySelection(categories, transaction.categoryId ?? ""),
    [categories, transaction.categoryId]
  );

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [date, setDate] = useState(formatDateInput(transaction.date));
  const [amount, setAmount] = useState(String(transaction.amount));
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [comment, setComment] = useState(transaction.comment ?? "");
  const [transferredBy, setTransferredBy] = useState(transaction.transferredBy ?? "");
  const [parentCategoryId, setParentCategoryId] = useState(initialCategory.parentCategoryId);
  const [subCategoryId, setSubCategoryId] = useState(initialCategory.subCategoryId);
  const [description, setDescription] = useState(transaction.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setType(transaction.type);
    setDate(formatDateInput(transaction.date));
    setAmount(String(transaction.amount));
    setAccountId(transaction.accountId);
    setComment(transaction.comment ?? "");
    setTransferredBy(transaction.transferredBy ?? "");
    setDescription(transaction.description ?? "");
    const split = splitCategorySelection(categories, transaction.categoryId ?? "");
    setParentCategoryId(split.parentCategoryId);
    setSubCategoryId(split.subCategoryId);
    requestAnimationFrame(() => {
      const dialog = document.querySelector('[role="dialog"]');
      dialog?.querySelector("[data-modal-scroll]")?.scrollTo({ top: 0 });
    });
  }, [transaction, categories]);

  const onParentCategoryChange = (id: string) => {
    setParentCategoryId(id);
    setSubCategoryId("");
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const num = parseFloat(amount);
      if (Number.isNaN(num) || num <= 0) throw new Error("Вкажіть коректну суму");

      if (type === "expense") {
        if (
          transaction.type === "income" &&
          transaction.taxExpenseId
        ) {
          await deleteDoc(
            doc(getFirebaseDb(), transactionsCollection(orgId), transaction.taxExpenseId)
          );
        }

        const categoryId = resolveCategoryId(
          categories,
          parentCategoryId,
          subCategoryId,
          "expense"
        );
        if (rootNeedsSubcategory(categories, parentCategoryId) && !subCategoryId) {
          if (isSalaryRootCategory(categories, parentCategoryId)) {
            throw new Error("Оберіть категорію працівника");
          }
          if (isPublicProcurementRootCategory(categories, parentCategoryId)) {
            throw new Error("Оберіть постачальника");
          }
          throw new Error("Оберіть підкатегорію");
        }
        if (!categoryId) throw new Error("Оберіть категорію витрати");

        let desc = description.trim();
        if (!desc && isSalaryRootCategory(categories, parentCategoryId) && subCategoryId) {
          const emp = categories.find((c) => c.id === subCategoryId);
          desc = emp ? `Зарплата ${emp.name}` : "Зарплата";
        }
        if (!desc) throw new Error("Додайте опис витрати");

        await updateTransaction(orgId, transaction.id, {
          type: "expense",
          date,
          amount: num,
          accountId,
          comment,
          categoryId,
          description: desc,
        });
      } else {
        const categoryId = resolveCategoryId(
          categories,
          parentCategoryId,
          subCategoryId,
          "income"
        );
        if (
          parentCategoryId &&
          incomeRootNeedsSubcategory(categories, parentCategoryId) &&
          !subCategoryId
        ) {
          throw new Error("Оберіть підкатегорію надходження");
        }

        await updateTransaction(orgId, transaction.id, {
          type: "income",
          date,
          amount: num,
          accountId,
          comment,
          transferredBy: transferredBy.trim(),
          categoryId: categoryId || "",
        });

        const taxCategoryId =
          findIncomeTaxCategory(categories)?.id ??
          (await ensureDefaultIncomeTaxCategory(orgId, categories));
        await syncIncomeTaxExpense(
          orgId,
          {
            ...transaction,
            type: "income",
            taxExpenseId:
              transaction.type === "income" ? transaction.taxExpenseId : undefined,
          },
          { date, amount: num, accountId, categoryId: categoryId || undefined },
          taxCategoryId,
          categories,
          transaction.createdBy
        );
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Редагувати операцію"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Select
          label="Тип операції"
          value={type}
          onChange={(e) => {
            const next = e.target.value as TransactionType;
            if (next === "expense" && type === "income") {
              if (!description.trim() && transferredBy.trim()) {
                setDescription(transferredBy.trim());
              }
            }
            setType(next);
          }}
        >
          <option value="income">Надходження</option>
          <option value="expense">Витрата</option>
        </Select>

        {type === "income" ? (
          <CategoryPicker
            mode="income"
            categories={categories}
            parentCategoryId={parentCategoryId}
            subCategoryId={subCategoryId}
            onParentChange={onParentCategoryChange}
            onSubChange={setSubCategoryId}
          />
        ) : (
          <CategoryPicker
            mode="expense"
            categories={categories}
            parentCategoryId={parentCategoryId}
            subCategoryId={subCategoryId}
            onParentChange={onParentCategoryChange}
            onSubChange={setSubCategoryId}
          />
        )}

        <Input label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          label="Сума"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Рахунок" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        {type === "income" ? (
          <Input
            label="Хто перекинув"
            value={transferredBy}
            onChange={(e) => setTransferredBy(e.target.value)}
          />
        ) : (
          <Input
            label="Опис"
            placeholder="Можна залишити порожнім для зарплати"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
        <Input
          label="Коментар"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && <p className="text-sm text-expense">{error}</p>}
      </div>
    </Modal>
  );
}
