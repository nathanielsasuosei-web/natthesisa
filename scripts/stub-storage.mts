/**
 * A stand-in for Supabase Storage, used to test the Storage code path from this
 * sandbox (which cannot reach supabase.com).
 *
 *   npx tsx scripts/stub-storage.mts [port]
 *
 * It implements the three endpoints the app uses, closely enough to catch
 * mistakes in URL building, headers and response parsing:
 *
 *   POST   /storage/v1/object/{bucket}/{key}       upload (x-upsert, body = bytes)
 *   DELETE /storage/v1/object/{bucket}/{key}       delete (404 when absent)
 *   GET    /storage/v1/object/info/{bucket}/{key}  metadata
 *   POST   /storage/v1/object/sign/{bucket}/{key}  signed URL
 *   GET    /storage/v1/object/sign/{bucket}/{key}?token=…  the signed download
 *   GET    /storage/v1/object/public/{bucket}/{key}        public bucket read
 *
 * Objects are kept in memory; restarting the stub clears them.
 */
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4000);
const objects = new Map<string, { bytes: Buffer; contentType: string }>();
const tokens = new Map<string, string>();

function send(response: import("node:http").ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json",
    ...(payload ? { "Content-Length": String(Buffer.byteLength(payload)) } : {}),
    ...headers,
  });
  response.end(payload);
}

