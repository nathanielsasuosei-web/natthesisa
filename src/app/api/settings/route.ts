import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from "@/lib/accounts";
import { handleError, readJson, requireAccount } from "@/lib/api";
import {
  defaultSettings,
  ensureSettingsShape,
  profileCompleteness,
  toProfileDto,
} from "@/lib/profile";

/** GET /api/settings — the member's own notification + privacy flags. */
export async function GET() {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  return NextResponse.json({
    settings: ensureSettingsShape(session.user.settings ?? defaultSettings()),
  });
}

/**
 * PATCH /api/settings
 * Body: { notifications?: {...}, privacy?: { showAge, showLocation, discoverable } }
 * Only booleans on the known keys are applied — everything else is ignored.
 */
export async function PATCH(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    const settings = updateSettings(session.user, {
      notifications: body.notifications as never,
      privacy: body.privacy as never,
    });
    const user = session.user;
    return NextResponse.json({
      ok: true,
      settings,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness: profileCompleteness(user.profile),
    });
  } catch (err) {
    return handleError(err);
  }
}
