/**
 * Profile domain: what a Sparks profile is made of, how each field is
 * validated server-side, and how two profiles relate to each other.
 *
 * Every rule that matters is enforced here (and called from the API routes),
 * so the forms are a convenience, not the gate.
 */
import { site } from "@/config/site";

/* ------------------------------------------------------------------ */
/* Vocabularies                                                        */
/* ------------------------------------------------------------------ */

export const GENDERS = ["woman", "man", "nonbinary"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABEL: Record<Gender, string> = {
  woman: "Woman",
  man: "Man",
  nonbinary: "Non-binary",
};

/** Plural forms for copy like “dating women, 24–33”. */
export const GENDER_PLURAL: Record<Gender, string> = {
  woman: "women",
  man: "men",
  nonbinary: "non-binary people",
};

export const PRONOUN_PRESETS = ["she/her", "he/him", "they/them", "she/they", "he/they"];

export const INTENTS = ["friendship", "casual", "relationship", "marriage"] as const;
export type Intent = (typeof INTENTS)[number];

export const INTENT_LABEL: Record<Intent, string> = {
  friendship: "New friends first",
  casual: "Keeping it light",
  relationship: "A proper relationship",
  marriage: "Marriage-minded",
};

export const COUNTRIES = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "Côte d'Ivoire",
  "United Kingdom",
  "Ireland",
  "United States",
  "Canada",
  "Germany",
  "Netherlands",
  "Other",
];

/** Curated interest catalogue — pick from these, or type your own. */
export const INTEREST_GROUPS: Array<{ group: string; items: Array<{ tag: string; emoji: string }> }> = [
  {
    group: "Outdoors",
    items: [
      { tag: "Hiking", emoji: "⛰️" },
      { tag: "Beach days", emoji: "🏖️" },
      { tag: "Running", emoji: "🏃" },
      { tag: "Gardening", emoji: "🪴" },
      { tag: "Stargazing", emoji: "🔭" },
    ],
  },
  {
    group: "Food & drink",
    items: [
      { tag: "Cooking", emoji: "🍳" },
      { tag: "Jollof debates", emoji: "🍚" },
      { tag: "Coffee", emoji: "☕" },
      { tag: "Street food", emoji: "🌭" },
      { tag: "Wine nights", emoji: "🍷" },
    ],
  },
  {
    group: "Arts",
    items: [
      { tag: "Live music", emoji: "🎸" },
      { tag: "Reading", emoji: "📚" },
      { tag: "Painting", emoji: "🎨" },
      { tag: "Poetry", emoji: "✍️" },
      { tag: "Film buff", emoji: "🎬" },
      { tag: "Photography", emoji: "📷" },
    ],
  },
  {
    group: "Play",
    items: [
      { tag: "Board games", emoji: "🎲" },
      { tag: "Dancing", emoji: "💃" },
      { tag: "Football", emoji: "⚽" },
      { tag: "Gym", emoji: "🏋️" },
      { tag: "Yoga", emoji: "🧘" },
      { tag: "Karaoke", emoji: "🎤" },
    ],
  },
  {
    group: "Life",
    items: [
      { tag: "Travel", emoji: "✈️" },
      { tag: "Faith", emoji: "🙏" },
      { tag: "Volunteering", emoji: "🤝" },
      { tag: "Startups", emoji: "🚀" },
      { tag: "Pets", emoji: "🐾" },
      { tag: "Fashion", emoji: "👗" },
    ],
  },
];

export const INTEREST_EMOJI: Record<string, string> = Object.fromEntries(
  INTEREST_GROUPS.flatMap((g) => g.items.map((i) => [i.tag.toLowerCase(), i.emoji]))
);

export function interestEmoji(tag: string): string {
  return INTEREST_EMOJI[tag.toLowerCase()] ?? "💫";
}

/** Fallback "avatars" for members who'd rather not upload a photo. */
export const AVATAR_PRESETS = [
  "🌅", "🎨", "🐙", "🎸", "⛰️", "🌿", "💃", "🍜", "📚", "☕", "🦋", "🌊", "🪐", "🔥", "🍑", "🌻",
];

