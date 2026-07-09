import {
  getRootCategoryForId,
  INCOME_TRANSFER_CATEGORY_NAME,
  normalizeCategoryName,
} from "@/lib/categories";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Category } from "@/types";

export const INCOME_TAX_RATE = 0.07;

export function computeIncomeTaxAmount(gross: number): number {
  return Math.round(gross * INCOME_TAX_RATE * 100) / 100;
}

export function incomeTaxDescriptionForIncome(opts: {
  grossAmount: number;
  transferredBy?: string;
  workDate: Date | string;
}): string {
  const who = opts.transferredBy?.trim() || "—";
  const dateLabel =
    typeof opts.workDate === "string"
      ? opts.workDate
      : formatDate(opts.workDate);
  return `Податок 7% від нарахування ${formatMoney(opts.grossAmount)} · ${who} · ${dateLabel}`;
}

/** Податок лише для надходжень категорії «Перерахунок на рахунок» (не готівка / картка). */
export function incomeAccruesTax(
  categories: Category[],
  categoryId: string | undefined
): boolean {
  if (!categoryId) return false;
  const root = getRootCategoryForId(categories, categoryId);
  if (!root) return false;
  return (
    normalizeCategoryName(root.name) ===
    normalizeCategoryName(INCOME_TRANSFER_CATEGORY_NAME)
  );
}
