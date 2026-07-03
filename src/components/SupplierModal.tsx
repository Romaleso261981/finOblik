"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { SupplierProfile } from "@/types";

const emptyProfile = (): SupplierProfile => ({
  firstName: "",
  lastName: "",
  displayName: "",
  location: "",
  phone: "",
});

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (profile: SupplierProfile) => Promise<void>;
  saving?: boolean;
};

export function SupplierModal({ open, onClose, onSubmit, saving = false }: Props) {
  const [form, setForm] = useState<SupplierProfile>(emptyProfile);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof SupplierProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setForm(emptyProfile());
    setError(null);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const hasName =
      form.displayName.trim() ||
      form.firstName.trim() ||
      form.lastName.trim();
    if (!hasName) {
      setError("Вкажіть ім’я, прізвище або як звертатись");
      return;
    }
    try {
      await onSubmit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        displayName: form.displayName.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
      });
      setForm(emptyProfile());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти");
    }
  };

  return (
    <Modal open={open} title="Новий постачальник" onClose={handleClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Ім’я"
          value={form.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          autoComplete="given-name"
        />
        <Input
          label="Прізвище"
          value={form.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          autoComplete="family-name"
        />
        <Input
          label="Як звертатись"
          placeholder="Наприклад: дядя Вася, ТОВ «Клімат»"
          value={form.displayName}
          onChange={(e) => update("displayName", e.target.value)}
        />
        <Input
          label="Звідки / де знаходиться"
          placeholder="Місто, адреса, район"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
        />
        <Input
          label="Телефон"
          type="tel"
          placeholder="+380…"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          autoComplete="tel"
        />
        {error && <p className="text-sm text-expense">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            Скасувати
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Збереження…" : "Зберегти"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
