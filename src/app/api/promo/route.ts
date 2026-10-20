import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { PromoError, resolvePromotion } from "@/lib/promotions";
import { getProgram } from "@/lib/programs";

/**
 * Checks a promo code before the student pays.
 *
 *   POST /api/promo
 *   { code: "FREE300", programId: "web-development" }
 *
 * The checkout modal calls this when the student presses "Apply", so a code
 * that has ended (or was already used) is refused with a sentence instead of
 * a payment that silently grants nothing. The same check runs again inside
 * `quoteCheckout` when the checkout row is created — this endpoint is a
 * preview, never the authority.
 *
 * Signed in only: whether a code is still claimable depends on the student
 * ("you have already used this one"), so there is nothing useful to answer
 * for a visitor.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use a promo code." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  const programId = typeof body.programId === "string" ? body.programId.trim() : "";

  if (!programId || !getProgram(programId)) {
    return NextResponse.json(
      { error: "A promo code applies to a program purchase. Choose the program first." },
      { status: 400 }
    );
  }

  try {
    const quote = await resolvePromotion(code, user, programId);
    return NextResponse.json(
      {
        ok: true,
        code: quote.code,
        description: quote.description,
        endsAt: quote.endsAt,
        programId: quote.rewardProgramId,
        programName: quote.rewardProgramName,
        programPrice: quote.rewardProgramPrice,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] promo check failed", error);
    return NextResponse.json({ error: "That promo code could not be checked." }, { status: 500 });
  }
}
