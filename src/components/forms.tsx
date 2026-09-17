/**
 * The Sparks design system, tuned for the phone-shaped app: dark, tactile,
 * big tap targets, sheets instead of modals, switches instead of checkboxes.
 *
 * Every surface (auth, onboarding, deck, profile, settings) is built from
 * these so the app reads as one product rather than a pile of forms.
 */
"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/* ------------------------------ surfaces ------------------------------ */

export function Panel({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "form";
}) {
  return (
    <Tag
      className={`rounded-3xl bg-white/[0.045] p-4 ring-1 ring-white/10 backdrop-blur-sm ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{children}</h2>
      {hint && <span className="text-[11px] text-white/35">{hint}</span>}
    </div>
  );
}

/** Tappable settings-style row. */
export function Row({
  icon,
  label,
  value,
  hint,
  onClick,
  href,
  chevron = true,
  tone = "default",
  disabled,
}: {
  icon?: string;
  label: string;
  value?: React.ReactNode;
  hint?: string;
  onClick?: () => void;
  href?: string;
  chevron?: boolean;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  const cls = `press flex w-full items-center gap-3 px-4 py-3.5 text-left ${
    tone === "danger" ? "text-rose-300" : "text-white"
  }`;
  const inner = (
    <>
      {icon && (
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/[0.07] text-base">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-xs text-white/45">{hint}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-sm text-white/55">{value}</span>}
      {chevron && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4 shrink-0 text-white/25">
          <path d="m9 6 6 6-6 6" />
        </svg>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${cls} disabled:opacity-40`}>
      {inner}
    </button>
  );
}

/** Bottom sheet — the app's answer to a modal. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        className="animate-sheet-up no-scrollbar relative max-h-[86%] overflow-y-auto rounded-t-[28px] bg-[#1b1017] px-5 pb-6 pt-3 ring-1 ring-white/10"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press grid size-8 place-items-center rounded-full bg-white/[0.07] text-white/60"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ controls ------------------------------ */

