import { site } from "@/config/site";

/**
 * Student email.
 *
 * Three moments matter enough to write to a student about:
 *
 *   • they bought something (an access pass, a course or a lesson),
 *   • they finished a course,
 *   • their certificate has been issued.
 *
 * Sending is best-effort on purpose: an email must never fail a purchase or a
 * progress save. Every public function catches its own errors and logs them.
 *
 * Transports, picked from the environment in this order:
 *
 *   1. RESEND_API_KEY  → the Resend HTTP API (no SMTP server needed),
 *   2. SMTP_HOST       → any SMTP server via nodemailer (Gmail app passwords,
 *                        Mailgun, a VPS postfix, …),
 *   3. neither         → dry run: the email is logged to the server console,
 *                        which keeps local development honest without a
 *                        provider.
 *
 * EMAIL_FROM sets the sender, e.g. `Codemaster Ghana <hello@codemasterghana.com>`.
 */

export interface EmailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  ok: boolean;
  /** True when no transport is configured and the email was only logged. */
  dryRun?: boolean;
  error?: string;
}

const BRAND_NAME = "Codemaster Ghana";
const BRAND_PURPLE = "#6d4aff";
const BRAND_INK = "#1b1822";

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://codemasterghana.com").replace(/\/+$/, "");
  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || `${BRAND_NAME} <${site.supportEmail}>`;
}

/* -------------------------------------------------------------------------- */
/* Transports                                                                 */
/* -------------------------------------------------------------------------- */

