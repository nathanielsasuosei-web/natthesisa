import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, recordSignIn } from "@/lib/session";
import { AUTH_UNAVAILABLE_CODE, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/auth-errors";
import {
  AccountExistsError,
  createUser,
  findUserByEmail,
  logActivity,
  passwordNeedsRehash,
  saveUser,
  setPassword,
  verifyPassword,
} from "@/lib/store";
import { passwordProblem } from "@/lib/passwords";
import { ensureReady } from "@/lib/bootstrap";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-in attempts are throttled per email + address so a real account cannot
 * be brute-forced through the form. The counter lives in memory, which is
 * enough for a single instance; move it to Redis if you run many.
 */
const g = globalThis as unknown as { __codaraAttempts?: Map<string, { count: number; resetAt: number }> };

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const ATTEMPT_LIMIT = 8;

function attempts(): Map<string, { count: number; resetAt: number }> {
  if (!g.__codaraAttempts) g.__codaraAttempts = new Map();
  return g.__codaraAttempts;
}

function tooManyAttempts(key: string): boolean {
  const record = attempts().get(key);
  if (!record) return false;
  if (Date.now() > record.resetAt) {
    attempts().delete(key);
    return false;
  }
  return record.count >= ATTEMPT_LIMIT;
}

function noteFailedAttempt(key: string): void {
  const record = attempts().get(key);
  if (!record || Date.now() > record.resetAt) {
    attempts().set(key, { count: 1, resetAt: Date.now() + ATTEMPT_WINDOW_MS });
    return;
  }
  record.count += 1;
}

export async function POST(req: NextRequest) {
  try {
    return await handleLogin(req);
  } catch (error) {
    // Database/bootstrap errors used to escape as Next.js HTML 500 pages. The
    // sign-in form could not parse those responses and showed only its generic
    // "Teacher sign-in failed" fallback. Keep the details in server
    // logs, but return a predictable message the UI can explain safely.
    console.error("authentication request failed", error);
    return NextResponse.json(
      { error: AUTH_UNAVAILABLE_MESSAGE, code: AUTH_UNAVAILABLE_CODE },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

async function handleLogin(req: NextRequest) {
  await ensureReady();
  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "signup" ? "signup" : "signin";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!emailPattern.test(email) || email.length > 160) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const attemptsKey = `${email}|${req.headers.get("x-forwarded-for") ?? "local"}`;
  if (tooManyAttempts(attemptsKey)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  if (mode === "signup") {
    if (name.length < 2) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    const problem = passwordProblem(password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    let user;
    try {
      user = await createUser(name, email, password);
    } catch (error) {
      if (error instanceof AccountExistsError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      console.error("sign-up failed", error);
      return NextResponse.json(
        { error: "Your account could not be created. Check the database connection and try again." },
        { status: 500 }
      );
    }

    await recordSignIn(user);
    return await signInResponse(user, 201, "Account created");
  }

  if (password.length > 200) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    // Sign-up already reports when an email is taken, so naming this case here
    // reveals nothing new — and it turns a dead end into a next step, which is
    // what a learner who typed an email from an older database needs.
    noteFailedAttempt(attemptsKey);
    return NextResponse.json(
      { error: "No account exists for that email yet.", code: "NO_ACCOUNT" },
      { status: 401 }
    );
  }
  if (!verifyPassword(user, password)) {
    noteFailedAttempt(attemptsKey);
    return NextResponse.json(
      { error: "That password does not match this account.", code: "BAD_PASSWORD" },
      { status: 401 }
    );
  }

  attempts().delete(attemptsKey);

  // Transparently upgrade a password hash that used older settings.
  if (passwordNeedsRehash(user, password)) {
    setPassword(user, password);
    logActivity(user, "Password hash upgraded to the current standard", "account");
    await saveUser(user);
  }

  await recordSignIn(user);
  return await signInResponse(user, 200, "Signed in");
}

async function signInResponse(user: { id: string; role: string }, status: number, message: string) {
  const cookie = await sessionCookie(user.id);
  const response = NextResponse.json({ ok: true, message, role: user.role }, { status });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