// STUB_INFO_BROKEN=1 makes `/object/info` answer the way the production project
// did — a 400 carrying a 404 — for *every* object, present or not. Everything
// else keeps working, which is precisely the shape of the outage this stub is
// used to test: the videos are fine, one endpoint is not, and the app must not
// tell the owner to re-render the library.
const infoBroken = /^(1|true|yes|on)$/i.test(process.env.STUB_INFO_BROKEN ?? "");

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  const parts = url.pathname.split("/").filter(Boolean); // storage, v1, ...

  if (parts[0] !== "storage" || parts[1] !== "v1") return send(response, 404, { message: "Not found" });

  const action = parts[2];
  const bucket = parts[3];
  const key = parts.slice(4).join("/");

  // GET /bucket/{name} — the bucket's own metadata. This is the call `/api/health`
  // makes first: it proves the project answers, the key is accepted, the bucket
  // exists and whether it is public, all before a single object is touched.
  if (action === "bucket" && parts.length === 4 && request.method === "GET") {
    if (!request.headers.authorization?.startsWith("Bearer ") || !request.headers.apikey) {
      return send(response, 401, { statusCode: "401", error: "Unauthorized", message: "Invalid JWT" });
    }
    if (bucket !== (process.env.STUB_BUCKET ?? "lesson-files")) {
      return send(response, 400, { statusCode: "404", error: "not_found", message: "Bucket not found" });
    }
    return send(response, 200, { id: bucket, name: bucket, public: Boolean(process.env.STUB_BUCKET_PUBLIC) });
  }

  const body: Buffer[] = [];
  request.on("data", (chunk) => body.push(chunk as Buffer));
  request.on("end", () => {
    const bytes = Buffer.concat(body);
    const id = `${bucket}/${key}`;

    // The sub-actions (info, sign) must be matched before the generic object
    // branch, or a sign POST is swallowed as an upload.
    if (action === "object" && parts[3] === "info" && request.method === "GET") {
      const infoId = parts.slice(4).join("/");
      const object = objects.get(infoId);
      if (!object || infoBroken) {
        // Exactly what Supabase answers for a missing object: **400**, with the
        // 404 inside the body. (Verified against the deployed project — a stub
        // that answered a plain 404 here is why the app never learned to read
        // this shape, and reported an unfilled bucket as broken storage.)
        return send(response, 400, {
          statusCode: "404",
          error: "not_found",
          message: "Object not found",
          code: "NoSuchKey",
        });
      }
      return send(response, 200, {
        key: infoId,
        size: object.bytes.length,
        metadata: { size: object.bytes.length, mimetype: object.contentType },
      });
    }

    // POST /object/list/{bucket} — the bucket's listing. A different endpoint
    // from `/object/info`, which is the point: it answers when that one is broken.
    if (action === "object" && parts[3] === "list" && request.method === "POST") {
      if (!request.headers.authorization?.startsWith("Bearer ")) {
        return send(response, 401, { message: "Missing authorization" });
      }
      const listBucket = parts[4];
      const prefix = String(JSON.parse(bytes.toString() || "{}").prefix ?? "");
      const names = [...objects.keys()]
        .filter((id) => id.startsWith(`${listBucket}/`))
        .map((id) => id.slice(listBucket.length + 1))
        .filter((name) => name.startsWith(prefix))
        .sort();
      return send(response, 200, names.map((name) => ({ name, id: null, metadata: null })));
    }

    if (action === "object" && parts[3] === "sign" && request.method === "POST") {
      if (!request.headers.authorization?.startsWith("Bearer ") || !request.headers.apikey) {
        return send(response, 401, { message: "Missing authorization" });
      }
      const signId = parts.slice(4).join("/"); // "<bucket>/<key>", matching the map
      const object = objects.get(signId);
      if (!object) return send(response, 404, { message: "Object not found" });
      const token = `stub-${Math.random().toString(36).slice(2, 12)}`;
      tokens.set(token, signId);
      const expiry = Number(JSON.parse(bytes.toString() || "{}").expiresIn ?? 3600);
      return send(response, 200, { signedURL: `/object/sign/${signId}?token=${token}&expires=${expiry}` });
    }

    if (action === "object" && parts[3] === "sign" && request.method === "GET") {
      const signId = parts.slice(4).join("/"); // "<bucket>/<key>", matching the map
      const token = url.searchParams.get("token") ?? "";
      if (tokens.get(token) !== signId) return send(response, 400, { message: "Invalid token" });
      const object = objects.get(signId);
      if (!object) return send(response, 404, { message: "Object not found" });
      const headers = {
        "Content-Type": object.contentType,
        "Content-Length": String(object.bytes.length),
        "Accept-Ranges": "bytes",
      };
      // Supabase serves the download with `Content-Disposition: attachment` when
      // the signed URL carries ?download=<name>; the app relies on that suffix.
      const download = url.searchParams.get("download");
      response.writeHead(200, download ? { ...headers, "Content-Disposition": `attachment; filename="${download}"` } : headers);
      return response.end(object.bytes);
    }

    // A public bucket serves any object with no credentials at all. The stub
    // answers the way Supabase does for a *private* bucket when the caller
    // flips it off, so the app's fallback to signed URLs can be exercised.
    if (action === "object" && parts[3] === "public" && request.method === "GET") {
      if (!process.env.STUB_BUCKET_PUBLIC) {
        return send(response, 400, { statusCode: "400", error: "Bucket not found", message: "Bucket not found" });
      }
      const publicId = parts.slice(4).join("/");
      const object = objects.get(publicId);
      if (!object) return send(response, 404, { message: "Object not found" });
      const headers = {
        "Content-Type": object.contentType,
        "Content-Length": String(object.bytes.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      };
      const download = url.searchParams.get("download");
      response.writeHead(200, download ? { ...headers, "Content-Disposition": `attachment; filename="${download}"` } : headers);
      return response.end(object.bytes);
    }

    if (action === "object" && request.method === "POST") {
      if (!request.headers.authorization?.startsWith("Bearer ") || !request.headers.apikey) {
        return send(response, 401, { message: "Missing authorization" });
      }
      if (!bytes.length) return send(response, 400, { message: "No file provided" });
      objects.set(id, { bytes, contentType: String(request.headers["content-type"] ?? "application/octet-stream") });
      return send(response, 200, { Key: id });
    }

    if (action === "object" && request.method === "DELETE") {
      if (!objects.delete(id)) return send(response, 404, { message: "Object not found" });
      return send(response, 200, { message: "Successfully deleted" });
    }

    return send(response, 404, { message: `Unsupported: ${request.method} ${url.pathname}` });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(
  `stub storage listening on http://localhost:${port} (objects are kept in memory, bucket is ${
    process.env.STUB_BUCKET_PUBLIC ? "public" : "private"
  })`
);
});
