import { Fragment, type ReactNode } from "react";

/**
 * The tiny amount of markup a textbook lesson needs.
 *
 * Lesson prose is written as plain text in `src/content/*` so that the content
 * stays readable in a diff and cannot smuggle HTML into a learner's page. This
 * module turns that text into React nodes:
 *
 *   - a blank line separates paragraphs
 *   - a line starting with `- ` or `* ` is a bullet, `1. ` a numbered step
 *   - `` `code` `` becomes an inline code span
 *   - `**bold**` and `_emphasis_` become what they say
 *   - a leading `> ` makes the paragraph a pull quote
 *
 * There is no escape hatch to raw HTML on purpose.
 */

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_)/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_PATTERN).filter((part) => part !== "");
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded-[5px] bg-[#efecf4] px-[5px] py-[1px] font-mono text-[.86em] font-semibold text-[#4a3a86]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-extrabold text-[#2c2733]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return (
        <em key={key} className="font-semibold italic text-[#4c4655]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Block =
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function blocks(body: string): Block[] {
  const out: Block[] = [];
  for (const chunk of body.split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (!lines.length) continue;

    const listItems = lines.map((line) => line.match(/^(?:[-*•]\s+|\d+[.)]\s+)(.*)$/));
    if (listItems.every(Boolean)) {
      out.push({
        type: "list",
        ordered: /^\d+[.)]\s/.test(lines[0]),
        items: listItems.map((match) => (match as RegExpMatchArray)[1]),
      });
      continue;
    }

    if (lines.every((line) => line.startsWith("> "))) {
      out.push({ type: "quote", text: lines.map((line) => line.slice(2)).join(" ") });
      continue;
    }

    out.push({ type: "paragraph", text: lines.join(" ") });
  }
  return out;
}

export default function LessonProse({ text, className }: { text: string; className?: string }) {
  const rendered = blocks(text);
  if (!rendered.length) return null;

  return (
    <div className={className}>
      {rendered.map((block, index) => {
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={`prose-list my-4 grid gap-2.5 ${block.ordered ? "list-decimal" : "list-disc"} pl-5 text-[15px] leading-8 text-[#5f5965] sm:text-[15.5px]`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1.5 marker:font-bold marker:text-[#8b7fd0]">
                  {inline(item, `l${index}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className="my-5 border-l-[3px] border-[#b9a8ff] bg-[#faf9ff] py-3 pl-5 pr-4 text-[15px] font-semibold italic leading-8 text-[#544a6b]"
            >
              {inline(block.text, `q${index}`)}
            </blockquote>
          );
        }
        return (
          <p key={index} className="my-4 first:mt-0 last:mb-0 text-[15px] leading-8 text-[#5f5965] sm:text-[15.5px] sm:leading-[1.85]">
            {inline(block.text, `p${index}`)}
          </p>
        );
      })}
    </div>
  );
}
