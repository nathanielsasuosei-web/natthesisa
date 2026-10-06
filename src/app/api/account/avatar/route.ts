import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { getUserById, logActivity, saveUser } from "@/lib/store";
import { AVATAR_MAX_BYTES, avatarHref, removeAvatarImage, saveAvatarImage } from "@/lib/avatars";
import { UploadError, diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A student's profile picture.
 *
 *   GET     the picture itself — yours, or (teacher only) a student's, so the
 *           console can show a face next to each name
 *   POST    one image file, replacing whatever was there
 *   DELETE  removes it and the account falls back to initials
 *
 * Nothing is public: without a session every method answers 401, and a student
 * can only read their own picture. On Supabase Storage the bytes are served
 * from the CDN (a redirect); on disk they are streamed through this route, so
 * the same code works on both backends.
 */

/** Adds a second of slack: `updatedAt` is ISO text, fine in a query string. */
function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return NextResponse.json({ error: "Sign in to view this picture." }, { status: 401 });

  // Yours by default; `u` asks for another account, which only the teacher may
  // do (the student list is the one place other people's pictures appear).
  const requested = req.nextUrl.searchParams.get("u")?.trim() || viewer.id;
  if (requested !== viewer.id && !isOwner(viewer)) {
    return NextResponse.json({ error: "You can only view your own picture." }, { status: 403 });
  }

  const account = requested === viewer.id ? viewer : await getUserById(requested);
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const record = account.avatar;
  if (!record) return NextResponse.json({ error: "No profile picture has been added." }, { status: 404 });

  const redirect = await storedBlobRedirect(record);
  if (redirect) {
    const response = NextResponse.redirect(redirect, 302);
    // The redirect target (a signed URL or a public object URL) is already
    // cacheable, but this hop is keyed to the viewer's session — so it is not.
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const size = await storedBlobSize(record);
  if (size === null) {
    return NextResponse.json({ error: "That picture is missing from storage." }, { status: 410 });
  }
  if (size === 0) return new NextResponse(null, { status: 204 });

  return new NextResponse(diskBlobRange(record, 0, size - 1), {
    status: 200,
    headers: {
      "Content-Type": record.mime || "image/jpeg",
      "Content-Length": String(size),
      // The URL carries the upload time (`avatarHref`), so a replaced picture
      // is a different URL: caching this one is safe, and it is per-viewer.
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read. Please try again." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a picture to upload." }, { status: 400 });
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json(
      { error: "That picture is larger than the 4 MB limit. Try a smaller one." },
      { status: 413 }
    );
  }

  const previous = user.avatar;
  try {
    user.avatar = await saveAvatarImage(user.id, file);
    logActivity(user, "Profile picture updated", "account");
    await saveUser(user);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[codemasterghana] profile picture upload failed", error);
    return NextResponse.json({ error: "Your picture could not be saved. Please try again." }, { status: 500 });
  }

  // Only now is the old file garbage: the account row already points at the
  // new one, so a failure deleting the old bytes changes nothing for the user.
  if (previous && previous.storedName !== user.avatar.storedName) {
    await removeAvatarImage(previous);
  }

  return noStore(NextResponse.json({ ok: true, avatarUrl: avatarHref(user), avatar: user.avatar }));
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!user.avatar) return noStore(NextResponse.json({ ok: true, avatarUrl: null }));

  const previous = user.avatar;
  user.avatar = null;
  logActivity(user, "Profile picture removed", "account");
  await saveUser(user);
  await removeAvatarImage(previous);
  return noStore(NextResponse.json({ ok: true, avatarUrl: null }));
}
