"use client";

import { PASSWORD_MIN, passwordStrength } from "@/lib/password-rules";
import { TextInput } from "./forms";

/**
 * Password input with a live strength meter.
 * The same rules run on the server (lib/password-rules.ts) — this is guidance,
 * not the gate.
 */
export default function PasswordField({
  label = "Password",
  value,
  onChange,
  error,
  autoComplete = "new-password",
  name,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string | null;
  autoComplete?: string;
  name?: string;
  hint?: string;
}) {
  const strength = value ? passwordStrength(value) : null;
  const pct = strength ? ((strength.score + 1) / 5) * 100 : 0;
  const barColor =
    !strength || strength.score <= 1
      ? "bg-red-400"
      : strength.score === 2
        ? "bg-amber-400"
        : strength.score === 3
          ? "bg-emerald-400"
          : "bg-emerald-500";

  return (
    <div>
      <TextInput
        label={label}
        name={name}
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        placeholder={`At least ${PASSWORD_MIN} characters`}
        hint={
          hint ??
          (strength && strength.hints.length > 0
            ? strength.hints.slice(0, 2).join(" · ")
            : "Mix letters, numbers and a symbol — a sentence works well.")
        }
      />
      {strength && (
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-xs font-medium text-white/55">{strength.label}</span>
        </div>
      )}
    </div>
  );
}
