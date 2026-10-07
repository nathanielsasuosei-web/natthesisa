#!/usr/bin/env python3
"""Append textbook lessons to a course content file.

Usage: python3 .arena/append.py <course-file> <payload-file>
The payload file holds `  {...},` entries; they are inserted before the
closing `];` of the `export const lessons` array.
"""
import sys

target, payload = sys.argv[1], sys.argv[2]
src = open(target, encoding="utf-8").read()
add = open(payload, encoding="utf-8").read().rstrip() + "\n"

marker = "\n];\n"
idx = src.rindex(marker)
out = src[:idx] + "\n" + add + src[idx:]
open(target, "w", encoding="utf-8").write(out)
print(f"appended {add.count('kind:')} blocks into {target}")
