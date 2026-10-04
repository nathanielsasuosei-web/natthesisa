import { NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { deleteUploadedLesson } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner-only: remove a published lesson and its uploaded materials. */
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const { id } = await context.params;

  const removed = deleteUploadedLesson(id);
  if (!removed) return NextResponse.json({ error: "That lesson no longer exists." }, { status: 404 });
  return NextResponse.json({ ok: true, id: removed.id, title: removed.title });
}
