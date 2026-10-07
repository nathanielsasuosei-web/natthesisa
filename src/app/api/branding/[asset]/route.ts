import { NextResponse } from "next/server";
import { brandingAsset } from "@/lib/branding";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serves the owner's profile photo or logo. Shown on public lesson pages. */
export async function GET(_req: Request, context: { params: Promise<{ asset: string }> }) {
  const { asset } = await context.params;
  if (asset !== "photo" && asset !== "logo") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const record = brandingAsset(asset);
  if (!record) return NextResponse.json({ error: `No ${asset} has been uploaded yet.` }, { status: 404 });

  const redirect = await storedBlobRedirect(record);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const size = await storedBlobSize(record);
  if (size === null) return NextResponse.json({ error: "That image is missing from storage." }, { status: 410 });
  const stored = { size };

  return new NextResponse(diskBlobRange(record, 0, size - 1), {
    status: 200,
    headers: {
      "Content-Type": record.mime || "image/png",
      "Content-Length": String(stored.size),
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
