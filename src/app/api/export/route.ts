import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";

/** CSV export of matches & dates — Premium/Elite entitlement, enforced server-side. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const plan = getPlan(user.subscription.planId);
  if (!plan.entitlements.export) {
    return NextResponse.json(
      { error: "Exporting your match history requires Premium or higher.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const rows: string[] = ["match,age,compatibility,date_idea,been_on_it,created_at"];
  for (const match of user.matches) {
    for (const idea of match.dateIdeas) {
      rows.push(
        [match.name, match.age, `${match.compatibility}%`, idea.title, idea.done ? "yes" : "no", idea.createdAt]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      );
    }
    if (match.dateIdeas.length === 0)
      rows.push(`"${match.name}",${match.age},"${match.compatibility}%","",no,""`);
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sparks-matches.csv"',
    },
  });
}
