import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { PurchaseError, buyCourse, buyLesson } from "@/lib/purchases";
import { saveUser } from "@/lib/store";
import { hasActivePass } from "@/lib/access";
import { notifyContentPurchased } from "@/lib/email";
import { getCourse } from "@/lib/courses";
import { findContentLesson } from "@/lib/course-content";
import { coursePrice, lessonPrice } from "@/lib/plans";
import { isPaystackConfigured } from "@/lib/paystack";

/**
 * Buys a course, or a single lesson.
 *
 * Buying content does not by itself open it: an access pass must also be
 * active (that is the rule in `access.ts`). The response says so plainly, and
 * the UI nudges a student who has bought the content but let their pass lapse
 * to buy more time — they never pay for the same lesson twice.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to buy this." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "course" || body.kind === "lesson" ? body.kind : null;
  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";

  if (!kind || !courseId) {
    return NextResponse.json({ error: "Say what you are buying." }, { status: 400 });
  }
  if (kind === "lesson" && !lessonId) {
    return NextResponse.json({ error: "A lesson purchase needs a lesson." }, { status: 400 });
  }

  // While live payments are on, priced content must go through checkout so the
  // provider verifies the money. A bare POST here would grant it for free.
  if (isPaystackConfigured()) {
    const price = kind === "course" ? coursePrice(courseId) : lessonPrice(lessonId);
    if (price > 0) {
      return NextResponse.json(
        {
          error: "Pay for this with Mobile Money or a card at checkout.",
          code: "CHECKOUT_REQUIRED",
          checkout: { kind, courseId, lessonId: kind === "lesson" ? lessonId : undefined },
        },
        { status: 402 }
      );
    }
  }

  try {
    const purchase =
      kind === "course" ? await buyCourse(user, courseId) : await buyLesson(user, courseId, lessonId);
    await saveUser(user);

    // Best-effort receipt email — never allowed to break the purchase.
    // (buyCourse/buyLesson have already validated the course and lesson exist.)
    const course = getCourse(courseId);
    const item =
      kind === "course"
        ? course?.title ?? "Course"
        : `${course?.shortTitle ?? "Course"} — ${course ? findContentLesson(course, lessonId)?.title ?? "lesson" : "lesson"}`;
    await notifyContentPurchased({
      to: user.email,
      toName: user.name,
      item,
      amount: purchase.amount,
      invoiceNumber: purchase.invoiceNumber,
    });

    return NextResponse.json({
      ok: true,
      purchase,
      // The purchase is banked either way; this is what the student still
      // needs before the lesson opens.
      passActive: hasActivePass(user),
    });
  } catch (error) {
    if (error instanceof PurchaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] purchase failed", error);
    return NextResponse.json({ error: "The payment could not be completed." }, { status: 500 });
  }
}
