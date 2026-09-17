import { NextRequest, NextResponse } from "next/server";
import { changeEmail } from "@/lib/accounts";
import { handleError, readJson, requireAccount } from "@/lib/api";

/**
 * PUT /api/settings/email — body { email, password }.
 * Changing the sign-in email always costs a password confirmation.
 */
export async function PUT(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    changeEmail(session.user, body.email, typeof body.password === "string" ? body.password : "");
    return NextResponse.json({ ok: true, email: session.user.email });
  } catch (err) {
    return handleError(err);
  }
}
