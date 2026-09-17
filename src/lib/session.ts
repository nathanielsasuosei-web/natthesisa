import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { User, getStore, ensureUserReady } from "./store";
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
  // backfills fields added after a record was created (hot-reload safety)
  ensureUserReady(user);
  syncSubscription(user);
  return user;
}

/** For server components behind the login wall — redirects instead of crashing. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Resolve the signed-in user only if they are an admin (or null). */
export async function getCurrentAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

/** Admin-only server component guard. */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/app/discover");
  return user;
}

/** True when the account is suspended and must be blocked from acting. */
export function isSuspended(user: User): boolean {
  return user.suspended === true;
}

/** True until the member has finished creating their profile. */
export function needsProfileSetup(user: User): boolean {
  return !user.profile?.completedAt;
}

export const SUSPENDED_ERROR = {
  error: "Your account has been suspended by an administrator. Contact support to appeal.",
  code: "SUSPENDED",
} as const;

export const NOT_DISCOVERABLE_ERROR = {
  error:
    "You're hidden from Discover, so new matches are paused. Turn visibility back on in account settings.",
  code: "NOT_DISCOVERABLE",
} as const;

export const PROFILE_INCOMPLETE_ERROR = {
  error: "Finish creating your profile before you start matching — add a photo, your interests and who you'd like to meet.",
  code: "PROFILE_INCOMPLETE",
} as const;

/** Set or clear the session cookie on a response. */
export function applySessionCookie<T extends NextResponse>(res: T, userId: string | null): T {
  res.cookies.set(SESSION_COOKIE, userId ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: userId ? SESSION_MAX_AGE : 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
