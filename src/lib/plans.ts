export type PlanId = "free" | "premium" | "elite";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  limits: {
    courses: number | null;
  };
  entitlements: {
    allCourses: boolean;
    certificates: boolean;
    downloads: boolean;
    advancedInsights: boolean;
    mentorship: boolean;
    activityLog: boolean;
  };
  features: string[];
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Build your first real skills",
    monthly: 0,
    yearly: 0,
    limits: { courses: 2 },
    entitlements: {
      allCourses: false,
      certificates: false,
      downloads: false,
      advancedInsights: false,
      mentorship: false,
      activityLog: false,
    },
    features: [
      "2 complete starter courses",
      "Preview lessons in every course",
      "Projects and coding exercises",
      "Basic progress tracking",
      "Community access",
    ],
  },
  {
    id: "premium",
    name: "Pro",
    tagline: "Everything you need to become job-ready",
    monthly: 149,
    yearly: 1_490,
    limits: { courses: null },
    entitlements: {
      allCourses: true,
      certificates: true,
      downloads: true,
      advancedInsights: true,
      mentorship: false,
      activityLog: true,
    },
    featured: true,
    features: [
      "Unlimited access to every course",
      "Portfolio-ready guided projects",
      "Completion certificates",
      "Downloadable learning resources",
      "Advanced progress insights",
      "Priority community support",
    ],
  },
  {
    id: "elite",
    name: "Mentor",
    tagline: "Personal guidance, faster growth",
    monthly: 349,
    yearly: 3_490,
    limits: { courses: null },
    entitlements: {
      allCourses: true,
      certificates: true,
      downloads: true,
      advancedInsights: true,
      mentorship: true,
      activityLog: true,
    },
    features: [
      "Everything in Pro",
      "Two 1:1 mentor sessions each month",
      "Personal learning roadmap",
      "Portfolio and code reviews",
      "Career preparation sessions",
      "Private learner community",
    ],
  },
];

export const PLAN_TIER: Record<PlanId, number> = { free: 0, premium: 1, elite: 2 };

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((item) => item.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function priceFor(id: PlanId, cycle: BillingCycle): number {
  const plan = getPlan(id);
  return cycle === "yearly" ? plan.yearly : plan.monthly;
}

export function cycleDays(cycle: BillingCycle): number {
  return cycle === "yearly" ? 365 : 30;
}

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return PLAN_TIER[to] > PLAN_TIER[from];
}

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return PLAN_TIER[to] < PLAN_TIER[from];
}

export { fmtMoney as formatMoney } from "./format";
