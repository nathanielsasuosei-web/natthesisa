import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { ensureContentReady } from "@/lib/bootstrap";
import InfoPage, { InfoContactStrip, InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "The rules for using codemasterghana: your account, programs and purchases, certificates, acceptable use and liability.",
};

const UPDATED = "Last updated 5 October 2026";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  await ensureContentReady();

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

      <InfoSection title="Programs and what they cost">
        <p>
          The lessons, files and narration are free. You do not need to pay, and you do not need an
          account, to study. A free account only remembers progress and prints a certificate. Older
          checkout records, if any, stay on the account as history and do not gate the lessons.
        </p>
        <InfoList
          items={[
            <><strong>A program is a path, not a paywall.</strong> Every course and every lesson in it is open to read, listen to and download.</>,
            <><strong>An account is optional.</strong> Create one if you want progress saved. It is free.</>,
            <><strong>No payment is required to study.</strong> The site does not ask for card, Mobile Money or bank details in order to open a lesson.</>,
          ]}
        />
      </InfoSection>

      <InfoSection title="Refunds">
        <p>
          Studying does not require a payment, so there is nothing to refund in order to use the lessons.
          If a payment was taken by mistake on an older checkout, write to us and we will sort it out.
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
          and reading them gives you a personal licence to learn from them. It is not a licence to republish them.
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
            q: "Do I have to pay to read a lesson?",
            a: "No. Every course, lesson, file and narration is open. An account is optional and free; it only saves progress and prints a certificate.",
          },
          {
            q: "What happens if I share my account?",
            a: "Progress can be reset and a certificate can be withdrawn, because a certificate that says you completed the work has to mean it. Repeated sharing can lead to the account being suspended.",
          },
          {
            q: "Can I get an invoice for my school or employer?",
            a: "There is nothing to invoice for studying — the lessons are free. If you need a letter confirming enrolment, contact us with the details.",
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
