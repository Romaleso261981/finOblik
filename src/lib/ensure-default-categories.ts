import type { Category } from "@/types";
import {
  findIncomeCashCategory,
  findIncomeTaxCategory,
  findIncomeTransferCategory,
  findPublicProcurementCategory,
  INCOME_CASH_CATEGORY_NAME,
  INCOME_TAX_CATEGORY_NAME,
  INCOME_TRANSFER_CATEGORY_NAME,
  PUBLIC_PROCUREMENT_CATEGORY_NAME,
} from "@/lib/categories";
import { createCategory } from "@/lib/firestore";

const ensuringExpense = new Set<string>();
const ensuringIncome = new Set<string>();
const ensuringTax = new Set<string>();

/** Гарантує категорію «Публічна закупка» у списку витрат */
export async function ensureDefaultExpenseCategories(
  orgId: string,
  categories: Category[]
): Promise<void> {
  if (findPublicProcurementCategory(categories)) return;
  if (ensuringExpense.has(orgId)) return;

  ensuringExpense.add(orgId);
  try {
    await createCategory(orgId, PUBLIC_PROCUREMENT_CATEGORY_NAME, null, "expense");
  } finally {
    ensuringExpense.delete(orgId);
  }
}

/** Базові категорії надходжень: готівка та перерахунок */
export async function ensureDefaultIncomeCategories(
  orgId: string,
  categories: Category[]
): Promise<void> {
  const hasCash = Boolean(findIncomeCashCategory(categories));
  const hasTransfer = Boolean(findIncomeTransferCategory(categories));
  if (hasCash && hasTransfer) return;
  if (ensuringIncome.has(orgId)) return;

  ensuringIncome.add(orgId);
  try {
    if (!hasCash) {
      await createCategory(orgId, INCOME_CASH_CATEGORY_NAME, null, "income");
    }
    if (!hasTransfer) {
      await createCategory(orgId, INCOME_TRANSFER_CATEGORY_NAME, null, "income");
    }
  } finally {
    ensuringIncome.delete(orgId);
  }
}

/** Категорія витрат для автоматичного податку 7% від нарахувань */
export async function ensureDefaultIncomeTaxCategory(
  orgId: string,
  categories: Category[]
): Promise<string> {
  const existing = findIncomeTaxCategory(categories);
  if (existing) return existing.id;
  if (ensuringTax.has(orgId)) {
    const again = findIncomeTaxCategory(categories);
    if (again) return again.id;
    throw new Error("Категорія податку ще створюється");
  }

  ensuringTax.add(orgId);
  try {
    return await createCategory(orgId, INCOME_TAX_CATEGORY_NAME, null, "expense");
  } finally {
    ensuringTax.delete(orgId);
  }
}
