import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/accounts";
import { fail, handleError, readJson, requireAccount } from "@/lib/api";
import { applySessionCookie } from "@/lib/session";

/**
 * DELETE /api/settings/account — body { password, confirm }.
 * `confirm` must equal the member's email, and the password is verified.
 * The account (matches, invoices, activity) is removed and the cookie cleared.
 */
export async function DELETE(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    if (typeof body.confirm !== "string" || body.confirm.trim().toLowerCase() !== session.user.email) {
      return fail("Type your email address to confirm.", {
        code: "CONFIRM_MISMATCH",
        fields: { confirm: "Must match your sign-in email." },
      });
    }
    if (session.user.role === "admin") {
      return fail("Admin accounts can't be self-deleted — demote yourself first.", {
        code: "ADMIN_ACCOUNT",
        status: 403,
      });
    }
    deleteAccount(session.user, typeof body.password === "string" ? body.password : "");
    return applySessionCookie(NextResponse.json({ ok: true }), null);
  } catch (err) {
    return handleError(err);
  }
}