/* ------------------------------------------------------------------ */
/* Shape                                                               */
/* ------------------------------------------------------------------ */

export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const BIO_MAX = 500;
export const CITY_MAX = 60;
export const INTEREST_MIN = 3;
export const INTEREST_MAX = 10;
export const TAG_MAX = 24;
/** Hard cap on an uploaded photo, after the browser has resized it. */
export const PHOTO_MAX_BYTES = 1_500_000;

export interface Preferences {
  /** who to surface in Discover — empty array means "anyone" */
  interestedIn: Gender[];
  ageMin: number;
  ageMax: number;
  /** 0 = anywhere */
  distanceKm: number;
  intent: Intent;
}

export interface Profile {
  /** yyyy-mm-dd — the source of truth for age, so it stays honest over time */
  birthDate: string;
  gender: Gender | "";
  pronouns: string;
  city: string;
  country: string;
  bio: string;
  interests: string[];
  /** data: URL produced by the browser after client-side downscaling */
  photo: string | null;
  /** decorative fallback shown until a photo exists */
  avatar: string;
  /** true once the member picked an avatar or uploaded a photo themselves */
  avatarPicked: boolean;
  preferences: Preferences;
  /** set once the member finishes (or skips) the profile wizard */
  completedAt: string | null;
  updatedAt: string | null;
}

export interface AccountSettings {
  notifications: {
    newMatches: boolean;
    newLikes: boolean;
    dateReminders: boolean;
    membership: boolean;
    productEmails: boolean;
  };
  privacy: {
    showAge: boolean;
    showLocation: boolean;
    /** false = hidden from Discover, existing matches still work */
    discoverable: boolean;
  };
}

export function defaultPreferences(): Preferences {
  return {
    interestedIn: [],
    ageMin: 21,
    ageMax: 39,
    distanceKm: 50,
    intent: "relationship",
  };
}

export function defaultProfile(): Profile {
  return {
    birthDate: "",
    gender: "",
    pronouns: "",
    city: "",
    country: site.defaultCountry ?? "Ghana",
    bio: "",
    interests: [],
    photo: null,
    avatar: AVATAR_PRESETS[0],
    avatarPicked: false,
    preferences: defaultPreferences(),
    completedAt: null,
    updatedAt: null,
  };
}

/** Backfill any missing settings group/key so callers never read undefined. */
export function ensureSettingsShape(input: AccountSettings | undefined): AccountSettings {
  const base = defaultSettings();
  const settings = input ?? base;
  return {
    notifications: { ...base.notifications, ...(settings.notifications ?? {}) },
    privacy: { ...base.privacy, ...(settings.privacy ?? {}) },
  };
}

export function defaultSettings(): AccountSettings {
  return {
    notifications: {
      newMatches: true,
      newLikes: true,
      dateReminders: true,
      membership: true,
      productEmails: false,
    },
    privacy: { showAge: true, showLocation: true, discoverable: true },
  };
}

