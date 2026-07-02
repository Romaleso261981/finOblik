import { type ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50",
  secondary:
    "bg-white border border-border text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-expense text-white hover:bg-red-700 disabled:opacity-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
