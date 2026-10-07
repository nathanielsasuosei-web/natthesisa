import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import InfoPage, { InfoContactStrip, InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What codemasterghana collects, why, where it is kept, and how to have it corrected or deleted.",
};

const UPDATED = "Last updated 5 October 2026";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="This page explains, in plain words, what we collect when you use codemasterghana, why we need it, and what you can ask us to do with it. It describes how this application actually works — not a template."
      updated={UPDATED}
    >
      <InfoSection title="The short version">
        <InfoList
          items={[
            "We collect the details you give us when you create an account, plus your learning progress and what you have bought.",
            "We use it to run your account, save your progress, keep track of what you own, and issue certificates.",
            "We do not sell your data, we do not run advertising, and there are no third-party tracking scripts on this site.",
            "Passwords are stored as scrypt hashes. Nobody here — including the teacher — can read your password.",
            "You can ask for a copy of your data, or for your account to be deleted, at any time.",
          ]}
        />
      </InfoSection>

      <InfoSection title="What we collect">
        <p><strong>When you create an account:</strong> your name, your email address, and a password (stored only as a hash).</p>
        <p>
          <strong>As you learn:</strong> which lessons you have completed, when you last opened a course, minutes learned
          per day, your weekly goal and profile details you choose to add (a headline, a track, an experience level).
        </p>
        <p>
          <strong>When you buy a program:</strong> which program, the amount, the date and an invoice
          number. <strong>No card number, Mobile Money number or bank detail is ever collected</strong> in this build — see
          the note on payments below.
        </p>
        <p>
          <strong>When you write to us:</strong> the name, email address and message you put in the contact form.
        </p>
        <p>
          <strong>Technically:</strong> a session cookie that keeps you signed in (see below). Server logs may record the
          request path, an error message and a timestamp; they are used for diagnosing faults and are not used to build
          a profile of you.
        </p>
      </InfoSection>

      <InfoSection title="Cookies">
        <p>
          We set one essential cookie: the session cookie that keeps you signed in. It is <em>httpOnly</em>, signed with a
          server secret, and it contains a session identifier — not your password, your email or your progress.
        </p>
        <p>
          There are no advertising cookies, no cross-site tracking pixels and no third-party analytics scripts. The code
          lab stores your work-in-progress in your own browser (localStorage) so a refresh does not lose it; it is not
          sent to us.
        </p>
      </InfoSection>

      <InfoSection title="Where your data is kept">
        <p>
          Account records, progress, purchases, invoices and issued certificates live in a PostgreSQL database. Lesson
          files and uploaded materials live in object storage or on the server's disk. Both are operated on our behalf by
          the hosting providers that run this deployment.
        </p>
        <p>
          The database is reachable only from the application. The certificate verification page deliberately exposes
          the <em>least</em> information possible: the holder's name, the course, the study hours, the issue date and
          whether the certificate is still valid. It never shows an email address, an account id, a payment or a
          password.
        </p>
      </InfoSection>

      <InfoSection title="Payments, honestly">
        <p>
          Studying does not require a payment. No card or Mobile Money details are collected in order to
          open a lesson, a file, or the narration.
        </p>
        <p>
          When a payment gateway is connected (for example Paystack or Flutterwave, which support Ghanaian cards and
          Mobile Money), the payment details will be collected by that provider on their own secure pages, under their
          privacy policy. We would only ever receive a confirmation that a payment succeeded, an amount, a reference and
          the last four digits of a card if you used one.
        </p>
      </InfoSection>

      <InfoSection title="Who can see what">
        <InfoList
          items={[
            "You can see your own account, progress, purchases, invoices and certificates.",
            "The teacher account can see student names, email addresses, programs owned, purchases, progress and certificates, because that is what running a school requires: granting access, helping with a problem and issuing certificates.",
            "Nobody else can see your account. Another student cannot see your progress.",
            "We do not share your data with advertisers or data brokers, and we do not sell it. We would only disclose it if a lawful order in Ghana required us to, and we would tell you unless we were legally barred from doing so.",
          ]}
        />
      </InfoSection>

      <InfoSection title="How long we keep it">
        <p>
          Account data is kept while your account exists. If you ask us to delete your account, the record — including
          progress, purchases and invoices — is removed from the database. A certificate that was already issued stays
          verifiable unless you ask for it to be withdrawn, because an employer may still hold a copy; if you would
          rather it were withdrawn, say so and the verification page will show it as withdrawn.
        </p>
        <p>Contact-form messages are kept until the question is answered, then cleared.</p>
      </InfoSection>

      <InfoSection title="Your rights">
        <InfoList
          items={[
            <><strong>See</strong> your data: most of it is on your <Link href="/dashboard/account" className="font-bold text-[#5e3de0] underline">account page</Link> and your dashboard; you can also export your learning history as CSV from the progress page.</>,
            <><strong>Correct</strong> it: change your name, email, password, profile and weekly goal from the account page.</>,
            <><strong>Delete</strong> it: ask us and we will delete the account record. You can also delete your account yourself from the account page.</>,
            <><strong>Object or restrict</strong>: write to us and tell us which use you object to; we will stop unless there is a legal reason we cannot.</>,
            <><strong>Complain</strong>: if you are not satisfied, contact the Ghana Data Protection Commission.</>,
          ]}
        />
      </InfoSection>

      <InfoSection title="Children">
        <p>
          The platform is intended for people aged 16 and over. If you are younger, please use it with a parent or
          guardian's permission — and ask them to read this page with you. If we learn that an account was created by a
          child without that permission, we will delete it on request.
        </p>
      </InfoSection>

      <InfoSection title="Changes to this policy">
        <p>
          If this policy changes in a way that affects you, the date at the top changes and — for a significant change —
          we will say so on the dashboard when you next sign in. Continuing to use the platform after a change means you
          accept the updated policy.
        </p>
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "Do you track which pages I visit?",
            a: "We record which lessons you complete, because that is what makes the dashboard and the certificate work. We do not record every page view, and there is no analytics or advertising script on the site.",
          },
          {
            q: "Can the teacher read my password?",
            a: "No. Your password is turned into a scrypt hash with a per-account salt when you set it. The check at sign-in runs the same maths again — the password itself is never stored, and nobody can recover it.",
          },
          {
            q: "What happens to my data if I stop paying?",
            a: "Nothing is deleted. Your account, progress and purchases stay exactly as they are until you ask us to remove them.",
          },
          {
            q: "How do I ask for my data or its deletion?",
            a: (
              <>
                Email <a href={`mailto:${site.supportEmail}`} className="font-bold text-[#5e3de0] underline">{site.supportEmail}</a> from the
                address on your account, or use the <Link href="/contact" className="font-bold text-[#5e3de0] underline">contact form</Link>. We reply within
                two working days and complete verified requests within 30 days.
              </>
            ),
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
