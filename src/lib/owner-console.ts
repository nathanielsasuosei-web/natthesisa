import { COURSES, getCourse, getCourseLessons } from "./courses";
import { contentPercent, ownerLessonSummaries } from "./course-content";
import { coursePrice, lessonPrice, programPrice, type PassPeriod } from "./plans";
import { PROGRAMS, programForCategory } from "./programs";
import { hasActivePass } from "./access";
import { grantAccess, grantPass, grantProgram } from "./purchases";
import {
  User,
  completedLessonCount,
  deleteAccount,
  getUserById,
  listUsers,
  logActivity,
  saveUser,
} from "./store";
import { OWNER_IMMUTABLE_ERROR, isOwner } from "./owner";

/**
 * The teacher's tools.
 *
 * Only the owner reaches this module (every route that calls it checks
 * `getCurrentOwner()` first). There is no administrator role any more: the
 * owner manages students, prices and content, and every other account is a
 * student.
 */

export class OwnerConsoleError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "BAD_REQUEST", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  owner: boolean;
  suspended: boolean;
  createdAt: string;
  /** Programs owned — the only access that matters. */
  programsOwned: string[];
  /** Purchases on record (programs; older course/lesson rows are history). */
  purchases: number;
  coursesStarted: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  lifetimeMinutes: number;
  invoices: number;
  revenue: number;
  /** True when the student has added a profile picture. */
  hasAvatar: boolean;
  /** Upload time of the picture, used to version the URL; null when there is none. */
  avatarVersion: string | null;
}

export function toStudentRow(user: User): StudentRow {
  const progress = Object.values(user.progress);
  const completedCourses = progress.filter((item) => {
    const course = getCourse(item.courseId);
    return course ? contentPercent(course, item.completedLessonIds) === 100 : false;
  }).length;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    owner: isOwner(user),
    suspended: user.suspended,
    createdAt: user.createdAt,
    programsOwned: user.purchases
      .filter((item) => item.kind === "program")
      .map((item) => PROGRAMS.find((program) => program.id === item.refId)?.name ?? item.refId),
    purchases: user.purchases.length,
    coursesStarted: progress.length,
    coursesCompleted: completedCourses,
    lessonsCompleted: completedLessonCount(user),
    lifetimeMinutes: user.lifetimeMinutes,
    invoices: user.invoices.length,
    revenue: user.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    hasAvatar: Boolean(user.avatar),
    avatarVersion: user.avatar?.updatedAt ?? null,
  };
}

export interface OwnerStats {
  totalUsers: number;
  students: number;
  suspended: number;
  /** Students who own at least one program — the ones who can learn. */
  withProgram: number;
  lessonsCompleted: number;
  learningMinutes: number;
  certificatesEarned: number;
  totalRevenue: number;
  invoiceCount: number;
  /** How many students own each program right now. */
  byProgram: Array<{ programId: string; name: string; price: number; count: number }>;
  coursePerformance: Array<{
    courseId: string;
    title: string;
    price: number;
    enrollments: number;
    completions: number;
    lessonsCompleted: number;
  }>;
}

export async function computeOwnerStats(): Promise<OwnerStats> {
  const users = await listUsers();
  const students = users.filter((user) => !isOwner(user));
  const ownsAnyProgram = (user: User): boolean => user.purchases.some((item) => item.kind === "program");
  const coursePerformance = COURSES.map((course) => {
    const records = students.map((user) => user.progress[course.id]).filter((item) => Boolean(item));
    const program = programForCategory(course.category);
    return {
      courseId: course.id,
      title: course.shortTitle,
      price: program ? programPrice(program.id) : coursePrice(course.id),
      enrollments: records.length,
      completions: records.filter((item) => contentPercent(course, item.completedLessonIds) === 100).length,
      lessonsCompleted: records.reduce((sum, item) => sum + item.completedLessonIds.length, 0),
    };
  });
  return {
    totalUsers: users.length,
    students: students.length,
    suspended: students.filter((user) => user.suspended).length,
    withProgram: students.filter(ownsAnyProgram).length,
    lessonsCompleted: students.reduce((sum, user) => sum + completedLessonCount(user), 0),
    learningMinutes: students.reduce((sum, user) => sum + user.lifetimeMinutes, 0),
    certificatesEarned: coursePerformance.reduce((sum, item) => sum + item.completions, 0),
    totalRevenue: users.reduce(
      (sum, user) => sum + user.invoices.reduce((invoiceSum, invoice) => invoiceSum + invoice.amount, 0),
      0
    ),
    invoiceCount: users.reduce((sum, user) => sum + user.invoices.length, 0),
    byProgram: PROGRAMS.map((program) => ({
      programId: program.id,
      name: program.name,
      price: programPrice(program.id),
      count: students.filter((user) =>
        user.purchases.some((item) => item.kind === "program" && item.refId === program.id)
      ).length,
    })),
    coursePerformance,
  };
}

