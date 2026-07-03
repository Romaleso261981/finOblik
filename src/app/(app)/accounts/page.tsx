"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createAccount, deleteAccount } from "@/lib/firestore";
import { balancesByAccount, formatMoney } from "@/lib/utils";

export default function AccountsPage() {
  const { orgId } = useAuth();
  const { accounts, transactions } = useOrgDataContext();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const balances = balancesByAccount(transactions, accounts.map((a) => a.id));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !name.trim()) return;
    setError(null);
    try {
      await createAccount(orgId, name);
      setName("");
    } catch {
      setError("Не вдалося створити рахунок");
    }
  };

  const remove = async (id: string) => {
    if (!orgId || !confirm("Видалити рахунок? Операції залишаться з посиланням на нього.")) return;
    await deleteAccount(orgId, id);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Рахунки</h1>
        <p className="text-sm text-muted mt-1">
          Готівка, картка, ФОП, Monobank, ПриватБанк тощо
        </p>
      </header>

      <Card>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <Input
            label="Назва рахунку"
            placeholder="Наприклад: Monobank"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            required
          />
          <div className="flex items-end">
            <Button type="submit">Створити</Button>
          </div>
        </form>
        {error && <p className="text-sm text-expense mt-2">{error}</p>}
      </Card>

      <Card title="Ваші рахунки">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted">Додайте перший рахунок.</p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm gap-2">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-muted text-xs">
                    Залишок: {formatMoney(balances[a.id] ?? 0)}
                  </p>
                </div>
                <Button variant="ghost" className="text-expense px-2" onClick={() => remove(a.id)}>
                  Видалити
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
