"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { OrgDataProvider, useOrgDataContext } from "@/contexts/OrgDataContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

function StatusBanners() {
  const { orgId, profileError, refreshProfile } = useAuth();
  const { error: dataError } = useOrgDataContext();

  if (!profileError && !dataError && orgId) return null;

  return (
    <div className="mb-4 space-y-2">
      {!orgId && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Організація не підключена</p>
          <p className="mt-1 text-amber-800">
            Без неї дані не зберігаються. Перевірте Firestore і натисніть «Повторити».
          </p>
          <Button className="mt-2" variant="secondary" onClick={() => refreshProfile()}>
            Повторити
          </Button>
        </div>
      )}
      {profileError && (
        <div className="rounded-lg border border-expense/30 bg-red-50 px-4 py-3 text-sm text-expense">
          {profileError}
        </div>
      )}
      {dataError && (
        <div className="rounded-lg border border-expense/30 bg-red-50 px-4 py-3 text-sm text-expense">
          {dataError}
        </div>
      )}
    </div>
  );
}

function AppShellWithBanners({
  children,
  email,
  onLogout,
}: {
  children: React.ReactNode;
  email?: string;
  onLogout: () => void;
}) {
  return (
    <AppShell email={email} onLogout={onLogout}>
      <StatusBanners />
      {children}
    </AppShell>
  );
}

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Завантаження...
      </div>
    );
  }

  if (!user) return null;

  return (
    <OrgDataProvider>
      <AppShellWithBanners email={user.email ?? undefined} onLogout={() => logout()}>
        {children}
      </AppShellWithBanners>
    </OrgDataProvider>
  );
}
