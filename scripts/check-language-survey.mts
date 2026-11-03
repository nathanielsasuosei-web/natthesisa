import assert from "node:assert/strict";
import { getCourse, getCourseLessons, getLesson } from "../src/lib/courses";
import { LANGUAGE_SURVEY_MODULES } from "../src/content/language-survey";

const expected = [
  "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "Dart", "R", "Scala", "SQL", "Shell (Bash)", "Objective-C", "Perl", "Lua", "MATLAB", "Julia", "Elixir", "Haskell", "Clojure", "F#", "Groovy", "Visual Basic .NET", "Assembly",
  "Swift for mobile", "Objective-C for mobile", "Kotlin for mobile", "Java for mobile", "Dart with Flutter", "C# with Xamarin and .NET MAUI", "JavaScript with React Native",
  "HTML", "XML", "XHTML", "SGML", "Markdown", "LaTeX", "TeX", "PostScript", "Troff", "RTF", "YAML", "JSON", "TOML", "HCL", "Jinja", "Handlebars", "Mustache", "Liquid", "ERB", "Haml", "Pug", "Twig", "Blade", "Razor", "Thymeleaf", "Velocity", "Smarty", "EJS", "Nunjucks",
  "Ada", "APL", "AWK", "Ballerina", "Bosque", "Ceylon", "Cobra", "Crystal", "Dylan", "Factor", "Fancy", "Felix", "Flix", "Gleam", "Grain", "Hack (HHVM)", "Harbour", "xBase / dBase / Clipper / FoxPro", "Icon", "Inform", "Ioke", "J", "Jolie", "K", "Kit", "Lasso", "Lily", "LiveCode (HyperTalk)", "Lobster", "Logtalk", "M4", "Mercury", "Monkey", "Mun", "Neko", "Nit", "Nu", "Oberon", "OCaml", "Opa", "OpenEdge ABL (Progress)", "Oxygene", "Pike", "PL/B", "PowerBuilder (PowerScript)", "Pure", "Racket", "Red", "Rebol", "Ring", "S-Lang", "Seed7", "Self", "Simula", "Slate", "Snobol", "Squeak", "Stata", "Streem", "Terra", "Turing", "Umple", "Unicon", "Vala", "Verse (Epic/Fortnite)", "Wolfram", "Wren", "X++ (Dynamics)", "Xojo", "Yorick", "Zig", "ZPL",
];

const course = getCourse("programming-languages");
assert.ok(course, "Programming Languages course exists");
const lessons = LANGUAGE_SURVEY_MODULES.flatMap((module) => module.lessons);
assert.deepEqual(lessons.map((lesson) => lesson.title), expected);
const courseLessons = getCourseLessons(course);
assert.equal(new Set(courseLessons.map((lesson) => lesson.id)).size, courseLessons.length, "lesson IDs are unique within the course");
for (const lesson of lessons) {
  assert.equal(getLesson(course, lesson.id)?.title, lesson.title, `${lesson.title} is reachable in the course`);
  assert.ok(lesson.sections.some((section) => section.kind === "definition" && section.body));
  assert.ok(lesson.sections.some((section) => section.kind === "example" && section.body));
  assert.ok(lesson.exercises?.length && lesson.challenge);
}
console.log(`Checked ${lessons.length} language and format introductions across ${LANGUAGE_SURVEY_MODULES.length} modules.`);
