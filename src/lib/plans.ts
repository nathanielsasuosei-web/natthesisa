export type PlanId = "free" | "premium" | "elite";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** price per month */
  monthly: number;
  /** price per year (≈ 2 months free) */
  yearly: number;
  limits: {
    /** max active matches, null = unlimited */
    matches: number | null;
    /** max likes & interactions per billing period, null = unlimited */
    likesPerPeriod: number | null;
  };
  entitlements: {
    insights: boolean;
    export: boolean;
    activityLog: boolean;
  };
  features: string[];
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Dip a toe in",
    monthly: 0,
    yearly: 0,
    limits: { matches: 3, likesPerPeriod: 25 },
    entitlements: { insights: false, export: false, activityLog: false },
    features: [
      "3 active matches",
      "25 likes per billing period",
      "Basic profile",
      "Community support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For serious daters",
    monthly: 99,
    yearly: 990,
    featured: true,
    limits: { matches: 25, likesPerPeriod: 2000 },
    entitlements: { insights: true, export: true, activityLog: false },
    features: [
      "25 active matches",
      "2,000 likes per billing period",
      "Love insights & compatibility stats",
      "Export your match history (CSV)",
      "Priority email support",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "All-in on love",
    monthly: 399,
    yearly: 3990,
    limits: { matches: null, likesPerPeriod: null },
    entitlements: { insights: true, export: true, activityLog: true },
    features: [
      "Unlimited matches",
      "Unlimited likes",
      "Everything in Premium",
      "Full activity timeline",
      "Profile boost (demo)",
      "Dedicated matchmaker support",
    ],
  },
];

export const PLAN_TIER: Record<PlanId, number> = { free: 0, premium: 1, elite: 2 };

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function priceFor(id: PlanId, cycle: BillingCycle): number {
  return cycle === "yearly" ? getPlan(id).yearly : getPlan(id).monthly;
}

export function cycleDays(cycle: BillingCycle): number {
  return cycle === "yearly" ? 365 : 30;
}

export { fmtMoney as formatMoney } from "./format";

export function describeLimit(n: number | null): string {
  return n === null ? "Unlimited" : n.toLocaleString("en-US");
}

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return PLAN_TIER[to] > PLAN_TIER[from];
}

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return PLAN_TIER[to] < PLAN_TIER[from];
}
