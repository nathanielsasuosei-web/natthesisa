import { BillingCycle, PlanId, cycleDays, getPlan } from "./plans";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  tasks: Task[];
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  description: string;
  status: "paid";
}

export interface AuditEvent {
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
  subscription: Subscription;
  usage: Usage;
  boards: Board[];
  invoices: Invoice[];
  auditLog: AuditEvent[];
  paymentMethod: PaymentMethod;
}

export interface Store {
  users: Map<string, User>;
}

/* ------------------------------------------------------------------ */
/* In-memory store (demo). Lives on globalThis so it survives         */
/* hot reloads in dev. Resets when the server process restarts.       */
/* ------------------------------------------------------------------ */

const g = globalThis as unknown as { __natthesisaStore?: Store };

export function getStore(): Store {
  if (!g.__natthesisaStore) {
    g.__natthesisaStore = { users: new Map<string, User>() };
  }
  return g.__natthesisaStore;
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

export function audit(user: User, text: string): void {
  user.auditLog.unshift({ id: uid(), ts: new Date().toISOString(), text });
  if (user.auditLog.length > 200) user.auditLog.pop();
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

/** Consume one action against the plan's per-period allowance. */
export function consumeAction(user: User): boolean {
  const limit = getPlan(user.subscription.planId).limits.actionsPerPeriod;
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

export function findTask(user: User, taskId: string): { board: Board; task: Task } | null {
  for (const board of user.boards) {
    const task = board.tasks.find((t) => t.id === taskId);
    if (task) return { board, task };
  }
  return null;
}

/* ------------------------------ seeding ------------------------------ */

const SEED_HISTORY = [4, 7, 2, 9, 5, 3, 0];

function seedBoard(name: string, tasks: Array<[string, boolean]>): Board {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name,
    createdAt: now,
    tasks: tasks.map(([title, done]) => ({
      id: uid(),
      title,
      done,
      createdAt: now,
    })),
  };
}

export function createUser(name: string): User {
  const usage = freshUsage();
  usage.history = usage.history.map((h, i) => ({ ...h, count: SEED_HISTORY[i] ?? 0 }));
  const user: User = {
    id: uid(),
    name: name.trim().slice(0, 40) || "Guest",
    createdAt: new Date().toISOString(),
    subscription: makeSubscription("free", "monthly"),
    usage,
    boards: [
      seedBoard("Website redesign", [
        ["Write project brief", true],
        ["Low-fi wireframes", true],
        ["Pick color palette", false],
        ["Build landing page", false],
      ]),
      seedBoard("Learning TypeScript", [
        ["Generics deep-dive", false],
        ["Practice: utility types", true],
        ["Skim the release notes", false],
      ]),
    ],
    invoices: [],
    auditLog: [],
    paymentMethod: { brand: "Visa", last4: "4242" },
  };
  audit(user, "Workspace created on the Free plan");
  getStore().users.set(user.id, user);
  return user;
}
