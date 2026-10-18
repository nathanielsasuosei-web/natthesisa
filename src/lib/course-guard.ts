import { NextResponse } from "next/server";
import { accessMessage, courseAccess } from "./access";
import type { Course } from "./courses";
import { getCurrentUser } from "./session";

/**
 * The gate in front of every lesson file, video, poster and welcome video.
 *
 * Returns `null` when the signed-in student may open the course, otherwise the
 * response to send: 401 when nobody is signed in, 402 when the program is not
 * owned, 403 when the account is paused. Those routes serve the bytes (or a
 * redirect to the storage CDN), so the check has to happen here, not only in
 * the page that links to them.
 */
export async function refuseUnlessCourseOpen(course: Course): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to open this lesson.", code: "SIGN_IN_REQUIRED" }, { status: 401 });
  }
  const access = courseAccess(user, course);
  if (access.allowed) return null;
  return NextResponse.json(
    { error: accessMessage(access, course.shortTitle), code: "ACCESS_REQUIRED", reason: access.reason },
    { status: access.reason === "suspended" ? 403 : 402 }
  );
}
