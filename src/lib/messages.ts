import { readState, readStateFresh, writeState } from "./app-state";
import { MESSAGE_TOPICS, type MessageTopic } from "./message-topics";

/**
 * Messages sent from the public contact form.
 *
 * They are kept in `app_state` under one key rather than its own table: the
 * volume is tiny (a teacher answering a few questions a week), and the record
 * is written and read by one console page. Nothing here is public — only the
 * owner console reads these, and the reply goes out by email.
 *
 * The key is written through `writeState` (cache + database) but always read
 * fresh on the console page: on a serverless host every instance has its own
 * cache, and a message written by one instance must be visible to the one that
 * renders the console.
 */

export const MESSAGES_KEY = "contact-messages";

export { MESSAGE_TOPICS } from "./message-topics";
export type { MessageTopic } from "./message-topics";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: MessageTopic;
  subject: string;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  answered: boolean;
  /** Signed-in sender, when there was one. */
  userId?: string;
}

export interface MessageInput {
  name: string;
  email: string;
  topic?: string;
  subject?: string;
  body: string;
  userId?: string;
}

const MAX_MESSAGES = 500;
const TOPIC_IDS = new Set<string>(MESSAGE_TOPICS.map((topic) => topic.id));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let counter = 0;

export function makeMessageId(): string {
  counter = (counter + 1) % 10_000;
  const stamp = Date.now().toString(36).toUpperCase();
  const tail = counter.toString(36).toUpperCase().padStart(2, "0");
  return `MSG-${stamp}-${tail}`;
}

/** Validation shared by the API route and any caller. Returns an error text or null. */
export function messageProblem(input: MessageInput): string | null {
  const name = input.name.trim();
  const email = input.email.trim();
  const body = input.body.trim();
  if (name.length < 2) return "Please tell us your name.";
  if (name.length > 80) return "That name is too long — please use 80 characters or fewer.";
  if (!emailPattern.test(email) || email.length > 160) return "That email address does not look right.";
  if (body.length < 10) return "Please write a little more — at least a sentence.";
  if (body.length > 4000) return "That message is too long — please keep it under 4000 characters.";
  if (input.subject && input.subject.trim().length > 120) return "Please keep the subject under 120 characters.";
  return null;
}

function normalise(input: MessageInput): ContactMessage {
  const topic = (input.topic ?? "other") as MessageTopic;
  return {
    id: makeMessageId(),
    name: input.name.trim().slice(0, 80),
    email: input.email.trim().slice(0, 160),
    topic: TOPIC_IDS.has(topic) ? topic : "other",
    subject: (input.subject ?? "").trim().slice(0, 120),
    body: input.body.trim().slice(0, 4000),
    createdAt: new Date().toISOString(),
    answered: false,
    ...(input.userId ? { userId: input.userId } : {}),
  };
}

/** Appends a message. Returns the stored record. */
export async function saveMessage(input: MessageInput): Promise<ContactMessage> {
  const record = normalise(input);
  const current = await readStateFresh<ContactMessage[]>(MESSAGES_KEY);
  const list = Array.isArray(current) ? current : readState<ContactMessage[]>(MESSAGES_KEY, []);
  const next = [record, ...list].slice(0, MAX_MESSAGES);
  await writeState(MESSAGES_KEY, next);
  return record;
}

/** Every message, newest first, read straight from the database. */
export async function allMessages(): Promise<ContactMessage[]> {
  const current = await readStateFresh<ContactMessage[]>(MESSAGES_KEY);
  return Array.isArray(current) ? current : [];
}

export async function messageStats(): Promise<{ total: number; open: number }> {
  const list = await allMessages();
  return { total: list.length, open: list.filter((message) => !message.answered).length };
}

export async function setMessageAnswered(id: string, answered: boolean): Promise<ContactMessage | null> {
  const list = await allMessages();
  let updated: ContactMessage | null = null;
  const next = list.map((message) => {
    if (message.id !== id) return message;
    updated = { ...message, answered };
    return updated;
  });
  if (!updated) return null;
  await writeState(MESSAGES_KEY, next);
  return updated;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const list = await allMessages();
  const next = list.filter((message) => message.id !== id);
  if (next.length === list.length) return false;
  await writeState(MESSAGES_KEY, next);
  return true;
}
