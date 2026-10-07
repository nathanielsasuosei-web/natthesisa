/** Small, browser-safe contract shared by Natthesisa's project builder and Code Lab. */
export type ProjectTarget = "website" | "mobile-app" | "code";

export interface NatthesisaProjectFile {
  name: string;
  content: string;
}

export interface NatthesisaProject {
  target: ProjectTarget;
  title: string;
  summary: string;
  files: NatthesisaProjectFile[];
  engine?: "cloud" | "starter";
}

/** One-time handoff from the assistant to Code Lab in the same browser tab. */
export const NATTHESISA_PROJECT_TRANSFER_KEY = "natthesisa-project-transfer-v1";
