"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SupplierModal } from "@/components/SupplierModal";
import { createCategory, createSupplierCategory, deleteCategory } from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";
import {
  canDeleteCategory,
  findPublicProcurementCategory,
  findSalaryCategory,
  getChildCategories,
  getRootCategories,
  PUBLIC_PROCUREMENT_CATEGORY_NAME,
  SALARY_CATEGORY_NAME,
} from "@/lib/categories";
import type { Category, SupplierProfile } from "@/types";

function CategoryTreeItem({
  category,
  categories,
  depth,
  onRemove,
}: {
  category: Category;
  categories: Category[];
  depth: number;
  onRemove: (id: string) => void;
}) {
  const children = getChildCategories(categories, category.id);
  return (
    <li className={depth === 0 ? "py-2 text-sm" : "flex items-center justify-between text-muted py-1"}>
      <div className={depth === 0 ? "flex items-center justify-between" : "flex-1 flex items-center justify-between"}>
        <span className={depth === 0 ? "font-medium" : undefined}>
          {depth > 0 && "→ "}
          {category.name}
          {category.supplier?.phone ? (
            <span className="text-muted font-normal"> · {category.supplier.phone}</span>
          ) : null}
        </span>
        <Button variant="ghost" className="text-expense px-2 shrink-0" onClick={() => onRemove(category.id)}>
          Видалити
        </Button>
      </div>
      {children.length > 0 && (
        <ul className={`${depth === 0 ? "mt-1 ml-3 border-l border-border pl-3 space-y-1" : "ml-4 mt-1 space-y-1"}`}>
          {children.map((ch) => (
            <CategoryTreeItem
              key={ch.id}
              category={ch}
              categories={categories}
              depth={depth + 1}
              onRemove={onRemove}
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
  const [subParentId, setSubParentId] = useState("");
  const [subName, setSubName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      await createCategory(orgId, name);
      setName("");
      setMessage("Категорію додано");
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

  const ensureAcBranch = async (): Promise<string> => {
    let rootId = acRoot?.id;
    if (!rootId) {
      rootId = await createCategory(orgId!, AC_ROOT_CATEGORY_NAME);
    }
    let purchaseId = acPurchase?.id;
    if (!purchaseId) {
      purchaseId = await createCategory(orgId!, AC_PURCHASE_SUBCATEGORY_NAME, rootId);
    }
    return purchaseId;
  };

  const addSupplier = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !supplierName.trim()) return;
    setError(null);
    setMessage(null);
    try {
      const purchaseId = await ensureAcBranch();
      await createCategory(orgId, supplierName.trim(), purchaseId);
      setSupplierName("");
      setMessage("Постачальника додано");
    } catch (e) {
      setError(mapFirebaseError(e));
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

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="text-2xl font-bold">Категорії витрат</h1>
        <p className="text-sm text-muted mt-1">
          Групи, підкатегорії, працівники та постачальники
        </p>
      </header>

      <Card title={`${AC_ROOT_CATEGORY_NAME} — ${AC_PURCHASE_SUBCATEGORY_NAME}`}>
        <form onSubmit={addSupplier} className="flex flex-col sm:flex-row gap-2">
          <Input
            label="Постачальник кондиціонерів"
            placeholder="Компанія або ПІБ"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="flex-1"
            required
          />
          <div className="flex items-end">
            <Button type="submit">Додати</Button>
          </div>
        </form>
        <p className="text-xs text-muted mt-2">
          Створяться «{AC_ROOT_CATEGORY_NAME}» та «{AC_PURCHASE_SUBCATEGORY_NAME}», якщо їх ще немає.
        </p>
        {suppliers.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {suppliers.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {AC_ROOT_CATEGORY_NAME} → {AC_PURCHASE_SUBCATEGORY_NAME} → {c.name}
                </span>
                <Button variant="ghost" className="text-expense px-2" onClick={() => remove(c.id)}>
                  Видалити
                </Button>
              </li>
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

      <Card title="Підкатегорія">
        <form onSubmit={addSubcategory} className="space-y-3">
          <Select
            label="Батьківська категорія"
            value={subParentId}
            onChange={(e) => setSubParentId(e.target.value)}
            required
          >
            <option value="">Оберіть групу</option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              label="Назва підкатегорії"
              placeholder="Наприклад: Закупка, Монтаж"
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
            {roots.map((c) => (
              <CategoryTreeItem
                key={c.id}
                category={c}
                categories={categories}
                depth={0}
                onRemove={remove}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
