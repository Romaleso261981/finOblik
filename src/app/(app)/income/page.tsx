"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createIncome } from "@/lib/firestore";
import { formatDateInput } from "@/lib/utils";
import Link from "next/link";

export default function IncomePage() {
  const { orgId, user } = useAuth();
  const { accounts } = useOrgDataContext();
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [amount, setAmount] = useState("");
  const [transferredBy, setTransferredBy] = useState("");
  const [accountId, setAccountId] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !user) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const num = parseFloat(amount);
      if (!accountId) throw new Error("Оберіть рахунок");
      if (!transferredBy.trim()) throw new Error("Вкажіть, хто перекинув кошти");
      if (Number.isNaN(num) || num <= 0) throw new Error("Вкажіть коректну суму");
      await createIncome(orgId, {
        date,
        amount: num,
        transferredBy,
        accountId,
        comment,
        createdBy: user.uid,
      });
      setAmount("");
      setTransferredBy("");
      setComment("");
      setMessage("Надходження збережено");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Надходження</h1>
        <p className="text-sm text-muted mt-1">Додати надходження коштів</p>
      </header>

      {accounts.length === 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Спочатку створіть рахунок у розділі{" "}
          <Link href="/accounts" className="underline font-medium">
            Рахунки
          </Link>
          .
        </p>
      )}

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
          <Input
            label="Хто перекинув кошти"
            value={transferredBy}
            onChange={(e) => setTransferredBy(e.target.value)}
            required
          />
          <Select
            label="Рахунок"
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
          <Input
            label="Коментар"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-sm text-expense">{error}</p>}
          {message && <p className="text-sm text-income">{message}</p>}
          <Button type="submit" disabled={saving || accounts.length === 0}>
            {saving ? "Збереження..." : "Додати надходження"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
