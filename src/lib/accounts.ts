/**
 * Account services: sign up, sign in, profile edits, settings, deletion.
 *
 * Same shape as lib/subscription.ts — a small class of typed errors plus pure
 * functions that mutate the in-memory user, so API routes stay thin and every
 * rule is enforced in one place.
 */
import { hashPassword, validateNewPassword, verifyPassword } from "./password";
import {
  AccountSettings,
  Profile,
  buildProfilePatch,
  defaultSettings,
  ensureSettingsShape,
  profileCompleteness,
  sanitizeText,
  validateEmail,
  validateName,
  validateBirthDate,
  validatePhotoDataUrl,
} from "./profile";
import {
  User,
  createAccount,
  ensureUserReady,
  emailTaken,
  findUserByEmail,
  getStore,
  indexEmail,
  logActivity,
  seedStarterMatch,
  unindexEmail,
} from "./store";

export class AccountError extends Error {
  code: string;
  status: number;
  /** per-field messages, surfaced inline by the forms */
  fields: Record<string, string>;
  constructor(
    message: string,
    code = "BAD_REQUEST",
    status = 400,
    fields: Record<string, string> = {}
  ) {
    super(message);
    this.name = "AccountError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

/** Lock the door after a few wrong passwords — a demo-scale brute-force brake. */
const MAX_FAILED_LOGINS = 5;
const LOCK_SECONDS = 60 * 5;

/* ------------------------------------------------------------------ */
/* Sign up / sign in                                                   */
/* ------------------------------------------------------------------ */

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

export function signup(input: SignupInput): { user: User; starter: boolean } {
  const name = validateName(input.name);
  const email = validateEmail(input.email);
  const birthDate = validateBirthDate(input.birthDate);
  const password = typeof input.password === "string" ? input.password : "";

  const pwError = validateNewPassword(password);
  if (pwError)
    throw new AccountError(pwError, "WEAK_PASSWORD", 400, { password: pwError });
  if (emailTaken(email))
    throw new AccountError(
      "An account already uses that email — try signing in instead.",
      "EMAIL_TAKEN",
      409,
      { email: "Already registered." }
    );

  const user = createAccount({ name, email, passwordHash: hashPassword(password), birthDate });
  // a friendly starting point so a brand-new account isn't staring at an empty app
  seedStarterMatch(user);
  return { user, starter: true };
}

export function authenticate(
  emailRaw: unknown,
  passwordRaw: unknown
): { user: User } {
  const email = sanitizeText(emailRaw, 254).toLowerCase();
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  if (!email || !password)
    throw new AccountError("Enter your email and password.", "MISSING_FIELDS", 400, {
      ...(email ? {} : { email: "Required." }),
      ...(password ? {} : { password: "Required." }),
    });

  const user = findUserByEmail(email);
  if (!user) {
    // Same message as a wrong password — don't confirm which emails exist.
    throw new AccountError("Email or password is incorrect.", "BAD_CREDENTIALS", 401);
  }
  ensureUserReady(user);

  const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil).getTime() : 0;
  if (lockedUntil > Date.now()) {
    const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
    throw new AccountError(
      `Too many failed attempts — try again in ${secs}s.`,
      "LOCKED",
      429,
      { password: `Locked for ${secs}s after ${MAX_FAILED_LOGINS} failed attempts.` }
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    user.failedLogins = (user.failedLogins ?? 0) + 1;
    let message = `Email or password is incorrect. ${MAX_FAILED_LOGINS - user.failedLogins} attempt${
      MAX_FAILED_LOGINS - user.failedLogins === 1 ? "" : "s"
    } left.`;
    let code = "BAD_CREDENTIALS";
    let status = 401;
    if (user.failedLogins >= MAX_FAILED_LOGINS) {
      user.lockedUntil = new Date(Date.now() + LOCK_SECONDS * 1000).toISOString();
      user.failedLogins = 0;
      message = `Too many failed attempts — sign-in is locked for ${LOCK_SECONDS / 60} minutes.`;
      code = "LOCKED";
      status = 429;
      logActivity(user, "Sign-in temporarily locked after repeated failures");
    }
    throw new AccountError(message, code, status, { password: message });
  }

  user.failedLogins = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date().toISOString();
  logActivity(user, "Signed in");
  return { user };
}

/* ------------------------------------------------------------------ */
/* Profile                                                            */
/* ------------------------------------------------------------------ */

/** Validate + apply a partial profile patch. Returns what actually changed. */
export function updateProfile(
  user: User,
  patch: Record<string, unknown>
): { user: User; changed: string[]; profile: Profile } {
  ensureUserReady(user);
  const { name, profile, changed } = buildProfilePatch(user.profile, patch, user.name);
  if (changed.length === 0) {
    return { user, changed: [], profile: user.profile };
  }
  if (name !== undefined) user.name = name;
  user.profile = profile;
  logActivity(user, describeProfileChanges(changed));
  return { user, changed, profile };
}

function describeProfileChanges(changed: string[]): string {
  if (changed.length === 0) return "Profile updated";
  const labels: Record<string, string> = {
    name: "display name",
    birthDate: "age",
    gender: "gender",
    pronouns: "pronouns",
    city: "location",
    bio: "bio",
    interests: "interests",
    avatar: "avatar",
    preferences: "dating preferences",
  };
  const text = changed.map((c) => labels[c] ?? c).join(", ");
  return `Updated profile — ${text}`;
}

export function setPhoto(user: User, dataUrl: unknown): { photo: string } {
  ensureUserReady(user);
  const photo = validatePhotoDataUrl(dataUrl);
  user.profile.photo = photo;
  user.profile.avatarPicked = true;
  user.profile.updatedAt = new Date().toISOString();
  logActivity(user, "Added a new profile photo");
  return { photo };
}

export function clearPhoto(user: User, avatar?: unknown): { photo: null; avatar: string } {
  ensureUserReady(user);
  user.profile.photo = null;
  if (typeof avatar === "string" && avatar.trim()) {
    const safe = sanitizeText(avatar, 8);
    if (safe && Array.from(safe).length <= 2) user.profile.avatar = safe;
  }
  user.profile.updatedAt = new Date().toISOString();
  logActivity(user, "Removed the profile photo — using an avatar instead");
  return { photo: null, avatar: user.profile.avatar };
}

/** Flip the "profile creation finished" flag (also used by "skip for now"). */
export function finishOnboarding(user: User): void {
  ensureUserReady(user);
  const already = Boolean(user.profile.completedAt);
  user.profile.completedAt = new Date().toISOString();
  user.profile.updatedAt = user.profile.completedAt;
  if (!already) {
    const { percent } = profileCompleteness(user.profile);
    logActivity(user, `Profile finished — ${percent}% complete`);
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                          */
/* ------------------------------------------------------------------ */

export function changeEmail(user: User, emailRaw: unknown, password: string): User {
  ensureUserReady(user);
  if (!verifyPassword(password ?? "", user.passwordHash)) {
    throw new AccountError("Confirm your current password first.", "BAD_PASSWORD", 403, {
      password: "Incorrect password.",
    });
  }
  const email = validateEmail(emailRaw);
  if (email === user.email) return user;
  if (emailTaken(email, user.id)) {
    throw new AccountError("Another account already uses that email.", "EMAIL_TAKEN", 409, {
      email: "Try a different address.",
    });
  }
  unindexEmail(user);
  user.email = email;
  indexEmail(user);
  logActivity(user, `Sign-in email changed to ${email}`);
  return user;
}

export function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string
): User {
  ensureUserReady(user);
  if (!verifyPassword(currentPassword ?? "", user.passwordHash)) {
    throw new AccountError("Your current password isn't right.", "BAD_PASSWORD", 403, {
      currentPassword: "Incorrect password.",
    });
  }
  if (newPassword === currentPassword) {
    throw new AccountError("That's the same as your current password.", "SAME_PASSWORD", 400, {
      newPassword: "Pick something new.",
    });
  }
  const weak = validateNewPassword(newPassword);
  if (weak) throw new AccountError(weak, "WEAK_PASSWORD", 400, { newPassword: weak });
  user.passwordHash = hashPassword(newPassword);
  user.failedLogins = 0;
  user.lockedUntil = null;
  logActivity(user, "Password changed");
  return user;
}

/**
 * Toggle notification / privacy flags. Accepts an untrusted object and copies
 * only known boolean keys, so a stray field can never invent a new setting.
 */
export function updateSettings(user: User, input: unknown): AccountSettings {
  ensureUserReady(user);
  const next: AccountSettings = ensureSettingsShape(user.settings ?? defaultSettings());
  const patch = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  let touched = false;

  for (const group of ["notifications", "privacy"] as const) {
    const source = patch[group];
    if (!source || typeof source !== "object") continue;
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (typeof value === "boolean" && key in next[group]) {
        (next[group] as unknown as Record<string, boolean>)[key] = value;
        touched = true;
      }
    }
  }

  user.settings = next;
  if (touched) logActivity(user, "Account settings updated");
  return next;
}

/** Everything this member can download about themselves (GDPR-style export). */
export function myData(user: User): Record<string, unknown> {
  ensureUserReady(user);
  const { passwordHash, failedLogins, lockedUntil, ...safe } = user;
  void passwordHash;
  void failedLogins;
  void lockedUntil;
  return {
    exportedAt: new Date().toISOString(),
    note: "Demo dataset — all data lives in memory and resets when the server restarts.",
    account: safe,
    completeness: profileCompleteness(user.profile),
  };
}

export function deleteAccount(user: User, password: string): void {
  ensureUserReady(user);
  if (!verifyPassword(password ?? "", user.passwordHash)) {
    throw new AccountError("Confirm your password to delete this account.", "BAD_PASSWORD", 403, {
      password: "Incorrect password.",
    });
  }
  const store = getStore();
  unindexEmail(user);
  store.users.delete(user.id);
}
