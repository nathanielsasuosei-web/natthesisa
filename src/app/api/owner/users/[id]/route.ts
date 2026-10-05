import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import {
  OwnerConsoleError,
  ownerDeleteStudent,
  ownerGrantAccess,
  ownerGrantPass,
  ownerResetProgress,
  ownerSuspendStudent,
  toStudentRow,
} from "@/lib/owner-console";
import { isPassPeriod } from "@/lib/plans";

/**
 * The owner's actions on one student.
 *
 * Everything here is owner-only, and the owner's own account is refused by
 * the console module — there is no second administrator to hand work to any
 * more, so the owner cannot demote or delete themselves out of the console.
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === "suspend" && typeof body.suspended === "boolean") {
      return NextResponse.json({ ok: true, user: toStudentRow(await ownerSuspendStudent(owner, id, body.suspended)) });
    }
    if (body.action === "grantPass" && isPassPeriod(body.period)) {
      return NextResponse.json({ ok: true, user: toStudentRow(await ownerGrantPass(owner, id, body.period)) });
    }
    if (body.action === "grantAccess" && typeof body.courseId === "string") {
      const lessonId = typeof body.lessonId === "string" && body.lessonId ? body.lessonId : undefined;
      return NextResponse.json({
        ok: true,
        user: toStudentRow(await ownerGrantAccess(owner, id, body.courseId, lessonId)),
      });
    }
    if (body.action === "resetProgress") {
      return NextResponse.json({ ok: true, user: toStudentRow(await ownerResetProgress(owner, id)) });
    }
    return NextResponse.json({ error: "Unknown or incomplete owner action." }, { status: 400 });
  } catch (error) {
    if (error instanceof OwnerConsoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] owner action failed", error);
    return NextResponse.json({ error: "The action could not be completed." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const { id } = await context.params;
  try {
    await ownerDeleteStudent(owner, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OwnerConsoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] deleting a student failed", error);
    return NextResponse.json({ error: "The student could not be deleted." }, { status: 500 });
  }
}
