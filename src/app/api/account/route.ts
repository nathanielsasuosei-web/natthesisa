import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import type { LearnerProfile } from "@/lib/store";
import { logActivity } from "@/lib/store";

const TRACKS: LearnerProfile["track"][] = [
  "Web developer",
  "App developer",
  "Computer science",
  "Full-stack developer",
];
const LEVELS: LearnerProfile["experience"][] = [
  "Just starting",
  "Some experience",
  "Building professionally",
];

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const headline = typeof body.headline === "string" ? body.headline.trim().slice(0, 120) : "";
  const weeklyGoal = Number(body.weeklyGoal);

  if (name.length < 2) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
  if (!TRACKS.includes(body.track)) return NextResponse.json({ error: "Choose a valid learning track." }, { status: 400 });
  if (!LEVELS.includes(body.experience)) return NextResponse.json({ error: "Choose a valid experience level." }, { status: 400 });
  if (!Number.isFinite(weeklyGoal) || weeklyGoal < 30 || weeklyGoal > 1_200) {
    return NextResponse.json({ error: "Weekly goal must be between 30 and 1,200 minutes." }, { status: 400 });
  }

  user.name = name;
  user.profile = {
    headline: headline || "Learning one project at a time.",
    track: body.track,
    experience: body.experience,
    weeklyGoal: Math.round(weeklyGoal),
  };
  logActivity(user, "Updated account and learning preferences", "account");
  return NextResponse.json({ ok: true });
}
