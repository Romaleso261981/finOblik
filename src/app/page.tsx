"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loadFromStorage, userScopedKey } from "@/lib/persistence";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const lastPath = loadFromStorage<string>(userScopedKey(user.uid, "lastPath"));
    router.replace(lastPath || "/dashboard");
  }, [loading, router, user]);

  return null;
}
