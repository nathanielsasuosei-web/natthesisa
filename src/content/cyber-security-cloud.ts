import type { CourseModule } from "@/lib/courses";
import { CS_CLOUD_FOUNDATIONS_MODULE } from "@/content/cyber-security/cloud-foundations";
import { CS_CLOUD_WORKLOADS_MODULE } from "@/content/cyber-security/cloud-workloads-and-data";
import { CS_CLOUD_POSTURE_MODULE } from "@/content/cyber-security/cloud-posture-and-response";

/**
 * Cyber Security · Cloud security: foundations, workloads and data, posture and response.
 */
export const CYBER_SECURITY_CLOUD_MODULES: CourseModule[] = [
  CS_CLOUD_FOUNDATIONS_MODULE,
  CS_CLOUD_WORKLOADS_MODULE,
  CS_CLOUD_POSTURE_MODULE,
];
