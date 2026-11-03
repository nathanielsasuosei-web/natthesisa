import { NextResponse } from "next/server";
import { probeStorage, storageSummary, type StorageFailureKind, type StorageProbe } from "@/lib/blob-store";
import { CONNECTION_STRING_VARS, connectionHint, databaseInfo, databaseTarget, ready } from "@/lib/db";
import { lessonVideoCount } from "@/lib/lesson-videos";
import { courseVideoCount } from "@/lib/course-videos";
import { sampleVideoKey } from "@/lib/video-availability";

// A diagnosis must never be answered from a cache, and must never itself be
// the thing that hangs: a database that never answers would otherwise hold the
// request open until the platform's own limit kills it.
export const dynamic = "force-dynamic";

const PROBE_TIMEOUT_MS = 12_000;

/** How the app decided where to connect. */
export interface HealthReport {
  ok: boolean;
  database: {
    driver: "postgres" | "embedded";
    connected: boolean;
    /** The environment variable the connection string came from, if any. */
    source: string | null;
    /** Hostname only — never a user, password or database name. */
    host: string | null;
    server: string | null;
    /**
     * Whether the tables sign-in needs exist (they are created on first use).
     * Null when there is no connection to ask.
     */
    schema: boolean | null;
    /** Plain-language next step when the connection failed. */
    hint: string | null;
  };
  /**
   * Where lesson videos, uploads and branding images live, and whether that
   * storage is answering.
   *
   * A lesson page cannot explain why its video will not play: to a student the
   * difference between "the bucket does not exist", "the key was rotated" and
   * "the videos were never uploaded" is invisible, and all three look like
   * "Video unavailable right now". This section is the answer — the same
   * question the page asked, with the reason and the fix attached.
   */
  storage: {
    ok: boolean;
    backend: "supabase" | "disk";
    target: string;
    bucket: string | null;
    host: string | null;
    /** How the browser is sent to a file: a permanent CDN URL or a signed one. */
    urlStyle: "public" | "signed" | null;
    reachable: boolean | null;
    authOk: boolean | null;
    bucketExists: boolean | null;
    bucketIsPublic: boolean | null;
    publicUrlsWillWork: boolean | null;
    missingVars: string[];
    /**
     * Whether a walkthrough could be played right now: the sampled object is in
     * the bucket *and* the step that hands the browser a URL answers. Null when
     * either question went unanswered — which is not the same as "no", and is
     * reported as such so an unreadable file is never mistaken for an absent one.
     */
    playable: boolean | null;
    /**
     * What the bucket's own listing says — the second opinion when the object
     * metadata call is the thing that is broken. Null when it could not be read.
     */
    listed: { objects: number; sampleListed: boolean | null; truncated: boolean } | null;
    /** Videos the manifest lists, and whether the one sampled object is there. */
    videos: { listed: number; welcomes: number; sampled: string | null; samplePresent: boolean | null };
    failure: StorageFailureKind | null;
    error: string | null;
    hint: string | null;
    ms: number;
  };
  checked: readonly string[];
  error?: string;
}

