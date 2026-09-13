import { BillingCycle, PlanId, cycleDays, getPlan } from "./plans";

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
  createdAt: string;
  role: "member" | "admin";
  /** suspended members can sign in but every action is blocked server-side */
  suspended: boolean;
  subscription: Subscription;
  usage: Usage;
  matches: Match[];
  invoices: Invoice[];
  activityLog: ActivityEvent[];
  paymentMethod: PaymentMethod;
}

export interface Store {
  users: Map<string, User>;
}

/* ------------------------------------------------------------------ */
/* In-memory store (demo). Lives on globalThis so it survives         */
/* hot reloads in dev. Resets when the server process restarts.       */
/* ------------------------------------------------------------------ */

const g = globalThis as unknown as { __sparksStore?: Store };

export function getStore(): Store {
  if (!g.__sparksStore) {
    g.__sparksStore = { users: new Map<string, User>() };
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

export function findUserByName(name: string): User | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  for (const user of getStore().users.values()) {
    if (user.name.toLowerCase() === needle) return user;
  }
  return undefined;
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

/* ------------------------------ seeding ------------------------------ */

const SEED_HISTORY = [4, 7, 2, 9, 5, 3, 0];

export interface MatchSeed {
  name: string;
  age: number;
  bio: string;
  emoji: string;
  compatibility: number;
}

function seedMatch(seed: MatchSeed, ideas: Array<[string, boolean]>): Match {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: seed.name,
    age: seed.age,
    bio: seed.bio,
    emoji: seed.emoji,
    compatibility: seed.compatibility,
    createdAt: now,
    dateIdeas: ideas.map(([title, done]) => ({
      id: uid(),
      title,
      done,
      createdAt: now,
    })),
  };
}

/** Pool of demo singles used when the user taps "Discover". */
export const DISCOVER_POOL: MatchSeed[] = [
  { name: "Ama", age: 27, bio: "Sunset chaser, amateur baker, will beat you at Scrabble.", emoji: "🌅", compatibility: 91 },
  { name: "Kwame", age: 31, bio: "Runs at dawn, reads at dusk. Looking for a plus-one to jollof festivals.", emoji: "🏃", compatibility: 84 },
  { name: "Efua", age: 25, bio: "Painter with paint on everything I own. Ask me about my cat, Palette.", emoji: "🎨", compatibility: 88 },
  { name: "Kofi", age: 29, bio: "Live-music nerd. I know every open-mic night in town.", emoji: "🎸", compatibility: 79 },
  { name: "Adjoa", age: 26, bio: "Marine biologist. Yes, I will talk about octopuses on the first date.", emoji: "🐙", compatibility: 93 },
  { name: "Yaw", age: 33, bio: "Chef who cooks better on dates than at work. Prove me wrong.", emoji: "👨‍🍳", compatibility: 82 },
  { name: "Abena", age: 28, bio: "Trail hiker and cloud photographer. Golden hour is my love language.", emoji: "⛰️", compatibility: 87 },
  { name: "Kojo", age: 30, bio: "Board-game hoarder. My shelf is a red flag and I own it.", emoji: "🎲", compatibility: 76 },
  { name: "Esi", age: 24, bio: "Poet, plant mom, professional overthinker of texts.", emoji: "🌿", compatibility: 90 },
  { name: "Nana", age: 32, bio: "Salsa on Fridays, brunch on Sundays, kindness always.", emoji: "💃", compatibility: 85 },
];

export function createUser(name: string): User {
  const usage = freshUsage();
  usage.history = usage.history.map((h, i) => ({ ...h, count: SEED_HISTORY[i] ?? 0 }));
  const cleanName = name.trim().slice(0, 40) || "Guest";
  const isAdmin = cleanName.toLowerCase() === "admin";
  const user: User = {
    id: uid(),
    name: cleanName,
    createdAt: new Date().toISOString(),
    role: isAdmin ? "admin" : "member",
    suspended: false,
    subscription: makeSubscription("free", "monthly"),
    usage,
    matches: [
      seedMatch(DISCOVER_POOL[0], [
        ["Say hi and break the ice", true],
        ["Coffee at the corner café", true],
        ["Sunset walk on the beach", false],
        ["Bake-off night — bring flour", false],
      ]),
      seedMatch(DISCOVER_POOL[4], [
        ["Aquarium visit", false],
        ["Trade favourite playlists", true],
        ["Street-food crawl", false],
      ]),
    ],
    invoices: [],
    activityLog: [],
    paymentMethod: { brand: "Visa", last4: "4242" },
  };
  logActivity(user, isAdmin ? "Admin account created" : "Profile created on the Free plan");
  getStore().users.set(user.id, user);
  return user;
}
