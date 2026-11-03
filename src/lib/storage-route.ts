import { NextResponse } from "next/server";
import { StorageError, type StorageFailureKind } from "./blob-store";

/**
 * The answer a file route gives when storage could not be asked about a file.
 *
 * Every video and poster route used to reduce `statBlob` to a boolean, so the
 * two outcomes it can have were reported as one: "the object is not there"
 * (410, and the student sees a plain "no video yet") and "storage could not
 * say" (which is not the same thing at all). Collapsing them is how a storage
 * outage became 410 "missing from storage" for every file in the library.
 *
 * A failure is a 503 with `Retry-After`, so a player or a browser retries
 * rather than treating the file as gone, and the reason stays in the server log
 * where it belongs — a student is told nothing, because nothing about this is
 * theirs to act on.
 */
export function storageUnavailable(error: unknown, subject: string): NextResponse {
  const kind: StorageFailureKind = error instanceof StorageError ? error.kind : "unknown";
  const hint = error instanceof StorageError ? error.hint : null;
  console.error(`[codemasterghana] ${subject}: storage could not be asked (${kind})`, error, { hint });
  return NextResponse.json(
    {
      error: `The ${subject} is not available right now. Try again in a moment — the written lesson is complete either way.`,
      code: "STORAGE_UNAVAILABLE",
      // Not "missing": the file may be perfectly present.
      reason: kind,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        // Short: a storage blip is worth one more try, and the lesson page keeps
        // working while it clears.
        "Retry-After": "30",
      },
    }
  );
}
