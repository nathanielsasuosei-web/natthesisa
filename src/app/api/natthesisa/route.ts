import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { answer, greeting, type AgentReply, type ChatContext, type ChatMessage, type QuizState } from "@/lib/natthesisa";
import { getCurrentUser } from "@/lib/session";

/**
 * Natthesisa — the student AI assistant.
 *
 * POST /api/natthesisa
 *   { messages: ChatMessage[], context?: ChatContext, quiz?: QuizState | null }
 * → { ok: true, ...AgentReply, engine: "local" | "cloud", userName?: string }
 *
 * Two engines:
 *  - Local (always available): the offline brain in `lib/natthesisa.ts`.
 *  - Cloud (optional): when NATTHESISA_API_KEY is set, an OpenAI-compatible
 *    chat model answers with full site context, and the local brain enriches
 *    the reply with suggestion chips and links. Any cloud failure falls back
 *    to local silently — Natthesisa always responds.
 */

interface Body {
  messages?: unknown;
  context?: unknown;
  quiz?: unknown;
}

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 40;

const g = globalThis as unknown as { __natthesisaAttempts?: Map<string, { count: number; resetAt: number }> };

function attempts(): Map<string, { count: number; resetAt: number }> {
  return (g.__natthesisaAttempts ??= new Map());
}

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `natthesisa:${ip.slice(0, 64)}`;
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

function cleanMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is ChatMessage =>
        typeof entry === "object" &&
        entry !== null &&
        ((entry as ChatMessage).role === "user" || (entry as ChatMessage).role === "assistant") &&
        typeof (entry as ChatMessage).content === "string"
    )
    .map((entry) => ({ role: entry.role, content: entry.content.slice(0, 2000) }))
    .slice(-20);
}

function cleanContext(value: unknown): ChatContext {
  if (typeof value !== "object" || value === null) return {};
  const source = value as Record<string, unknown>;
  const pick = (key: string): string | undefined =>
    typeof source[key] === "string" && (source[key] as string).trim()
      ? (source[key] as string).slice(0, 200).trim()
      : undefined;
  return {
    courseId: pick("courseId"),
    courseTitle: pick("courseTitle"),
    lessonId: pick("lessonId"),
    lessonTitle: pick("lessonTitle"),
    url: pick("url"),
  };
}

function cleanQuiz(value: unknown): QuizState | null {
  if (typeof value !== "object" || value === null) return null;
  const source = value as Record<string, unknown>;
  if (typeof source.id !== "string" || typeof source.answer !== "string") return null;
  return { id: source.id.slice(0, 40), answer: source.answer.slice(0, 4) };
}

const SYSTEM_PROMPT = `You are Natthesisa, the friendly AI study companion on codemasterghana ("Learn. Build. Become."), a learning platform with practical web, app and computer science courses in Ghana.

Programs & courses:
- Web Development: Web Foundations (beginner, HTML/CSS), JavaScript Zero to Builder (beginner), React Production Apps (intermediate)
- Computer Science: CS Essentials (beginner), Data Structures & Algorithms, Databases & SQL
- Software Engineering: Practices (Git/testing), System Design, DevOps & Delivery
- Vibe Coding: Ship with AI (beginner), AI Apps Agents & APIs
- App Development: Mobile Apps with React Native. Backend: Node.js APIs.
One payment per program opens every course and lesson inside it permanently. Pay with MTN MoMo, Telecel, AT or card. Certificates carry QR verification at /verify. Dashboard at /dashboard, courses at /courses, pricing at /pricing, sign-in at /login.

Style: warm, encouraging, plain language, short paragraphs, small code examples with markdown fences when they help. Never invent course names, prices, or features. If asked about something outside learning or the platform, briefly redirect to how you can help with studying. Keep answers under ~220 words unless explaining code.`;

async function cloudReply(messages: ChatMessage[], context: ChatContext): Promise<string | null> {
  const apiKey = process.env.NATTHESISA_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (process.env.NATTHESISA_API_URL?.trim() || "https://api.openai.com/v1/chat/completions").replace(/\/+$/, "");
  const model = process.env.NATTHESISA_MODEL?.trim() || "gpt-4o-mini";

  const where = [
    context.courseTitle ? `studying course "${context.courseTitle}"` : "",
    context.lessonTitle ? `lesson "${context.lessonTitle}"` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 900,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + (where ? `\nThe student is currently ${where}.` : "") },
          ...messages.slice(-12),
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[natthesisa] cloud engine ${response.status}: ${detail.slice(0, 300)}`);
      return null;
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) return null;
    return content.trim().slice(0, 4000);
  } catch (error) {
    console.error("[natthesisa] cloud engine failed, using local brain", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[natthesisa] failed", error);
    return NextResponse.json(
      { ok: false, error: "Natthesisa hiccupped. Please try again in a moment." },
      { status: 503 }
    );
  }
}

async function handle(req: NextRequest) {
  const key = clientKey(req);
  const limit = throttled(key);
  if (limit.limited) {
    return NextResponse.json(
      {
        ok: true,
        engine: "local",
        reply: `You're asking great questions fast! Give me about ${Math.max(1, Math.ceil(limit.retryAfter / 60))} minute(s) to catch my breath, then fire away. 💜`,
        suggestions: ["What should I learn first?", "Give me study tips"],
        links: [],
        quiz: null,
      } satisfies { ok: true; engine: string } & AgentReply,
      { status: 200, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "That request could not be read." }, { status: 400 });
  }

  const messages = cleanMessages(body.messages);
  const context = cleanContext(body.context);
  const pendingQuiz = cleanQuiz(body.quiz);
  const lastUser = [...messages].reverse().find((message) => message.role === "user");

  const user = await getCurrentUser().catch(() => null);
  const userName = user?.name?.trim() || undefined;
  const fullContext: ChatContext = { ...context, ...(userName ? { userName } : {}) };

  // Empty chat → greeting (the widget also greets locally, this keeps the page in sync).
  if (!lastUser) {
    noteAttempt(key);
    return NextResponse.json({ ok: true, engine: "local", userName, ...greeting(fullContext) });
  }

  // Local brain always runs: it is the fallback AND the source of chips/links.
  const local: AgentReply = answer(lastUser.content, messages.slice(0, -1), fullContext, pendingQuiz);

  // Cloud upgrade when configured.
  const cloud = await cloudReply(messages, fullContext);
  noteAttempt(key);
  if (cloud) {
    return NextResponse.json({
      ok: true,
      engine: "cloud",
      reply: cloud,
      suggestions: local.suggestions,
      links: local.links,
      quiz: local.quiz ?? null,
      ...(userName ? { userName } : {}),
    });
  }
  return NextResponse.json({ ok: true, engine: "local", ...(userName ? { userName } : {}), ...local });
}
