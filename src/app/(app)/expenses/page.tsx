"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createCategory, createExpense } from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";
import { formatDateInput } from "@/lib/utils";
import Link from "next/link";

export default function ExpensesPage() {
  const { orgId, user } = useAuth();
  const { accounts, categories } = useOrgDataContext();
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    if (!orgId) {
      setError("Організація не підключена. Дивіться повідомлення зверху сторінки.");
      return;
    }
    setError(null);
    try {
      await createCategory(orgId, newCategory);
      setNewCategory("");
      setMessage("Категорію додано");
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!orgId) {
      setError("Організація не підключена. Дивіться повідомлення зверху сторінки.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const num = parseFloat(amount);
      if (!accountId) throw new Error("Оберіть рахунок");
      if (!categoryId) throw new Error("Оберіть категорію");
      if (!description.trim()) throw new Error("Додайте опис витрати");
      if (Number.isNaN(num) || num <= 0) throw new Error("Вкажіть коректну суму");
      await createExpense(orgId, {
        date,
        amount: num,
        categoryId,
        description,
        accountId,
        comment,
        createdBy: user.uid,
      });
      setAmount("");
      setDescription("");
      setComment("");
      setMessage("Витрату збережено");
    } catch (err) {
      setError(err instanceof Error ? err.message : mapFirebaseError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Витрати</h1>
        <p className="text-sm text-muted mt-1">Додати витрату</p>
      </header>

      {accounts.length === 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Створіть рахунок у{" "}
          <Link href="/accounts" className="underline font-medium">
            Рахунках
          </Link>
          .
        </p>
      )}

      <Card title="Нова категорія (якщо немає в списку)">
        <div className="flex gap-2">
          <Input
            placeholder="Назва категорії"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={addCategory}>
            Додати
          </Button>
        </div>
      </Card>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input
            label="Сума"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Select
            label="Категорія витрати"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Оберіть категорію</option>
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
            required
          />
          <Select
            label="Рахунок оплати"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="">Оберіть рахунок</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Input label="Коментар" value={comment} onChange={(e) => setComment(e.target.value)} />
          {error && <p className="text-sm text-expense">{error}</p>}
          {message && <p className="text-sm text-income">{message}</p>}
          <Button type="submit" disabled={saving || accounts.length === 0}>
            {saving ? "Збереження..." : "Додати витрату"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
