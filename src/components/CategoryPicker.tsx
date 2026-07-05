"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  getChildCategories,
  getExpenseSubcategoryOptions,
  getRootCategories,
  incomeRootNeedsSubcategory,
  isPublicProcurementRootCategory,
  isSalaryRootCategory,
  rootNeedsSubcategory,
  subcategoryPickerLabel,
} from "@/lib/categories";
import type { Category, CategoryScope } from "@/types";

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
  mode?: CategoryScope;
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
  mode = "expense",
  newEmployeeName = "",
  onNewEmployeeNameChange,
  onAddEmployee,
  addingEmployee,
  onOpenAddSupplier,
}: Props) {
  const isIncome = mode === "income";
  const roots = useMemo(
    () => getRootCategories(categories, mode),
    [categories, mode]
  );
  const children = useMemo(() => {
    if (!parentCategoryId) return [];
    if (isIncome) return getChildCategories(categories, parentCategoryId);
    return getExpenseSubcategoryOptions(categories, parentCategoryId);
  }, [categories, parentCategoryId, isIncome]);

  const isSalary = !isIncome && isSalaryRootCategory(categories, parentCategoryId);
  const isPublicProcurement =
    !isIncome && isPublicProcurementRootCategory(categories, parentCategoryId);
  const needsSub = isIncome
    ? incomeRootNeedsSubcategory(categories, parentCategoryId)
    : rootNeedsSubcategory(categories, parentCategoryId);
  const subLabel = isIncome
    ? "Підкатегорія"
    : subcategoryPickerLabel(categories, parentCategoryId);

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

  const subPlaceholder = isIncome
    ? children.length > 0
      ? "Оберіть підкатегорію"
      : "Підкатегорій ще немає"
    : isSalary
      ? "Оберіть працівника"
      : isPublicProcurement
        ? children.length > 0
          ? "Оберіть постачальника"
          : "Постачальників ще немає"
        : "Оберіть підкатегорію";

  return (
    <div className="space-y-3">
      <Select
        label={isIncome ? "Категорія надходження" : "Категорія витрати"}
        value={parentCategoryId}
        onChange={(e) => onParentChange(e.target.value)}
      >
        <option value="">
          {isIncome ? "Оберіть категорію (необов’язково)" : "Оберіть категорію"}
        </option>
        {roots.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      {roots.length === 0 && isIncome && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Категорій надходжень ще немає. Додайте їх у розділі «Категорії» (блок «Категорії
          надходжень»).
        </p>
      )}

      {parentCategoryId && needsSub && (
        <>
          <Select
            label={subLabel}
            value={subCategoryId}
            onChange={(e) => onSubChange(e.target.value)}
          >
            <option value="">{subPlaceholder}</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {isPublicProcurement && onOpenAddSupplier && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onOpenAddSupplier}
            >
              Додати постачальника
            </Button>
          )}

          {renderInlineCreate(employeeInline)}
        </>
      )}
    </div>
  );
}

export function resolveCategoryId(
  categories: Category[],
  parentCategoryId: string,
  subCategoryId: string,
  mode: CategoryScope = "expense"
): string {
  if (!parentCategoryId) return "";
  const needsSub =
    mode === "income"
      ? incomeRootNeedsSubcategory(categories, parentCategoryId)
      : rootNeedsSubcategory(categories, parentCategoryId);
  if (needsSub) return subCategoryId;
  return parentCategoryId;
}

/** @deprecated use resolveCategoryId */
export const resolveExpenseCategoryId = resolveCategoryId;

/** Розкладає збережений categoryId на рівні для форми */
export function splitCategorySelection(
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

export const splitExpenseCategorySelection = splitCategorySelection;
