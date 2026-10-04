import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/bootstrap";
import { passwordProblem } from "@/lib/passwords";
import { createOwnerAccount, ownerAccount } from "@/lib/store";
import { recordSignIn, sessionCookie } from "@/lib/session";

/**
 * First-run owner setup.
 *
 * The owner account normally comes from OWNER_EMAIL / OWNER_PASSWORD on the
 * first request against an empty database. When those are not configured — a
 * preview sandbox that lost its environment file, or a fresh self-hosted
 * install — the admin sign-in page offers this instead, so "there is no admin
 * account yet" is never a dead end.
 *
 * It refuses to do anything once an owner exists, and it is disabled entirely
 * when OWNER_EMAIL / OWNER_PASSWORD are set, so a deployment that manages its
 * owner through the environment cannot be claimed through this route.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function configuredByEnvironment(): boolean {
  return Boolean(process.env.OWNER_EMAIL?.trim() && process.env.OWNER_PASSWORD);
}

export async function GET() {
  await ensureReady();
  const owner = await ownerAccount();
  const available = !configuredByEnvironment() && !owner;
  return NextResponse.json({
    available,
    reason: configuredByEnvironment() ? "configured" : owner ? "exists" : "available",
  });
}

export async function POST(req: NextRequest) {
  await ensureReady();

  if (configuredByEnvironment()) {
    return NextResponse.json(
      { error: "Owner credentials are configured in the environment. Sign in with those." },
      { status: 403 }
    );
  }
  if (await ownerAccount()) {
    return NextResponse.json({ error: "An owner account already exists. Sign in instead." }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!emailPattern.test(email) || email.length > 160) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  let owner;
  try {
    owner = await createOwnerAccount(email, password);
  } catch (error) {
    // The single-owner index rejects a second owner created by a race.
    console.error("owner setup failed", error);
    return NextResponse.json(
      { error: "The owner account could not be created. Check the database connection and try again." },
      { status: 500 }
    );
  }

  await recordSignIn(owner);
  const cookie = await sessionCookie(owner.id);
  const response = NextResponse.json({ ok: true, message: "Owner account created", role: owner.role }, { status: 201 });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
