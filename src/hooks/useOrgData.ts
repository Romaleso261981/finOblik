"use client";

import { useEffect, useState } from "react";
import {
  subscribeAccounts,
  subscribeCategories,
  subscribeTransactions,
} from "@/lib/firestore";
import { ensureDefaultExpenseCategories, ensureDefaultIncomeCategories } from "@/lib/ensure-default-categories";
import { mapFirebaseError } from "@/lib/firebase-errors";
import type { Account, Category, Transaction } from "@/types";

export function useOrgData(orgId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    let ready = 0;
    const markReady = () => {
      ready += 1;
      if (ready >= 3) setLoading(false);
    };
    const onFail = (e: Error) => {
      setError(mapFirebaseError(e));
      markReady();
    };

    const unsubA = subscribeAccounts(
      orgId,
      (data) => {
        setAccounts(data);
        markReady();
      },
      onFail
    );
    const unsubC = subscribeCategories(
      orgId,
      (data) => {
        setCategories(data);
        void ensureDefaultExpenseCategories(orgId, data);
        void ensureDefaultIncomeCategories(orgId, data);
        markReady();
      },
      onFail
    );
    const unsubT = subscribeTransactions(
      orgId,
      (data) => {
        setTransactions(data);
        markReady();
      },
      onFail
    );

    return () => {
      unsubA();
      unsubC();
      unsubT();
    };
  }, [orgId]);

  return { accounts, categories, transactions, loading, error };
}