/* ------------------------------------------------------------------ */
/* Derived values                                                      */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function ageFrom(birthDate: string, now: Date = new Date()): number | null {
  if (!ISO_DATE.test(birthDate)) return null;
  const dob = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < dob.getUTCMonth() ||
    (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function summarizeLocation(p: Pick<Profile, "city" | "country">, withCountry = true): string {
  const city = p.city.trim();
  if (!city) return withCountry ? p.country : "";
  return withCountry && p.country ? `${city}, ${p.country}` : city;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface Completeness {
  percent: number;
  /** friendly labels for what's still missing */
  missing: string[];
  done: boolean;
}

const WEIGHTS: Array<[string, number, (p: Profile) => boolean]> = [
  ["photo", 20, (p) => Boolean(p.photo) || p.avatarPicked],
  ["age", 15, (p) => ageFrom(p.birthDate) !== null],
  ["city", 15, (p) => p.city.trim().length >= 2],
  ["bio", 15, (p) => p.bio.trim().length >= 40],
  ["interests", 20, (p) => p.interests.length >= INTEREST_MIN],
  ["gender", 10, (p) => p.gender !== ""],
  ["gender preferences", 5, (p) => p.preferences.interestedIn.length > 0],
];

export function profileCompleteness(profile: Profile | undefined): Completeness {
  const p = profile ?? defaultProfile();
  let percent = 0;
  const missing: string[] = [];
  for (const [label, weight, ok] of WEIGHTS) {
    if (ok(p)) percent += weight;
    else missing.push(label);
  }
  // a finished wizard is finished, even with optional bits left out
  if (p.completedAt) percent = Math.max(percent, 60);
  return { percent: Math.min(100, percent), missing, done: p.completedAt !== null };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export class ProfileValidationError extends Error {
  /** field name → message, so forms can render errors inline */
  fields: Record<string, string>;
  status: number;
  code: string;
  constructor(message: string, fields: Record<string, string> = {}, status = 400, code = "VALIDATION") {
    super(message);
    this.name = "ProfileValidationError";
    this.fields = fields;
    this.status = status;
    this.code = code;
  }
}

/** Trim, collapse whitespace, strip control characters, clamp length. */
export function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Multiline variant: keeps newlines, still strips control chars. */
export function sanitizeMultiline(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, max);
}

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function validateEmail(raw: unknown): string {
  const email = normalizeEmail(raw);
  if (!email) throw new ProfileValidationError("Email is required.", { email: "Enter your email." });
  if (!EMAIL_SHAPE.test(email))
    throw new ProfileValidationError("That doesn't look like an email address.", {
      email: "Check the format — e.g. you@example.com.",
    });
  return email;
}

export function validateName(raw: unknown): string {
  const name = sanitizeText(raw, NAME_MAX + 10);
  if (name.length < NAME_MIN)
    throw new ProfileValidationError(`Names need at least ${NAME_MIN} characters.`, {
      name: `At least ${NAME_MIN} characters.`,
    });
  if (/\p{C}/u.test(name)) throw new ProfileValidationError("Names can't contain control characters.", { name: "Please tidy that up." });
  return name.slice(0, NAME_MAX);
}

/** Accepts yyyy-mm-dd only, and requires an adult birthday. */
export function validateBirthDate(raw: unknown, field = "birthDate"): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!ISO_DATE.test(value))
    throw new ProfileValidationError("Enter your date of birth.", { [field]: "Use the date picker." });
  const dob = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dob.getTime()))
    throw new ProfileValidationError("That date doesn't exist.", { [field]: "Pick a real date." });
  const today = Date.now();
  if (dob.getTime() > today)
    throw new ProfileValidationError("Birth date can't be in the future.", { [field]: "That date hasn't happened yet." });
  const age = ageFrom(value);
  if (age === null || age < MIN_AGE)
    throw new ProfileValidationError(
      `You must be ${MIN_AGE} or older to join ${site.name}.`,
      { [field]: `Spark members are 18+.` },
      403,
      "TOO_YOUNG"
    );
  if (age > MAX_AGE) throw new ProfileValidationError("Please double-check your birth year.", { [field]: "That age looks off." });
  return value;
}

export function validateGender(raw: unknown): Gender | "" {
  if (raw === "" || raw === null || raw === undefined) return "";
  if (typeof raw === "string" && (GENDERS as readonly string[]).includes(raw)) return raw as Gender;
  throw new ProfileValidationError("Unrecognised gender option.", { gender: "Pick one of the listed options." });
}

export function validatePronouns(raw: unknown): string {
  const value = sanitizeText(raw, 30);
  if (value && !/^[a-z/]+$/i.test(value))
    throw new ProfileValidationError("Pronouns should look like “she/her”.", { pronouns: "Letters and a slash only." });
  return value;
}

export function validateCity(raw: unknown): string {
  const city = sanitizeText(raw, CITY_MAX);
  if (city.length > 0 && city.length < 2)
    throw new ProfileValidationError("Add a longer city name.", { city: "At least 2 characters." });
  return city;
}

export function validateCountry(raw: unknown): string {
  const country = sanitizeText(raw, 40);
  if (!country) return COUNTRIES[0];
  return country;
}

