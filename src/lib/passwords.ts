import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing for real accounts.
 *
 * scrypt (from Node's own crypto, no dependency) with a per-password random
 * salt, stored as a single self-describing string:
 *
 *   scrypt$<N>$<r>$<p>$<salt-hex>$<hash-hex>
 *
 * The parameters travel with the hash, so they can be raised later without
 * invalidating existing accounts: `needsRehash()` reports when a stored hash
 * uses weaker settings than the current defaults and the account is upgraded
 * on its next successful sign-in.
 */

const N = 16_384; // CPU/memory cost
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("hex"), hash.toString("hex")].join("$");
}

interface ParsedHash {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
}

function parse(stored: string): ParsedHash | null {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [, n, r, p, saltHex, hashHex] = parts;
  const cost = Number(n);
  const blockSize = Number(r);
  const parallel = Number(p);
  if (!Number.isFinite(cost) || !Number.isFinite(blockSize) || !Number.isFinite(parallel)) return null;
  try {
    return { N: cost, r: blockSize, p: parallel, salt: Buffer.from(saltHex, "hex"), hash: Buffer.from(hashHex, "hex") };
  } catch {
    return null;
  }
}

export interface VerifyResult {
  ok: boolean;
  /** True when the stored hash used older settings and should be rewritten. */
  needsRehash: boolean;
}

export function verifyPasswordHash(stored: string, password: string): VerifyResult {
  const parsed = parse(stored);

  // Accounts created before the database migration used a single unsalted-ish
  // SHA-256 digest. They still verify, and are upgraded to scrypt on the next
  // successful sign-in.
  if (!parsed) {
    if (/^[a-f0-9]{64}$/i.test(stored)) {
      const legacy = legacySha256(password, stored);
      return { ok: legacy, needsRehash: legacy };
    }
    return { ok: false, needsRehash: false };
  }

  const candidate = scryptSync(password.normalize("NFKC"), parsed.salt, parsed.hash.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: 256 * 1024 * 1024,
  });
  const ok = candidate.length === parsed.hash.length && timingSafeEqual(candidate, parsed.hash);
  const needsRehash = ok && (parsed.N !== N || parsed.r !== R || parsed.p !== P);
  return { ok, needsRehash };
}

/**
 * Compares a candidate digest against a stored one in constant time.
 * (Kept so pre-migration hashes can be checked without a database lookup.)
 */
function legacySha256(password: string, stored: string): boolean {
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  const digest = createHash("sha256").update(password).digest("hex");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(stored, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Cheap strength gate for sign-up: length plus the most common passwords. */
const WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "letmein123",
  "iloveyou",
  "admin123",
  "welcome1",
  "codemaster",
  "codemasterghana",
]);

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (password.length > 200) return "That password is too long.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9\W_]/.test(password)) {
    return "Mix letters with at least one number or symbol.";
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) return "That password is too common. Choose something less guessable.";
  if (/^(.)\1+$/.test(password)) return "That password repeats one character. Choose something stronger.";
  return null;
}

export const PASSWORD_HASH_ALGORITHM = `scrypt(N=${N}, r=${R}, p=${P})`;
