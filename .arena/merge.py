#!/usr/bin/env python3
"""Merge lesson chunk files into a course textbook module.

Usage: python3 .arena/merge.py <course-id>

Reads every `.arena/chunks/<course-id>-*.ts` file (each holding one or more
complete `TextbookLesson` object literals), sorts them by name, and writes
`src/lib/textbook/<course-id>.ts` with them inside the exported array.
"""
import glob
import os
import sys

COURSE = sys.argv[1]
HEADER = '''import type {{ TextbookLesson }} from "../textbook-blocks";

/**
 * Textbook lessons for `{course}`.
 *
 * Every lesson in the course, written out in full: the formal definition, the
 * reasoning behind it, the mechanics in detail, worked examples traced step by
 * step, the mistakes learners reliably make, and exercises. `applyTextbook()`
 * merges each entry over the short catalog lesson with the same id, and the
 * lesson reader renders the blocks.
 */
export const lessons: TextbookLesson[] = [
'''

chunks = sorted(glob.glob(f".arena/chunks/{COURSE}-*.ts"))
if not chunks:
    sys.exit(f"no chunks for {COURSE}")

parts = []
for chunk in chunks:
    body = open(chunk, encoding="utf-8").read().strip()
    parts.append("  " + body.replace("\n", "\n  ").rstrip() + "\n")

os.makedirs(f"src/lib/textbook", exist_ok=True)
out = HEADER.format(course=COURSE) + "".join(parts) + "];\n"
target = f"src/lib/textbook/{COURSE}.ts"
open(target, "w", encoding="utf-8").write(out)
print(f"{target}: {len(chunks)} chunk(s), {out.count(chr(10))} lines, {len(out.split())} source words")
