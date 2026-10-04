import { createHash, randomUUID } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { UploadedFileRecord } from "./lesson-uploads";
import { MAX_FILE_BYTES, UploadError, dataDir, fileKindForName, mimeForUpload, uploadedFilePath } from "./lesson-uploads";

/**
 * Owner branding: the profile photo and logo the owner adds when publishing
 * lessons. Stored next to the lesson data so it survives restarts:
 *
 *   .data/branding.json   name, role and the photo/logo metadata
 *   .data/uploads/*       the image files (same folder as lesson materials)
 */

export type BrandingAsset = "photo" | "logo";

export interface OwnerBranding {
  displayName: string;
  roleTitle: string;
  photo: UploadedFileRecord | null;
  logo: UploadedFileRecord | null;
  updatedAt: string | null;
  updatedBy: string;
}

const EMPTY: OwnerBranding = {
  displayName: "",
  roleTitle: "Course instructor",
  photo: null,
  logo: null,
  updatedAt: null,
  updatedBy: "",
};

const g = globalThis as unknown as { __codaraBranding?: OwnerBranding };

function brandingFile(): string {
  return path.join(dataDir(), "branding.json");
}

export function getBranding(): OwnerBranding {
  if (g.__codaraBranding) return g.__codaraBranding;
  let branding: OwnerBranding = { ...EMPTY };
  try {
    const file = brandingFile();
    if (existsSync(file)) {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<OwnerBranding>;
      branding = {
        displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
        roleTitle: typeof parsed.roleTitle === "string" ? parsed.roleTitle : EMPTY.roleTitle,
        photo: parsed.photo ?? null,
        logo: parsed.logo ?? null,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
        updatedBy: typeof parsed.updatedBy === "string" ? parsed.updatedBy : "",
      };
    }
  } catch (error) {
    console.error("Could not read owner branding from disk", error);
    branding = { ...EMPTY };
  }
  g.__codaraBranding = branding;
  return branding;
}

export function saveBranding(next: Partial<OwnerBranding>, updatedBy: string): OwnerBranding {
  const branding: OwnerBranding = {
    ...getBranding(),
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(brandingFile(), `${JSON.stringify(branding, null, 2)}\n`, "utf8");
  g.__codaraBranding = branding;
  return branding;
}

/** Images only, streamed to disk with the same limits as lesson materials. */
export async function saveBrandingAsset(file: File, asset: BrandingAsset): Promise<UploadedFileRecord> {
  const kind = fileKindForName(file.name || "");
  if (kind !== "image") {
    throw new UploadError("Your photo and logo must be image files (PNG, JPG, WEBP, GIF or AVIF).", 415);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError(`“${file.name}” is larger than the 200 MB limit.`, 413);
  }

  const extension = path.extname(file.name || "").toLowerCase();
  const digest = createHash("sha256").update(`${asset}:${file.name}:${Date.now()}`).digest("hex").slice(0, 12);
  const storedName = `branding-${asset}__${digest}${/^[a-z0-9]{1,8}$/.test(extension.replace(".", "")) ? extension : ""}`;
  const destination = uploadedFilePath(storedName);
  mkdirSync(path.dirname(destination), { recursive: true });

  let written = 0;
  const source = Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]);
  try {
    await pipeline(
      source,
      async function* (chunks) {
        for await (const chunk of chunks) {
          written += (chunk as Buffer).length;
          if (written > MAX_FILE_BYTES) throw new UploadError("That image is larger than the 200 MB limit.", 413);
          yield chunk as Buffer;
        }
      },
      createWriteStream(destination)
    );
  } catch (error) {
    try {
      if (existsSync(destination)) rmSync(destination);
    } catch {
      /* ignore cleanup failures */
    }
    if (error instanceof UploadError) throw error;
    throw new UploadError("The image could not be saved. Check that the server can write to its data folder.", 500);
  }

  return {
    id: randomUUID(),
    name: path.basename(file.name || storedName).slice(0, 160),
    storedName,
    mime: mimeForUpload(file.name || "", file.type || "image/png"),
    size: written,
    kind: "image",
    uploadedAt: new Date().toISOString(),
  };
}

export function clearBrandingAsset(asset: BrandingAsset, updatedBy: string): OwnerBranding {
  const current = getBranding();
  const existing = current[asset];
  if (existing) {
    try {
      const target = uploadedFilePath(existing.storedName);
      if (existsSync(target)) rmSync(target);
    } catch (error) {
      console.error(`Could not remove branding ${asset}`, error);
    }
  }
  return saveBranding({ [asset]: null } as Partial<OwnerBranding>, updatedBy);
}

export interface BrandingSummary {
  name: string;
  role: string;
  photoHref: string | null;
  logoHref: string | null;
}

/** What learners see, or null when the owner has not set any branding yet. */
export function brandingSummary(ownerName: string): BrandingSummary | null {
  const branding = getBranding();
  if (!branding.photo && !branding.logo && !branding.displayName) return null;
  return {
    name: branding.displayName || ownerName,
    role: branding.roleTitle || "Course instructor",
    photoHref: branding.photo ? "/api/branding/photo" : null,
    logoHref: branding.logo ? "/api/branding/logo" : null,
  };
}

export function brandingAsset(asset: BrandingAsset): UploadedFileRecord | null {
  return getBranding()[asset];
}
