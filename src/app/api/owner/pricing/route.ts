import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { PricingError, pricing, saveContentPrice, savePricing } from "@/lib/plans";
import { coursePriceRows, lessonPriceRows } from "@/lib/owner-console";

export const dynamic = "force-dynamic";

/**
 * The owner sets the prices.
 *
 * Two kinds of change arrive here:
 *   • the three pass prices (and the default course/lesson price a new upload
 *     starts from), and
 *   • the price of one named course or lesson.
 *
 * Nothing in the app hardcodes a price, so a change here is live on the next
 * page render.
 */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  return NextResponse.json({
    ok: true,
    pricing: pricing(),
    courses: coursePriceRows(),
    lessons: lessonPriceRows(),
  });
}

export async function PATCH(req: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));

  try {
    // A single course or lesson price.
    if (body.scope === "content") {
      const kind = body.kind === "course" || body.kind === "lesson" ? body.kind : null;
      const refId = typeof body.refId === "string" ? body.refId : "";
      if (!kind || !refId) {
        return NextResponse.json({ error: "Name the course or lesson to reprice." }, { status: 400 });
      }
      const price = await saveContentPrice(kind, refId, body.price);
      return NextResponse.json({ ok: true, kind, refId, price });
    }

    // The pass prices / defaults.
    const next = await savePricing(body.pricing ?? body);
    return NextResponse.json({ ok: true, pricing: next });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message, code: "BAD_PRICE" }, { status: 400 });
    }
    console.error("[codemasterghana] saving prices failed", error);
    return NextResponse.json({ error: "The prices could not be saved." }, { status: 500 });
  }
}
