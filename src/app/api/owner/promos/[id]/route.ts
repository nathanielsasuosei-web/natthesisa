import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { PromoError, deletePromotion, updatePromotion } from "@/lib/promotions";

/**
 * One promo code.
 *
 *   PATCH  /api/owner/promos/<id>  — change the window, reward, cap or the
 *                                    on/off switch. The code itself is
 *                                    immutable: rename it by deleting and
 *                                    creating a new one.
 *   DELETE /api/owner/promos/<id>  — remove it from future checkouts. Claims
 *                                    already made keep their free program.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const { id } = await context.params;

  const body = await req.json().catch(() => ({}));
  if (body && typeof body === "object" && "code" in body) {
    return NextResponse.json(
      { error: "A code cannot be renamed — create a new code instead." },
      { status: 400 }
    );
  }

  try {
    const promotion = await updatePromotion(id, body);
    return NextResponse.json({ ok: true, promotion }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] updating a promo code failed", error);
    return NextResponse.json({ error: "The promo code could not be saved." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const { id } = await context.params;

  try {
    await deletePromotion(id);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] deleting a promo code failed", error);
    return NextResponse.json({ error: "The promo code could not be deleted." }, { status: 500 });
  }
}
