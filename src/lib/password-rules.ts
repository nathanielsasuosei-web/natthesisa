/**
 * Password *policy* — kept separate from lib/password.ts (which does the
 * hashing with Node's crypto) because this module is imported by browser
 * components to drive the strength meter while you type.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

/** A tiny "please don't" list — enough to stop the obvious 1234567890s. */
const COMMON_PASSWORDS = [
  "password",
  "password1",
  "password123",
  "1234567890",
  "qwertyuiop",
  "letmein123",
  "iloveyou1",
  "welcome123",
  "admin12345",
  "sparks1234",
];

export interface PasswordStrength {
  /** 0 (useless) → 4 (excellent); drives the meter in the UI */
  score: number;
  label: string;
  /** human-readable reasons the password was rejected / could be stronger */
  hints: string[];
}

export function passwordStrength(pw: string): PasswordStrength {
  const hints: string[] = [];
  if (pw.length < PASSWORD_MIN) hints.push(`Use at least ${PASSWORD_MIN} characters`);
  if (!/[a-zA-Z]/.test(pw)) hints.push("Add at least one letter");
  if (!/[0-9]/.test(pw)) hints.push("Add at least one number");
  if (!/[^a-zA-Z0-9]/.test(pw)) hints.push("Add a symbol for extra strength");
  if (COMMON_PASSWORDS.includes(pw.toLowerCase())) hints.push("That one is too common — pick another");
  if (/(.)\1{3,}/.test(pw)) hints.push("Avoid repeating the same character");
  const distinct = new Set(pw).size;
  if (distinct < 6) hints.push("Use more different characters");

  let score = 0;
  if (pw.length >= PASSWORD_MIN) score += 1;
  if (pw.length >= 14) score += 1;
  if ((/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || /[0-9]/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw) || distinct >= 10) score += 1;
  if (hints.some((h) => h.includes("too common"))) score = Math.min(score, 1);

  const label = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][score];
  return { score, label, hints };
}

/** Returns an error message, or null when the password is acceptable. */
export function validateNewPassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Passwords need at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return "That password is too long.";
  const s = passwordStrength(pw);
  const blocking = s.hints.some(
    (h) =>
      h.startsWith("Use at least") ||
      h.startsWith("Add at least one letter") ||
      h.startsWith("Add at least one number") ||
      h.includes("too common")
  );
  if (blocking) return "Use 10+ characters with letters and numbers — and skip the obvious ones.";
  return null;
}