export function validateBio(raw: unknown): string {
  const bio = sanitizeMultiline(raw, BIO_MAX + 120);
  if (bio.length > BIO_MAX)
    throw new ProfileValidationError(`Bios are capped at ${BIO_MAX} characters.`, {
      bio: `${bio.length}/${BIO_MAX} characters — trim it a little.`,
    });
  return bio;
}

export function normalizeInterest(raw: unknown): string | null {
  const tag = sanitizeText(raw, TAG_MAX + 6);
  if (!tag) return null;
  if (tag.length > TAG_MAX) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '&().,+!-]*$/u.test(tag)) return null;
  return tag;
}

export function validateInterests(raw: unknown, { minimum = INTEREST_MIN } = {}): string[] {
  if (!Array.isArray(raw))
    throw new ProfileValidationError("Interests should be a list.", { interests: "Pick a few." });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = normalizeInterest(item);
    if (!tag)
      throw new ProfileValidationError(`“${String(item).slice(0, 30)}” isn't a valid interest.`, {
        interests: `Letters and numbers only, ${TAG_MAX} characters max.`,
      });
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  if (out.length < minimum)
    throw new ProfileValidationError(
      `Pick at least ${minimum} ${minimum === 1 ? "interest" : "interests"} so we can find your people.`,
      { interests: `${out.length}/${minimum} so far.` }
    );
  if (out.length > INTEREST_MAX)
    throw new ProfileValidationError(`Profiles show up to ${INTEREST_MAX} interests.`, {
      interests: `Remove ${out.length - INTEREST_MAX} to continue.`,
    });
  return out;
}

export function validatePreferences(raw: unknown, current: Preferences): Preferences {
  if (typeof raw !== "object" || raw === null)
    throw new ProfileValidationError("Preferences should be an object.", { preferences: "Something's off." });
  const input = raw as Record<string, unknown>;
  const next: Preferences = { ...current };

  if (input.interestedIn !== undefined) {
    if (!Array.isArray(input.interestedIn))
      throw new ProfileValidationError("“Interested in” should be a list.", { interestedIn: "Pick who to see." });
    const set = new Set<Gender>();
    for (const g of input.interestedIn) {
      if (typeof g !== "string" || !(GENDERS as readonly string[]).includes(g))
        throw new ProfileValidationError("Unknown gender in preferences.", { interestedIn: "Pick a listed option." });
      set.add(g as Gender);
    }
    next.interestedIn = GENDERS.filter((g) => set.has(g));
  }

  if (input.intent !== undefined) {
    if (typeof input.intent !== "string" || !(INTENTS as readonly string[]).includes(input.intent))
      throw new ProfileValidationError("Unknown relationship goal.", { intent: "Pick a listed option." });
    next.intent = input.intent as Intent;
  }

  const ageMinIn = input.ageMin !== undefined ? Number(input.ageMin) : next.ageMin;
  const ageMaxIn = input.ageMax !== undefined ? Number(input.ageMax) : next.ageMax;
  if (input.ageMin !== undefined || input.ageMax !== undefined) {
    if (!Number.isFinite(ageMinIn) || !Number.isFinite(ageMaxIn))
      throw new ProfileValidationError("Age range must be numbers.", { ageMin: "Use whole numbers." });
    const ageMin = Math.trunc(ageMinIn);
    const ageMax = Math.trunc(ageMaxIn);
    if (ageMin < MIN_AGE || ageMax > MAX_AGE || ageMin > ageMax)
      throw new ProfileValidationError(
        `Age range must sit between ${MIN_AGE} and ${MAX_AGE}, low to high.`,
        { ageMin: `${MIN_AGE}–${MAX_AGE}, low ≤ high.` }
      );
    next.ageMin = ageMin;
    next.ageMax = ageMax;
  }

  if (input.distanceKm !== undefined) {
    const d = Math.trunc(Number(input.distanceKm));
    if (!Number.isFinite(Number(input.distanceKm)) || d < 0 || d > 2000)
      throw new ProfileValidationError("Distance must be between 0 (anywhere) and 2000 km.", {
        distanceKm: "Try 10, 50, 200 or 0 for anywhere.",
      });
    next.distanceKm = d;
  }

  return next;
}

