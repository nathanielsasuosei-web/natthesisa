/**
 * Contact-form topics. Split from `lib/messages.ts` on purpose: the client
 * component needs these labels, and `lib/messages.ts` imports the database
 * layer — importing it from a client component would pull `pg` into the
 * browser bundle (the same trap `lib/plans.ts` has).
 */

export type MessageTopic = "course" | "certificate" | "payment" | "school" | "account" | "other";

export const MESSAGE_TOPICS: Array<{ id: MessageTopic; label: string }> = [
  { id: "course", label: "A course or lesson" },
  { id: "certificate", label: "A certificate check" },
  { id: "payment", label: "Passes, prices or an invoice" },
  { id: "school", label: "School, company or group training" },
  { id: "account", label: "My account or sign-in" },
  { id: "other", label: "Something else" },
];
