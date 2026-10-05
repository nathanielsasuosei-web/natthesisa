import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { allCertificates, CertificateError, setCertificateRevoked } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Owner-only: every certificate ever issued, including withdrawn ones. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  return NextResponse.json({ ok: true, certificates: allCertificates() });
}

/**
 * Owner-only: withdraw or restore a certificate.
 * Body: `{ code, revoked: boolean, reason?: string }`
 *
 * Withdrawing does not delete anything: the public verification page keeps
 * answering for that code, but reports it as withdrawn with the reason. An
 * employer who already has a copy finds out rather than being told the
 * certificate does not exist.
 */
export async function POST(req: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  let body: { code?: unknown; revoked?: unknown; reason?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "That request could not be read." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const revoked = body.revoked === true;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 240) : "";
  if (!code) return NextResponse.json({ error: "Which certificate?" }, { status: 400 });

  try {
    const record = await setCertificateRevoked(code, revoked, revoked ? reason || undefined : undefined);
    return NextResponse.json({ ok: true, certificate: record, certificates: allCertificates() });
  } catch (error) {
    if (error instanceof CertificateError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
