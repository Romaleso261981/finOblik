import {
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

export type TransactionType = "income" | "expense";

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  defaultOrgId: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

export interface OrgMember {
  id: string;
  role: "owner" | "member";
  joinedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: Date;
  amount: number;
  accountId: string;
  comment?: string;
  transferredBy?: string;
  categoryId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  transferredBy?: string;
  type?: TransactionType | "all";
}

export function timestampToDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

export function mapDoc<T extends { id: string }>(
  snap: QueryDocumentSnapshot<DocumentData>,
  mapper: (data: DocumentData, id: string) => Omit<T, "id">
): T {
  return { id: snap.id, ...mapper(snap.data(), snap.id) } as T;
}
