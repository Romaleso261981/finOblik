"use client";

import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Modal } from "@/components/ui/Modal";

type OptionItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

function parseOptions(children: ReactNode): OptionItem[] {
  const items: OptionItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{
      value?: string;
      disabled?: boolean;
      children?: ReactNode;
    }>;
    if (el.type !== "option") return;
    items.push({
      value: String(el.props.value ?? ""),
      label: String(el.props.children ?? ""),
      disabled: el.props.disabled,
    });
  });
  return items;
}

export function Select({
  label,
  children,
  className = "",
  value,
  onChange,
  disabled,
  required,
  name,
  id,
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => parseOptions(children), [children]);
  const stringValue = value === undefined || value === null ? "" : String(value);

  const selected = options.find((o) => o.value === stringValue);
  const placeholder =
    options.find((o) => o.value === "" && o.disabled)?.label ??
    options.find((o) => o.value === "")?.label ??
    "Оберіть…";

  const pick = (next: string) => {
    onChange?.({
      target: { value: next, name: name ?? "" },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  const selectable = options.filter(
    (o) => o.value !== "" && !(o.disabled && o.value === "")
  );

  return (
    <div className="block text-sm">
      {label && (
        <span className="mb-1 block font-medium text-slate-700" id={id ? `${id}-label` : undefined}>
          {label}
        </span>
      )}
      {/* для автозаповнення / форм */}
      {name && <input type="hidden" name={name} value={stringValue} readOnly />}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={id ? `${id}-label` : undefined}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-left outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50 ${className}`}
      >
        <span className={selected && selected.value !== "" ? "text-slate-900" : "text-muted"}>
          {selected && selected.value !== "" ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-muted"
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Modal open={open} title={label ?? "Оберіть варіант"} onClose={() => setOpen(false)} sheet>
        <ul className="divide-y divide-border -mx-4">
          {selectable.map((opt) => {
            const active = opt.value === stringValue;
            return (
              <li key={`${opt.value}-${opt.label}`}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && pick(opt.value)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm transition-colors ${
                    opt.disabled
                      ? "text-muted cursor-not-allowed"
                      : active
                        ? "bg-brand-50 text-brand-700 font-medium"
                        : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {active && (
                    <span className="text-brand-600 shrink-0" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </div>
  );
}
