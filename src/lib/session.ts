import { cookies } from "next/headers";
import { User, getStore } from "./store";
import { syncSubscription } from "./subscription";

export const SESSION_COOKIE = "sparks_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Resolve the signed-in user from the session cookie (or null). */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const user = getStore().users.get(id);
  if (!user) return null;
  // backfill for users created before the admin fields existed (hot-reload safety)
  if (user.role === undefined) user.role = user.name.toLowerCase() === "admin" ? "admin" : "member";
  if (user.suspended === undefined) user.suspended = false;
  syncSubscription(user);
  return user;
}

/** Resolve the signed-in user only if they are an admin (or null). */
export async function getCurrentAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

/** True when the account is suspended and must be blocked from acting. */
export function isSuspended(user: User): boolean {
  return user.suspended === true;
}

export const SUSPENDED_ERROR = {
  error: "Your account has been suspended by an administrator. Contact support to appeal.",
  code: "SUSPENDED",
} as const;
