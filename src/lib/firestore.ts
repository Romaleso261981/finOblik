import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import {
  accountsCollection,
  categoriesCollection,
  getFirebaseDb,
  transactionsCollection,
} from "./firebase";
import { mapDoc, timestampToDate, type Account, type Category, type CategoryScope, type SupplierProfile, type Transaction, type TransactionType } from "@/types";
import { supplierDisplayName } from "@/lib/categories";
import { computeIncomeTaxAmount, incomeAccruesTax, incomeTaxDescription } from "@/lib/income-tax";

function mapAccount(snap: Parameters<typeof mapDoc<Account>>[0]): Account {
  return mapDoc(snap, (data) => ({
    name: data.name,
    createdAt: timestampToDate(data.createdAt),
  }));
}

function mapCategory(snap: Parameters<typeof mapDoc<Category>>[0]): Category {
  return mapDoc(snap, (data) => {
    const supplierRaw = data.supplier as Record<string, unknown> | undefined;
    const supplier =
      supplierRaw && typeof supplierRaw === "object"
        ? {
            firstName: String(supplierRaw.firstName ?? ""),
            lastName: String(supplierRaw.lastName ?? ""),
            displayName: String(supplierRaw.displayName ?? ""),
            location: String(supplierRaw.location ?? ""),
            phone: String(supplierRaw.phone ?? ""),
          }
        : undefined;
    const scopeRaw = data.scope as string | undefined;
    const scope =
      scopeRaw === "income" || scopeRaw === "expense" ? scopeRaw : undefined;
    return {
      name: data.name,
      parentId: (data.parentId as string | undefined) ?? null,
      createdAt: timestampToDate(data.createdAt),
      scope,
      supplier,
    };
  });
}

function mapTransaction(snap: Parameters<typeof mapDoc<Transaction>>[0]): Transaction {
  return mapDoc(snap, (data) => ({
    type: data.type,
    date: timestampToDate(data.date),
    amount: Number(data.amount),
    accountId: data.accountId,
    comment: data.comment ?? undefined,
    transferredBy: data.transferredBy ?? undefined,
    categoryId: data.categoryId ?? undefined,
    description: data.description ?? undefined,
    taxExpenseId: (data.taxExpenseId as string | undefined) ?? undefined,
    linkedIncomeId: (data.linkedIncomeId as string | undefined) ?? undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    createdBy: data.createdBy,
  }));
}

export function subscribeAccounts(
  orgId: string,
  onData: (accounts: Account[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), accountsCollection(orgId)),
    (snap) => {
      const items = snap.docs.map(mapAccount);
      items.sort((a, b) => a.name.localeCompare(b.name, "uk"));
      onData(items);
    },
    (err) => onError?.(err)
  );
}

export function subscribeCategories(
  orgId: string,
  onData: (categories: Category[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), categoriesCollection(orgId)),
    (snap) => {
      const items = snap.docs.map(mapCategory);
      items.sort((a, b) => a.name.localeCompare(b.name, "uk"));
      onData(items);
    },
    (err) => onError?.(err)
  );
}

export function subscribeTransactions(
  orgId: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), transactionsCollection(orgId)),
    (snap) => {
      const items = snap.docs.map(mapTransaction);
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      onData(items);
    },
    (err) => onError?.(err)
  );
}

export async function createAccount(orgId: string, name: string): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), accountsCollection(orgId)), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteAccount(orgId: string, accountId: string) {
  await deleteDoc(doc(getFirebaseDb(), accountsCollection(orgId), accountId));
}

export async function createCategory(
  orgId: string,
  name: string,
  parentId: string | null = null,
  scope: CategoryScope = "expense"
): Promise<string> {
  const payload: Record<string, unknown> = {
    name: name.trim(),
    parentId: parentId ?? null,
    createdAt: serverTimestamp(),
  };
  if (!parentId) {
    payload.scope = scope;
  }
  const ref = await addDoc(collection(getFirebaseDb(), categoriesCollection(orgId)), payload);
  return ref.id;
}

