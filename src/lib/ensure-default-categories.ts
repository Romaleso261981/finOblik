import type { Category } from "@/types";
import {
  findPublicProcurementCategory,
  PUBLIC_PROCUREMENT_CATEGORY_NAME,
} from "@/lib/categories";
import { createCategory } from "@/lib/firestore";

const ensuring = new Set<string>();

/** Гарантує категорію «Публічна закупка» у списку */
export async function ensureDefaultExpenseCategories(
  orgId: string,
  categories: Category[]
): Promise<void> {
  if (findPublicProcurementCategory(categories)) return;
  if (ensuring.has(orgId)) return;

  ensuring.add(orgId);
  try {
    await createCategory(orgId, PUBLIC_PROCUREMENT_CATEGORY_NAME);
  } finally {
    ensuring.delete(orgId);
  }
}