/**
 * Rejects with a message as soon as the timer fires, so a stalled probe cannot
 * hold the response. The underlying promise is abandoned, not cancelled —
 * there is no way to cancel a `pg` connect — but it finishes or fails on its
 * own, and its error is already handled below.
 */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No answer within ${ms / 1000}s.`)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Did a schema statement lose a race rather than fail?
 *
 * Every statement in the schema and migration lists is `if not exists`, so the
 * only way one of them reports an error is a *concurrent* create between the
 * check and the insert — two instances booting at once, or a deploy overlapping
 * the instance it replaces. The database ends up correct either way.
 */
function isAlreadyExists(error: unknown): boolean {
  const code = (error as { code?: unknown }).code;
  if (code === "42P07" || code === "42710" || code === "42P06") return true; // duplicate table / object / schema
  const detail = error instanceof Error ? error.message : String(error);
  return /already exists/i.test(detail);
}

/** Did the probe give up waiting, as opposed to getting an answer? */
function timedOut(error: unknown): boolean {
  const detail = error instanceof Error ? error.message : String(error);
  return /^No answer within/.test(detail) || (error instanceof Error && error.name === "TimeoutError");
}

/**
 * `GET /api/health` — what the deployment is actually connected to.
 *
 * The sign-in banner deliberately says nothing specific, and the real reason
 * only exists in the host's logs. This endpoint is the way to read it from the
 * deployment itself: open `/api/health` and the `database.hint` field names
 * the fix (a Supabase direct host, a rejected password, a missing role, an
 * allowlist blocking the host, no connection string configured at all).
 *
 * The same is true of the file storage behind lesson videos. A lesson page can
 * only say "Video unavailable right now", because that is all a student should
 * be told; `storage.hint` here says which of the four real causes it is — a
 * paused project, a refused key, a bucket that does not exist, or a healthy
 * bucket that was never filled — and what to do about it.
 *
 * It is public, so it never reports anything that is not already implied by
 * the deployment being up: no credentials, no account data, and only the
 * hostname of the database — never the user, password or database name. The
 * storage bucket name is reported because a name that does not match the
 * dashboard is one of the failures being diagnosed, and it is not a secret:
 * it appears in every public object URL the app hands out.
 */
export async function GET() {
  const target = databaseTarget();
  const sample = sampleVideoKey();
  // Both probes run at once: the endpoint is a diagnosis, and waiting for a
  // stalled database before asking storage would double the wait.
  const storagePromise = withTimeout(probeStorage(sample?.key), PROBE_TIMEOUT_MS).catch(
    (error): StorageProbe | null => {
      console.error("[codemasterghana] storage probe failed", error);
      return null;
    }
  );
  const report: HealthReport = {
    ok: false,
    database: {
      driver: target.driver,
      connected: false,
      source: target.source,
      host: target.host,
      server: null,
      schema: null,
      hint: null,
    },
    storage: {
      ok: false,
      backend: "disk",
      target: storageSummary(),
      bucket: null,
      host: null,
      urlStyle: null,
      reachable: null,
      authOk: null,
      bucketExists: null,
      bucketIsPublic: null,
      publicUrlsWillWork: null,
      missingVars: [],
      playable: null,
      listed: null,
      videos: { listed: lessonVideoCount(), welcomes: courseVideoCount(), sampled: null, samplePresent: null },
      failure: null,
      error: null,
      hint: null,
      ms: 0,
    },
    checked: CONNECTION_STRING_VARS,
  };

  try {
    // The probe proves the connection; `ready()` proves the schema, which is
    // what sign-in actually needs. They can disagree: a connection made with a
    // role that cannot create tables succeeds here and fails on the first
    // sign-in, so the report distinguishes the two.
    const info = await withTimeout(databaseInfo(), PROBE_TIMEOUT_MS);
    report.database.connected = true;
    report.database.driver = info.driver;
    report.database.source = info.source;
    report.database.host = info.host;
    report.database.server = info.version?.split(" ").slice(0, 2).join(" ") ?? null;

    await withTimeout(ready(), PROBE_TIMEOUT_MS);
    report.database.schema = true;
    report.ok = true;
  } catch (error) {
    // A schema statement that answers "already exists" is not a failure:
    // another instance deployed at the same moment may have created the table
    // between our check and our create, and the database is exactly as
    // intended. Reporting that as a schema error would page the owner about a
    // no-op — the tables they need are there.
    if (report.database.connected && isAlreadyExists(error)) {
      report.database.schema = true;
      report.ok = true;
      console.warn("[codemasterghana] health: a schema statement raced another instance — the schema is complete");
    } else {
      if (!report.database.connected) {
        report.database.schema = null;
      } else {
        report.database.schema = false;
      }
      report.database.hint = connectionHint(error);
      report.error = error instanceof Error ? error.message : String(error);
      if (!report.database.hint) {
        report.database.hint = timedOut(error)
          ? report.database.connected
            ? "The database answered, but checking (and, on a first deploy, creating) its tables did not finish " +
              `within ${PROBE_TIMEOUT_MS / 1000}s. That is usually a cold instance working through the schema for ` +
              "the first time, or a pooled connection waiting on a busy project — ask again in a minute. If it " +
              "keeps happening, read the `[codemasterghana] schema statement failed …` line in the host's logs."
            : "The database did not answer within 12s. A paused free-tier project or a blocked connection pooler " +
              "looks like this; check the project in the dashboard, then ask again."
          : target.driver === "embedded"
            ? "No PostgreSQL connection string is configured, so the app fell back to its embedded database. " +
              "Set one of the variables in `checked` in the host's environment variables and redeploy."
            : report.database.connected
              ? "Connected to the database, but its tables could not be created or upgraded. The role may lack " +
                "permission to change tables, or a table made by hand (or by another project) may exist under the " +
                "same name with different columns. Read the `[codemasterghana] schema statement failed …` line in " +
                "the host's logs — it names the exact statement."
              : "The database could not be reached and the error did not match a known cause. Read the " +
                "`[codemasterghana] database connection failed …` line in the host's logs.";
      }
      console.error("[codemasterghana] health check failed", error);
    }
  }

  const storage = await storagePromise;
  if (storage) {
    // Storage being down does not take the site down — every lesson is
    // readable without its video — so the response status still follows the
    // database. `storage.ok` is the separate question, and it means the one
    // thing a student cares about: could a walkthrough actually play? That
    // needs both a storage that answers and bytes in it.
    // Only a real "absent" counts as missing: `sample === null` means the probe
    // could not read the object at all, which is an outage, not an empty bucket.
    const sampleMissing = storage.sample?.present === false;
    report.storage = {
      // The question a student asks. Deliberately not `failure === null`: a
      // metadata endpoint can be broken while every video still plays, and the
      // reverse (a clean failure report over an empty bucket) is the case that
      // needs saying out loud.
      ok: storage.playable === true,
      backend: storage.backend,
      target: storageSummary(),
      bucket: storage.bucket,
      host: storage.host,
      urlStyle: storage.urlStyle,
      reachable: storage.reachable,
      authOk: storage.authOk,
      bucketExists: storage.bucketExists,
      bucketIsPublic: storage.bucketIsPublic,
      publicUrlsWillWork: storage.publicUrlsWillWork,
      missingVars: storage.missingVars,
      playable: storage.playable,
      listed: storage.listing,
      videos: {
        listed: report.storage.videos.listed,
        welcomes: report.storage.videos.welcomes,
        sampled: sample?.lessonId ?? null,
        samplePresent: storage.sample?.present ?? null,
      },
      failure: storage.failure,
      error: storage.error,
      hint: storage.hint,
      ms: storage.ms,
    };
    if (sampleMissing && storage.failure === null) {
      // Healthy storage, empty bucket: the manifest is committed but the bytes
      // are not, which is the one case no environment variable can fix.
      report.storage.hint =
        `Storage is answering, but the ${report.storage.videos.listed} lesson videos in the manifest are not in it — ` +
        `the sample file (${sample?.lessonId}) is absent. The videos are generated artifacts and do not travel with a ` +
        "deploy. Fill the bucket with Actions → Lesson videos → Run workflow (it renders every video, uploads it and " +
        "verifies the bucket), or run `npm run videos:synthesize && npm run videos:build` from a machine that has " +
        "these same storage variables set.";
    }
    // A probe that could not read the sample at all is an outage, not an empty
    // bucket: `videos.samplePresent` is null for "no answer", and saying so
    // explicitly stops the two very different fixes — re-render every video, or
    // repair the storage call — being swapped for each other.
    // Only when the answer is still unknown. If the listing settled it (the file
    // is there, or the bucket is empty) the probe's hint is already the fix, and
    // overwriting it would bury it.
    if (storage.sample === null) {
      // One plain sentence for the state, then the most specific advice there
      // is: the probe's own hint already names the failing call, and repeating
      // it here only makes the fix harder to find.
      const said = storage.error ? ` Storage said: ${storage.error}` : "";
      const advice =
        storage.hint ??
        "`npm run storage:check` writes its own probe object and reads it back through these same calls, " +
          "naming the step that fails.";
      report.storage.hint =
        "Storage answered, but the sampled lesson video could not be read, so whether the videos are in the " +
        `bucket is unknown — this is not the same as an empty bucket.${said} ${advice}`;
    }
    // `ok` is now "a video would play". Say which of the two reasons it is, so a
    // log reader does not have to work it out from the fields.
    if (!report.storage.ok) {
      console.error(
        "[codemasterghana] storage check failed",
        report.storage.playable === false
          ? "storage answered and the sampled video is not playable"
          : "the sampled video could not be read",
        report.storage.error ?? report.storage.hint
      );
    }
  } else {
    report.storage.error = "The storage probe did not finish.";
    report.storage.hint =
      "The storage check itself timed out, which usually means the project is not answering at all. " +
      "Run `npm run storage:check` from a machine that can reach it.";
  }

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