const control =
  "w-full rounded-2xl bg-white/[0.07] px-4 py-3.5 text-[15px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:bg-white/[0.11] focus:ring-2 focus:ring-rose-400/70 disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  counter,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 px-1">
          <label htmlFor={htmlFor} className="text-[13px] font-medium text-white/70">
            {label}
            {required && <span className="ml-1 text-rose-400">*</span>}
          </label>
          {counter && <span className="text-[11px] tabular-nums text-white/35">{counter}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 px-1 text-xs font-medium text-rose-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 px-1 text-xs text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  error,
  required,
  className = "",
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
        className={`${control} ${error ? "ring-rose-400/70" : ""} ${className}`}
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
  className = "",
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
        className={`${control} min-h-28 resize-none leading-relaxed ${error ? "ring-rose-400/70" : ""} ${className}`}
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
  className = "",
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
        className={`${control} appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-[length:1rem] bg-[position:right_0.9rem_center] bg-no-repeat pr-10 [&>option]:bg-[#1b1017] [&>option]:text-white`}
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
      className="press flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left ring-1 ring-white/10 transition disabled:opacity-50 hover:bg-white/[0.04]"
    >
      {emoji && (
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/[0.07] text-base">
          {emoji}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-white/45">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`relative block h-[26px] w-[46px] shrink-0 rounded-full transition ${
          checked ? "bg-gradient-to-r from-rose-500 to-fuchsia-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[23px]" : "left-[3px]"
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
  size = "md",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  emoji?: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm";
  if (onRemove) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full ${pad} ${
          active ? "bg-white/[0.09] font-medium text-white ring-1 ring-white/15" : "bg-white/[0.05] text-white/55"
        }`}
      >
        {emoji && <span aria-hidden>{emoji}</span>}
        {children}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${String(children)}`}
          className="press grid size-4 place-items-center rounded-full bg-white/10 text-[11px] text-white/70 hover:bg-rose-500 hover:text-white"
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
      className={`press inline-flex items-center gap-1.5 rounded-full ${pad} font-medium transition ${
        active
          ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-900/40"
          : "bg-white/[0.06] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.11]"
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
  full,
  href,
  ...rest
}: Omit<React.ComponentProps<"button">, "href"> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  busy?: boolean;
  full?: boolean;
  /** renders a styled link instead — so a CTA never nests a button in an <a> */
  href?: string;
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-900/40 hover:brightness-110",
    ghost: "bg-white/[0.06] text-white/80 ring-1 ring-white/12 hover:bg-white/[0.11]",
    subtle: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/25 hover:bg-rose-500/25",
    danger: "bg-rose-600/90 text-white shadow-lg shadow-rose-900/40 hover:bg-rose-600",
  }[variant];
  const look = `press inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition ${styles} ${
    full ? "w-full" : ""
  } ${className}`;
  if (href) {
    return (
      <Link href={href} className={look}>
        {children}
      </Link>
    );
  }
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={`${look} disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {busy && (
        <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

/** Round icon-only control (deck buttons, header actions). */
export function IconButton({
  label,
  onClick,
  children,
  size = 52,
  tone = "dark",
  disabled,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  size?: number;
  tone?: "dark" | "like" | "pass" | "super" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const tones = {
    dark: "bg-white/[0.07] text-white ring-1 ring-white/12 hover:bg-white/[0.13]",
    like: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-900/40",
    pass: "bg-white text-rose-600 shadow-lg shadow-black/30 ring-1 ring-white/20",
    super: "bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-indigo-900/40",
    ghost: "bg-transparent text-white/60 hover:text-white",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`press grid shrink-0 place-items-center rounded-full transition disabled:opacity-40 ${tones} ${className}`}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-white/[0.05] p-1 ring-1 ring-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`press flex-1 rounded-xl px-3 ${
            size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm"
          } font-semibold transition ${
            value === o.value ? "bg-white text-[#1b1017] shadow" : "text-white/60 hover:text-white"
          }`}
        >
          {o.label}
          {o.hint && <span className="ml-1 text-[10px] font-bold uppercase opacity-70">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

export function Meter({
  value,
  max,
  label,
  tone = "rose",
}: {
  value: number;
  max: number | null;
  label?: string;
  tone?: "rose" | "emerald" | "amber";
}) {
  const pct = max === null ? 8 : Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  const bar = {
    rose: "bg-gradient-to-r from-rose-400 to-fuchsia-400",
    emerald: "bg-gradient-to-r from-emerald-400 to-teal-400",
    amber: "bg-gradient-to-r from-amber-300 to-orange-400",
  }[tone];
  return (
    <div>
      {label && (
        <p className="mb-1 flex items-baseline justify-between text-[11px] text-white/45">
          <span>{label}</span>
          <span className="tabular-nums text-white/70">
            {value.toLocaleString("en-US")}
            {max === null ? " · unlimited" : ` / ${max.toLocaleString("en-US")}`}
          </span>
        </p>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
  action,
}: {
  tone?: "error" | "success" | "info" | "warn";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const cls = {
    error: "bg-rose-500/12 text-rose-100 ring-rose-400/25",
    success: "bg-emerald-500/12 text-emerald-100 ring-emerald-400/25",
    info: "bg-sky-500/12 text-sky-100 ring-sky-400/25",
    warn: "bg-amber-500/12 text-amber-100 ring-amber-400/25",
  }[tone];
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${cls}`}>
      <span className="font-medium">{children}</span>
      {action}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span aria-hidden className="animate-float grid size-16 place-items-center rounded-3xl bg-white/[0.06] text-3xl ring-1 ring-white/10">
        {emoji}
      </span>
      <h3 className="mt-4 text-lg font-bold tracking-tight text-white">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/55">{body}</p>
      {action && <div className="mt-5 w-full max-w-xs">{action}</div>}
    </div>
  );
}

/** Small floating confirmation, shown at the bottom of the phone frame. */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  function show(message: string, ms = 2400) {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), ms);
  }
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const node = toast ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] mx-auto flex max-w-[430px] justify-center px-6">
      <p className="animate-pop glass rounded-full px-4 py-2.5 text-center text-sm font-medium text-white shadow-xl ring-1 ring-white/15">
        {toast}
      </p>
    </div>
  ) : null;
  return { show, node };
}

/* ------------------------------ networking ----------------------------- */

/** Fetch JSON with the app's conventions: parsed body + friendly errors. */
export async function sendJson(
  url: string,
  init: RequestInit = {}
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
