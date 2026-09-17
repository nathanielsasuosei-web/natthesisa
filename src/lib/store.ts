import { hashPassword } from "./password";
import { DISCOVER_POOL, MatchSeed, candidateOf, seedByName } from "./demo-pool";
import { BillingCycle, PlanId, cycleDays, getPlan } from "./plans";
import {
  AccountSettings,
  AVATAR_PRESETS,
  Gender,
  Profile,
  ageFrom,
  compatibilityFor,
  defaultProfile,
  defaultSettings,
  withinPreferences,
} from "./profile";

export interface DateIdea {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Match {
  id: string;
  name: string;
  age: number;
  bio: string;
  emoji: string;
  compatibility: number; // 0-100
  createdAt: string;
  dateIdeas: DateIdea[];
  /** --- profile fields, so preferences and interests actually mean something --- */
  gender: Gender | "";
  city: string;
  distanceKm: number;
  interests: string[];
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  description: string;
  status: "paid";
}

export interface ActivityEvent {
  id: string;
  ts: string;
  text: string;
}

export interface DayUsage {
  date: string; // yyyy-mm-dd
  count: number;
}

export interface Subscription {
  planId: PlanId;
  cycle: BillingCycle;
  /** true = user asked to cancel; plan stays active until currentPeriodEnd */
  cancelAtPeriodEnd: boolean;
  /** scheduled plan change applied when the period ends (downgrades) */
  pendingPlanId: PlanId | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface Usage {
  periodStart: string;
  count: number;
  history: DayUsage[];
}

export interface PaymentMethod {
  brand: string;
  last4: string;
}

export interface User {
  id: string;
  name: string;
  /** lower-cased, unique */
  email: string;
  /** scrypt digest string — never leaves the server, never reaches the client */
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string | null;
  role: "member" | "admin";
  /** suspended members can sign in but every action is blocked server-side */
  suspended: boolean;
  /** failed sign-in counter for the small brute-force brake in lib/accounts */
  failedLogins: number;
  lockedUntil: string | null;
  profile: Profile;
  settings: AccountSettings;
  subscription: Subscription;
  usage: Usage;
  matches: Match[];
  invoices: Invoice[];
  activityLog: ActivityEvent[];
  paymentMethod: PaymentMethod;
}

export interface Store {
  users: Map<string, User>;
  /** lower-cased email → user id, kept in sync with `users` */
  emailIndex: Map<string, string>;
}

/* ------------------------------------------------------------------ */
/* In-memory store (demo). Lives on globalThis so it survives         */
/* hot reloads in dev. Resets when the server process restarts.       */
/* ------------------------------------------------------------------ */

const g = globalThis as unknown as { __sparksStore?: Store };

export function getStore(): Store {
  if (!g.__sparksStore) {
    const store: Store = { users: new Map<string, User>(), emailIndex: new Map<string, string>() };
    g.__sparksStore = store;
    seedDemoUsers(store);
  }
  return g.__sparksStore;
}

let uidCounter = 0;
export function uid(): string {
  uidCounter += 1;
  return `${Date.now().toString(36)}-${uidCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(from: Date | number, days: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** yyyy-mm-dd for a date n years before today — used by the demo birthdays. */
export function yearsAgoDate(years: number, offsetDays = 0): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function freshUsage(): Usage {
  const history: DayUsage[] = [];
  for (let i = 6; i >= 0; i--) {
    history.push({ date: todayKey(addDays(new Date(), -i)), count: 0 });
  }
  return { periodStart: new Date().toISOString(), count: 0, history };
}

export function makeSubscription(planId: PlanId, cycle: BillingCycle): Subscription {
  const now = new Date();
  return {
    planId,
    cycle,
    cancelAtPeriodEnd: false,
    pendingPlanId: null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: addDays(now, cycleDays(cycle)).toISOString(),
  };
}

export function logActivity(user: User, text: string): void {
  user.activityLog.unshift({ id: uid(), ts: new Date().toISOString(), text });
  if (user.activityLog.length > 200) user.activityLog.pop();
}

export function addInvoice(user: User, amount: number, description: string): Invoice | null {
  if (amount <= 0) return null;
  const invoice: Invoice = {
    id: uid(),
    number: `INV-${String(user.invoices.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString(),
    amount,
    description,
    status: "paid",
  };
  user.invoices.unshift(invoice);
  return invoice;
}

/** Consume one like/interaction against the plan's per-period allowance. */
export function consumeAction(user: User): boolean {
  const limit = getPlan(user.subscription.planId).limits.likesPerPeriod;
  if (limit !== null && user.usage.count >= limit) return false;
  user.usage.count += 1;
  const key = todayKey();
  const entry = user.usage.history.find((h) => h.date === key);
  if (entry) entry.count += 1;
  return true;
}

export function findUserByEmail(email: string): User | undefined {
  const needle = email.trim().toLowerCase();
  if (!needle) return undefined;
  const store = getStore();
  const id = store.emailIndex.get(needle);
  if (id) {
    const user = store.users.get(id);
    if (user) return user;
    store.emailIndex.delete(needle);
  }
  for (const user of store.users.values()) {
    if (user.email?.toLowerCase() === needle) {
      store.emailIndex.set(needle, user.id);
      return user;
    }
  }
  return undefined;
}

export function emailTaken(email: string, exceptId?: string): boolean {
  const existing = findUserByEmail(email);
  return Boolean(existing && existing.id !== exceptId);
}

export function indexEmail(user: User): void {
  const store = getStore();
  const email = (user.email ?? "").toLowerCase();
  if (email) store.emailIndex.set(email, user.id);
}

export function unindexEmail(user: User): void {
  const store = getStore();
  const email = (user.email ?? "").toLowerCase();
  if (email && store.emailIndex.get(email) === user.id) store.emailIndex.delete(email);
}

export function findDateIdea(
  user: User,
  ideaId: string
): { match: Match; idea: DateIdea } | null {
  for (const match of user.matches) {
    const idea = match.dateIdeas.find((t) => t.id === ideaId);
    if (idea) return { match, idea };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Backfill for records created before the profile fields existed.     */
/* Hot reload keeps users in memory, so this has to be forgiving.      */
/* ------------------------------------------------------------------ */

function ensureAccountShape(user: User): User {
  if (user.role === undefined) user.role = "member";
  if (user.suspended === undefined) user.suspended = false;
  if (user.email === undefined) user.email = `${user.name.toLowerCase().replace(/\W+/g, ".")}@demo.sparks`;
  if (user.lastLoginAt === undefined) user.lastLoginAt = null;
  if (user.failedLogins === undefined) user.failedLogins = 0;
  if (user.lockedUntil === undefined) user.lockedUntil = null;
  if (!user.profile) {
    user.profile = {
      ...defaultProfile(),
      birthDate: yearsAgoDate(Math.max(18, user.name.length + 24)),
      city: "Accra",
      completedAt: new Date().toISOString(),
    };
  } else {
    const p = user.profile;
    if (!Array.isArray(p.interests)) p.interests = [];
    if (typeof p.bio !== "string") p.bio = "";
    if (typeof p.city !== "string") p.city = "";
    if (!p.preferences) p.preferences = defaultProfile().preferences;
    if (p.avatar === undefined) p.avatar = defaultProfile().avatar;
    if (p.avatarPicked === undefined) p.avatarPicked = false;
    if (p.photo === undefined) p.photo = null;
  }
  if (!user.settings) user.settings = defaultSettings();
  else {
    if (!user.settings.notifications) user.settings.notifications = defaultSettings().notifications;
    if (!user.settings.privacy) user.settings.privacy = defaultSettings().privacy;
  }
  indexEmail(user);
  return user;
}

/** Older matches were created without gender/interests — give them defaults. */
function ensureMatchShape(match: Match, user: User): Match {
  if (match.gender === undefined) match.gender = "";
  if (typeof match.city !== "string") match.city = user.profile?.city ?? "";
  if (typeof match.distanceKm !== "number") match.distanceKm = 12;
  if (!Array.isArray(match.interests)) match.interests = [];
  return match;
}

export function ensureUserReady(user: User): User {
  ensureAccountShape(user);
  for (const match of user.matches) ensureMatchShape(match, user);
  return user;
}

/* ------------------------------ seeding ------------------------------ */

export { DISCOVER_POOL, candidateOf };
export type { MatchSeed };

export function seedFromPool(name: string): MatchSeed | undefined {
  return seedByName(name);
}

/** Materialise a pool entry as this member's match, scored against their profile. */
export function createMatch(user: User, seed: MatchSeed): Match {
  const now = new Date().toISOString();
  const profile = user.profile ?? defaultProfile();
  return {
    id: uid(),
    name: seed.name,
    age: seed.age,
    bio: seed.bio,
    emoji: seed.emoji,
    compatibility: compatibilityFor(profile, candidateOf(seed), seed.compatibility),
    createdAt: now,
    dateIdeas: [],
    gender: seed.gender,
    city: seed.city,
    distanceKm: seed.distanceKm,
    interests: [...seed.interests],
  };
}

function seedMatchWithIdeas(user: User, seed: MatchSeed, ideas: Array<[string, boolean]>): Match {
  const match = createMatch(user, seed);
  match.dateIdeas = ideas.map(([title, done]) => ({
    id: uid(),
    title,
    done,
    createdAt: match.createdAt,
  }));
  return match;
}

/** Choose the best un-matched single for this member, honouring preferences. */
export function pickCandidate(
  user: User,
  opts: { respectPreferences?: boolean } = { respectPreferences: true }
): MatchSeed | undefined {
  const taken = new Set(user.matches.map((m) => m.name.toLowerCase()));
  const profile = user.profile ?? defaultProfile();
  const pool = DISCOVER_POOL.filter((s) => !taken.has(s.name.toLowerCase()));
  if (pool.length === 0) return undefined;
  const eligible = opts.respectPreferences
    ? pool.filter((s) => withinPreferences(profile, candidateOf(s)).ok)
    : pool;
  const ranked = (eligible.length > 0 ? eligible : pool)
    .map((s) => ({ seed: s, score: s.compatibility + sharedInterestsCount(profile, s) * 6 }))
    .sort((a, b) => b.score - a.score);
  // pick from the top few so Discover feels alive without breaking the maths
  const top = ranked.slice(0, Math.min(3, ranked.length));
  return top[Math.floor(Math.random() * top.length)].seed;
}

function sharedInterestsCount(profile: Profile, seed: MatchSeed): number {
  const mine = new Set(profile.interests.map((t) => t.toLowerCase()));
  return seed.interests.filter((t) => mine.has(t.toLowerCase())).length;
}

/* ------------------------------------------------------------------ */
/* Demo accounts                                                       */
/* ------------------------------------------------------------------ */

interface DemoSpec {
  name: string;
  email: string;
  password: string;
  role?: "admin";
  plan?: PlanId;
  cycle?: BillingCycle;
  bio: string;
  interests: string[];
  gender: Gender;
  pronouns: string;
  city: string;
  age: number;
  intent?: Profile["preferences"]["intent"];
  interestedIn?: Gender[];
}

function buildDemoUser(store: Store, spec: DemoSpec): User {
  const plan = spec.plan ?? "free";
  const cycle = spec.cycle ?? "monthly";
  const user: User = {
    id: uid(),
    name: spec.name,
    email: spec.email.toLowerCase(),
    // Demo users are hashed once, at boot — see lib/password.ts for the format.
    passwordHash: hashPassword(spec.password),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (30 + store.users.size * 7)).toISOString(),
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    role: spec.role ?? "member",
    suspended: false,
    failedLogins: 0,
    lockedUntil: null,
    profile: {
      ...defaultProfile(),
      birthDate: yearsAgoDate(spec.age),
      gender: spec.gender,
      pronouns: spec.pronouns,
      city: spec.city,
      bio: spec.bio,
      interests: spec.interests,
      avatar: AVATAR_FOR[spec.name] ?? defaultAvatarFor(spec.name),
      avatarPicked: true,
      preferences: {
        ...defaultProfile().preferences,
        intent: spec.intent ?? "relationship",
        interestedIn: spec.interestedIn ?? [],
      },
      completedAt: new Date().toISOString(),
    },
    settings: defaultSettings(),
    subscription: makeSubscription(plan, cycle),
    usage: freshUsage(),
    matches: [],
    invoices: [],
    activityLog: [],
    paymentMethod: { brand: "Visa", last4: "4242" },
  };
  store.users.set(user.id, user);
  store.emailIndex.set(user.email, user.id);
  return user;
}

const AVATAR_FOR: Record<string, string> = {
  Admin: "🛡️",
  Ama: "🌅",
  Kwame: "🏃",
  Efua: "🎨",
};

function seedDemoUsers(store: Store): void {
  const admin = buildDemoUser(store, {
    name: "Nat the Admin",
    email: "admin@sparks.app",
    password: "sparksadmin1",
    role: "admin",
    plan: "elite",
    cycle: "yearly",
    bio: "Keeps the sparks flying. Moderates profiles, refunds the odd invoice, adopts every stray dog in Accra.",
    interests: ["Reading", "Coffee", "Volunteering", "Startups"],
    gender: "man",
    pronouns: "he/him",
    city: "Accra",
    age: 36,
    interestedIn: ["woman", "man", "nonbinary"],
  });
  admin.activityLog.push({ id: uid(), ts: new Date().toISOString(), text: "Admin account seeded for the demo" });

  const ama = buildDemoUser(store, {
    name: "Ama Boateng",
    email: "ama@sparks.app",
    password: "sunrise2026!",
    plan: "premium",
    cycle: "monthly",
    bio: "Pastry chef with a 5am start and a 6pm sunset walk. Looking for someone to share the last puff-puff with.",
    interests: ["Cooking", "Beach days", "Photography", "Live music", "Jollof debates"],
    gender: "woman",
    pronouns: "she/her",
    city: "Accra",
    age: 28,
    intent: "relationship",
    interestedIn: ["man"],
  });
  ama.matches.push(
    seedMatchWithIdeas(ama, DISCOVER_POOL[0], [
      ["Say hi and break the ice", true],
      ["Coffee at the corner café", true],
      ["Sunset walk at Labadi", false],
      ["Bake-off night — bring flour", false],
    ]),
    seedMatchWithIdeas(ama, DISCOVER_POOL[4], [["Aquarium visit", false], ["Trade favourite playlists", true]])
  );
  const seededHistory = [4, 7, 2, 9, 5, 3, 0];
  ama.usage.history = ama.usage.history.map((h, i) => ({ ...h, count: seededHistory[i] ?? 0 }));
  ama.usage.count = seededHistory.reduce((a, b) => a + b, 0);
  addInvoice(ama, getPlan("premium").monthly, "Upgrade to Premium (monthly)");
  logActivity(ama, "Upgraded to Premium (monthly)");
  logActivity(ama, "Profile created on the Premium plan");

  const kwame = buildDemoUser(store, {
    name: "Kwame Mensah",
    email: "kwame@sparks.app",
    password: "dawnrunner24",
    plan: "free",
    bio: "Marathon in training, book club on Sundays. I will talk about octopuses if you let me.",
    interests: ["Running", "Reading", "Football", "Faith"],
    gender: "man",
    pronouns: "he/him",
    city: "Tema",
    age: 31,
    intent: "marriage",
    interestedIn: ["woman"],
  });
  kwame.matches.push(seedMatchWithIdeas(kwame, DISCOVER_POOL[8], [["Poetry swap", false]]));

  buildDemoUser(store, {
    name: "Efua Danso",
    email: "efua@sparks.app",
    password: "palettecat24",
    plan: "elite",
    cycle: "yearly",
    bio: "Painter. Cat named Palette. I put paint on everything I own and I'm not sorry.",
    interests: ["Painting", "Pets", "Poetry", "Fashion", "Yoga"],
    gender: "woman",
    pronouns: "she/they",
    city: "Kumasi",
    age: 25,
    intent: "casual",
    interestedIn: ["woman", "nonbinary"],
  });

  // keep the age-derived birth dates honest for whatever "today" is
  for (const user of store.users.values()) {
    const age = ageFrom(user.profile.birthDate);
    if (age === null) user.profile.birthDate = yearsAgoDate(28);
  }
}

/**
 * Create a brand-new member account. `passwordHash` must already be produced by
 * lib/password.ts — this function never sees a plain password.
 */
export function createAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
  birthDate: string;
}): User {
  const store = getStore();
  const now = new Date().toISOString();
  const user: User = {
    id: uid(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: now,
    lastLoginAt: now,
    role: "member",
    suspended: false,
    failedLogins: 0,
    lockedUntil: null,
    profile: {
      ...defaultProfile(),
      birthDate: input.birthDate,
      avatar: defaultAvatarFor(input.name),
    },
    settings: defaultSettings(),
    subscription: makeSubscription("free", "monthly"),
    usage: freshUsage(),
    matches: [],
    invoices: [],
    activityLog: [],
    paymentMethod: { brand: "Visa", last4: "4242" },
  };
  store.users.set(user.id, user);
  indexEmail(user);
  logActivity(user, "Account created — free plan, no card, no surprises");
  return user;
}

/** A deterministic, friendly default avatar for members without a photo. */
export function defaultAvatarFor(name: string): string {
  const sum = [...name.trim()].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return AVATAR_PRESETS[sum % AVATAR_PRESETS.length];
}

/**
 * New members land in an app that already has one spark waiting — a demo like
 * from someone in the pool, chosen so the matches view is never empty.
 */
export function seedStarterMatch(user: User, seedName = "Ama"): void {
  const seed = seedFromPool(seedName) ?? DISCOVER_POOL[0];
  const match = createMatch(user, seed);
  match.dateIdeas.push({
    id: uid(),
    title: "Say hi and break the ice",
    done: false,
    createdAt: match.createdAt,
  });
  user.matches.push(match);
  logActivity(user, `It's a match — you and ${match.name} liked each other 💘 (demo data)`);
}
