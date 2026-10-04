import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import type { LearnerProfile } from "@/lib/store";
import { logActivity, saveUser, setPassword, verifyPassword } from "@/lib/store";
import { passwordProblem } from "@/lib/passwords";

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
  await saveUser(user);
  return NextResponse.json({ ok: true });
}

/**
 * Password change for a real account: the current password is required, the
 * new one must pass the same strength checks as sign-up, and the change is
 * written to the database before we answer.
 */
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!verifyPassword(user, currentPassword)) {
    return NextResponse.json({ error: "Your current password is not correct." }, { status: 403 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Choose a password you have not used here before." }, { status: 400 });
  }
  const problem = passwordProblem(newPassword);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  setPassword(user, newPassword);
  logActivity(user, "Password changed", "account");
  await saveUser(user);
  return NextResponse.json({ ok: true });
}
