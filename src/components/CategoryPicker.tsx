"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  getExpenseSubcategoryOptions,
  getRootCategories,
  getSupplierCategories,
  isPublicProcurementRootCategory,
  isSalaryRootCategory,
  rootNeedsSubcategory,
  subcategoryPickerLabel,
} from "@/lib/categories";
import type { Category } from "@/types";

type InlineCreate = {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
  label: string;
  placeholder: string;
};

type Props = {
  categories: Category[];
  parentCategoryId: string;
  subCategoryId: string;
  onParentChange: (id: string) => void;
  onSubChange: (id: string) => void;
  newEmployeeName?: string;
  onNewEmployeeNameChange?: (name: string) => void;
  onAddEmployee?: () => void;
  addingEmployee?: boolean;
  onOpenAddSupplier?: () => void;
};

export function CategoryPicker({
  categories,
  parentCategoryId,
  subCategoryId,
  onParentChange,
  onSubChange,
  newEmployeeName = "",
  onNewEmployeeNameChange,
  onAddEmployee,
  addingEmployee,
  onOpenAddSupplier,
}: Props) {
  const roots = useMemo(() => getRootCategories(categories), [categories]);
  const children = useMemo(
    () =>
      parentCategoryId
        ? getExpenseSubcategoryOptions(categories, parentCategoryId)
        : [],
    [categories, parentCategoryId]
  );

  const isSalary = isSalaryRootCategory(categories, parentCategoryId);
  const isPublicProcurement = isPublicProcurementRootCategory(categories, parentCategoryId);
  const needsSub = rootNeedsSubcategory(categories, parentCategoryId);
  const subLabel = subcategoryPickerLabel(categories, parentCategoryId);
  const hasSuppliers = getSupplierCategories(categories).length > 0;

  const renderInlineCreate = (cfg: InlineCreate | undefined) => {
    if (!cfg) return null;
    return (
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <Input
          label={cfg.label}
          placeholder={cfg.placeholder}
          value={cfg.value}
          onChange={(e) => cfg.onChange(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={cfg.adding || !cfg.value.trim()}
          onClick={cfg.onAdd}
        >
          Додати
        </Button>
      </div>
    );
  };

  const employeeInline: InlineCreate | undefined =
    isSalary && onAddEmployee && onNewEmployeeNameChange
      ? {
          value: newEmployeeName,
          onChange: onNewEmployeeNameChange,
          onAdd: onAddEmployee,
          adding: Boolean(addingEmployee),
          label: "Новий працівник",
          placeholder: "Наприклад: Коля",
        }
      : undefined;

  const subPlaceholder = isSalary
    ? "Оберіть працівника"
    : isPublicProcurement
      ? children.length > 0
        ? "Оберіть постачальника"
        : "Постачальників ще немає"
      : hasSuppliers
        ? "Оберіть підкатегорію або постачальника"
        : "Оберіть підкатегорію";

  return (
    <div className="space-y-3">
      <Select
        label="Категорія витрати"
        value={parentCategoryId}
        onChange={(e) => onParentChange(e.target.value)}
        required
      >
        <option value="">Оберіть категорію</option>
        {roots.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      {parentCategoryId && needsSub && (
        <>
          <Select
            label={subLabel}
            value={subCategoryId}
            onChange={(e) => onSubChange(e.target.value)}
            required
          >
            <option value="">{subPlaceholder}</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {isPublicProcurement && onOpenAddSupplier && (
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onOpenAddSupplier}>
              Додати постачальника
            </Button>
          )}

          {!isSalary && !isPublicProcurement && hasSuppliers && onOpenAddSupplier && (
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onOpenAddSupplier}>
              Додати постачальника
            </Button>
          )}

          {renderInlineCreate(employeeInline)}
        </>
      )}
    </div>
  );
}

export function resolveExpenseCategoryId(
  categories: Category[],
  parentCategoryId: string,
  subCategoryId: string
): string {
  if (rootNeedsSubcategory(categories, parentCategoryId)) {
    return subCategoryId;
  }
  return parentCategoryId;
}

/** Розкладає збережений categoryId на рівні для форми */
export function splitExpenseCategorySelection(
  categories: Category[],
  categoryId: string
): { parentCategoryId: string; subCategoryId: string } {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) {
    return { parentCategoryId: "", subCategoryId: "" };
  }
  const chain: Category[] = [cat];
  let current = cat;
  while (current.parentId) {
    const parent = categories.find((c) => c.id === current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  if (chain.length === 1) {
    return { parentCategoryId: chain[0].id, subCategoryId: "" };
  }
  return {
    parentCategoryId: chain[0].id,
    subCategoryId: chain[chain.length - 1].id,
  };
}
