import { NextResponse } from "next/server";
import { handleError, requireAccount } from "@/lib/api";
import { myData } from "@/lib/accounts";

/**
 * GET /api/settings/data — download everything we hold about this member as
 * JSON (profile, settings, matches, invoices, activity). Password hashes and
 * sign-in lockout state are stripped by lib/accounts.
 */
export async function GET() {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const payload = myData(session.user);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="sparks-${session.user.name
          .toLowerCase()
          .replace(/\W+/g, "-")}-data.json"`,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
