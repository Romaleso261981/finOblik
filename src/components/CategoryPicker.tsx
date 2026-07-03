"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  findSalaryCategory,
  getChildCategories,
  getRootCategories,
} from "@/lib/categories";
import type { Category } from "@/types";

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
}: Props) {
  const roots = useMemo(() => getRootCategories(categories), [categories]);
  const children = useMemo(
    () => (parentCategoryId ? getChildCategories(categories, parentCategoryId) : []),
    [categories, parentCategoryId]
  );
  const salary = findSalaryCategory(categories);
  const parent = roots.find((c) => c.id === parentCategoryId);
  const isSalary = Boolean(salary && parent && parent.id === salary.id);
  const needsSub = children.length > 0 || isSalary;

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
            label={isSalary ? "Працівник" : "Підкатегорія"}
            value={subCategoryId}
            onChange={(e) => onSubChange(e.target.value)}
            required
          >
            <option value="">{isSalary ? "Оберіть працівника" : "Оберіть підкатегорію"}</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {isSalary && onAddEmployee && onNewEmployeeNameChange && (
            <div className="flex gap-2 items-end">
              <Input
                label="Новий працівник"
                placeholder="Наприклад: Коля"
                value={newEmployeeName}
                onChange={(e) => onNewEmployeeNameChange(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={addingEmployee || !newEmployeeName.trim()}
                onClick={onAddEmployee}
              >
                Додати
              </Button>
            </div>
          )}
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
  const children = getChildCategories(categories, parentCategoryId);
  const salary = findSalaryCategory(categories);
  const parent = categories.find((c) => c.id === parentCategoryId);
  const isSalary =
    parent &&
    salary &&
    parent.id === salary.id;

  if (children.length > 0 || isSalary) {
    return subCategoryId;
  }
  return parentCategoryId;
}
