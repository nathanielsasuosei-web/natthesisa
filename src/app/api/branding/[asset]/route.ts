import { NextResponse } from "next/server";
import { brandingAsset } from "@/lib/branding";
import { getCurrentUser } from "@/lib/session";
import { locateUploadedFile, readFileRange } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the owner's profile photo or logo.
 *
 * Signed-in learners can load it (it appears on lesson pages); everyone else
 * gets a 401, so the owner's images are never public.
 */
export async function GET(_req: Request, context: { params: Promise<{ asset: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view this image." }, { status: 401 });

  const { asset } = await context.params;
  if (asset !== "photo" && asset !== "logo") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const record = brandingAsset(asset);
  if (!record) return NextResponse.json({ error: `No ${asset} has been uploaded yet.` }, { status: 404 });

  const stored = locateUploadedFile(record);
  if (!stored) return NextResponse.json({ error: "That image is missing from the server." }, { status: 410 });

  return new NextResponse(readFileRange(stored.path, 0, stored.size - 1), {
    status: 200,
    headers: {
      "Content-Type": record.mime || "image/png",
      "Content-Length": String(stored.size),
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
