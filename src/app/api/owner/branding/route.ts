import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import {
  BrandingAsset,
  brandingAsset,
  clearBrandingAsset,
  getBranding,
  saveBranding,
  saveBrandingAsset,
} from "@/lib/branding";
import { removeStoredBlob, UploadError } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAsset(value: unknown): value is BrandingAsset {
  return value === "photo" || value === "logo";
}

function text(form: FormData, key: string, max: number): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Owner-only: current profile photo, logo and display details. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const branding = getBranding();
  return NextResponse.json({
    ok: true,
    branding: {
      displayName: branding.displayName || owner.name,
      roleTitle: branding.roleTitle,
      updatedAt: branding.updatedAt,
      hasPhoto: Boolean(branding.photo),
      hasLogo: Boolean(branding.logo),
      photoHref: branding.photo ? "/api/branding/photo" : null,
      logoHref: branding.logo ? "/api/branding/logo" : null,
    },
  });
}

/**
 * Owner-only: save the details and/or upload a new profile photo or logo,
 * or remove one with removePhoto / removeLogo.
 */
export async function POST(req: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "The request could not be read. Please try again." }, { status: 400 });
  }

  try {
    if (form.get("removePhoto") === "true") await clearBrandingAsset("photo", owner.name);
    if (form.get("removeLogo") === "true") await clearBrandingAsset("logo", owner.name);

    const displayName = text(form, "displayName", 80);
    const roleTitle = text(form, "roleTitle", 60);
    const hasDetails = form.has("displayName") || form.has("roleTitle");
    if (hasDetails) {
      await saveBranding(
        {
          ...(form.has("displayName") ? { displayName } : {}),
          ...(form.has("roleTitle") ? { roleTitle } : {}),
        },
        owner.name
      );
    }

    for (const asset of ["photo", "logo"] as const) {
      const file = form.get(asset);
      if (file instanceof File && file.size > 0) {
        const replaced = brandingAsset(asset);
        const record = await saveBrandingAsset(file, asset);
        await saveBranding({ [asset]: record } as { photo?: typeof record; logo?: typeof record }, owner.name);
        // Only once the replacement is recorded do we drop the object it
        // replaced — otherwise a failed save would leave the profile pointing
        // at a file that no longer exists. Without this, every new photo or
        // logo would leave the old one sitting in the bucket forever.
        if (replaced && replaced.storedName !== record.storedName) {
          await removeStoredBlob(replaced.storedName).catch((error) => {
            console.error("branding: could not remove the replaced object", error);
          });
        }
      }
    }
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("branding update failed", error);
    return NextResponse.json({ error: "Your photo or logo could not be saved." }, { status: 500 });
  }

  const branding = getBranding();
  return NextResponse.json({
    ok: true,
    branding: {
      displayName: branding.displayName || owner.name,
      roleTitle: branding.roleTitle,
      updatedAt: branding.updatedAt,
      hasPhoto: Boolean(branding.photo),
      hasLogo: Boolean(branding.logo),
      photoHref: branding.photo ? "/api/branding/photo" : null,
      logoHref: branding.logo ? "/api/branding/logo" : null,
    },
    assets: {
      photo: brandingAsset("photo")?.name ?? null,
      logo: brandingAsset("logo")?.name ?? null,
    },
  });
}
