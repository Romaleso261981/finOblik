"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CategoryPicker, resolveExpenseCategoryId } from "@/components/CategoryPicker";
import { SupplierModal } from "@/components/SupplierModal";
import {
  createCategory,
  createExpense,
  createSupplierCategory,
} from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";
import {
  findPublicProcurementCategory,
  findSalaryCategory,
  isPublicProcurementRootCategory,
  isSalaryRootCategory,
  PUBLIC_PROCUREMENT_CATEGORY_NAME,
  rootNeedsSubcategory,
  SALARY_CATEGORY_NAME,
} from "@/lib/categories";
import type { SupplierProfile } from "@/types";
import { formatDateInput } from "@/lib/utils";
import Link from "next/link";

export default function ExpensesPage() {
  const { orgId, user } = useAuth();
  const { accounts, categories } = useOrgDataContext();
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [amount, setAmount] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [newEmployee, setNewEmployee] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);

  const salaryCategory = useMemo(() => findSalaryCategory(categories), [categories]);
  const publicProcurement = useMemo(() => findPublicProcurementCategory(categories), [categories]);

  const addRootCategory = async () => {
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

  const ensureSalaryAndAddEmployee = async () => {
    if (!orgId || !newEmployee.trim()) return;
    setAddingEmployee(true);
    setError(null);
    try {
      let salaryId = salaryCategory?.id;
      if (!salaryId) {
        salaryId = await createCategory(orgId, SALARY_CATEGORY_NAME);
      }
      const id = await createCategory(orgId, newEmployee, salaryId);
      setSubCategoryId(id);
      setParentCategoryId(salaryId);
      setNewEmployee("");
      setMessage(`Працівника «${newEmployee.trim()}» додано`);
    } catch (e) {
      setError(mapFirebaseError(e));
    } finally {
      setAddingEmployee(false);
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
      const id = await createSupplierCategory(orgId, rootId, profile);
      setParentCategoryId(rootId);
      setSubCategoryId(id);
      setSupplierModalOpen(false);
      setMessage("Постачальника додано");
    } catch (e) {
      throw e instanceof Error ? e : new Error(mapFirebaseError(e));
    } finally {
      setAddingSupplier(false);
    }
  };

  const onParentCategoryChange = (id: string) => {
    setParentCategoryId(id);
    setSubCategoryId("");
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
      if (!parentCategoryId) throw new Error("Оберіть категорію");

      const categoryId = resolveExpenseCategoryId(categories, parentCategoryId, subCategoryId);

      if (rootNeedsSubcategory(categories, parentCategoryId) && !subCategoryId) {
        const isSalary = isSalaryRootCategory(categories, parentCategoryId);
        const isProcurement = isPublicProcurementRootCategory(categories, parentCategoryId);
        if (isSalary) throw new Error("Оберіть або додайте працівника");
        if (isProcurement) throw new Error("Оберіть або додайте постачальника");
        throw new Error("Оберіть підкатегорію");
      }
      if (!categoryId) throw new Error("Оберіть категорію");

      const isSalary = isSalaryRootCategory(categories, parentCategoryId);
      const isProcurement = isPublicProcurementRootCategory(categories, parentCategoryId);
      let desc = description.trim();
      if (!desc && isSalary && subCategoryId) {
        const emp = categories.find((c) => c.id === subCategoryId);
        desc = emp ? `Зарплата ${emp.name}` : "Зарплата";
      }
      if (!desc && isProcurement && subCategoryId) {
        const supplier = categories.find((c) => c.id === subCategoryId);
        desc = supplier ? `Публічна закупка, ${supplier.name}` : "Публічна закупка";
      }
      if (!desc) throw new Error("Додайте опис витрати");

      if (Number.isNaN(num) || num <= 0) throw new Error("Вкажіть коректну суму");

      await createExpense(orgId, {
        date,
        amount: num,
        categoryId,
        description: desc,
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

      <Card title="Нова категорія верхнього рівня">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Наприклад: Обіди, Матеріали"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={addRootCategory}>
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
          <CategoryPicker
            categories={categories}
            parentCategoryId={parentCategoryId}
            subCategoryId={subCategoryId}
            onParentChange={onParentCategoryChange}
            onSubChange={setSubCategoryId}
            newEmployeeName={newEmployee}
            onNewEmployeeNameChange={setNewEmployee}
            onAddEmployee={ensureSalaryAndAddEmployee}
            addingEmployee={addingEmployee}
            onOpenAddSupplier={() => setSupplierModalOpen(true)}
          />
          <Input
            label="Опис"
            placeholder="Для зарплати чи публічної закупки можна залишити порожнім"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

      <SupplierModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={saveSupplier}
        saving={addingSupplier}
      />
    </div>
  );
}
