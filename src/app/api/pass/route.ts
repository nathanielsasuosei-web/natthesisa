import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { PurchaseError, buyPass } from "@/lib/purchases";
import { saveUser } from "@/lib/store";
import { PASS_PERIODS, isPassPeriod, passPrice } from "@/lib/plans";

/**
 * Buys an access pass — a day, a week or a month.
 *
 * This is the door to the platform: without an active pass a student can read
 * the catalog and watch free previews, but no lesson of their own opens. There
 * is no renewal to manage; a pass simply ends, and buying another one extends
 * whatever time is left.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to buy an access pass." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const period = body.period;
  if (!isPassPeriod(period)) {
    return NextResponse.json(
      { error: `Choose a pass: ${PASS_PERIODS.join(", ")}.` },
      { status: 400 }
    );
  }

  try {
    const receipt = await buyPass(user, period);
    await saveUser(user);
    return NextResponse.json({ ok: true, pass: user.subscription, receipt });
  } catch (error) {
    if (error instanceof PurchaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] buying a pass failed", error);
    return NextResponse.json({ error: "The payment could not be completed." }, { status: 500 });
  }
}

/** What each pass costs right now, for the checkout UI. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    periods: PASS_PERIODS.map((period) => ({ period, price: passPrice(period) })),
  });
}
