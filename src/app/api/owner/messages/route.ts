import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { allMessages, deleteMessage, setMessageAnswered } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner-only: the contact-form inbox. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const messages = await allMessages();
  return NextResponse.json({
    ok: true,
    open: messages.filter((message) => !message.answered).length,
    messages,
  });
}

/**
 * Owner-only: mark a message answered (or answered again), or delete it.
 * Body: `{ id, action: "answered" | "unanswered" | "delete" }`
 */
export async function POST(req: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  let body: { id?: unknown; action?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "That request could not be read." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!id) return NextResponse.json({ error: "Which message?" }, { status: 400 });

  if (action === "delete") {
    const removed = await deleteMessage(id);
    if (!removed) return NextResponse.json({ error: "That message no longer exists." }, { status: 404 });
    const messages = await allMessages();
    return NextResponse.json({ ok: true, deleted: id, messages });
  }

  if (action !== "answered" && action !== "unanswered") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const updated = await setMessageAnswered(id, action === "answered");
  if (!updated) return NextResponse.json({ error: "That message no longer exists." }, { status: 404 });
  const messages = await allMessages();
  return NextResponse.json({ ok: true, message: updated, messages });
}
