"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPageClient() {
  const { signIn, signUp, user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password);
      router.replace("/dashboard");
    } catch {
      setError(
        mode === "login"
          ? "Не вдалося увійти. Перевірте email і пароль."
          : "Не вдалося зареєструватися. Можливо, email вже зайнятий."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-brand-50 to-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-700">ФінОблік</h1>
          <p className="text-sm text-muted mt-2">Облік надходжень і витрат</p>
        </div>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Пароль"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p className="text-sm text-expense">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Зачекайте..."
                : mode === "login"
                  ? "Увійти"
                  : "Зареєструватися"}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted">
            {mode === "login" ? "Немає облікового запису?" : "Вже маєте обліковий запис?"}{" "}
            <button
              type="button"
              className="text-brand-600 font-medium hover:underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Реєстрація" : "Увійти"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
