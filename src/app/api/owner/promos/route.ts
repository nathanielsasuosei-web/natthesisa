import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { PromoError, createPromotion, listPromotions } from "@/lib/promotions";

/**
 * The teacher's promo codes.
 *
 *   GET  /api/owner/promos   — every code, with claim counts
 *   POST /api/owner/promos   — create one:
 *        { code, rewardProgramId, description, startsAt, endsAt,
 *          maxRedemptions, active }
 *
 * `startsAt` and `endsAt` are ISO timestamps and are the teacher's decision:
 * outside that window the code is refused at checkout with a sentence that
 * names the date. The console shows the window, so nothing here hides it.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const promotions = await listPromotions();
  return NextResponse.json({ ok: true, promotions }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  try {
    const promotion = await createPromotion(body);
    return NextResponse.json({ ok: true, promotion }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] creating a promo code failed", error);
    return NextResponse.json({ error: "The promo code could not be saved." }, { status: 500 });
  }
}
