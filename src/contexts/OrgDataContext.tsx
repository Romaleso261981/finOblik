"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOrgData } from "@/hooks/useOrgData";
import { useAuth } from "@/contexts/AuthContext";
import type { Account, Category, Transaction } from "@/types";

type OrgDataContextValue = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
};

const OrgDataContext = createContext<OrgDataContextValue | null>(null);

export function OrgDataProvider({ children }: { children: ReactNode }) {
  const { orgId } = useAuth();
  const data = useOrgData(orgId);
  return (
    <OrgDataContext.Provider value={data}>{children}</OrgDataContext.Provider>
  );
}

export function useOrgDataContext() {
  const ctx = useContext(OrgDataContext);
  if (!ctx) throw new Error("useOrgDataContext within OrgDataProvider");
  return ctx;
}
