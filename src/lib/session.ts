import { cookies } from "next/headers";
import { User, getStore } from "./store";
import { syncSubscription } from "./subscription";

export const SESSION_COOKIE = "codara_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function isArenaPreview(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ARENA_PREVIEW === "1";
}

function demoUser(id: "codara-student-demo" | "codara-admin"): User | null {
  const user = getStore().users.get(id) ?? null;
  if (user) syncSubscription(user);
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  // Arena displays previews in a cross-site iframe, where some browsers block
  // session cookies. The dedicated preview process uses deterministic demo
  // identities so both dashboards remain testable. This path cannot run in a
  // production build.
  if (isArenaPreview()) return demoUser("codara-student-demo");

  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const user = getStore().users.get(id);
  if (!user) return null;
  syncSubscription(user);
  return user;
}

export async function getCurrentAdmin(): Promise<User | null> {
  if (isArenaPreview()) return demoUser("codara-admin");
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export function isSuspended(user: User): boolean {
  return user.suspended;
}

export const SUSPENDED_ERROR = {
  error: "Your account is paused. Please contact an administrator for help.",
  code: "SUSPENDED",
} as const;
