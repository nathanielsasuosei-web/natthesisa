import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import { ensureContentReady } from "@/lib/bootstrap";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { programPrice } from "@/lib/plans";
import { formatMoney } from "@/lib/pass-periods";
import { lessonCountsByCourse } from "@/lib/course-content";
import { contentTotals } from "@/lib/course-content";
import { siteUrl } from "@/config/site";
import AnimatedBackground from "@/components/AnimatedBackground";
import CourseCard from "@/components/CourseCard";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const lessonCount = contentTotals().lessons;

// Lessons can be published at any time from the owner console.
export const revalidate = 0;

export default async function LandingPage() {
  await ensureContentReady();
  const user = await getCurrentUser();
  const lessonCounts = lessonCountsByCourse();
  const appHref = user?.role === "owner" ? "/owner" : "/dashboard";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <PublicHeader appHref={user ? appHref : null} signedIn={Boolean(user)} userName={user?.name}
        userAvatar={user ? avatarHref(user) : null} />

      <main>
        <section className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14 lg:pb-24 lg:pt-20">
          <div className="relative z-10 border-y border-[#ddd8e2] py-5 lg:border-y-0 lg:border-r lg:py-8 lg:pr-8">
            <a href="#courses" className="inline-flex items-center gap-2 text-sm font-bold text-[#302b37] transition hover:text-[#5c3be4]">
              <span className="grid size-7 place-items-center rounded-full bg-[#eee9ff] text-[#6d4aff]"><Icon name="play" size={11} /></span>
              Explore courses
            </a>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#77717f] lg:flex-col">
              <span className="inline-flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={10} /></span>Sign in to open every lesson</span>
              <span className="inline-flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={10} /></span>Every lesson is open</span>
              <span className="inline-flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={10} /></span>Learn at your pace</span>
            </div>
          </div>

          <div className="animate-fade-up relative mx-auto w-full max-w-[760px]" style={{ animationDelay: ".08s" }}>
            <div className="absolute -right-5 -top-6 size-28 rounded-[32px] bg-[#ffcf59] opacity-70 blur-2xl" />
            <div className="absolute -bottom-8 -left-6 size-36 rounded-full bg-[#b8f0dc] opacity-75 blur-2xl" />
            <div className="relative rotate-[1.2deg] overflow-hidden rounded-[25px] border border-white/70 bg-[#15131b] p-2.5 shadow-[0_30px_80px_rgba(34,24,70,.24)] transition duration-500 hover:rotate-0">
              <div className="overflow-hidden rounded-[18px] bg-[#fdfdfb]">
                <div className="flex h-11 items-center border-b border-black/[.06] bg-white px-4">
                  <div className="code-dots" />
                  <span className="mx-auto -translate-x-4 rounded-md bg-[#f4f2f7] px-16 py-1 text-[9px] font-medium text-[#918a99]">{siteUrl}/learn</span>
                </div>
                <div className="grid min-h-[390px] grid-cols-[112px_1fr] sm:grid-cols-[145px_1fr]">
                  <aside className="bg-[#1c1923] px-3 py-5 text-white">
                    <Logo inverse compact className="mb-7" />
                    {[
                      ["home", "Home"], ["courses", "Courses"], ["progress", "Progress"], ["certificate", "Certificates"],
                    ].map(([icon, label], index) => (
                      <div key={label} className={`mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[9px] font-semibold ${index === 1 ? "bg-[#6d4aff] text-white" : "text-[#8f8998]"}`}>
                        <Icon name={icon as "home"} size={12} /> <span className="hidden sm:block">{label}</span>
                      </div>
                    ))}
                    <div className="mt-20 rounded-xl border border-white/10 bg-white/[.04] p-2.5">
                      <div className="mb-2 size-5 rounded-full bg-[#ffcf59]" />
                      <p className="text-[8px] font-bold">Weekly goal</p>
                      <div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#a993ff]" /></div>
                      <p className="mt-1.5 text-[7px] text-[#8f8998]">172 / 240 min</p>
                    </div>
                  </aside>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div><p className="text-[9px] font-bold uppercase tracking-wider text-[#8b8492]">Continue learning</p><h3 className="mt-1 text-base font-black tracking-tight">CSS layouts that work</h3></div>
                      <span className="grid size-7 place-items-center rounded-full bg-[#f0ecff] text-[9px] font-black text-[#5f3ee7]">AM</span>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl bg-[#eee9ff] p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-white/70 px-2 py-1 text-[8px] font-bold text-[#5c3be4]">WEB FOUNDATIONS</span>
                        <span className="text-[8px] font-bold text-[#706b77]">5 / 7 lessons</span>
                      </div>
                      <div className="mt-4 rounded-xl bg-[#1f1c27] p-3 font-mono text-[8px] leading-[1.8] text-[#a7a0b1] shadow-lg">
                        <p><span className="text-[#b6a6ff]">.card-grid</span> <span className="text-white">{"{"}</span></p>
                        <p>&nbsp;&nbsp;<span className="text-[#86d9ce]">display</span>: <span className="text-[#ffc374]">grid</span>;</p>
                        <p>&nbsp;&nbsp;<span className="text-[#86d9ce]">grid-template-columns</span>:</p>
                        <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ffc374]">repeat</span>(auto-fit, minmax(220px, 1fr));</p>
                        <p><span className="text-white">{"}"}</span></p>
                      </div>
                      <button className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#6d4aff] px-3 py-2 text-[8px] font-bold text-white">Continue lesson <Icon name="arrow-right" size={10} /></button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[['flame', '4 days', 'Streak'], ['clock', '3.2 hrs', 'This week'], ['trophy', '12', 'Lessons']].map(([icon, value, label]) => (
                        <div key={label} className="rounded-lg border border-[#ebe8ef] bg-white p-2.5">
                          <Icon name={icon as "clock"} size={12} className="text-[#6d4aff]" />
                          <p className="mt-2 text-[10px] font-black">{value}</p><p className="text-[7px] text-[#918a99]">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-float absolute -right-3 bottom-12 hidden items-center gap-2.5 rounded-2xl border border-white bg-white p-3 shadow-[0_14px_38px_rgba(36,28,61,.16)] sm:flex">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Icon name="check" size={18} /></span>
              <div><p className="text-[10px] font-extrabold">Lesson complete!</p><p className="text-[8px] text-[#89828f]">+24 learning minutes</p></div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[.06] bg-white/70 py-8 backdrop-blur">
          <div className="mx-auto grid max-w-[980px] grid-cols-2 gap-8 px-5 text-center sm:grid-cols-4">
            {[
              [String(COURSES.length), "guided courses"], [String(lessonCount), "bite-size lessons"], ["15+", "real projects"], ["100%", "learn at your pace"],
            ].map(([value, label]) => (
              <div key={label}><p className="text-2xl font-black tracking-[-.04em] text-[#27222e]">{value}</p><p className="mt-1 text-xs font-medium text-[#817a87]">{label}</p></div>
            ))}
          </div>
        </section>

        <section id="courses" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">Choose your direction</span>
          </div>
          <div className="mt-11 grid gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((program) => {
              const course = COURSES.find((item) => item.category === program.category);
              return course ? <CourseCard key={course.id} course={course} hrefBase="public" /> : null;
            })}
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {["HTML & CSS", "JavaScript", "React", "React Native", "Node.js", "Algorithms", "APIs", "Git & deployment"].map((tag) => (
              <span key={tag} className="rounded-full border border-[#ded9e6] bg-white px-3.5 py-2 text-xs font-semibold text-[#6f6877]">{tag}</span>
            ))}
          </div>
        </section>

        <section id="programs" className="border-y border-black/[.06] bg-white py-24">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">Seven programs</span>
              <h2 className="mt-3 text-balance text-3xl font-black tracking-[-.045em] sm:text-5xl">Everything sits under a program you can finish.</h2>
              <p className="mt-4 text-sm leading-6 text-[#77717e]">
                Each program is a set of complete courses that build on each other — so the path from your first
                lesson to a portfolio project is already drawn.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {PROGRAMS.map((program) => {
                const courses = COURSES.filter((course) => course.category === program.category);
                const lessons = courses.reduce((sum, course) => sum + lessonCounts[course.id], 0);
                return (
                  <article key={program.id} className="flex flex-col overflow-hidden rounded-[24px] border border-[#e8e4ec] bg-[#fbfafc]">
                    {program.cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={program.cover} alt={`${program.name} artwork`} className="h-40 w-full object-cover" />
                    ) : null}
                    <div className="flex flex-1 flex-col p-6">
                    <span className="grid size-12 place-items-center rounded-2xl bg-[#6d4aff] text-white"><Icon name={program.icon} size={22} /></span>
                    <h3 className="mt-5 text-lg font-black tracking-[-.02em]">{program.name}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#6d4aff]">{program.tagline}</p>
                    <p className="mt-3 flex-1 text-sm leading-6 text-[#6e6875]">{program.description}</p>
                    <p className="mt-5 text-[11px] font-bold text-[#8a8390]">{courses.length} courses · {lessons} lessons</p>
                    <ul className="mt-3 space-y-2 text-xs text-[#5e5864]">
                      {courses.map((course) => (
                        <li key={course.id} className="flex items-center gap-2"><Icon name="check" size={13} className="text-emerald-600" />{course.title}</li>
                      ))}
                    </ul>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-[#19171f] p-6 text-white">
              <div>
                <h3 className="text-base font-black tracking-[-.02em]">Write the code while you learn it</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#aaa4b1]">
                  Every student gets the Code lab — an editor and live preview in the browser, plus a console for
                  JavaScript. And the teacher edits pictures and video in the Studio.
                </p>
              </div>
              <Link href="/login?mode=signup" className="rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5">Open the Code lab</Link>
            </div>
          </div>
        </section>

        {/* Pricing section hidden for now. Uncomment to restore.
        <section id="pricing" className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8">
          <div className="text-center"><span className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">Seven programs, one price each</span><h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">Buy a program to open it.</h2><p className="mt-4 text-sm text-[#77717e]">Sign in, then buy a program once. It opens every course and lesson inside, permanently.</p></div>
          <div className="open-plan-grid mt-12 grid gap-0 md:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((program) => (
              <article key={program.id} className="open-plan flex flex-col">
                <h3 className="text-lg font-black">{program.name}</h3>
                <p className="mt-1 text-sm text-[#7b7481]">{program.tagline}</p>
                <p className="mt-6"><span className="text-4xl font-black tracking-[-.05em]">{formatMoney(programPrice(program.id))}</span></p>
                <ul className="mt-7 flex-1 space-y-3 text-sm text-[#625c69]">
                  {["Every course and lesson inside", "Listen to any lesson", "Files and videos included", "Sign in to open the lessons"].map((feature) => (
                    <li key={feature} className="flex gap-2.5"><Icon name="check" size={16} className="text-emerald-600" />{feature}</li>
                  ))}
                </ul>
                <Link href="/login?mode=signup" className="mt-8 rounded-xl border border-[#dad5df] bg-[#faf9fb] px-4 py-3 text-center text-sm font-extrabold text-[#302b37] transition hover:-translate-y-0.5 hover:border-[#bdb3dc]">Sign in to start</Link>
              </article>
            ))}
          </div>
          <p className="mt-5 text-center text-[11px] text-[#98919e]">Your account keeps your progress and prints your certificate. Each program is paid once, through Mobile Money or card.</p>
        </section>
        */}

        <section className="border-t border-black/[.06] bg-white py-24">
          <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#efe9ff] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#5c3be4]">
                <Icon name="spark" size={14} /> Meet Natthesisa
              </span>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-.045em] sm:text-4xl">Stuck at midnight? Ask Natthesisa.</h2>
              <p className="mt-4 text-[15px] leading-7 text-[#6e6875]">
                Your AI study companion lives inside every lesson. Ask about the current
                material, get a quiz or code review, and build code, websites, or React Native
                app starters. Chat is free; project generation is available to signed-in students.
              </p>
              <ul className="mt-6 space-y-3">
                {["Lesson-aware explanations and helpful practice hints", "Quizzes with answers that teach, not just grade", "Generate code, build websites and create mobile-app starters"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-semibold text-[#49434f]">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#f0ecff] text-[#6d4aff]"><Icon name="check" size={13} /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/natthesisa" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(109,74,255,.3)] transition hover:-translate-y-0.5">
                  Chat with Natthesisa <Icon name="arrow-right" size={15} />
                </Link>
                <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl border border-[#dad5df] bg-white px-5 py-3 text-sm font-extrabold text-[#302b37] transition hover:-translate-y-0.5">
                  Browse courses
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -right-4 -top-4 size-28 rounded-[28px] bg-[#ffcf59] opacity-70 blur-2xl" />
              <div className="relative rounded-[24px] border border-[#e7e2ee] bg-[#faf9fc] p-5 shadow-[0_24px_60px_rgba(36,28,61,.12)]">
                <div className="flex items-center gap-2.5 border-b border-black/[.06] pb-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#8b6bff] to-[#6d4aff] text-xs font-black text-white">N</span>
                  <div><p className="text-[13px] font-black">Natthesisa</p><p className="text-[10px] text-emerald-600">● Online · replies instantly</p></div>
                </div>
                <div className="space-y-3 pt-4">
                  <div className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#6d4aff] px-3.5 py-2.5 text-[12px] leading-5 text-white">What should I learn first? I&apos;m brand new 🌱</p></div>
                  <div className="flex gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#8b6bff] to-[#6d4aff] text-[10px] font-black text-white">N</span><p className="max-w-[88%] rounded-2xl rounded-tl-md border border-[#ece8f1] bg-white px-3.5 py-2.5 text-[12px] leading-5 text-[#35313d]">Start with <strong>Web Foundations</strong> — HTML, CSS, and your first published site. Then JavaScript to make it interactive. Want a quiz to check the basics?</p></div>
                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {["Quiz me", "Show courses", "Explain HTML"].map((chip) => (
                      <span key={chip} className="rounded-full border border-[#ddd5f5] bg-[#faf8ff] px-2.5 py-1 text-[10px] font-bold text-[#5c3be4]">{chip}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-[#6040e5] bg-[#6d4aff] text-white">
          <div className="relative mx-auto max-w-[1120px] px-7 py-16 text-center sm:px-12">
            <div className="absolute -left-12 -top-20 size-52 rounded-full border-[35px] border-white/10" /><div className="absolute -bottom-16 -right-10 size-48 rounded-full bg-[#ffcf59]/30" />
            <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><Icon name="spark" size={14} /> Your next project starts here</span><h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-black tracking-[-.045em] sm:text-5xl">Start building the future you keep thinking about.</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-violet-100">Create your free learner account and complete your first lesson today.</p><Link href="/login?mode=signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#5b39dc] shadow-xl transition hover:-translate-y-1">Create free account <Icon name="arrow-right" size={16} /></Link></div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
