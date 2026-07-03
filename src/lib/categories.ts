import type { Category } from "@/types";

export const SALARY_CATEGORY_NAME = "Зарплата";

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function getRootCategories(categories: Category[]): Category[] {
  return categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function getChildCategories(categories: Category[], parentId: string): Category[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function findSalaryCategory(categories: Category[]): Category | undefined {
  return categories.find(
    (c) => !c.parentId && normalizeCategoryName(c.name) === normalizeCategoryName(SALARY_CATEGORY_NAME)
  );
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function formatCategoryPath(categories: Category[], categoryId: string): string {
  const cat = getCategoryById(categories, categoryId);
  if (!cat) return "—";
  if (!cat.parentId) return cat.name;
  const parent = getCategoryById(categories, cat.parentId);
  return parent ? `${parent.name} → ${cat.name}` : cat.name;
}

export function buildCategoryDisplayMap(categories: Category[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of categories) {
    map[c.id] = formatCategoryPath(categories, c.id);
  }
  return map;
}

export function categoryMatchesFilter(
  categories: Category[],
  transactionCategoryId: string | undefined,
  filterCategoryId: string
): boolean {
  if (!transactionCategoryId) return false;
  if (transactionCategoryId === filterCategoryId) return true;
  const txCat = getCategoryById(categories, transactionCategoryId);
  if (txCat?.parentId === filterCategoryId) return true;
  return false;
}

export function canDeleteCategory(categories: Category[], categoryId: string): boolean {
  return getChildCategories(categories, categoryId).length === 0;
}
