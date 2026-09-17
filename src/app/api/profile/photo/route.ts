import { NextRequest, NextResponse } from "next/server";
import { clearPhoto, setPhoto } from "@/lib/accounts";
import { fail, handleError, readJson, requireAccount } from "@/lib/api";
import { PHOTO_MAX_BYTES, profileCompleteness, toProfileDto } from "@/lib/profile";

/**
 * PUT /api/profile/photo
 * Body: { dataUrl } — a `data:image/...;base64,` string the browser produced
 * after downsizing the picked file. Validated for type and size on the server.
 */
export async function PUT(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    if (typeof body.dataUrl !== "string")
      return fail("No photo received — pick an image file.", { code: "MISSING_PHOTO" });
    if (body.dataUrl.length > PHOTO_MAX_BYTES * 1.4)
      return fail("That photo is too large.", { code: "PHOTO_TOO_BIG", status: 413 });
    setPhoto(session.user, body.dataUrl);
    const user = session.user;
    return NextResponse.json({
      ok: true,
      photo: user.profile.photo,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness: profileCompleteness(user.profile),
    });
  } catch (err) {
    return handleError(err);
  }
}

/** DELETE /api/profile/photo — go back to the emoji avatar. */
export async function DELETE(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    clearPhoto(session.user, body.avatar);
    const user = session.user;
    return NextResponse.json({
      ok: true,
      photo: null,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness: profileCompleteness(user.profile),
    });
  } catch (err) {
    return handleError(err);
  }
}
