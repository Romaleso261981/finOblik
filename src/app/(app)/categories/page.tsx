"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CategoryNameEditor, CategoryNameRow } from "@/components/CategoryNameRow";
import { SupplierModal } from "@/components/SupplierModal";
import { createCategory, createSupplierCategory, deleteCategory, updateCategoryName } from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";
import {
  canDeleteCategory,
  findPublicProcurementCategory,
  findSalaryCategory,
  getChildCategories,
  getRootCategories,
  getRootScope,
  PUBLIC_PROCUREMENT_CATEGORY_NAME,
  SALARY_CATEGORY_NAME,
} from "@/lib/categories";
import type { Category, SupplierProfile } from "@/types";

function CategoryTreeItem({
  category,
  categories,
  depth,
  onRemove,
  onRename,
}: {
  category: Category;
  categories: Category[];
  depth: number;
  onRemove: (id: string) => void;
  onRename: (category: Category, newName: string) => Promise<void>;
}) {
  const children = getChildCategories(categories, category.id);
  const phoneSuffix = category.supplier?.phone ? ` · ${category.supplier.phone}` : undefined;
  const scopeSuffix =
    depth === 0 && getRootScope(category) === "income" ? " · надходження" : undefined;
  return (
    <li className={depth === 0 ? "py-2 text-sm" : "py-1 text-muted"}>
      <CategoryNameEditor
        compact
        showArrow={depth > 0}
        name={category.name}
        suffix={
          (scopeSuffix ?? "") + (phoneSuffix ?? "") || undefined
        }
        onSave={(newName) => onRename(category, newName)}
        onRemove={() => onRemove(category.id)}
      />
      {children.length > 0 && (
        <ul className={`${depth === 0 ? "mt-1 ml-3 border-l border-border pl-3 space-y-1" : "ml-4 mt-1 space-y-1"}`}>
          {children.map((ch) => (
            <CategoryTreeItem
              key={ch.id}
              category={ch}
              categories={categories}
              depth={depth + 1}
              onRemove={onRemove}
              onRename={onRename}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoriesPage() {
  const { orgId } = useAuth();
  const { categories } = useOrgDataContext();
  const [name, setName] = useState("");
  const [incomeRootName, setIncomeRootName] = useState("");
  const [incomeSubParentId, setIncomeSubParentId] = useState("");
  const [incomeSubName, setIncomeSubName] = useState("");
  const [subParentId, setSubParentId] = useState("");
  const [subName, setSubName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const expenseRoots = useMemo(() => getRootCategories(categories, "expense"), [categories]);
  const incomeRoots = useMemo(() => getRootCategories(categories, "income"), [categories]);
  const roots = useMemo(() => getRootCategories(categories), [categories]);
  const salary = useMemo(() => findSalaryCategory(categories), [categories]);
  const publicProcurement = useMemo(() => findPublicProcurementCategory(categories), [categories]);
  const employees = useMemo(
    () => (salary ? getChildCategories(categories, salary.id) : []),
    [categories, salary]
  );
  const suppliers = useMemo(
    () => (publicProcurement ? getChildCategories(categories, publicProcurement.id) : []),
    [categories, publicProcurement]
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
      await createCategory(orgId, name, null, "expense");
      setName("");
      setMessage("Категорію додано");
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const addIncomeRoot = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !incomeRootName.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await createCategory(orgId, incomeRootName.trim(), null, "income");
      setIncomeRootName("");
      setMessage("Категорію надходження додано");
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const addIncomeSubcategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !incomeSubParentId || !incomeSubName.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await createCategory(orgId, incomeSubName.trim(), incomeSubParentId, "income");
      setIncomeSubName("");
      setMessage("Підкатегорію надходження додано");
    } catch (e) {
      setError(mapFirebaseError(e));
    }
  };

  const addSubcategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !subParentId || !subName.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await createCategory(orgId, subName.trim(), subParentId);
      setSubName("");
      setMessage("Підкатегорію додано");
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

  const saveSupplier = async (profile: SupplierProfile) => {
    if (!orgId) throw new Error("Організація не підключена");
    setAddingSupplier(true);
    setError(null);
    try {
      let rootId = publicProcurement?.id;
      if (!rootId) {
        rootId = await createCategory(orgId, PUBLIC_PROCUREMENT_CATEGORY_NAME);
      }
      await createSupplierCategory(orgId, rootId, profile);
      setSupplierModalOpen(false);
      setMessage("Постачальника додано");
    } catch (e) {
      throw e instanceof Error ? e : new Error(mapFirebaseError(e));
    } finally {
      setAddingSupplier(false);
    }
  };

  const remove = async (id: string) => {
    if (!orgId) return;
    if (!canDeleteCategory(categories, id)) {
      setError("Спочатку видаліть вкладені підкатегорії.");
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

  const rename = async (category: Category, newName: string) => {
    if (!orgId) throw new Error("Організація не підключена");
    setError(null);
    try {
      await updateCategoryName(orgId, category.id, newName, {
        supplier: category.supplier,
      });
      setMessage("Назву оновлено");
    } catch (e) {
      const msg = mapFirebaseError(e);
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Категорії</h1>
        <p className="text-sm text-muted mt-1">
          Витрати, надходження, працівники та постачальники
        </p>
      </header>

      <Card title="Категорії надходжень">
        <form onSubmit={addIncomeRoot} className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            label="Нова група надходжень"
            placeholder="Наприклад: Інше надходження"
            value={incomeRootName}
            onChange={(e) => setIncomeRootName(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-end">
            <Button type="submit">Додати</Button>
          </div>
        </form>
        <form onSubmit={addIncomeSubcategory} className="space-y-3">
          <Select
            label="Група надходжень"
            value={incomeSubParentId}
            onChange={(e) => setIncomeSubParentId(e.target.value)}
            required
          >
            <option value="">Оберіть групу</option>
            {incomeRoots.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              label="Підкатегорія"
              placeholder="Наприклад: Monobank, Privat…"
              value={incomeSubName}
              onChange={(e) => setIncomeSubName(e.target.value)}
              className="flex-1"
              required
            />
            <div className="flex items-end">
              <Button type="submit">Додати підкатегорію</Button>
            </div>
          </div>
        </form>
        <p className="text-xs text-muted mt-2">
          За замовчуванням створюються «Готівка» та «Перерахунок на рахунок» — під останню можна
          додати назви рахунків, на які переказували.
        </p>
      </Card>

      <Card title={PUBLIC_PROCUREMENT_CATEGORY_NAME}>
        <Button type="button" onClick={() => setSupplierModalOpen(true)}>
          Додати постачальника
        </Button>
        <p className="text-xs text-muted mt-2">
          Категорія «{PUBLIC_PROCUREMENT_CATEGORY_NAME}» створиться автоматично, якщо її ще немає.
        </p>
        {suppliers.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {suppliers.map((c) => (
              <CategoryNameRow
                key={c.id}
                prefix={PUBLIC_PROCUREMENT_CATEGORY_NAME}
                name={c.name}
                suffix={
                  c.supplier?.location ? ` · ${c.supplier.location}` : undefined
                }
                onSave={(newName) => rename(c, newName)}
                onRemove={() => remove(c.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted mt-3">Постачальників ще немає.</p>
        )}
      </Card>

      <Card title={`${SALARY_CATEGORY_NAME} — працівники`}>
        <form onSubmit={addEmployee} className="flex flex-col sm:flex-row gap-2">
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
              <CategoryNameRow
                key={c.id}
                prefix={SALARY_CATEGORY_NAME}
                name={c.name}
                onSave={(newName) => rename(c, newName)}
                onRemove={() => remove(c.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted mt-3">Працівників ще немає.</p>
        )}
      </Card>

      <Card title="Підкатегорія">
        <form onSubmit={addSubcategory} className="space-y-3">
          <Select
            label="Батьківська категорія"
            value={subParentId}
            onChange={(e) => setSubParentId(e.target.value)}
            required
          >
            <option value="">Оберіть групу</option>
            {expenseRoots.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              label="Назва підкатегорії"
              placeholder="Наприклад: монтаж, доставка"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="flex-1"
              required
            />
            <div className="flex items-end">
              <Button type="submit">Додати</Button>
            </div>
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <Input
            label="Нова категорія витрат (верхній рівень)"
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
            {roots.map((c) => (
              <CategoryTreeItem
                key={c.id}
                category={c}
                categories={categories}
                depth={0}
                onRemove={remove}
                onRename={rename}
              />
            ))}
          </ul>
        )}
      </Card>

      <SupplierModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={saveSupplier}
        saving={addingSupplier}
      />
    </div>
  );
}
