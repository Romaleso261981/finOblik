"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDataContext } from "@/contexts/OrgDataContext";
import { useWorkHours } from "@/hooks/useWorkHours";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  createWorkHoursEntry,
  deleteWorkHoursEntry,
  updateWorkHoursEntry,
} from "@/lib/firestore";
import { getSalaryEmployeeCategories } from "@/lib/categories";
import { formatDate, formatDateInput } from "@/lib/utils";

function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${month}-01`,
    to: `${month}-${pad(last)}`,
  };
}

export default function WorkHoursPage() {
  const { orgId, user } = useAuth();
  const { categories } = useOrgDataContext();
  const { entries, loading, error: loadError } = useWorkHours(orgId);

  const employees = useMemo(() => getSalaryEmployeeCategories(categories), [categories]);
  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name])),
    [employees]
  );

  const [filterMonth, setFilterMonth] = useState(() => formatDateInput(new Date()).slice(0, 7));
  const [filterEmployeeId, setFilterEmployeeId] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [workDate, setWorkDate] = useState(formatDateInput(new Date()));
  const [hours, setHours] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<(typeof entries)[0] | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const filtered = useMemo(() => {
    const { from, to } = monthBounds(filterMonth);
    return entries.filter((e) => {
      if (e.workDate < from || e.workDate > to) return false;
      if (filterEmployeeId && e.employeeCategoryId !== filterEmployeeId) return false;
      return true;
    });
  }, [entries, filterMonth, filterEmployeeId]);

  const totalsByEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filtered) {
      map[e.employeeCategoryId] = (map[e.employeeCategoryId] ?? 0) + e.hours;
    }
    return map;
  }, [filtered]);

  const grandTotal = useMemo(
    () => filtered.reduce((acc, e) => acc + e.hours, 0),
    [filtered]
  );

  const openEdit = (row: (typeof entries)[0]) => {
    setEditing(row);
    setEditEmployeeId(row.employeeCategoryId);
    setEditDate(row.workDate);
    setEditHours(String(row.hours));
    setEditComment(row.comment ?? "");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!orgId || !user) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (!employeeId) throw new Error("Оберіть працівника");
      const h = parseFloat(hours.replace(",", "."));
      if (Number.isNaN(h) || h <= 0) throw new Error("Вкажіть коректну кількість годин");
      await createWorkHoursEntry(orgId, {
        employeeCategoryId: employeeId,
        workDate,
        hours: h,
        comment,
        createdBy: user.uid,
      });
      setHours("");
      setComment("");
      setMessage("Запис збережено");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!orgId || !editing) return;
    setEditSaving(true);
    try {
      const h = parseFloat(editHours.replace(",", "."));
      if (!editEmployeeId) throw new Error("Оберіть працівника");
      if (Number.isNaN(h) || h <= 0) throw new Error("Вкажіть коректну кількість годин");
      await updateWorkHoursEntry(orgId, editing.id, {
        employeeCategoryId: editEmployeeId,
        workDate: editDate,
        hours: h,
        comment: editComment,
      });
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка збереження");
    } finally {
      setEditSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!orgId || !confirm("Видалити запис про години?")) return;
    await deleteWorkHoursEntry(orgId, id);
  };

  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Відпрацьовані години</h1>
        <p className="text-sm text-muted mt-1">
          Працівники з категорії «Зарплата». Додавайте нових у{" "}
          <Link href="/categories" className="text-brand-600 underline font-medium">
            Категорії
          </Link>
          .
        </p>
      </header>

      {employees.length === 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Немає працівників. Додайте їх у розділі «Категорії» → «Зарплата — працівники».
        </p>
      )}

      <Card title="Додати запис">
        <form onSubmit={submit} className="space-y-4 max-w-xl">
          <Select
            label="Працівник"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            disabled={employees.length === 0}
          >
            <option value="">Оберіть працівника</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Дата"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
            />
            <Input
              label="Години"
              type="number"
              min="0.25"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="8"
              required
            />
          </div>
          <Input
            label="Примітка"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Об’єкт, зміна…"
          />
          <Button type="submit" disabled={saving || employees.length === 0}>
            {saving ? "Збереження…" : "Зберегти"}
          </Button>
          {message && <p className="text-sm text-income">{message}</p>}
          {error && <p className="text-sm text-expense">{error}</p>}
        </form>
      </Card>

      <Card title="Журнал">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 max-w-xl">
          <Input
            label="Місяць"
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
          <Select
            label="Працівник"
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
          >
            <option value="">Усі</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </div>

        {loadError && <p className="text-sm text-expense mb-2">{loadError}</p>}

        {Object.keys(totalsByEmployee).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(totalsByEmployee)
              .sort(([a], [b]) =>
                (employeeMap[a] ?? "").localeCompare(employeeMap[b] ?? "", "uk")
              )
              .map(([id, total]) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm"
                >
                  <span className="text-muted">{employeeMap[id] ?? "—"}:</span>
                  <strong className="tabular-nums">{total.toFixed(2)} год</strong>
                </span>
              ))}
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">
              Разом: {grandTotal.toFixed(2)} год
            </span>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted">Завантаження…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted">Записів за обраний період немає.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2 pr-3 font-medium">Дата</th>
                  <th className="py-2 pr-3 font-medium">Працівник</th>
                  <th className="py-2 pr-3 font-medium text-right">Години</th>
                  <th className="py-2 pr-3 font-medium">Примітка</th>
                  <th className="py-2 font-medium w-28" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDate(new Date(row.workDate + "T12:00:00"))}
                    </td>
                    <td className="py-2 pr-3">{employeeMap[row.employeeCategoryId] ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-medium">
                      {row.hours.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 text-muted max-w-[200px] truncate" title={row.comment}>
                      {row.comment || "—"}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="text-brand-600 hover:underline text-xs mr-2"
                        onClick={() => openEdit(row)}
                      >
                        Редагувати
                      </button>
                      <button
                        type="button"
                        className="text-expense hover:underline text-xs"
                        onClick={() => remove(row.id)}
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        title="Редагувати запис"
        onClose={() => !editSaving && setEditing(null)}
      >
        <div className="space-y-4">
          <Select
            label="Працівник"
            value={editEmployeeId}
            onChange={(e) => setEditEmployeeId(e.target.value)}
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
          <Input label="Дата" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          <Input
            label="Години"
            type="number"
            min="0.25"
            step="0.25"
            value={editHours}
            onChange={(e) => setEditHours(e.target.value)}
          />
          <Input label="Примітка" value={editComment} onChange={(e) => setEditComment(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={editSaving}>
              Скасувати
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving ? "Збереження…" : "Зберегти"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
