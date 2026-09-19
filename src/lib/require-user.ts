import { redirect } from "next/navigation";
import type { User } from "./store";
import { getCurrentUser } from "./session";

/** Page-only guard. Layout redirects do not stop parallel page rendering. */
export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