/**
 * Real money in the last 30 days, from paid invoice dates — used on the
 * console's revenue card. Programs are one-off purchases, so this is what
 * actually arrived, not a renewal projection.
 */
export async function estimateMonthlyRevenue(): Promise<number> {
  const users = await listUsers();
  const since = Date.now() - 30 * 86_400_000;
  return users.reduce((sum, user) => {
    if (isOwner(user)) return sum;
    return (
      sum +
      user.invoices
        .filter((invoice) => new Date(invoice.date).getTime() >= since)
        .reduce((invoiceSum, invoice) => invoiceSum + invoice.amount, 0)
    );
  }, 0);
}

async function targetStudent(userId: string): Promise<User> {
  const user = await getUserById(userId);
  if (!user) throw new OwnerConsoleError("Student not found.", "NOT_FOUND", 404);
  if (isOwner(user)) throw new OwnerConsoleError(OWNER_IMMUTABLE_ERROR.error, OWNER_IMMUTABLE_ERROR.code, 403);
  return user;
}

export async function ownerSuspendStudent(owner: User, userId: string, suspended: boolean): Promise<User> {
  const student = await targetStudent(userId);
  if (student.id === owner.id) throw new OwnerConsoleError("You cannot pause your own account.", "SELF_ACTION");
  student.suspended = suspended;
  logActivity(student, suspended ? "Account paused by your teacher" : "Account restored by your teacher", "owner");
  logActivity(owner, `${suspended ? "Paused" : "Restored"} ${student.name}'s account`, "owner");
  await saveUser(student);
  await saveUser(owner);
  return student;
}

export async function ownerResetProgress(owner: User, userId: string): Promise<User> {
  const student = await targetStudent(userId);
  student.progress = {};
  student.usage = {
    ...student.usage,
    minutes: 0,
    history: student.usage.history.map((day) => ({ ...day, count: 0 })),
    creditedLessonIds: [],
  };
  student.lifetimeMinutes = 0;
  logActivity(student, "Learning progress reset by your teacher", "owner");
  logActivity(owner, `Reset learning progress for ${student.name}`, "owner");
  await saveUser(student);
  await saveUser(owner);
  return student;
}

export async function ownerDeleteStudent(owner: User, userId: string): Promise<void> {
  const student = await targetStudent(userId);
  if (student.id === owner.id) throw new OwnerConsoleError("You cannot delete your own account.", "SELF_ACTION");
  await deleteAccount(userId);
  logActivity(owner, `Deleted ${student.name}'s account`, "owner");
  await saveUser(owner);
}

/** Gives a student time on the house, without a payment. */
export async function ownerGrantPass(owner: User, userId: string, period: PassPeriod): Promise<User> {
  const student = await targetStudent(userId);
  await grantPass(owner, student, period);
  await saveUser(student);
  await saveUser(owner);
  return student;
}

/** Opens a course or lesson for a student, without a payment. */
export async function ownerGrantAccess(
  owner: User,
  userId: string,
  courseId: string,
  lessonId?: string
): Promise<User> {
  const student = await targetStudent(userId);
  await grantAccess(owner, student, courseId, lessonId);
  await saveUser(student);
  await saveUser(owner);
  return student;
}

/** Opens a whole program for a student, without a payment. */
export async function ownerGrantProgram(owner: User, userId: string, programId: string): Promise<User> {
  const student = await targetStudent(userId);
  await grantProgram(owner, student, programId);
  await saveUser(student);
  await saveUser(owner);
  return student;
}

/* -------------------------------------------------------------------------- */
/* Prices                                                                     */
/* -------------------------------------------------------------------------- */

export interface PriceRow {
  id: string;
  title: string;
  courseTitle: string;
  price: number;
}

/** Every lesson the owner can price: catalog lessons and published ones. */
export function lessonPriceRows(): PriceRow[] {
  const builtIn = COURSES.flatMap((course) =>
    getCourseLessons(course).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      courseTitle: course.shortTitle,
      price: lessonPrice(lesson.id),
    }))
  );
  // Lessons the owner uploaded live outside COURSES; they can be re-priced too.
  const uploaded = ownerLessonSummaries().map(({ record, courseTitle }) => ({
    id: record.id,
    title: record.title,
    courseTitle,
    price: lessonPrice(record.id),
  }));
  return [...builtIn, ...uploaded];
}

export function coursePriceRows(): PriceRow[] {
  return COURSES.map((course) => ({
    id: course.id,
    title: course.title,
    courseTitle: course.shortTitle,
    price: coursePrice(course.id),
  }));
}

/** Every program the owner can price — the one price list that matters. */
export function programPriceRows(): PriceRow[] {
  return PROGRAMS.map((program) => ({
    id: program.id,
    title: program.name,
    courseTitle: program.tagline,
    price: programPrice(program.id),
  }));
}
