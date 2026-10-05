import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { site } from "@/config/site";
import { ownerDisplayName } from "@/lib/owner";
import InfoPage, { InfoFaq, InfoSection } from "@/components/InfoPage";
import ContactForm from "@/components/ContactForm";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Talk to the codemasterghana teacher: questions about a course, a certificate check, group pricing or a problem with your account.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await getCurrentUser();
  const appHref = user ? (user.role === "owner" ? "/owner" : "/dashboard") : null;
  const teacher = ownerDisplayName();

  return (
    <InfoPage
      eyebrow="Contact"
      title="Talk to your teacher"
      intro="Questions about a course, a certificate an employer is checking, a group price for your school, or something that is not working — send a message and it comes straight to the teacher's inbox."
      appHref={appHref}
      signedIn={Boolean(user)}
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <ContactForm signedIn={Boolean(user)} defaultName={user?.name ?? ""} defaultEmail={user?.email ?? ""} />

        <div className="space-y-4">
          <div className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
            <h2 className="text-sm font-extrabold">Direct contact</h2>
            <ul className="mt-3 space-y-3 text-sm text-[#5d5763]">
              <li className="flex items-start gap-2.5">
                <Icon name="mail" size={16} className="mt-0.5 text-[#6d4aff]" />
                <span>
                  <a href={`mailto:${site.supportEmail}`} className="font-bold text-[#5e3de0] underline">{site.supportEmail}</a>
                  <span className="mt-0.5 block text-[11px] text-[#918a97]">Reaches {teacher} directly</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="globe" size={16} className="mt-0.5 text-[#6d4aff]" />
                <span>
                  Accra, Ghana
                  <span className="mt-0.5 block text-[11px] text-[#918a97]">Support hours: Mon–Fri, 08:00–18:00 GMT</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="clock" size={16} className="mt-0.5 text-[#6d4aff]" />
                <span>
                  Two working days
                  <span className="mt-0.5 block text-[11px] text-[#918a97]">Usually much sooner, in English or Twi</span>
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
            <h2 className="text-sm font-extrabold">Faster answers</h2>
            <ul className="mt-3 space-y-2.5 text-[12px] text-[#5d5763]">
              <li className="flex items-start gap-2.5"><Icon name="shield" size={15} className="mt-0.5 text-[#6d4aff]" /><span><strong>Checking a certificate?</strong> Use the <a href="/verify" className="font-bold text-[#5e3de0] underline">verification page</a> — it answers instantly, no message needed.</span></li>
              <li className="flex items-start gap-2.5"><Icon name="card" size={15} className="mt-0.5 text-[#6d4aff]" /><span><strong>Prices and invoices?</strong> See the <a href="/pricing" className="font-bold text-[#5e3de0] underline">pricing page</a> and your billing page.</span></li>
              <li className="flex items-start gap-2.5"><Icon name="lock" size={15} className="mt-0.5 text-[#6d4aff]" /><span><strong>Password or email change?</strong> Do it yourself on the account page; message us only if you are locked out.</span></li>
              <li className="flex items-start gap-2.5"><Icon name="briefcase" size={15} className="mt-0.5 text-[#6d4aff]" /><span><strong>School or company?</strong> Mention how many learners and which courses — you get a group price.</span></li>
            </ul>
          </div>
        </div>
      </div>

      <InfoSection title="What happens to your message">
        <p>
          Messages sent from this form are stored in the platform's own database and shown in the teacher's console —
          they are not sent to a third-party mailing service. Your name, email address and message are used only to
          answer you. See the <a href="/privacy" className="font-bold text-[#5e3de0] underline">privacy policy</a> for
          the full picture and for how to have the message removed.
        </p>
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "I paid for a pass but a lesson is still locked.",
            a: "A pass and a purchase are both needed to open a paid lesson: the pass opens the platform, and the course or lesson has to be bought. Check your billing page to see what you own — and if something looks wrong, message us with the course name.",
          },
          {
            q: "My certificate code does not verify.",
            a: "First check for a typo — the code looks like CMG-WF-2026-7KQ2M4 and the O/0 and I/1 characters are deliberately not used. If it still fails, send us the name and course on the certificate and we will check it by hand.",
          },
          {
            q: "Can you teach my class or run a workshop?",
            a: "Yes. Send the number of learners, their level and the dates, and we will put together a plan — in person in Accra or online.",
          },
        ]}
      />
    </InfoPage>
  );
}
