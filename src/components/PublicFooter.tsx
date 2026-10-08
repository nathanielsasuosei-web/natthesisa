import Link from "next/link";
import { site } from "@/config/site";
import { COURSES } from "@/lib/courses";
import Logo from "./Logo";
import Icon from "./Icon";

/**
 * The footer every public page shares. It carries the navigation that does not
 * belong in the header (the legal pages, certificate verification, the teacher
 * door) and the catalogue, so a course is never more than one click from the
 * bottom of any page.
 */
export default function PublicFooter() {
  const featured = COURSES.filter((course) => course.featured).slice(0, 4);
  const courses = (featured.length ? featured : COURSES.slice(0, 4));

  return (
    <footer className="border-t border-black/[.06] bg-white print:hidden">
      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo showTagline />
            <p className="mt-4 max-w-xs text-xs leading-6 text-[#7d7683]">
              Practical coding courses for Ghana and beyond. Learn at your pace, build real projects and earn a
              certificate employers can verify.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/login?mode=signup" className="inline-flex items-center gap-1.5 rounded-xl bg-[#17151f] px-3.5 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#2a2632]">
                Start learning <Icon name="arrow-right" size={13} />
              </Link>
              <Link href="/verify" className="inline-flex items-center gap-1.5 rounded-xl border border-[#ddd9e2] px-3.5 py-2.5 text-[11px] font-bold text-[#4a4450] transition hover:bg-[#f7f5f9]">
                <Icon name="shield" size={13} /> Verify a certificate
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#8a8390]">Learn</p>
            <ul className="mt-4 space-y-2.5 text-xs text-[#5e5864]">
              <li><Link href="/courses" className="transition hover:text-[#5c3be4]">All courses</Link></li>
              <li><Link href="/#programs" className="transition hover:text-[#5c3be4]">Programs</Link></li>
              <li><Link href="/pricing" className="transition hover:text-[#5c3be4]">Pricing &amp; payment</Link></li>
              <li><Link href="/#how-it-works" className="transition hover:text-[#5c3be4]">How it works</Link></li>
              <li><Link href="/verify" className="transition hover:text-[#5c3be4]">Verify a certificate</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#8a8390]">Popular courses</p>
            <ul className="mt-4 space-y-2.5 text-xs text-[#5e5864]">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link href={`/dashboard/courses/${course.slug}`} className="transition hover:text-[#5c3be4]">{course.shortTitle}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#8a8390]">Company</p>
            <ul className="mt-4 space-y-2.5 text-xs text-[#5e5864]">
              <li><Link href="/about" className="transition hover:text-[#5c3be4]">About us</Link></li>
              <li><Link href="/contact" className="transition hover:text-[#5c3be4]">Contact</Link></li>
              <li><Link href="/terms" className="transition hover:text-[#5c3be4]">Terms &amp; conditions</Link></li>
              <li><Link href="/privacy" className="transition hover:text-[#5c3be4]">Privacy policy</Link></li>
              <li><Link href="/owner-sign-in" className="transition hover:text-[#5c3be4]">Teacher sign in</Link></li>
            </ul>
            <p className="mt-4 text-[11px] text-[#7d7683]">
              <a href={`mailto:${site.supportEmail}`} className="inline-flex items-center gap-1.5 font-bold text-[#5e3de0] transition hover:underline">
                <Icon name="mail" size={13} /> {site.supportEmail}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#eeeaf1] pt-6 text-[11px] text-[#918a97] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Built in Accra, Ghana.</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Lessons open after sign-in and program purchase</span>
            <span className="hidden sm:inline">·</span>
            <span>Programs are paid once</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
