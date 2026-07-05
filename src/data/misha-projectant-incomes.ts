import type { LegacyImportRow } from "@/data/legacy-notes-import";

/** Нарахування на рахунок «Міша Проектант», 2026 */
export const MISHA_PROJECTANT_ACCOUNT_NAME = "Міша Проектант";

export const MISHA_PROJECTANT_INCOMES: LegacyImportRow[] = [
  {
    type: "income",
    date: "2026-05-23",
    amount: 4000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-03",
    amount: 3000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-04",
    amount: 3000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-07",
    amount: 2000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-08",
    amount: 520,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-10",
    amount: 2500,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-15",
    amount: 5000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-16",
    amount: 20000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-20",
    amount: 7000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-06-21",
    amount: 10000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
  {
    type: "income",
    date: "2026-07-04",
    amount: 12000,
    category: "Перерахунок на рахунок",
    description: "Нарахування",
    transferredBy: "Нарахування",
  },
];

export const MISHA_PROJECTANT_INCOMES_TOTAL = MISHA_PROJECTANT_INCOMES.reduce(
  (s, r) => s + r.amount,
  0
);