async function sendViaResend(message: EmailMessage, apiKey: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress(),
      to: [message.toName ? `${message.toName} <${message.to}>` : message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend responded ${response.status}: ${body.slice(0, 300)}`);
  }
}

async function sendViaSmtp(message: EmailMessage): Promise<void> {
  // Loaded lazily so a Resend-only deployment never pays for it.
  const { default: nodemailer } = await import("nodemailer");
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT ?? (process.env.SMTP_SECURE === "1" ? 465 : 587));
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "1" || port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
      : undefined,
  });
  await transport.sendMail({
    from: fromAddress(),
    to: message.toName ? `${message.toName} <${message.to}>` : message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  transport.close();
}

/** Sends one email. Throws on failure — callers decide how to react. */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    await sendViaResend(message, resendKey);
    return { ok: true };
  }
  if (process.env.SMTP_HOST?.trim()) {
    await sendViaSmtp(message);
    return { ok: true };
  }
  // No provider configured: keep development honest by showing exactly what
  // would have been sent.
  console.info(
    `[codemasterghana][email] dry run (no RESEND_API_KEY or SMTP_HOST set)\n` +
      `  to:      ${message.to}\n` +
      `  subject: ${message.subject}\n` +
      (message.text ? `  preview: ${message.text.slice(0, 200)}` : "")
  );
  return { ok: true, dryRun: true };
}

/* -------------------------------------------------------------------------- */
/* Brand template                                                             */
/* -------------------------------------------------------------------------- */

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="border-radius:12px;background:${BRAND_PURPLE}">
    <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

function detailRows(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6f6880;border-bottom:1px solid #f0edf3">${escapeHtml(label)}</td>
        <td style="padding:9px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${BRAND_INK};text-align:right;border-bottom:1px solid #f0edf3">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");
}

function shell(headline: string, emoji: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f3f1f6">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1f6;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="padding:0 6px 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:900;color:${BRAND_INK};letter-spacing:-.02em">
          Codemaster <span style="color:${BRAND_PURPLE}">Ghana</span>
        </td></tr>
        <tr><td style="background:${BRAND_INK};border-radius:16px 16px 0 0;padding:26px 34px">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#b7a7ff;font-weight:bold;text-transform:uppercase;letter-spacing:.14em">${emoji}&nbsp; ${escapeHtml(site.tagline)}</p>
          <h1 style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;color:#ffffff">${headline}</h1>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 34px 32px">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8a8390;line-height:1.7">
          You are receiving this because you have an account with ${BRAND_NAME}.<br/>
          Questions? Reply to this email or write to <a href="mailto:${site.supportEmail}" style="color:${BRAND_PURPLE};text-decoration:none">${site.supportEmail}</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const paragraph = (html: string) =>
  `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#413a4a">${html}</p>`;

/* -------------------------------------------------------------------------- */
/* The three student notifications                                            */
/* -------------------------------------------------------------------------- */

/** Never throws: a failed email must never break the request that triggered it. */
async function safely(label: string, send: () => Promise<EmailResult>): Promise<EmailResult> {
  try {
    const result = await send();
    if (!result.ok) console.error(`[codemasterghana][email] ${label} was not sent`, result.error);
    return result;
  } catch (error) {
    console.error(`[codemasterghana][email] ${label} failed`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** A course or lesson receipt. */
export function notifyContentPurchased(opts: {
  to: string;
  toName: string;
  item: string;
  amount: number;
  invoiceNumber: string | null;
}): Promise<EmailResult> {
  const { to, toName, item, amount, invoiceNumber } = opts;
  const money = `${site.currency.symbol}${amount.toLocaleString("en-US")}`;
  const html = shell("Your purchase is confirmed", "🧾", 
    paragraph(`Hi ${escapeHtml(toName)},`) +
    paragraph(`Thank you for your purchase — it has been added to your account and is ready to study right away.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 2px">${detailRows([
      ["Item", item],
      ["Amount paid", money],
      ["Invoice", invoiceNumber ?? "—"],
      ["Date", new Date().toUTCString().slice(0, 16)],
    ])}</table>` +
    paragraph(`Remember: you also need an active access pass for lessons to open. If yours has lapsed, renew it from your dashboard.`) +
    button(siteUrl("/dashboard/courses"), "Start learning")
  );
  return safely("purchase receipt", () =>
    sendEmail({
      to,
      toName,
      subject: `Receipt — ${item}`,
      html,
      text: `Hi ${toName}, your purchase of "${item}" (${money}${invoiceNumber ? `, invoice ${invoiceNumber}` : ""}) is confirmed. Start learning: ${siteUrl("/dashboard/courses")}`,
    })
  );
}

/** An access pass receipt. */
export function notifyPassPurchased(opts: {
  to: string;
  toName: string;
  period: string;
  price: number;
  expiresAt: string;
  invoiceNumber: string | null;
  extended: boolean;
}): Promise<EmailResult> {
  const { to, toName, period, price, expiresAt, invoiceNumber, extended } = opts;
  const money = `${site.currency.symbol}${price.toLocaleString("en-US")}`;
  const expires = new Date(expiresAt).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  const html = shell(
    extended ? "Your access pass has been extended" : "Your access pass is active", "🎟️",
    paragraph(`Hi ${escapeHtml(toName)},`) +
    paragraph(
      extended
        ? `Thank you — the time you bought has been added on top of your current pass, so nothing you paid for is lost.`
        : `Thank you — the platform is open for you. Every course and lesson you own is unlocked until your pass ends.`
    ) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 2px">${detailRows([
      ["Pass", `${period[0].toUpperCase()}${period.slice(1)}`],
      ["Amount paid", money],
      ["Active until", expires],
      ["Invoice", invoiceNumber ?? "—"],
    ])}</table>` +
    button(siteUrl("/dashboard"), "Go to my dashboard")
  );
  return safely("access pass receipt", () =>
    sendEmail({
      to,
      toName,
      subject: extended ? `Your ${period} pass was extended` : `Your ${period} access pass is active`,
      html,
      text: `Hi ${toName}, your ${period} access pass (${money}) is active until ${expires}. Dashboard: ${siteUrl("/dashboard")}`,
    })
  );
}

/** A student finished every lesson in a course. */
export function notifyCourseCompleted(opts: {
  to: string;
  toName: string;
  courseId: string;
  courseTitle: string;
}): Promise<EmailResult> {
  const { to, toName, courseId, courseTitle } = opts;
  const html = shell(`You completed ${escapeHtml(courseTitle)}!`, "🎉",
    paragraph(`Hi ${escapeHtml(toName)},`) +
    paragraph(`Every single lesson — done. That takes real consistency, and you should be proud of it.`) +
    paragraph(
      `Your certificate for <strong>${escapeHtml(courseTitle)}</strong> is ready to issue. Open it, save it, and share it — employers can verify it online with its code.`
    ) +
    button(siteUrl(`/dashboard/certificates/${courseId}`), "Get my certificate") +
    paragraph(`<span style="color:#8a8390;font-size:12px">Keep the momentum going — your next course is waiting in the catalog.</span>`)
  );
  return safely("course completion", () =>
    sendEmail({
      to,
      toName,
      subject: `🎉 Congratulations — you completed ${courseTitle}`,
      html,
      text: `Hi ${toName}, congratulations — you completed ${courseTitle}! Your certificate is ready: ${siteUrl(`/dashboard/certificates/${courseId}`)}`,
    })
  );
}

/** A certificate has been issued. `verifyUrl` is the public check page. */
export function notifyCertificateIssued(opts: {
  to: string;
  toName: string;
  courseId: string;
  courseTitle: string;
  code: string;
  hours: number;
  lessons: number;
  verifyUrl: string;
}): Promise<EmailResult> {
  const { to, toName, courseId, courseTitle, code, hours, lessons, verifyUrl } = opts;
  const html = shell("Your certificate is ready", "🏅",
    paragraph(`Hi ${escapeHtml(toName)},`) +
    paragraph(`Your certificate for <strong>${escapeHtml(courseTitle)}</strong> has been issued in your name. Download it from your dashboard and add it to your CV and LinkedIn.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 2px">${detailRows([
      ["Certificate code", code],
      ["Course", courseTitle],
      ["Lessons completed", String(lessons)],
      ["Learning hours", String(hours)],
    ])}</table>` +
    paragraph(`Anyone can confirm this certificate is genuine at <a href="${verifyUrl}" style="color:${BRAND_PURPLE};font-weight:bold;text-decoration:none">${verifyUrl}</a>.`) +
    button(siteUrl(`/dashboard/certificates/${courseId}`), "View my certificate") +
    paragraph(`<span style="color:#8a8390;font-size:12px">Tip: add the code to your CV so employers can verify your achievement in seconds.</span>`)
  );
  return safely("certificate issued", () =>
    sendEmail({
      to,
      toName,
      subject: `🏅 Your certificate for ${courseTitle} is ready (${code})`,
      html,
      text: `Hi ${toName}, your certificate for ${courseTitle} has been issued. Code: ${code}. Verify: ${verifyUrl}. Download: ${siteUrl(`/dashboard/certificates/${courseId}`)}`,
    })
  );
}
