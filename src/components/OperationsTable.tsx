"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { deleteTransaction, updateTransaction } from "@/lib/firestore";
import { formatDate, formatDateInput, formatMoney } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types";

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
  const [editing, setEditing] = useState<Transaction | null>(null);
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const handleDelete = async (t: Transaction) => {
    if (!confirm("Видалити цю операцію?")) return;
    await deleteTransaction(orgId, t.id);
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
              <th className="px-3 py-2 font-medium">Дата</th>
              <th className="px-3 py-2 font-medium">Тип</th>
              <th className="px-3 py-2 font-medium">Сума</th>
              <th className="px-3 py-2 font-medium">Рахунок</th>
              <th className="px-3 py-2 font-medium">Категорія</th>
              <th className="px-3 py-2 font-medium">Опис / хто перекинув</th>
              <th className="px-3 py-2 font-medium w-28"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(t.date)}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      t.type === "income" ? "text-income font-medium" : "text-expense font-medium"
                    }
                  >
                    {t.type === "income" ? "Надходження" : "Витрата"}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium whitespace-nowrap">
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
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(t)}>
                      Ред.
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-expense"
                      onClick={() => handleDelete(t)}
                    >
                      Вид.
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditTransactionModal
          transaction={editing}
          accounts={accounts}
          categories={categories}
          orgId={orgId}
          onClose={() => setEditing(null)}
        />
      )}
    </>
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
  const [date, setDate] = useState(formatDateInput(transaction.date));
  const [amount, setAmount] = useState(String(transaction.amount));
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [comment, setComment] = useState(transaction.comment ?? "");
  const [transferredBy, setTransferredBy] = useState(transaction.transferredBy ?? "");
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [description, setDescription] = useState(transaction.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const num = parseFloat(amount);
      if (Number.isNaN(num) || num <= 0) throw new Error("Вкажіть коректну суму");
      await updateTransaction(orgId, transaction.id, {
        date,
        amount: num,
        accountId,
        comment,
        ...(transaction.type === "income"
          ? { transferredBy }
          : { categoryId, description }),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Редагувати операцію" onClose={onClose}>
      <div className="space-y-3">
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
        {transaction.type === "income" ? (
          <Input
            label="Хто перекинув"
            value={transferredBy}
            onChange={(e) => setTransferredBy(e.target.value)}
          />
        ) : (
          <>
            <Select
              label="Категорія"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Опис"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </>
        )}
        <Input
          label="Коментар"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && <p className="text-sm text-expense">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
