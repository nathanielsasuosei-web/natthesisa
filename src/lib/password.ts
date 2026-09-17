/**
 * Password *hashing* for the demo accounts (the policy lives in
 * ./password-rules.ts, which is browser-safe).
 *
 * No external dependencies — Node's scrypt is used directly and the result is
 * stored as a self-describing string, so a hash always carries its own params:
 *   scrypt$N$r$p$salt$hash
 *
 * scrypt is an in-memory KDF. SCRYPT_COST is intentionally modest so seeding the
 * demo accounts at boot stays quick; raise it for anything real.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 1 << 13; // 8192
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
  });
  return [
    "scrypt",
    SCRYPT_COST,
    BLOCK_SIZE,
    PARALLELISM,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

/** Compares in constant time for equal-length digests; never throws. */
export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (!stored || !password) return false;
  const [scheme, n, r, p, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  try {
    const expected = Buffer.from(key, "base64");
    const actual = scryptSync(password.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export {
  PASSWORD_MAX,
  PASSWORD_MIN,
  passwordStrength,
  validateNewPassword,
  type PasswordStrength,
} from "./password-rules";
