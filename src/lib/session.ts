import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { User, getUserById, saveUser, touchLastSeen } from "./store";
import { ensureReady } from "./bootstrap";
import { syncSubscription } from "./subscription";
import { isOwner } from "./owner";

/**
 * Cookie sessions for real accounts.
 *
 * The cookie holds `<userId>.<expiry>.<signature>`, signed with HMAC-SHA256.
 * A tampered cookie fails the signature check, and the expiry is checked on
 * every request, so a stolen cookie stops working once it lapses. The signing
 * key comes from SESSION_SECRET, or is generated once into
 * `.data/session-secret` for local development.
 */

export const SESSION_COOKIE = "codara_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const g = globalThis as unknown as { __codaraSessionSecret?: Buffer };

function secret(): Buffer {
  if (g.__codaraSessionSecret) return g.__codaraSessionSecret;
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) {
    g.__codaraSessionSecret = Buffer.from(fromEnv);
    return g.__codaraSessionSecret;
  }
  const file = process.env.SESSION_SECRET_FILE?.trim() || path.join(process.cwd(), ".data", "session-secret");
  try {
    if (existsSync(/* turbopackIgnore: true */ file)) {
      const stored = readFileSync(/* turbopackIgnore: true */ file, "utf8").trim();
      if (stored.length >= 32) {
        g.__codaraSessionSecret = Buffer.from(stored);
        return g.__codaraSessionSecret;
      }
    }
    mkdirSync(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
    const generated = randomBytes(32).toString("hex");
    writeFileSync(/* turbopackIgnore: true */ file, generated, { encoding: "utf8", mode: 0o600 });
    g.__codaraSessionSecret = Buffer.from(generated);
    return g.__codaraSessionSecret;
  } catch (error) {
    console.error("[codemasterghana] Could not read or create a session secret", error);
    g.__codaraSessionSecret = randomBytes(32);
    return g.__codaraSessionSecret;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, maxAgeSeconds = SESSION_MAX_AGE): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export interface SessionPayload {
  userId: string;
  expires: number;
}

export function readSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;
  const expires = Number(expiresRaw);
  if (!userId || !Number.isFinite(expires) || expires < Date.now()) return null;
  const expected = sign(`${userId}.${expires}`);
  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) return null;
  return { userId, expires };
}

interface CookieOptions {
  httpOnly: boolean;
  sameSite: "lax" | "none";
  secure: boolean;
  path: string;
  maxAge: number;
}

async function cookieOptions(maxAge: number): Promise<CookieOptions> {
  let secure = process.env.NODE_ENV === "production";
  try {
    // Arena serves the preview inside a cross-site iframe over HTTPS. A
    // SameSite=Lax cookie is not sent there, so when the request arrives over
    // HTTPS we use SameSite=None (which browsers require to be Secure).
    const header = await headers();
    if (header.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https") secure = true;
  } catch {
    /* headers() is unavailable outside a request; keep the default */
  }
  return {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge,
  };
}

export interface SessionCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

/** The cookie a route sets after a successful sign-in or sign-up. */
export async function sessionCookie(userId: string, maxAgeSeconds = SESSION_MAX_AGE): Promise<SessionCookie> {
  return {
    name: SESSION_COOKIE,
    value: createSessionToken(userId, maxAgeSeconds),
    options: await cookieOptions(maxAgeSeconds),
  };
}

/** The cookie a route sets to sign somebody out. */
export async function clearedSessionCookie(): Promise<SessionCookie> {
  return { name: SESSION_COOKIE, value: "", options: { ...(await cookieOptions(0)), maxAge: 0 } };
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const payload = readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  // Reading the cookie comes first on purpose: pages that call this at build
  // time (e.g. /admin-sign-in) are signed out, so nothing here runs during
  // static prerendering. First-run setup only happens for a real session.
  await ensureReady();

  const user = await getUserById(payload.userId);
  if (!user) return null;

  // Rolls the billing period over if it lapsed while the learner was away.
  if (await syncSubscription(user)) {
    await saveUser(user);
  }
  return user;
}

export async function getCurrentAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

/**
 * The site owner: the only account allowed to publish lessons. Every lesson
 * upload route calls this, so the rule is enforced on the server.
 */
export async function getCurrentOwner(): Promise<User | null> {
  const admin = await getCurrentAdmin();
  return isOwner(admin) ? admin : null;
}

export async function recordSignIn(user: User): Promise<void> {
  await touchLastSeen(user.id);
}

export function isSuspended(user: User): boolean {
  return user.suspended;
}

export const SUSPENDED_ERROR = {
  error: "Your account is paused. Please contact an administrator for help.",
  code: "SUSPENDED",
} as const;
