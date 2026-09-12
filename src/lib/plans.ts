export type PlanId = "free" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** price per month, USD */
  monthly: number;
  /** price per year, USD (≈ 2 months free) */
  yearly: number;
  limits: {
    /** max boards, null = unlimited */
    boards: number | null;
    /** max tracked actions per billing period, null = unlimited */
    actionsPerPeriod: number | null;
  };
  entitlements: {
    analytics: boolean;
    export: boolean;
    auditLog: boolean;
  };
  features: string[];
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Kick the tires",
    monthly: 0,
    yearly: 0,
    limits: { boards: 3, actionsPerPeriod: 25 },
    entitlements: { analytics: false, export: false, auditLog: false },
    features: [
      "3 boards",
      "25 actions per billing period",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For serious builders",
    monthly: 99,
    yearly: 990,
    featured: true,
    limits: { boards: 25, actionsPerPeriod: 2000 },
    entitlements: { analytics: true, export: true, auditLog: false },
    features: [
      "25 boards",
      "2,000 actions per billing period",
      "Insights & analytics",
      "CSV export",
      "Priority email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "Teams at scale",
    monthly: 399,
    yearly: 3990,
    limits: { boards: null, actionsPerPeriod: null },
    entitlements: { analytics: true, export: true, auditLog: true },
    features: [
      "Unlimited boards",
      "Unlimited actions",
      "Everything in Pro",
      "Full audit log",
      "SSO / SAML (demo)",
      "Dedicated support",
    ],
  },
];

export const PLAN_TIER: Record<PlanId, number> = { free: 0, pro: 1, business: 2 };

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
