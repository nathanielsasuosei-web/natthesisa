import type { CourseModule } from "@/lib/courses";
import { CS_NETWORKING_MODULE } from "@/content/cyber-security/networking";
import { CS_LINUX_MODULE } from "@/content/cyber-security/linux";
import { CS_PROGRAMMING_MODULE } from "@/content/cyber-security/programming";

/**
 * Cyber Security · Foundations: networking, Linux and programming for security.
 * Each module lives in src/content/cyber-security/ so every file stays reviewable.
 */
export const CYBER_SECURITY_FOUNDATIONS_MODULES: CourseModule[] = [
  CS_NETWORKING_MODULE,
  CS_LINUX_MODULE,
  CS_PROGRAMMING_MODULE,
];