export async function createSupplierCategory(
  orgId: string,
  parentCategoryId: string,
  supplier: SupplierProfile
): Promise<string> {
  const name = supplierDisplayName(supplier);
  const ref = await addDoc(collection(getFirebaseDb(), categoriesCollection(orgId)), {
    name,
    parentId: parentCategoryId,
    supplier: {
      firstName: supplier.firstName.trim(),
      lastName: supplier.lastName.trim(),
      displayName: supplier.displayName.trim(),
      location: supplier.location.trim(),
      phone: supplier.phone.trim(),
    },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteCategory(orgId: string, categoryId: string) {
  await deleteDoc(doc(getFirebaseDb(), categoriesCollection(orgId), categoryId));
}

export async function updateCategoryName(
  orgId: string,
  categoryId: string,
  name: string,
  options?: { supplier?: Category["supplier"] }
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Назва не може бути порожньою");
  const payload: Record<string, unknown> = { name: trimmed };
  if (options?.supplier) {
    payload.supplier = { ...options.supplier, displayName: trimmed };
  }
  await updateDoc(doc(getFirebaseDb(), categoriesCollection(orgId), categoryId), payload);
}

export type IncomeInput = {
  date: string;
  amount: number;
  transferredBy: string;
  accountId: string;
  categoryId?: string;
  comment?: string;
  createdBy: string;
};

export type ExpenseInput = {
  date: string;
  amount: number;
  categoryId: string;
  description: string;
  accountId: string;
  comment?: string;
  createdBy: string;
};

export async function createIncome(
  orgId: string,
  input: IncomeInput,
  taxCategoryId: string,
  categories: Category[]
): Promise<string> {
  const now = serverTimestamp();
  const incomeRef = await addDoc(collection(getFirebaseDb(), transactionsCollection(orgId)), {
    type: "income",
    date: Timestamp.fromDate(new Date(input.date)),
    amount: input.amount,
    transferredBy: input.transferredBy.trim(),
    accountId: input.accountId,
    categoryId: input.categoryId ?? null,
    comment: input.comment?.trim() || null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  const shouldTax = incomeAccruesTax(categories, input.categoryId);
  const taxAmount = shouldTax ? computeIncomeTaxAmount(input.amount) : 0;
  if (taxAmount > 0) {
    const expenseRef = await addDoc(collection(getFirebaseDb(), transactionsCollection(orgId)), {
      type: "expense",
      date: Timestamp.fromDate(new Date(input.date)),
      amount: taxAmount,
      categoryId: taxCategoryId,
      description: incomeTaxDescription(),
      accountId: input.accountId,
      comment: null,
      linkedIncomeId: incomeRef.id,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    await updateDoc(incomeRef, {
      taxExpenseId: expenseRef.id,
      updatedAt: now,
    });
  }

  return incomeRef.id;
}

export async function createExpense(orgId: string, input: ExpenseInput) {
  const now = serverTimestamp();
  await addDoc(collection(getFirebaseDb(), transactionsCollection(orgId)), {
    type: "expense",
    date: Timestamp.fromDate(new Date(input.date)),
    amount: input.amount,
    categoryId: input.categoryId,
    description: input.description.trim(),
    accountId: input.accountId,
    comment: input.comment?.trim() || null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTransaction(
  orgId: string,
  transactionId: string,
  patch: Partial<{
    date: string;
    amount: number;
    accountId: string;
    comment: string;
    type: TransactionType;
    transferredBy: string;
    categoryId: string;
    description: string;
  }>
) {
  const ref = doc(getFirebaseDb(), transactionsCollection(orgId), transactionId);
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.date) data.date = Timestamp.fromDate(new Date(patch.date));
  if (patch.amount !== undefined) data.amount = patch.amount;
  if (patch.accountId) data.accountId = patch.accountId;
  if (patch.comment !== undefined) data.comment = patch.comment || null;

  if (patch.type === "income") {
    data.type = "income";
    data.transferredBy = patch.transferredBy?.trim() ?? "";
    if (patch.categoryId !== undefined) {
      data.categoryId = patch.categoryId || deleteField();
    }
    data.description = deleteField();
  } else   if (patch.type === "expense") {
    data.type = "expense";
    data.categoryId = patch.categoryId || deleteField();
    data.description = patch.description?.trim() ?? "";
    data.transferredBy = deleteField();
    data.taxExpenseId = deleteField();
    data.linkedIncomeId = deleteField();
  } else {
    if (patch.transferredBy !== undefined) data.transferredBy = patch.transferredBy;
    if (patch.categoryId !== undefined) data.categoryId = patch.categoryId || deleteField();
    if (patch.description !== undefined) data.description = patch.description;
  }

  await updateDoc(ref, data);
}

export async function syncIncomeTaxExpense(
  orgId: string,
  income: Transaction,
  patch: { date: string; amount: number; accountId: string; categoryId?: string },
  taxCategoryId: string,
  categories: Category[],
  createdBy: string
) {
  const categoryId = patch.categoryId ?? income.categoryId;
  const shouldTax = incomeAccruesTax(categories, categoryId);
  const taxAmount = shouldTax ? computeIncomeTaxAmount(patch.amount) : 0;
  const dateTs = Timestamp.fromDate(new Date(patch.date));
  const now = serverTimestamp();

  if (taxAmount <= 0) {
    if (income.taxExpenseId) {
      await deleteDoc(
        doc(getFirebaseDb(), transactionsCollection(orgId), income.taxExpenseId)
      );
      await updateDoc(doc(getFirebaseDb(), transactionsCollection(orgId), income.id), {
        taxExpenseId: deleteField(),
        updatedAt: now,
      });
    }
    return;
  }

  if (income.taxExpenseId) {
    await updateDoc(doc(getFirebaseDb(), transactionsCollection(orgId), income.taxExpenseId), {
      date: dateTs,
      amount: taxAmount,
      accountId: patch.accountId,
      updatedAt: now,
    });
    return;
  }

  const expenseRef = await addDoc(collection(getFirebaseDb(), transactionsCollection(orgId)), {
    type: "expense",
    date: dateTs,
    amount: taxAmount,
    categoryId: taxCategoryId,
    description: incomeTaxDescription(),
    accountId: patch.accountId,
    comment: null,
    linkedIncomeId: income.id,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  await updateDoc(doc(getFirebaseDb(), transactionsCollection(orgId), income.id), {
    taxExpenseId: expenseRef.id,
    updatedAt: now,
  });
}

export async function backfillIncomeTaxes(
  orgId: string,
  transactions: Transaction[],
  taxCategoryId: string,
  categories: Category[],
  createdBy: string
): Promise<number> {
  const linkedIncomeIds = new Set(
    transactions
      .filter((t) => t.type === "expense" && t.linkedIncomeId)
      .map((t) => t.linkedIncomeId as string)
  );

  let created = 0;
  for (const income of transactions) {
    if (income.type !== "income") continue;
    if (income.taxExpenseId || linkedIncomeIds.has(income.id)) continue;
    if (!incomeAccruesTax(categories, income.categoryId)) continue;

    const taxAmount = computeIncomeTaxAmount(income.amount);
    if (taxAmount <= 0) continue;

    const now = serverTimestamp();
    const expenseRef = await addDoc(collection(getFirebaseDb(), transactionsCollection(orgId)), {
      type: "expense",
      date: Timestamp.fromDate(income.date),
      amount: taxAmount,
      categoryId: taxCategoryId,
      description: incomeTaxDescription(),
      accountId: income.accountId,
      comment: null,
      linkedIncomeId: income.id,
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    await updateDoc(doc(getFirebaseDb(), transactionsCollection(orgId), income.id), {
      taxExpenseId: expenseRef.id,
      updatedAt: now,
    });
    created += 1;
  }
  return created;
}

export async function deleteTransaction(orgId: string, transaction: Transaction) {
  if (transaction.type === "income" && transaction.taxExpenseId) {
    await deleteDoc(
      doc(getFirebaseDb(), transactionsCollection(orgId), transaction.taxExpenseId)
    );
  }
  await deleteDoc(doc(getFirebaseDb(), transactionsCollection(orgId), transaction.id));
}
