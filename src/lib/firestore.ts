import {
  addDoc,
  collection,
  deleteDoc,
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
import { mapDoc, timestampToDate, type Account, type Category, type SupplierProfile, type Transaction } from "@/types";
import { supplierDisplayName } from "@/lib/categories";

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
    return {
      name: data.name,
      parentId: (data.parentId as string | undefined) ?? null,
      createdAt: timestampToDate(data.createdAt),
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
  parentId: string | null = null
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseDb(), categoriesCollection(orgId)), {
    name: name.trim(),
    parentId: parentId ?? null,
    createdAt: serverTimestamp(),
  });
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

export type IncomeInput = {
  date: string;
  amount: number;
  transferredBy: string;
  accountId: string;
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

export async function createIncome(orgId: string, input: IncomeInput) {
  const now = serverTimestamp();
  await addDoc(collection(getFirebaseDb(), transactionsCollection(orgId)), {
    type: "income",
    date: Timestamp.fromDate(new Date(input.date)),
    amount: input.amount,
    transferredBy: input.transferredBy.trim(),
    accountId: input.accountId,
    comment: input.comment?.trim() || null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  });
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
  if (patch.transferredBy !== undefined) data.transferredBy = patch.transferredBy;
  if (patch.categoryId !== undefined) data.categoryId = patch.categoryId;
  if (patch.description !== undefined) data.description = patch.description;
  await updateDoc(ref, data);
}

export async function deleteTransaction(orgId: string, transactionId: string) {
  await deleteDoc(doc(getFirebaseDb(), transactionsCollection(orgId), transactionId));
}
