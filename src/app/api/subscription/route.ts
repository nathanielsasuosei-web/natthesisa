import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  SubscriptionError,
  cancelSubscription,
  changePlan,
  clearPendingChange,
  resumeSubscription,
} from "@/lib/subscription";
import { BillingCycle, PlanId, getPlan } from "@/lib/plans";

const PLAN_IDS: PlanId[] = ["free", "pro", "business"];
const CYCLES: BillingCycle[] = ["monthly", "yearly"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  try {
    switch (body.action) {
      case "changePlan": {
        const planId = body.planId as PlanId;
        const cycle = body.cycle as BillingCycle | undefined;
        if (!PLAN_IDS.includes(planId)) {
          return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
        }
        if (cycle !== undefined && !CYCLES.includes(cycle)) {
          return NextResponse.json({ error: "Unknown billing cycle." }, { status: 400 });
        }
        const result = changePlan(user, planId, cycle);
        return NextResponse.json({
          ok: true,
          mode: result.mode,
          charged: result.charged ?? 0,
          effectiveAt: result.effectiveAt ?? null,
          planName: getPlan(user.subscription.planId).name,
        });
      }
      case "cancel": {
        cancelSubscription(user);
        return NextResponse.json({ ok: true });
      }
      case "resume": {
        resumeSubscription(user);
        return NextResponse.json({ ok: true });
      }
      case "clearPending": {
        clearPendingChange(user);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof SubscriptionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error("subscription error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
