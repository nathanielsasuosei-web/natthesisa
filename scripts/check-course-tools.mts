import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import initSqlJs from "sql.js";
import { COURSES, getCourseLessons } from "../src/lib/courses";
import { COURSE_PRIMARY_TOOLS, LESSON_TOOL_META, planLessonTools } from "../src/lib/lesson-tools";
import { bubbleTrace, capacityEstimate, classificationMetrics, gameBudget, touchTarget } from "../src/lib/course-calculators";

assert.deepEqual(Object.keys(COURSE_PRIMARY_TOOLS).sort(), COURSES.map((c) => c.id).sort());
for (const course of COURSES) {
  const expected = COURSE_PRIMARY_TOOLS[course.id];
  assert.ok(LESSON_TOOL_META[expected]);
  for (const lesson of getCourseLessons(course)) {
    const plan = planLessonTools({ courseId: course.id, lessonId: lesson.id, lessonTitle: lesson.title, summary: lesson.summary, headings: lesson.sections.map((s) => s.heading), sampleLanguages: lesson.sections.flatMap((s) => s.code ? [s.language ?? "code"] : []) });
    assert.equal(plan[0]?.id, expected, `${course.id}/${lesson.id}`);
    assert.equal(new Set(plan.map((p) => p.id)).size, plan.length);
  }
}
assert.equal(gameBudget(60, 3840, 2160, 50)?.pixels, 2073600);
assert.equal(gameBudget(0, 10, 10, 50), null);
assert.equal(gameBudget(60, 10, 10, 101), null);
assert.equal(classificationMetrics(0, 0, 0, 0)?.precision, null);
assert.equal(classificationMetrics(80, 20, 850, 50)?.accuracy, 0.93);
assert.equal(classificationMetrics(-1, 0, 0, 0), null);
assert.equal(capacityEstimate(100, 20, 4, 50)?.utilization, 0.5);
assert.equal(capacityEstimate(1, 1, 0, 1), null);
assert.deepEqual(bubbleTrace([7, 2, 5, 1])?.sorted, [1, 2, 5, 7]);
assert.equal(bubbleTrace([1, 2, 3])?.comparisons, 2);
assert.equal(bubbleTrace([]), null);
assert.equal(touchTarget(48, 48, 3, "android")?.pass, true);
assert.equal(touchTarget(43, 44, 2, "ios")?.pass, false);

// Execute the actual browser worker against the shipped SQLite WASM, with the
// browser APIs shimmed. Each message creates a fresh seeded database.
const wasm = await readFile("public/vendor/sqljs/sql-wasm.wasm");
const SQL = await initSqlJs({ wasmBinary: wasm });
let reply: { ok: boolean; results?: Array<{ values: unknown[][] }>; error?: string } | undefined;
const self: { onmessage?: (event: { data: { query: string } }) => Promise<void>; postMessage: (value: typeof reply) => void } = { postMessage: (value) => { reply = value; } };
vm.runInNewContext(await readFile("public/workers/sql.js", "utf8"), { self, importScripts: () => {}, initSqlJs: async () => SQL, Error });
await self.onmessage!({ data: { query: "CREATE TABLE scores (value INTEGER); INSERT INTO scores VALUES (2), (3); SELECT SUM(value) FROM scores;" } });
assert.equal(reply?.ok, true);
assert.deepEqual(Array.from(reply?.results?.[0].values[0] ?? []), [5]);
await self.onmessage!({ data: { query: "SELECT * FROM scores;" } });
assert.equal(reply?.ok, false, "new runs use fresh databases");
await self.onmessage!({ data: { query: "SELECT name FROM products WHERE price >= 100 ORDER BY price DESC;" } });
assert.equal(reply?.ok, true);
assert.equal(reply?.results?.[0].values[0][0], "Leather sandals");
console.log(`Checked course tools across ${COURSES.length} courses, calculations and the SQLite worker.`);
