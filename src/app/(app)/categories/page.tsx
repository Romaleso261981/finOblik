"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCategory, deleteCategory } from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";

export default function CategoriesPage() {
  const { orgId } = useAuth();
  const { categories } = useOrgDataContext();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!orgId) {
      setError("Організація не підключена. Дивіться повідомлення зверху сторінки.");
      return;
    }
    setError(null);
    try {
      await createCategory(orgId, name);
      setName("");
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const remove = async (id: string) => {
    if (!orgId || !confirm("Видалити категорію?")) return;
    try {
      await deleteCategory(orgId, id);
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Категорії витрат</h1>
        <p className="text-sm text-muted mt-1">Список і додавання нових категорій</p>
      </header>

      <Card>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            label="Нова категорія"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            required
          />
          <div className="flex items-end">
            <Button type="submit">Додати</Button>
          </div>
        </form>
        {error && <p className="text-sm text-expense mt-2">{error}</p>}
      </Card>

      <Card title="Існуючі категорії">
        {categories.length === 0 ? (
          <p className="text-sm text-muted">Категорій ще немає.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>{c.name}</span>
                <Button variant="ghost" className="text-expense px-2" onClick={() => remove(c.id)}>
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
