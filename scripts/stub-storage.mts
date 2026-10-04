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

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  const parts = url.pathname.split("/").filter(Boolean); // storage, v1, ...

  if (parts[0] !== "storage" || parts[1] !== "v1") return send(response, 404, { message: "Not found" });

  const action = parts[2];
  const bucket = parts[3];
  const key = parts.slice(4).join("/");

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
      if (!object) return send(response, 404, { message: "Object not found" });
      return send(response, 200, {
        key: infoId,
        size: object.bytes.length,
        metadata: { size: object.bytes.length, mimetype: object.contentType },
      });
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