/** `data:image/jpeg;base64,…` only, resized client-side, with a size ceiling. */
export function validatePhotoDataUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0)
    throw new ProfileValidationError("No photo data received.", { photo: "Choose an image file." });
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(raw);
  if (!match)
    throw new ProfileValidationError("Photos must be a JPEG, PNG or WebP image.", {
      photo: "Try a JPG or PNG instead.",
    });
  const bytes = Math.floor((match[2].length * 3) / 4);
  if (bytes > PHOTO_MAX_BYTES)
    throw new ProfileValidationError("That photo is too large — please pick a smaller image.", {
      photo: "Max 1.5 MB after resizing.",
    });
  return `data:image/${match[1] === "jpg" ? "jpeg" : match[1]};base64,${match[2].replace(/\s+/g, "")}`;
}

export function validateAvatar(raw: unknown): string {
  const value = sanitizeText(raw, 8);
  if (!value) throw new ProfileValidationError("Pick an avatar.", { avatar: "Choose one of the presets." });
  if (Array.from(value).length > 2)
    throw new ProfileValidationError("Pick a single emoji for your avatar.", { avatar: "One emoji only." });
  return value;
}

/* ------------------------------------------------------------------ */
/* Patching                                                            */
/* ------------------------------------------------------------------ */

export interface ProfileChanges {
  /** display name lives on the account, not the profile */
  name?: string;
  profile: Profile;
  changed: string[];
}

/**
 * Validate a partial patch and return the *next* profile.
 * Unknown keys are ignored on purpose; invalid values throw with per-field messages.
 */
export function buildProfilePatch(
  current: Profile,
  patch: Record<string, unknown>,
  currentName: string
): ProfileChanges {
  const profile: Profile = { ...current, preferences: { ...current.preferences } };
  const changed: string[] = [];
  let name: string | undefined;

  const touch = (key: string) => {
    if (!changed.includes(key)) changed.push(key);
  };

  if (patch.name !== undefined) {
    const next = validateName(patch.name);
    if (next !== currentName) {
      name = next;
      touch("name");
    }
  }
  if (patch.birthDate !== undefined) {
    const next = validateBirthDate(patch.birthDate);
    if (next !== current.birthDate) {
      profile.birthDate = next;
      touch("birthDate");
    }
  }
  if (patch.gender !== undefined) {
    const next = validateGender(patch.gender);
    if (next !== current.gender) {
      profile.gender = next;
      touch("gender");
    }
  }
  if (patch.pronouns !== undefined) {
    const next = validatePronouns(patch.pronouns);
    if (next !== current.pronouns) {
      profile.pronouns = next;
      touch("pronouns");
    }
  }
  if (patch.city !== undefined) {
    const next = validateCity(patch.city);
    if (next !== current.city) {
      profile.city = next;
      touch("city");
    }
  }
  if (patch.country !== undefined) {
    const next = validateCountry(patch.country);
    if (next !== current.country) {
      profile.country = next;
      touch("country");
    }
  }
  if (patch.bio !== undefined) {
    const next = validateBio(patch.bio);
    if (next !== current.bio) {
      profile.bio = next;
      touch("bio");
    }
  }
  if (patch.interests !== undefined) {
    const next = validateInterests(patch.interests);
    if (next.join("|").toLowerCase() !== current.interests.join("|").toLowerCase()) {
      profile.interests = next;
      touch("interests");
    }
  }
  if (patch.avatar !== undefined) {
    const next = validateAvatar(patch.avatar);
    if (next !== current.avatar) {
      profile.avatar = next;
      touch("avatar");
    }
    if (next) profile.avatarPicked = true;
  }
  if (patch.preferences !== undefined) {
    const next = validatePreferences(patch.preferences, current.preferences);
    profile.preferences = next;
    touch("preferences");
  }

  if (changed.length > 0) profile.updatedAt = new Date().toISOString();
  return { name, profile, changed };
}

/* ------------------------------------------------------------------ */
/* Matching maths — preferences + shared interests                     */
/* ------------------------------------------------------------------ */

