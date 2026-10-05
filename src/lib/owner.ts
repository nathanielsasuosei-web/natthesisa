import type { User } from "./store";

/**
 * Site ownership.
 *
 * There are two roles: students and the owner — the teacher. The owner is the
 * single account that can publish lessons, set prices and manage students.
 * Ownership is stored on the account itself (`user.owner`) and seeded from
 * `store.ts`. Set OWNER_EMAIL to move ownership to a different account without
 * editing code.
 */
export const DEFAULT_OWNER_EMAIL = "admin@codemasterghana.dev";

export function ownerEmail(): string {
  return (process.env.OWNER_EMAIL?.trim() || DEFAULT_OWNER_EMAIL).toLowerCase();
}

type OwnerLike = { email: string; owner?: boolean };

export function isOwner(user: OwnerLike | null | undefined): boolean {
  if (!user) return false;
  if (user.owner === true) return true;
  return user.email.trim().toLowerCase() === ownerEmail();
}

export const OWNER_ONLY_ERROR = {
  error: "Only the owner — the teacher's account — can do this.",
  code: "OWNER_ONLY",
} as const;

export const OWNER_IMMUTABLE_ERROR = {
  error: "The owner account cannot be changed here. Ownership is controlled by the OWNER_EMAIL setting.",
  code: "OWNER_PROTECTED",
} as const;

export type OwnerUser = User;
