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

export interface SupplierProfile {
  firstName: string;
  lastName: string;
  /** Як звертатись / відображати в списках */
  displayName: string;
  location: string;
  phone: string;
}

export type CategoryScope = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  /** Лише для кореневих категорій; за замовчуванням — витрата */
  scope?: CategoryScope;
  supplier?: SupplierProfile;
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
  /** Витрата-податок для цього нарахування */
  taxExpenseId?: string;
  /** Нарахування, від якого пораховано податок */
  linkedIncomeId?: string;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  transferredBy?: string;
  /** Пошук у описі витрати або коментарі */
  descriptionSearch?: string;
  type?: TransactionType | "all";
}

export interface WorkHoursEntry {
  id: string;
  /** id підкатегорії працівника під «Зарплата» */
  employeeCategoryId: string;
  workDate: string;
  hours: number;
  comment?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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
