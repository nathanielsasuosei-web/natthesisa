import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import {
  AdminError,
  adminDeleteUser,
  adminResetLikes,
  adminSetPlan,
  adminSetRole,
  adminSuspendUser,
  toAdminRow,
} from "@/lib/admin";
import { PlanId } from "@/lib/plans";

const PLAN_IDS: PlanId[] = ["free", "premium", "elite"];

/** Admin-only member management: suspend, promote, comp plans, reset likes. */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required.", code: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  try {
    switch (body.action) {
      case "suspend": {
        if (typeof body.suspended !== "boolean") {
          return NextResponse.json({ error: "`suspended` must be a boolean." }, { status: 400 });
        }
        const user = adminSuspendUser(admin, id, body.suspended);
        return NextResponse.json({ ok: true, user: toAdminRow(user) });
      }
      case "setRole": {
        if (body.role !== "member" && body.role !== "admin") {
          return NextResponse.json({ error: "Unknown role." }, { status: 400 });
        }
        const user = adminSetRole(admin, id, body.role);
        return NextResponse.json({ ok: true, user: toAdminRow(user) });
      }
      case "setPlan": {
        if (!PLAN_IDS.includes(body.planId)) {
          return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
        }
        const user = adminSetPlan(admin, id, body.planId);
        return NextResponse.json({ ok: true, user: toAdminRow(user) });
      }
      case "resetLikes": {
        const user = adminResetLikes(admin, id);
        return NextResponse.json({ ok: true, user: toAdminRow(user) });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    console.error("admin error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required.", code: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    adminDeleteUser(admin, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    console.error("admin error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
