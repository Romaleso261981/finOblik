import { createAccount, createCategory, createExpense, createIncome } from "./firestore";
import { ensureDefaultIncomeTaxCategory } from "./ensure-default-categories";
import type { Account, Category } from "@/types";
import type { LegacyImportRow } from "@/data/legacy-notes-import";

export type BulkImportOptions = {
  orgId: string;
  createdBy: string;
  /** Якщо не передано — шукаємо або створюємо за accountName */
  accountId?: string;
  accountName: string;
  accounts: Account[];
  categories: Category[];
  rows: LegacyImportRow[];
  onProgress?: (done: number, total: number) => void;
};

export type BulkImportResult = {
  imported: number;
  categoriesCreated: string[];
  accountCreated: boolean;
};

export function buildCategoryMap(categories: Category[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of categories) {
    map.set(c.name.trim().toLowerCase(), c.id);
  }
  return map;
}

export async function bulkImportTransactions(
  options: BulkImportOptions
): Promise<BulkImportResult> {
  const {
    orgId,
    createdBy,
    accountName,
    accounts,
    categories,
    rows,
    onProgress,
    accountId: accountIdProp,
  } = options;

  const categoryMap = buildCategoryMap(categories);
  const categoriesCreated: string[] = [];
  const uniqueCategories = [...new Set(rows.map((r) => r.category))];

  for (const catName of uniqueCategories) {
    const key = catName.trim().toLowerCase();
    if (categoryMap.has(key)) continue;
    const sample = rows.find((r) => r.category === catName);
    const scope = sample?.type === "income" ? "income" : "expense";
    const id = await createCategory(orgId, catName, null, scope);
    categoryMap.set(key, id);
    categoriesCreated.push(catName);
  }

  let accountId = accountIdProp;
  let accountCreated = false;
  if (!accountId) {
    accountId = accounts.find(
      (a) => a.name.trim().toLowerCase() === accountName.trim().toLowerCase()
    )?.id;
  }
  if (!accountId) {
    accountId = await createAccount(orgId, accountName);
    accountCreated = true;
  }

  const taxCategoryId = await ensureDefaultIncomeTaxCategory(orgId, categories);

  let imported = 0;
  for (const row of rows) {
    const categoryId = categoryMap.get(row.category.trim().toLowerCase());

    if (row.type === "income") {
      await createIncome(orgId, {
        date: row.date,
        amount: row.amount,
        transferredBy: row.transferredBy ?? row.description ?? "—",
        accountId,
        categoryId: categoryId ?? undefined,
        comment: row.comment,
        createdBy,
      }, taxCategoryId);
    } else {
      if (!categoryId) throw new Error(`Немає категорії: ${row.category}`);
      await createExpense(orgId, {
        date: row.date,
        amount: row.amount,
        categoryId,
        description: row.description,
        accountId,
        comment: row.comment,
        createdBy,
      });
    }
    imported += 1;
    onProgress?.(imported, rows.length);
  }

  return { imported, categoriesCreated, accountCreated };
}

export function parseImportJson(text: string): LegacyImportRow[] {
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data)) throw new Error("Очікується масив JSON");
  return data as LegacyImportRow[];
}
