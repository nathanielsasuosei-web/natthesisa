import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";

/** CSV export — Pro/Business entitlement, enforced server-side. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const plan = getPlan(user.subscription.planId);
  if (!plan.entitlements.export) {
    return NextResponse.json(
      { error: "CSV export requires the Pro plan or higher.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const rows: string[] = ["board,task,done,created_at"];
  for (const board of user.boards) {
    for (const task of board.tasks) {
      rows.push(
        [board.name, task.title, task.done ? "yes" : "no", task.createdAt]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      );
    }
    if (board.tasks.length === 0) rows.push(`"${board.name}","",no,""`);
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="natthesisa-boards.csv"',
    },
  });
}
