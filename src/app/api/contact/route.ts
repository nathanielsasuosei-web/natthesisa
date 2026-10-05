import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ensureReady } from "@/lib/bootstrap";
import { getCurrentUser } from "@/lib/session";
import { messageProblem, saveMessage } from "@/lib/messages";

/**
 * The public contact form.
 *
 * A message is stored on this platform (see `lib/messages.ts`) rather than
 * posted to a third-party form service, and the reply goes out by email. The
 * endpoint is deliberately quiet about internal failure: the visitor is told
 * to email us instead, and the details stay in the server log.
 */

interface Body {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  subject?: unknown;
  message?: unknown;
  /** Honeypot. Real people never fill a field called "company". */
  company?: unknown;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const g = globalThis as unknown as { __codaraContactAttempts?: Map<string, { count: number; resetAt: number }> };

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 6;

function attempts(): Map<string, { count: number; resetAt: number }> {
  return (g.__codaraContactAttempts ??= new Map());
}

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return ip.slice(0, 64);
}

function throttled(key: string): { limited: boolean; retryAfter: number } {
  const record = attempts().get(key);
  if (!record || Date.now() > record.resetAt) return { limited: false, retryAfter: 0 };
  if (record.count >= LIMIT) return { limited: true, retryAfter: Math.ceil((record.resetAt - Date.now()) / 1000) };
  return { limited: false, retryAfter: 0 };
}

function noteAttempt(key: string): void {
  const record = attempts().get(key);
  if (!record || Date.now() > record.resetAt) {
    attempts().set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return;
  }
  record.count += 1;
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[contact] failed to store message", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not save your message just now. Please email hello@codemasterghana.com instead — it comes to the same place.",
      },
      { status: 503 }
    );
  }
}

async function handle(req: NextRequest) {
  await ensureReady();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "That request could not be read." }, { status: 400 });
  }

  // A bot filled the hidden field. Pretend it worked: telling it otherwise
  // only teaches the bot what to avoid next time.
  if (text(body.company).trim()) return NextResponse.json({ ok: true, id: "MSG-RECEIVED" });

  const key = clientKey(req);
  const limit = throttled(key);
  if (limit.limited) {
    return NextResponse.json(
      { ok: false, error: `That is a lot of messages at once. Please try again in ${Math.ceil(limit.retryAfter / 60)} minutes, or email us directly.` },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  const input = {
    name: text(body.name).trim(),
    email: text(body.email).trim(),
    topic: text(body.topic),
    subject: text(body.subject),
    body: text(body.message),
  };

  const problem = messageProblem(input);
  if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });

  const user = await getCurrentUser().catch(() => null);

  const record = await saveMessage({
    ...input,
    subject: input.subject || `Message from ${input.name}`,
    ...(user ? { userId: user.id } : {}),
  });

  noteAttempt(key);
  return NextResponse.json({ ok: true, id: record.id });
}
