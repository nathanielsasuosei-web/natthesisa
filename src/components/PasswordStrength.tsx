"use client";

/**
 * A live strength meter for the password fields. It mirrors the rules the
 * server enforces (length, letters plus a number or symbol, not a common or
 * repeated password), so the bar only fills when sign-up would accept it.
 */

export function passwordScore(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9\W_]/.test(password)) return 1;
  if (/^(.)\1+$/.test(password)) return 1;
  let score = 2;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(4, score) as 2 | 3 | 4;
}

const LABELS = ["Start typing", "Needs more", "Fair", "Good", "Strong"];
const COLORS = ["#e5e1ea", "#e05d5d", "#e8934a", "#d8b43a", "#2fa36b"];

export default function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className="auth-meter-bar h-1.5 flex-1 rounded-full"
            style={{
              backgroundColor: score >= segment ? COLORS[score] : COLORS[0],
              transform: score >= segment ? "scaleX(1)" : "scaleX(.92)",
            }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-[#89828f]">
        {LABELS[score]}
        {value && score < 2 && <span className="font-medium"> — use 8+ characters with a letter and a number or symbol</span>}
      </p>
    </div>
  );
}
