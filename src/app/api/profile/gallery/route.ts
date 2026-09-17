import { NextRequest, NextResponse } from "next/server";
import { setGallery } from "@/lib/accounts";
import { fail, handleError, readJson, requireAccount } from "@/lib/api";
import { PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, profileCompleteness, toProfileDto } from "@/lib/profile";

/**
 * PUT /api/profile/gallery — body { photos: string[] } (up to 6 data URLs).
 *
 * The gallery is replaced wholesale, so reordering and deleting are one call;
 * the first entry becomes the primary photo. Every entry is re-validated
 * (type + size) here — the browser-side resize is a courtesy, not the rule.
 * Oversized uploads get 413 PHOTO_TOO_BIG, the same code the single-photo
 * endpoint uses, so neither path can be used to smuggle a huge body in.
 */
export async function PUT(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    const photos = body.photos;
    if (Array.isArray(photos)) {
      for (const entry of photos) {
        if (typeof entry === "string" && entry.length > PHOTO_MAX_BYTES * 1.4) {
          return fail("One of those photos is too large — pick a smaller shot.", {
            code: "PHOTO_TOO_BIG",
            status: 413,
            fields: { photo: "Max 1.5 MB after resizing." },
          });
        }
      }
    }
    setGallery(session.user, photos);
    const user = session.user;
    return NextResponse.json({
      ok: true,
      photos: user.profile.photos,
      photo: user.profile.photo,
      max: PHOTO_MAX_COUNT,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness: profileCompleteness(user.profile),
    });
  } catch (err) {
    return handleError(err);
  }
}
