"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Щось пішло не так</h1>
        <p className="text-sm text-muted">{error.message || "Помилка застосунку"}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-medium"
        >
          Спробувати знову
        </button>
      </div>
    </div>
  );
}
