/**
 * Shared form building blocks. Every account screen (signup, onboarding,
 * profile editor, settings) is assembled from these so inputs, error text and
 * focus rings stay identical across the app.
 */
"use client";

import { useId } from "react";

/* ----------------------------- wrappers ----------------------------- */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  counter,
  children,
  className = "",
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  counter?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
          {counter && <span className="shrink-0 text-xs tabular-nums text-slate-400">{counter}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  description,
  icon,
  action,
  children,
  footer,
  id,
}: {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-900/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <span aria-hidden className="text-base leading-none">
                {icon}
              </span>
            </span>
          )}
          <div>
            <h2 className="font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
      {footer && <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rose-50 pt-4">{footer}</div>}
    </section>
  );
}

export function Alert({
  tone = "error",
  children,
  action,
}: {
  tone?: "error" | "success" | "info" | "warn";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const cls = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  }[tone];
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-sm ${cls}`}>
      <span className="font-medium">{children}</span>
      {action}
    </div>
  );
}

/* ----------------------------- controls ----------------------------- */

const inputBase =
  "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

function tone(error?: string | null) {
  return error
    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
    : "border-slate-300 focus:border-rose-500 focus:ring-rose-100";
}

export function TextInput({
  label,
  hint,
  error,
  required,
  className,
  id,
  ...rest
}: React.ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string | null;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} required={required}>
      <input
        id={inputId}
        {...rest}
        aria-invalid={error ? true : undefined}
        className={`${inputBase} ${tone(error)} ${className ?? ""}`}
      />
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  required,
  maxLength,
  value,
  className,
  id,
  ...rest
}: React.ComponentProps<"textarea"> & {
  label?: string;
  hint?: string;
  error?: string | null;
}) {
  const auto = useId();
  const areaId = id ?? auto;
  const len = typeof value === "string" ? [...value].length : 0;
  return (
    <Field
      label={label}
      htmlFor={areaId}
      hint={hint}
      error={error}
      required={required}
      counter={maxLength ? `${len}/${maxLength}` : undefined}
    >
      <textarea
        id={areaId}
        value={value}
        maxLength={maxLength}
        {...rest}
        aria-invalid={error ? true : undefined}
        className={`${inputBase} ${tone(error)} min-h-28 resize-y leading-relaxed ${className ?? ""}`}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  required,
  options,
  className,
  id,
  ...rest
}: React.ComponentProps<"select"> & {
  label?: string;
  hint?: string;
  error?: string | null;
  options: Array<{ value: string; label: string }> | string[];
}) {
  const auto = useId();
  const selectId = id ?? auto;
  const list = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <Field label={label} htmlFor={selectId} hint={hint} error={error} required={required}>
      <select
        id={selectId}
        {...rest}
        className={`${inputBase} ${tone(error)} appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-[length:1rem] bg-[position:right_0.85rem_center] bg-no-repeat pr-10 ${className ?? ""}`}
      >
        {list.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Accessible switch: a real checkbox that looks like a toggle. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  emoji,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  emoji?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start justify-between gap-4 rounded-xl border bg-white px-4 py-3 text-left transition disabled:opacity-60 ${
        checked ? "border-rose-200" : "border-slate-200"
      } hover:border-rose-300`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">
          {emoji && <span className="mr-1.5">{emoji}</span>}
          {label}
        </span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`relative mt-0.5 block h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-rose-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function Chip({
  active,
  onClick,
  children,
  emoji,
  onRemove,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  emoji?: string;
  onRemove?: () => void;
}) {
  if (onRemove) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
          active
            ? "border-rose-300 bg-rose-50 font-medium text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {emoji && <span aria-hidden>{emoji}</span>}
        {children}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${String(children)}`}
          className="grid size-4 place-items-center rounded-full text-slate-400 transition hover:bg-rose-200 hover:text-rose-700"
        >
          ×
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-rose-500 bg-rose-600 font-semibold text-white shadow-sm shadow-rose-600/25"
          : "border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50"
      }`}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      {children}
    </button>
  );
}

export function Button({
  variant = "primary",
  busy,
  children,
  className = "",
  ...rest
}: React.ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger" | "subtle"; busy?: boolean }) {
  const styles = {
    primary: "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500",
    ghost: "border border-slate-300 bg-white/80 text-slate-700 hover:border-slate-400",
    subtle: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    danger: "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50",
  }[variant];
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {busy && (
        <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ------------------------------ helpers ------------------------------ */

export interface ApiError {
  error?: string;
  code?: string;
  fields?: Record<string, string>;
}

/** Post JSON and return the parsed body, throwing a friendly message on failure. */
export async function sendJson(
  url: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

export function messageFrom(body: Record<string, unknown>, fallback: string): string {
  return typeof body.error === "string" ? body.error : fallback;
}

export function fieldsFrom(body: Record<string, unknown>): Record<string, string> {
  const raw = body.fields;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
