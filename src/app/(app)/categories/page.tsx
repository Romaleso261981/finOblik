"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCategory, deleteCategory } from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";
import {
  canDeleteCategory,
  findSalaryCategory,
  getChildCategories,
  getRootCategories,
  SALARY_CATEGORY_NAME,
} from "@/lib/categories";

export default function CategoriesPage() {
  const { orgId } = useAuth();
  const { categories } = useOrgDataContext();
  const [name, setName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const roots = useMemo(() => getRootCategories(categories), [categories]);
  const salary = useMemo(() => findSalaryCategory(categories), [categories]);
  const employees = useMemo(
    () => (salary ? getChildCategories(categories, salary.id) : []),
    [categories, salary]
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!orgId) {
      setError("Організація не підключена. Дивіться повідомлення зверху сторінки.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await createCategory(orgId, name);
      setName("");
      setMessage("Категорію додано");
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const addEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !employeeName.trim()) return;
    setError(null);
    setMessage(null);
    try {
      let salaryId = salary?.id;
      if (!salaryId) {
        salaryId = await createCategory(orgId, SALARY_CATEGORY_NAME);
      }
      await createCategory(orgId, employeeName, salaryId);
      setEmployeeName("");
      setMessage(`Працівника додано до «${SALARY_CATEGORY_NAME}»`);
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const remove = async (id: string) => {
    if (!orgId) return;
    if (!canDeleteCategory(categories, id)) {
      setError("Спочатку видаліть підкатегорії (працівників).");
      return;
    }
    if (!confirm("Видалити категорію?")) return;
    try {
      await deleteCategory(orgId, id);
      setMessage(null);
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Категорії витрат</h1>
        <p className="text-sm text-muted mt-1">
          Категорії та працівники в «{SALARY_CATEGORY_NAME}»
        </p>
      </header>

      <Card title={`${SALARY_CATEGORY_NAME} — працівники`}>
        <form onSubmit={addEmployee} className="flex gap-2">
          <Input
            label="Ім’я працівника"
            placeholder="Коля, Рома, Діма…"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            className="flex-1"
            required
          />
          <div className="flex items-end">
            <Button type="submit">Додати</Button>
          </div>
        </form>
        <p className="text-xs text-muted mt-2">
          Категорія «{SALARY_CATEGORY_NAME}» створиться автоматично, якщо її ще немає.
        </p>
        {employees.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {employees.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {SALARY_CATEGORY_NAME} → {c.name}
                </span>
                <Button variant="ghost" className="text-expense px-2" onClick={() => remove(c.id)}>
                  Видалити
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted mt-3">Працівників ще немає.</p>
        )}
      </Card>

      <Card>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            label="Нова категорія (верхній рівень)"
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
        {message && <p className="text-sm text-income mt-2">{message}</p>}
      </Card>

      <Card title="Усі категорії">
        {roots.length === 0 ? (
          <p className="text-sm text-muted">Категорій ще немає.</p>
        ) : (
          <ul className="divide-y divide-border">
            {roots.map((c) => {
              const children = getChildCategories(categories, c.id);
              return (
                <li key={c.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <Button
                      variant="ghost"
                      className="text-expense px-2"
                      onClick={() => remove(c.id)}
                    >
                      Видалити
                    </Button>
                  </div>
                  {children.length > 0 && (
                    <ul className="mt-1 ml-3 border-l border-border pl-3 space-y-1">
                      {children.map((ch) => (
                        <li key={ch.id} className="flex items-center justify-between text-muted">
                          <span>{ch.name}</span>
                          <Button
                            variant="ghost"
                            className="text-expense px-2"
                            onClick={() => remove(ch.id)}
                          >
                            Видалити
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
