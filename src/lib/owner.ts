import type { User } from "./store";

/**
 * Site ownership.
 *
 * The owner is the single account allowed to publish lessons (and the only
 * account that may grant administrator access to somebody else). Ownership is
 * stored on the account itself (`user.owner`) and seeded for the administrator
 * account in `store.ts`. Set OWNER_EMAIL to move ownership to a different
 * account without editing code.
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

export function ownerLabel(user: OwnerLike): string {
  return isOwner(user) ? "Owner" : "Admin";
}

export const OWNER_ONLY_ERROR = {
  error: "Only the site owner can publish or remove lessons.",
  code: "OWNER_ONLY",
} as const;

export const OWNER_IMMUTABLE_ERROR = {
  error: "The owner account cannot be changed here. Ownership is controlled by the OWNER_EMAIL setting.",
  code: "OWNER_PROTECTED",
} as const;

export type OwnerUser = User;
