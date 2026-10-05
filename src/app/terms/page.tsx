import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { formatMoney, pricing } from "@/lib/plans";
import { ensureContentReady } from "@/lib/bootstrap";
import InfoPage, { InfoContactStrip, InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "The rules for using codemasterghana: your account, passes and purchases, certificates, acceptable use and liability.",
};

const UPDATED = "Last updated 5 October 2026";

// Owner-set prices appear in these terms, so the page must be rendered per
// request rather than prerendered with the default prices baked in.
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  await ensureContentReady();
  const prices = pricing();

  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms & conditions"
      intro="These are the rules for using codemasterghana. They are written to be read: if something here is unclear, ask us and we will explain it."
      updated={UPDATED}
    >
      <InfoSection title="The agreement">
        <p>
          codemasterghana is a learning platform operated from Accra, Ghana. By creating an account or using the site,
          you agree to these terms. If you do not agree with them, please do not use the platform.
        </p>
        <p>You must be 16 or older, or use the platform with a parent or guardian's permission.</p>
      </InfoSection>

      <InfoSection title="Your account">
        <InfoList
          items={[
            "Give us accurate details and keep your email address up to date — it is how we reach you about your account.",
            "One account per person. Accounts are not transferable and must not be shared or sold.",
            "Keep your password to yourself. You are responsible for what happens under your account; tell us immediately if you think someone else has it.",
            "We may suspend an account that breaks these terms, and you can ask us why.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Passes, courses and what they cost">
        <p>
          The teacher sets the prices. In this build they are: a <strong>day pass {formatMoney(prices.daily)}</strong>,
          a <strong>week pass {formatMoney(prices.weekly)}</strong>, a <strong>month pass {formatMoney(prices.monthly)}</strong>,
          a single <strong>lesson from {formatMoney(prices.lesson)}</strong> and a <strong>course from {formatMoney(prices.course)}</strong>,
          in Ghana cedis. The prices that apply to you are the ones shown on the{" "}
          <Link href="/pricing" className="font-bold text-[#5e3de0] underline">pricing page</Link> and at checkout when you buy.
        </p>
        <InfoList
          items={[
            <><strong>A pass buys time, not content.</strong> It opens the platform for the period you chose. To open a course or a lesson you must also have bought that course or lesson.</>,
            <><strong>Buying more time while a pass is active extends it</strong> from the day it would have ended, rather than restarting it.</>,
            <><strong>What you buy stays yours.</strong> A purchase of a course or a lesson is recorded on your account permanently. If your pass lapses you cannot open it until you buy more time, but nothing you paid for is lost.</>,
            <><strong>Free preview lessons</strong> are marked by the teacher and can be watched without a pass or a purchase.</>,
            <><strong>No real payment is taken in this build.</strong> The checkout works and your access is recorded exactly as it will be, but no card, Mobile Money or bank details are collected and no money changes hands.</>,
          ]}
        />
      </InfoSection>

      <InfoSection title="Refunds">
        <p>
          Because no real money is collected today, there is nothing to refund. When live payments are switched on, the
          policy will be: a pass that has not been used can be refunded within 7 days of purchase; a course or lesson that
          you have opened is not refundable, because the content has been delivered. Faults are different — if something
          you paid for does not work and we cannot fix it, you get your money back.
        </p>
      </InfoSection>

      <InfoSection title="Certificates">
        <InfoList
          items={[
            "A certificate is issued when every lesson in a course is completed while your access is active.",
            "Each certificate carries an ID and a QR code that opens a public verification page showing the holder, the course, the study hours and the issue date.",
            "A certificate is a record of completed coursework on this platform. It is not an accredited academic qualification, and it is not a guarantee of a job.",
            "We may withdraw a certificate if it was earned by sharing an account, having somebody else complete the work, or by scripting the progress endpoints. The verification page then reports it as withdrawn.",
          ]}
        />
      </InfoSection>

      <InfoSection title="What you may do with the material">
        <p>
          The lessons, videos, slides, code samples, artwork and course text belong to the teacher or to the platform,
          and your purchase gives you a personal licence to learn from them.
        </p>
        <InfoList
          items={[
            "Learn from them, use the code in your own projects, and show your work in a portfolio or job application.",
            "Do not re-publish, resell, share or re-upload the lessons, videos or materials, in whole or in part.",
            "Do not record lessons and post them elsewhere, and do not use the material to train a competing platform.",
            "Quote us freely with a link back, and use the certificate in your CV, portfolio or job applications.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Acceptable use">
        <InfoList
          items={[
            "Do not attack, overload or probe the platform; do not scrape it; do not try to reach another student's account.",
            "Do not automate progress or completion — including calling the progress or purchase endpoints from a script — to earn a certificate dishonestly.",
            "Do not upload unlawful material or use the code lab to build or distribute malware or spam.",
            "Do not impersonate the teacher or the platform.",
          ]}
        />
      </InfoSection>

      <InfoSection title="Availability and changes">
        <p>
          We work to keep the platform online and the lessons correct, but we cannot promise uninterrupted service. We may
          add, change or retire lessons and courses; where a change reduces what you have already paid for, we will tell
          you and keep your access reasonable. We may update these terms — the date at the top will change, and significant
          changes will be shown on your dashboard.
        </p>
      </InfoSection>

      <InfoSection title="Liability">
        <p>
          The platform is provided as it is. To the extent the law allows, we are not liable for indirect or consequential
          losses — for example lost earnings, a lost job opportunity, or data lost because of a device failure. Nothing in
          these terms limits rights you have under Ghanaian consumer law, and nothing here excludes liability for fraud or
          for death or personal injury caused by our negligence.
        </p>
      </InfoSection>

      <InfoSection title="Governing law">
        <p>
          These terms are governed by the laws of the Republic of Ghana, and disputes are subject to the jurisdiction of
          the Ghanaian courts. Where a dispute can be settled by talking, we would much rather talk: write to{" "}
          <a href={`mailto:${site.supportEmail}`} className="font-bold text-[#5e3de0] underline">{site.supportEmail}</a> first.
        </p>
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "Can I use what I build here in a paid job?",
            a: "Yes. The projects you build are yours. The course material is licensed to you for learning, not for redistribution, so put your own work in your portfolio rather than our lessons.",
          },
          {
            q: "Does a pass include the courses?",
            a: "No — a pass buys time on the platform, and courses and lessons are bought separately. Both are needed to open a paid lesson, which is why the cheapest way to start is the free preview lessons.",
          },
          {
            q: "What happens if I share my account?",
            a: "Progress can be reset and a certificate can be withdrawn, because a certificate that says you completed the work has to mean it. Repeated sharing can lead to the account being suspended.",
          },
          {
            q: "Can I get an invoice for my school or employer?",
            a: "Yes. Every purchase creates an invoice number shown on your billing page; for a formal invoice in an organisation's name, contact us with the details.",
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