export interface CandidateProfile {
  age: number;
  gender: Gender | "";
  interests: string[];
  city: string;
  country: string;
  distanceKm: number;
}

export function sharedInterests(a: string[], b: string[]): string[] {
  const other = new Map(b.map((t) => [t.toLowerCase(), t]));
  const out: string[] = [];
  for (const tag of a) {
    const hit = other.get(tag.toLowerCase());
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

export function withinPreferences(
  me: Pick<Profile, "preferences" | "city">,
  candidate: CandidateProfile
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const { interestedIn, ageMin, ageMax, distanceKm } = me.preferences;
  if (interestedIn.length > 0 && candidate.gender && !interestedIn.includes(candidate.gender)) {
    reasons.push("outside your gender preference");
  }
  if (candidate.age < ageMin || candidate.age > ageMax) reasons.push("outside your age range");
  if (distanceKm > 0 && candidate.distanceKm > distanceKm) reasons.push("too far away");
  return { ok: reasons.length === 0, reasons };
}

/**
 * Deterministic 0-100 affinity: the seeded baseline is nudged by shared
 * interests, age fit, gender fit and how close they are. Same two profiles
 * always produce the same number — that's what makes it feel like a score.
 */
export function compatibilityFor(me: Profile, candidate: CandidateProfile, baseline: number): number {
  const shared = sharedInterests(me.interests, candidate.interests);
  const denominator = Math.max(3, Math.min(me.interests.length || 3, candidate.interests.length || 3));
  let score = baseline;
  score += Math.round((shared.length / denominator) * 26);
  if (me.interests.length === 0) score -= 4;
  if (candidate.age >= me.preferences.ageMin && candidate.age <= me.preferences.ageMax) score += 5;
  else score -= 10;
  if (me.preferences.interestedIn.length > 0 && candidate.gender && !me.preferences.interestedIn.includes(candidate.gender))
    score -= 25;
  if (me.city && candidate.city && me.city.toLowerCase() === candidate.city.toLowerCase()) score += 6;
  if (me.preferences.distanceKm > 0 && candidate.distanceKm > me.preferences.distanceKm) score -= 6;
  return Math.max(35, Math.min(99, Math.round(score)));
}

/* ------------------------------------------------------------------ */
/* Serialization for client components                                 */
/* ------------------------------------------------------------------ */

/** What the browser is allowed to see. Never includes the password hash. */
export interface ProfileDto {
  name: string;
  email: string;
  birthDate: string;
  age: number | null;
  gender: Gender | "";
  pronouns: string;
  city: string;
  country: string;
  bio: string;
  interests: string[];
  photo: string | null;
  avatar: string;
  avatarPicked: boolean;
  preferences: Preferences;
  completedAt: string | null;
  updatedAt: string | null;
  settings: AccountSettings;
  createdAt: string;
  lastLoginAt: string | null;
}

/** Rebuild a Profile from the flat DTO (used by the live preview in the editor). */
export function profileFromDto(dto: ProfileDto): Profile {
  return {
    birthDate: dto.birthDate,
    gender: dto.gender,
    pronouns: dto.pronouns,
    city: dto.city,
    country: dto.country,
    bio: dto.bio,
    interests: dto.interests,
    photo: dto.photo,
    avatar: dto.avatar,
    avatarPicked: dto.avatarPicked,
    preferences: dto.preferences,
    completedAt: dto.completedAt,
    updatedAt: dto.updatedAt,
  };
}

export function toProfileDto(
  account: { name: string; email: string; createdAt: string; lastLoginAt?: string | null },
  profile: Profile,
  settings: AccountSettings
): ProfileDto {
  return {
    name: account.name,
    email: account.email,
    birthDate: profile.birthDate,
    age: ageFrom(profile.birthDate),
    gender: profile.gender,
    pronouns: profile.pronouns,
    city: profile.city,
    country: profile.country,
    bio: profile.bio,
    interests: profile.interests,
    photo: profile.photo,
    avatar: profile.avatar,
    avatarPicked: profile.avatarPicked,
    preferences: profile.preferences,
    completedAt: profile.completedAt,
    updatedAt: profile.updatedAt,
    settings,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt ?? null,
  };
}
