import type { TransactionFilters } from "@/types";

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = { type: "all" };

export function countActiveFilters(
  filters: TransactionFilters,
  options?: { includeType?: boolean; includeTransferredBy?: boolean }
): number {
  const includeType = options?.includeType !== false;
  const includeTransferredBy = options?.includeTransferredBy !== false;
  let n = 0;
  if (includeType && filters.type && filters.type !== "all") n += 1;
  if (filters.dateFrom) n += 1;
  if (filters.dateTo) n += 1;
  if (filters.accountId) n += 1;
  if (filters.categoryId) n += 1;
  if (includeTransferredBy && filters.transferredBy?.trim()) n += 1;
  if (filters.descriptionSearch?.trim()) n += 1;
  return n;
}
