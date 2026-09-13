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
  syncSubscription(user);
  return user;
}
