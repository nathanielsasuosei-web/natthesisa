import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import {
  AdminError,
  adminDeleteUser,
  adminResetProgress,
  adminSetPlan,
  adminSetRole,
  adminSuspendUser,
  toAdminRow,
} from "@/lib/admin";
import type { PlanId } from "@/lib/plans";

const PLAN_IDS: PlanId[] = ["free", "premium", "elite"];

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === "suspend" && typeof body.suspended === "boolean") {
      return NextResponse.json({ ok: true, user: toAdminRow(adminSuspendUser(admin, id, body.suspended)) });
    }
    if (body.action === "setRole" && (body.role === "member" || body.role === "admin")) {
      return NextResponse.json({ ok: true, user: toAdminRow(adminSetRole(admin, id, body.role)) });
    }
    if (body.action === "setPlan" && PLAN_IDS.includes(body.planId)) {
      return NextResponse.json({ ok: true, user: toAdminRow(adminSetPlan(admin, id, body.planId)) });
    }
    if (body.action === "resetProgress") {
      return NextResponse.json({ ok: true, user: toAdminRow(adminResetProgress(admin, id)) });
    }
    return NextResponse.json({ error: "Unknown or incomplete admin action." }, { status: 400 });
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("admin action failed", error);
    return NextResponse.json({ error: "The admin action could not be completed." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { id } = await context.params;
  try {
    adminDeleteUser(admin, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "The learner could not be deleted." }, { status: 500 });
  }
}
