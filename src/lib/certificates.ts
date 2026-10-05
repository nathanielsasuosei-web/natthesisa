import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { readState, writeState } from "./app-state";
import { contentLessons, contentMinutes } from "./course-content";
import { getCourse } from "./courses";
import { saveUser, type User } from "./store";

/**
 * Course certificates.
 *
 * A certificate is worth something to an employer only if it can be *checked*,
 * so every one that is issued gets:
 *
 *   • a code that is short enough to type and unique enough not to collide,
 *   • a public page at `/verify/<code>` showing the holder, the course, the
 *     hours and the date — no email, no account details,
 *   • a QR code on the printed certificate that opens that page,
 *   • a permanent record the teacher can revoke if it was obtained by cheating.
 *
 * The student's copy lives on their account (`user.certificates`); the public
 * copy lives in `app_state` under one index, which is what the verification
 * page reads — so verifying a certificate never loads a user record.
 */

export interface Certificate {
  /** The public code, e.g. `CMG-WF-2026-7KQ2M4`. */
  code: string;
  courseId: string;
  courseTitle: string;
  /** Snapshot of the certificate's wording, so later edits to a course don't rewrite history. */
  program: string;
  lessons: number;
  hours: number;
  issuedAt: string;
}

/** What the public verification page is allowed to reveal. */
export interface CertificateRecord {
  code: string;
  holder: string;
  courseId: string;
  courseTitle: string;
  program: string;
  lessons: number;
  hours: number;
  issuedAt: string;
  /** True once the teacher withdraws it; the page says so instead of "valid". */
  revoked: boolean;
  revokedAt?: string;
  revokedReason?: string;
}

const INDEX_KEY = "certificates";

/** Letters and digits that cannot be confused with each other when typed. */
const ALPHABET = "ACDEFGHJKLMNPQRTUVWXY34679";

function block(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let index = 0; index < length; index++) out += ALPHABET[bytes[index] % ALPHABET.length];
  return out;
}

function coursePart(courseId: string, title: string): string {
  const initials = title
    .replace(/[^A-Za-z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase())
    .join("")
    .slice(0, 3);
  return (initials || courseId.slice(0, 3).toUpperCase()).padEnd(2, "X");
}

/** `CMG-WF-2026-7KQ2M4` — the year is the issue year, so a code is datable. */
export function makeCertificateCode(courseId: string, title: string, when: Date = new Date()): string {
  return `CMG-${coursePart(courseId, title)}-${when.getUTCFullYear()}-${block()}`;
}

/** Anything a human might type, reduced to the canonical form. */
export function normaliseCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function sameCode(a: string, b: string): boolean {
  return normaliseCode(a) === normaliseCode(b);
}

function index(): Record<string, CertificateRecord> {
  return readState<Record<string, CertificateRecord>>(INDEX_KEY, {});
}

/** Look a certificate up by its code. Public — no account needed. */
export function findCertificate(code: string): CertificateRecord | null {
  const wanted = normaliseCode(code);
  if (wanted.length < 8) return null;
  for (const record of Object.values(index())) {
    if (normaliseCode(record.code) === wanted) return record;
  }
  return null;
}

export function allCertificates(): CertificateRecord[] {
  return Object.values(index()).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function certificateCount(): number {
  return Object.keys(index()).length;
}

export function studentCertificates(user: User): Certificate[] {
  return [...(user.certificates ?? [])].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function certificateFor(user: User, courseId: string): Certificate | undefined {
  return (user.certificates ?? []).find((item) => item.courseId === courseId);
}

/** True when the student has finished every lesson in the course. */
export function hasFinishedCourse(user: User, courseId: string): boolean {
  const course = getCourse(courseId);
  const progress = user.progress[courseId];
  if (!course || !progress) return false;
  const lessons = contentLessons(course);
  if (!lessons.length) return false;
  return lessons.every((lesson) => progress.completedLessonIds.includes(lesson.id));
}

export class CertificateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CertificateError";
  }
}

/**
 * Issues the certificate for a finished course, or returns the one that already
 * exists. Idempotent on purpose: the certificate page calls it on every visit,
 * and a second visit must show the same code — an employer who checked last week
 * must find the same record today.
 */
export async function issueCertificate(user: User, courseId: string): Promise<Certificate> {
  const existing = certificateFor(user, courseId);
  if (existing) return existing;

  const course = getCourse(courseId);
  if (!course) throw new CertificateError("That course does not exist.");

  const lessons = contentLessons(course).length;
  const minutes = contentMinutes(course);
  const issuedAt = new Date().toISOString();

  // The code is unique in the index; a collision is astronomically unlikely but
  // cheap to rule out, so it is.
  let code = makeCertificateCode(course.id, course.title);
  let guard = 0;
  while (findCertificate(code) && guard++ < 5) code = makeCertificateCode(course.id, course.title);

  const certificate: Certificate = {
    code,
    courseId: course.id,
    courseTitle: course.title,
    program: course.category,
    lessons,
    hours: Math.max(1, Math.round(minutes / 60)),
    issuedAt,
  };

  const record: CertificateRecord = {
    code,
    holder: user.name,
    courseId: course.id,
    courseTitle: course.title,
    program: course.category,
    lessons,
    hours: certificate.hours,
    issuedAt,
    revoked: false,
  };

  await writeState(INDEX_KEY, { ...index(), [code]: record });
  user.certificates = [...(user.certificates ?? []), certificate];
  await saveUser(user);
  return certificate;
}

/** The teacher's controls over an issued certificate. */
export async function setCertificateRevoked(code: string, revoked: boolean, reason?: string): Promise<CertificateRecord> {
  const record = findCertificate(code);
  if (!record) throw new CertificateError("No certificate has that code.");
  const next: CertificateRecord = {
    ...record,
    revoked,
    revokedAt: revoked ? new Date().toISOString() : undefined,
    revokedReason: revoked ? reason?.slice(0, 200) || undefined : undefined,
  };
  await writeState(INDEX_KEY, { ...index(), [record.code]: next });
  return next;
}

/**
 * The absolute URL an employer opens. `NEXT_PUBLIC_SITE_URL` is set on a real
 * deployment; the fallback matches the site metadata.
 */
export function verificationUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://codemasterghana.com").replace(/\/+$/, "");
  return `${base}/verify/${code}`;
}

/** The QR code on the printed certificate, as inline SVG (no external service). */
export async function verificationQrSvg(code: string, width = 132): Promise<string> {
  try {
    const svg = await QRCode.toString(verificationUrl(code), {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#1b1822", light: "#0000" },
    });
    return svg.replace("<svg ", `<svg width="${width}" height="${width}" `);
  } catch (error) {
    // A missing QR code must never take the certificate page down.
    console.error("[codemasterghana] QR generation failed", error);
    return "";
  }
}
