"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

const nav = [
  { href: "/dashboard", label: "Огляд" },
  { href: "/income", label: "Надходження" },
  { href: "/expenses", label: "Витрати" },
  { href: "/operations", label: "Всі операції" },
  { href: "/import", label: "Імпорт" },
  { href: "/categories", label: "Категорії" },
  { href: "/accounts", label: "Рахунки" },
];

export function AppShell({
  children,
  onLogout,
  email,
}: {
  children: ReactNode;
  email?: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card">
        <div className="px-4 py-5 border-b border-border">
          <p className="text-lg font-semibold text-brand-700">ФінОблік</p>
          <p className="text-xs text-muted mt-1 truncate">{email}</p>
        </div>
        <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                active
                  ? "bg-brand-100 text-brand-700"
                  : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {item.label}
            </Link>
          );
          })}
        </nav>
        <div className="p-2 md:mt-auto flex md:block justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-3 py-2 text-sm text-left rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Вийти
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
