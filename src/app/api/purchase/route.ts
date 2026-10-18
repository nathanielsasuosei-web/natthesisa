import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { PurchaseError, buyProgram } from "@/lib/purchases";
import { saveUser } from "@/lib/store";
import { ownsProgram } from "@/lib/access";
import { notifyProgramPurchased } from "@/lib/email";
import { getProgram } from "@/lib/programs";
import { programPrice } from "@/lib/plans";

/**
 * Joins a program.
 *
 * A program priced at GH₵0 needs no money and is granted here directly.
 * Anything with a price must go through checkout (Mobile Money / card
 * verified by the provider) — a bare POST here would grant it for free.
 * Joining is what opens every course and lesson under the program.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to join this." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const programId = typeof body.programId === "string" ? body.programId : "";
  const program = programId ? getProgram(programId) : null;
  if (!program) {
    return NextResponse.json({ error: "Say which program you are joining." }, { status: 400 });
  }
  if (ownsProgram(user, programId)) {
    return NextResponse.json({ error: "You already own this program.", code: "ALREADY_OWNED" }, { status: 409 });
  }

  // A priced program must go through checkout so the provider verifies the
  // money — or the demo checkout while no provider is configured. A bare
  // POST here would grant it for free.
  const price = programPrice(programId);
  if (price > 0) {
    return NextResponse.json(
      {
        error: "Pay for this program with Mobile Money or a card at checkout.",
        code: "CHECKOUT_REQUIRED",
        checkout: { kind: "program", programId },
      },
      { status: 402 }
    );
  }

  try {
    const purchase = await buyProgram(user, programId);
    await saveUser(user);

    // Best-effort receipt email — never allowed to break the purchase.
    await notifyProgramPurchased({
      to: user.email,
      toName: user.name,
      program: program.name,
      amount: purchase.amount,
      invoiceNumber: purchase.invoiceNumber,
    });

    return NextResponse.json({ ok: true, purchase, programId });
  } catch (error) {
    if (error instanceof PurchaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] purchase failed", error);
    return NextResponse.json({ error: "The program could not be joined." }, { status: 500 });
  }
}
