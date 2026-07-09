"use client";

import { useEffect, useState } from "react";
import { subscribeWorkHours } from "@/lib/firestore";
import { mapFirebaseError } from "@/lib/firebase-errors";
import type { WorkHoursEntry } from "@/types";

export function useWorkHours(orgId: string | null) {
  const [entries, setEntries] = useState<WorkHoursEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const unsub = subscribeWorkHours(
      orgId,
      (data) => {
        setEntries(data);
        setLoading(false);
      },
      (e) => {
        setError(mapFirebaseError(e));
        setLoading(false);
      }
    );
    return () => unsub();
  }, [orgId]);

  return { entries, loading, error };
}
