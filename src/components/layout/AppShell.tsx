"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const nav = [
  { href: "/dashboard", label: "Огляд" },
  { href: "/income", label: "Надходження" },
  { href: "/expenses", label: "Витрати" },
  { href: "/operations", label: "Всі операції" },
  { href: "/import", label: "Імпорт" },
  { href: "/categories", label: "Категорії" },
  { href: "/accounts", label: "Рахунки" },
];

function NavLinks({
  pathname,
  onNavigate,
  vertical,
}: {
  pathname: string;
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  return (
    <>
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-lg text-sm font-medium transition-colors ${
              vertical ? "px-4 py-3" : "px-3 py-2 whitespace-nowrap"
            } ${
              active
                ? "bg-brand-100 text-brand-700"
                : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const currentPage = nav.find((n) => n.href === pathname)?.label ?? "ФінОблік";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col shrink-0 border-r border-border bg-card">
        <div className="px-4 py-5 border-b border-border">
          <p className="text-lg font-semibold text-brand-700">ФінОблік</p>
          <p className="text-xs text-muted mt-1 truncate" title={email}>
            {email}
          </p>
        </div>
        <nav className="p-2 flex flex-col gap-1 flex-1">
          <NavLinks pathname={pathname} vertical />
        </nav>
        <div className="p-2 border-t border-border">
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-3 py-2 text-sm text-left rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Вийти
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-slate-700 hover:bg-slate-50"
          aria-label="Відкрити меню"
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted truncate">ФінОблік</p>
          <p className="text-sm font-semibold text-slate-900 truncate">{currentPage}</p>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal aria-label="Меню">
          <button
            type="button"
            className="flex-1 bg-black/45 backdrop-blur-[1px]"
            aria-label="Закрити меню"
            onClick={closeMenu}
          />
          <aside className="w-[min(100%,280px)] max-w-[85vw] flex flex-col bg-card shadow-xl">
            <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-4">
              <div className="min-w-0">
                <p className="text-lg font-semibold text-brand-700">ФінОблік</p>
                <p className="text-xs text-muted mt-1 break-all">{email}</p>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="h-9 w-9 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
              <NavLinks pathname={pathname} onNavigate={closeMenu} vertical />
            </nav>
            <div className="p-3 border-t border-border safe-area-pb">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
                className="w-full px-4 py-3 text-sm font-medium text-left rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Вийти
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
