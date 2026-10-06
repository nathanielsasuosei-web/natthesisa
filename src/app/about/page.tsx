import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import { ensureContentReady } from "@/lib/bootstrap";
import { PROGRAMS } from "@/lib/programs";
import { contentTotals } from "@/lib/course-content";
import { brandAssets } from "@/config/branding";
import InfoPage, { InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "About us",
  description:
    "codemasterghana is a Ghanaian learning platform for web, app and computer-science skills: short lessons, real projects, verifiable certificates.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  await ensureContentReady();
  const user = await getCurrentUser();
  const totals = contentTotals();
  const appHref = user ? (user.role === "owner" ? "/owner" : "/dashboard") : null;

  return (
    <InfoPage
      eyebrow="About us"
      title="Coding skills, taught the way Ghana learns"
      intro="codemasterghana is a learning platform built in Accra. Short lessons, practice after each idea, a real project at the end of every course — and a certificate an employer can check for themselves."
      appHref={appHref}
      signedIn={Boolean(user)}
      userName={user?.name}
      userAvatar={user ? avatarHref(user) : null}
    >
      <section className="overflow-hidden rounded-[22px] border border-[#e8e4ec] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandAssets.vibeCoding} alt="Vibe Coding course artwork" className="h-52 w-full object-cover sm:h-64" />
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-black tracking-[-.03em]">Why we built it</h2>
          <p className="mt-3 text-sm leading-7 text-[#5d5763]">
            Watching videos is not learning. Most people who start a coding tutorial series never finish their first
            project, because nothing in the middle asks them to build anything. We wanted the opposite: every lesson
            ends in something you can run, every course ends in something you can show, and every certificate says
            exactly what you did to earn it.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#5d5763]">
            It is also built for how people here actually study — in the evening after work, on a phone as often as a
            laptop, on data that costs money. Lessons are short, the site works on a small screen, and there are no
            video ads in the middle of a lesson.
          </p>
        </div>
      </section>

      <InfoSection title="What is on the platform">
        <p>
          {totals.lessons} lessons across {totals.courses} courses, in three programs plus the web, app and backend
          paths:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PROGRAMS.map((program) => (
            <div key={program.id} className="rounded-2xl border border-[#e8e4ec] bg-white p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={program.icon} size={17} /></span>
              <p className="mt-3 text-sm font-extrabold text-[#332e39]">{program.name}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7d7683]">{program.tagline}</p>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="How learning here works">
        <InfoList
          items={[
            <>A <strong>program</strong> is the one thing you pay for — one payment opens every course and every lesson under it, permanently. Prices are set by your teacher and shown on the <Link href="/pricing" className="font-bold text-[#5e3de0] underline">pricing page</Link>.</>,
            <>Nothing else opens without the program — that is what keeps the platform funded and the lessons coming. There are no free previews and nothing to renew: what you buy stays open forever.</>,
            <>Every course is <strong>practical</strong>: a reading, a worked example, then a challenge to try. Your progress is saved as you go.</>,
            <><strong>A certificate at the end</strong>, with an ID and a QR code that opens a public verification page — useful when you are applying for a job or a contract.</>,
            <>A <strong>code lab</strong> in the dashboard: write HTML, CSS and JavaScript in the browser with a live preview, and download what you make.</>,
          ]}
        />
      </InfoSection>

      <InfoSection title="Certificates employers can check">
        <p>
          A certificate is worth something only if it can be verified. Every codemasterghana certificate carries a
          code such as <span className="font-mono text-xs font-bold text-[#332e39]">CMG-WF-2026-7KQ2M4</span>, a QR
          code, the course, the number of lessons, the study hours and the date. Anyone — an employer, a client, a
          school — can open <Link href="/verify" className="font-bold text-[#5e3de0] underline">the verification page</Link> and
          confirm it in seconds, without an account.
        </p>
        <p>
          If a certificate was earned by cheating, the teacher can withdraw it, and the verification page says so
          instead of showing it as valid.
        </p>
      </InfoSection>

      <InfoSection title="Who teaches">
        <p>
          Courses are written and taught by the codemasterghana teacher, who also sets every price, publishes
          lessons, and can be reached directly from the <Link href="/contact" className="font-bold text-[#5e3de0] underline">contact page</Link>.
          There is one teacher account and as many student accounts as you like — no anonymous content farm, and
          nobody can publish lessons but the teacher.
        </p>
      </InfoSection>

      <InfoSection title="Where we are going">
        <InfoList
          items={[
            "More Ghanaian project work: a bus-fare tracker, a market-price board, a school report tool.",
            "Mobile Money payments through a verified gateway, so a program can be bought in seconds from any network.",
            "School and study-group plans, with a class code and a teacher view of everyone's progress.",
            "Twi and Ewe subtitles on the lesson videos.",
          ]}
        />
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "Is the platform only for people in Ghana?",
            a: "The courses are global — HTML, JavaScript, algorithms and AI tooling are the same everywhere. The pricing is in Ghana cedis, the examples use local projects, and support answers in English or Twi during Ghanaian working hours.",
          },
          {
            q: "Do I need my own computer?",
            a: "A phone works for reading lessons, and the code lab runs in the browser. For the project work in the web, mobile and backend courses a laptop makes life much easier — a shared one is fine.",
          },
          {
            q: "Is any of this a real payment right now?",
            a: (
              <>
                No. The checkout, program purchases and invoices are fully built and recorded in the database, but no
                money moves and no card or Mobile Money number is ever asked for. See the{" "}
                <Link href="/pricing" className="font-bold text-[#5e3de0] underline">pricing page</Link> for what that means.
              </>
            ),
          },
        ]}
      />
    </InfoPage>
  );
}
