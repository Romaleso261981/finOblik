"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  prefix?: string;
  name: string;
  suffix?: string;
  onSave: (newName: string) => Promise<void>;
  onRemove: () => void;
  compact?: boolean;
  showArrow?: boolean;
};

export function CategoryNameEditor({
  prefix,
  name,
  suffix,
  onSave,
  onRemove,
  compact = false,
  showArrow = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setValue(name);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setValue(name);
    setError(null);
  };

  const save = async () => {
    const next = value.trim();
    if (!next) {
      setError("Вкажіть назву");
      return;
    }
    if (next === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className={`space-y-2 ${compact ? "w-full" : ""}`}>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <Input
            label="Назва"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={cancel} disabled={saving}>
              Скасувати
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "…" : "Зберегти"}
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-expense">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-2 ${compact ? "flex-1 min-w-0" : "w-full"}`}>
      <span className="min-w-0">
        {showArrow ? "→ " : null}
        {prefix ? `${prefix} → ` : null}
        {name}
        {suffix ? <span className="text-muted">{suffix}</span> : null}
      </span>
      <span className="flex shrink-0 gap-1">
        <Button variant="ghost" className="px-2 text-brand-700" onClick={startEdit}>
          Редагувати
        </Button>
        <Button variant="ghost" className="text-expense px-2" onClick={onRemove}>
          Видалити
        </Button>
      </span>
    </div>
  );
}

export function CategoryNameRow(props: Props) {
  return (
    <li className="py-2 text-sm">
      <CategoryNameEditor {...props} />
    </li>
  );
}
