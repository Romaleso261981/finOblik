import type { Category, SupplierProfile } from "@/types";

export const SALARY_CATEGORY_NAME = "Зарплата";
export const PUBLIC_PROCUREMENT_CATEGORY_NAME = "Публічна закупка";

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

/** Усі постачальники (дочірні категорії з профілем supplier, зазвичай під «Публічна закупка»). */
export function getSupplierCategories(categories: Category[]): Category[] {
  return categories
    .filter((c) => c.supplier != null)
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

/**
 * Варіанти для поля підкатегорії у витратах:
 * для звичайних груп (напр. «Кондиціонери») — підкатегорії + постачальники з довідника.
 */
export function getExpenseSubcategoryOptions(
  categories: Category[],
  parentCategoryId: string
): Category[] {
  if (isSalaryRootCategory(categories, parentCategoryId)) {
    return getChildCategories(categories, parentCategoryId);
  }
  if (isPublicProcurementRootCategory(categories, parentCategoryId)) {
    return getChildCategories(categories, parentCategoryId);
  }

  const direct = getChildCategories(categories, parentCategoryId);
  const suppliers = getSupplierCategories(categories);
  if (suppliers.length === 0) return direct;

  const seen = new Set(direct.map((c) => c.id));
  const merged = [...direct];
  for (const s of suppliers) {
    if (!seen.has(s.id)) merged.push(s);
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function findCategoryByName(
  categories: Category[],
  name: string,
  parentId: string | null = null
): Category | undefined {
  const n = normalizeCategoryName(name);
  return categories.find(
    (c) =>
      normalizeCategoryName(c.name) === n &&
      (parentId === null ? !c.parentId : c.parentId === parentId)
  );
}

export function findSalaryCategory(categories: Category[]): Category | undefined {
  return findCategoryByName(categories, SALARY_CATEGORY_NAME, null);
}

export function findPublicProcurementCategory(categories: Category[]): Category | undefined {
  return findCategoryByName(categories, PUBLIC_PROCUREMENT_CATEGORY_NAME, null);
}

export function isSalaryRootCategory(categories: Category[], categoryId: string): boolean {
  const salary = findSalaryCategory(categories);
  return Boolean(salary && salary.id === categoryId);
}

export function isPublicProcurementRootCategory(
  categories: Category[],
  categoryId: string
): boolean {
  const root = findPublicProcurementCategory(categories);
  return Boolean(root && root.id === categoryId);
}

export function supplierDisplayName(profile: SupplierProfile): string {
  const display = profile.displayName.trim();
  if (display) return display;
  const full = [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean).join(" ");
  return full || "Постачальник";
}

export function rootNeedsSubcategory(
  categories: Category[],
  parentCategoryId: string
): boolean {
  if (isSalaryRootCategory(categories, parentCategoryId)) return true;
  if (isPublicProcurementRootCategory(categories, parentCategoryId)) return true;
  if (getChildCategories(categories, parentCategoryId).length > 0) return true;
  if (getSupplierCategories(categories).length > 0) return true;
  return false;
}

export function subcategoryPickerLabel(
  categories: Category[],
  parentCategoryId: string
): string {
  if (isSalaryRootCategory(categories, parentCategoryId)) return "Працівник";
  if (isPublicProcurementRootCategory(categories, parentCategoryId)) return "Постачальник";
  if (getSupplierCategories(categories).length > 0) {
    return "Підкатегорія / постачальник";
  }
  return "Підкатегорія";
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function formatCategoryPath(categories: Category[], categoryId: string): string {
  const parts: string[] = [];
  let current = getCategoryById(categories, categoryId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? getCategoryById(categories, current.parentId) : undefined;
  }
  return parts.length ? parts.join(" → ") : "—";
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
  let current = getCategoryById(categories, transactionCategoryId);
  while (current) {
    if (current.id === filterCategoryId) return true;
    current = current.parentId ? getCategoryById(categories, current.parentId) : undefined;
  }
  return false;
}

export function canDeleteCategory(categories: Category[], categoryId: string): boolean {
  return getChildCategories(categories, categoryId).length === 0;
}
