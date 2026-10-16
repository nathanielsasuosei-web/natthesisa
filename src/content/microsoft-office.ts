import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Microsoft Office — the productivity suite as a professional skill, not a
 * school subject.
 *
 * The course is built around the documents offices actually produce: a formatted
 * report, a spreadsheet that stays correct when it grows, a presentation that
 * survives being presented, and shared files that do not get overwritten. It
 * covers Word, Excel, PowerPoint and collaborative practice, with the habits —
 * styles, tables, formulas, references — that distinguish work that can be
 * maintained from work that has to be redone.
 */

export const MICROSOFT_OFFICE_MODULES: CourseModule[] = [
  module(
    "documents-and-data",
    "01 · Documents and data",
    "Word documents that stay consistent, and Excel workbooks that stay correct.",
    [
      lesson({
        id: "word-professional-documents",
        title: "Word: professional documents",
        summary:
          "A long document is a system, not a page of typing. This lesson covers the tools that make a report maintainable — styles for headings and body text, a table of contents that updates itself, sections and page numbering, tables, captions, cross-references — plus the professional habits that decide whether a document survives review: track changes, comments, spell check in the right language, and a final review pass. It ends with a complete formatting and proofing checklist.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Almost every professional document starts as somebody else's draft: a proposal with a structure template, a report with sections to fill, a letter on company letterhead. The people who are trusted with these documents are not the fastest typists; they are the ones whose documents look consistent at page 40, whose contents page matches the headings, and whose tracked changes a reviewer can follow.",
          },
          {
            heading: "Definition: styles, sections, fields, structure",
            kind: "definition",
            body:
              "**A style** is a named collection of formatting instructions (font, size, spacing, colour, alignment) applied to text. `Heading 1`, `Heading 2` and `Normal` are the built-in styles; you can modify them, and every paragraph using them updates at once. Styles are the difference between a document you can restructure in ten minutes and one where you format each heading by hand, twice.\n\n**A section** is a part of a document with its own page setup: orientation, margins, headers and footers, and page numbering. Sections are how a landscape table sits inside a portrait report, and how the front matter is numbered separately from the body.\n\n**Fields** are pieces of content Word calculates: the page number, the table of contents, cross-references, the date, a document property like the title. They update (or can be updated) rather than being typed, which is why they are essential in anything longer than a few pages.\n\n**Structure** is the honest use of heading levels: one `Heading 1` per major section, `Heading 2` for subsections, no skipping. Structure is what produces the automatic table of contents, the navigation pane, and — in the accessibility world — a document a screen reader can navigate. It is also the single thing that most distinguishes professional documents.\n\n**The tools that earn their keep in a report**: table of contents (References → Table of Contents), page breaks (never repeated Enter presses), section breaks for orientation changes, captions on tables and figures with automatic numbering, cross-references (\"see Table 4\") that never go stale, headers and footers with the document title and page numbers, and comments plus tracked changes for review.",
          },
          {
            heading: "Setting up a document that will not fight you",
            kind: "paragraph",
            body:
              "1. **Set the page** first: margins (2.5 cm is standard for a report; 1.5–2 cm for a letter), paper size, orientation. Everything downstream depends on this.\n2. **Choose the body font and set it in `Normal`** — a serif or sans-serif at 11–12 pt with 1.15–1.5 line spacing. Set it once in the style; never select-all-and-change later.\n3. **Modify the heading styles** deliberately: `Heading 1` at 16–18 pt bold, `Heading 2` at 13–14 pt, both with spacing before and after, and the same font family. Keep the built-in names — the table of contents depends on them.\n4. **Set up page numbering and the header early.** Page numbers belong in the footer, with the document title or the client's name in the header. Check that the first page is not numbered if it is a cover page — which requires a section break or the \"different first page\" option.\n5. **Write with styles, not with the toolbar.** `Ctrl/Cmd + Alt + 1` applies Heading 1; the navigation pane on the left becomes your outline, and you can drag sections to reorder them.\n6. **Insert the table of contents after the structure exists**, and update it (F9) before every export. A contents page that does not match the document is the most visible sign of careless work.\n7. **Add captions to every table and figure**, then cross-reference them by number so that inserting a new table does not break every \"see Table 3\" in the text.\n8. **Save as PDF for delivery**, after checking the PDF itself — fonts, page breaks and the contents page — rather than trusting the export blindly.",
          },
          {
            heading: "Working with other people's documents",
            kind: "paragraph",
            body:
              "**Track changes** (Review → Track Changes) records every insertion, deletion and formatting change with an author name. Agree with your team when to use it: it is essential for review and unhelpful for drafting. Reviewers should use **comments** for questions and tracked changes for edits, and never both for the same thing.\n\n**Accept, reject and reply.** Work through changes deliberately, and reply to comments rather than deleting them; an unanswered comment looks ignored. Before final delivery, remove all comments and turn off tracking, or accept all changes — a document that arrives with a reviewer's notes still visible looks unfinished.\n\n**Compare and merge** (Review → Compare) produces a document showing the differences between two versions, which is how you review a file that somebody edited with tracking off. It is the safety net when a colleague returns a document with no record of what they changed.\n\n**Manage your own versioning outside the file.** `Proposal-Acme-2026-03-14-v2.docx` and a proper folder is more reliable than `final-final-2.docx`. Where possible, use a shared document with version history instead of emailing attachments around.\n\n**Language and spelling.** Set the proofing language correctly (English (UK) for Ghanaian professional writing, unless a house style says otherwise), check consistently for the three or four errors everybody makes — its/it's, your/you're, effect/affect, and inconsistent date formats — and read the document aloud or have it read to you: the ear catches what the eye skips. A final pass on paper, or at 150% zoom, finds different mistakes.\n\n**Tables in Word** are for presenting information, not for laying out pages. Use them with header rows that repeat across pages (Layout → Repeat Header Rows), consistent column widths, cell padding, and no cell merges that break in a different version of Word. Never use a table or a series of spaces to position content: it breaks on every change and cannot be read by assistive technology.",
          },
          {
            heading: "Worked example: from a messy draft to a delivered report",
            kind: "example",
            body:
              "A twenty-two page report arrives for tidying. The headings were formatted by hand at six different sizes; the contents page was typed manually and no longer matches; page numbers start from the cover; three tables are unnumbered; and one table needs landscape orientation while everything else is portrait.\n\nThe repair takes about two hours and follows the process exactly. First, all headings are re-tagged with real heading styles — the document immediately becomes navigable and the table of contents will be accurate. Second, the typed contents page is deleted and an automatic one is inserted, set to update on print. Third, a section break is added before the body so that the cover has no number and the body starts at page 1; the footer is set accordingly. Fourth, the landscape table gets its own section with the orientation changed, and its own header — Word's \"link to previous\" is switched off so the change does not affect the rest. Fifth, every table gets a caption, and the \"see Table 3\" references in the text become cross-references.\n\nThe result: the document now updates itself, adding a section takes seconds and the numbering follows, and the same file can be re-templated for the next report by replacing the content and leaving the styles alone. That last point is the real prize — the template is reusable, and the next report takes forty minutes instead of two hours.",
            code:
              "BEFORE                     AFTER (styles + fields)\n  6 hand-formatted              Heading 1 / Heading 2 modified once\n  \"headings\"                    Navigation pane shows the outline\n  typed contents page           automatic TOC, update-on-print (F9)\n  cover page numbered \"1\"       section break · cover unnumbered · body from 1\n  all portrait                  one landscape section for the wide table\n  tables unnumbered             captions + automatic numbering\n  \"see Table 3\" typed           cross-references → never stale\n\nCHECKLIST BEFORE EXPORT\n  □ every heading uses a real style, levels not skipped\n  □ contents page updated and matches the headings\n  □ cover unnumbered; body numbering starts at 1\n  □ tables/figures captioned and referenced\n  □ no tracked changes, no comments, no highlighting left\n  □ proofing language correct; spell-check run; read aloud once\n  □ headers/footers correct on every section  □ saved as PDF and the PDF checked",
            language: "text",
            codeLabel: "Two hours that make the next report a forty-minute job",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Formatting headings by hand.** It takes longer, breaks at page 40, and destroys the automatic contents page. Styles are faster even for a two-page document.\n- **Using Enter to reach a new page.** Page breaks and section breaks exist; repeated Enters move every time the text above changes.\n- **Typing a table of contents.** It is out of date as soon as one heading changes.\n- **Sending tracked changes or comments to a client.** Review the document in the state the recipient will see: accept or reject everything, delete comments, and export to PDF.\n- **Using tables or spaces to position text.** It breaks on the smallest edit and reads terribly with a screen reader or in a different version of Word.\n- **Trusting the spell-checker.** It approves \"form\" for \"from\" and \"public\" for \"publish\". Read the document once properly, out loud.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Task", "Do this", "Not this", "Why it matters"],
              ["Format headings", "Modify `Heading 1/2/3` styles", "Select and set the font each time", "Automatic TOC, navigation, consistency"],
              ["New page", "Insert → Page Break (Ctrl+Enter)", "Repeated Enter presses", "Text above changes without moving the break"],
              ["Orientation change", "Section break, then change setup", "Rotating every page", "One wide table does not force a whole document"],
              ["Page numbers", "Footer field, per section", "Typed numbers", "Numbers survive edits"],
              ["Table/figure labelling", "Caption + cross-reference", "Typed \"Table 3\"", "Never stale when tables are inserted"],
              ["Review", "Track changes + comments", "Editing directly and emailing back", "The author sees and accepts each change"],
              ["Delivery", "PDF, checked after export", "Sending the .docx blindly", "Layout and fonts are preserved"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Professional Word documents are built from styles, sections and fields rather than from manual formatting: modify the heading styles once, let the table of contents number itself, use section breaks for changes of page setup, caption every table and reference it rather than typing its number, and review with tracked changes and comments. Then run a checklist before export, deliver a PDF, and the same file becomes a template for every report that follows.",
          },
        ],
        keyPoints: [
          "Use and modify styles for headings and body text rather than formatting by hand.",
          "Insert a table of contents and page numbering as fields that update.",
          "Use section breaks for orientation, headers and separate page numbering.",
          "Caption tables and figures and use cross-references instead of typed numbers.",
          "Review with tracked changes and comments, then clean the document before delivery.",
        ],
        exercises: [
          "Take a document of at least five pages and re-tag every heading with real heading styles, then insert an automatic table of contents.",
          "Insert a landscape-oriented table inside a portrait document using section breaks, with headers that do not leak into the rest of the file.",
          "Add captions to three tables or figures and replace typed references in the text with cross-references.",
          "Send a document to a colleague with tracked changes on, then accept some changes, reject others, and reply to their comments.",
          "Export a finished document to PDF and check the contents page, the page numbers, the fonts and the page breaks in the PDF itself.",
        ],
        challenge:
          "Produce a complete, delivered document — a report, proposal or manual of at least ten pages — using styles, an automatic table of contents, sections with correct page numbering, captioned and cross-referenced tables, a reviewed change log, and a checked PDF. Then save it as a template and use that template to produce a second, shorter document in under an hour, recording how long each took.",
      }),

      lesson({
        id: "excel-spreadsheets-that-work",
        title: "Excel: spreadsheets that stay correct",
        summary:
          "Most spreadsheets are wrong, and most of them are wrong for the same few reasons: numbers stored as text, formulas copied pasted without understanding relative and absolute references, lookups that break silently, and data typed into a layout that cannot be analysed. This lesson covers the structure that makes a workbook reliable — one table of data, defined columns, no merged cells in data — plus the formulas that do the real work: `SUM`/`AVERAGE` with criteria, `IF`, `VLOOKUP` versus `XLOOKUP`/`INDEX MATCH`, pivot tables, conditional formatting and data validation.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Every office has one spreadsheet that everything depends on and nobody fully trusts. It was built by somebody who has left, its totals are copied from somewhere, and the number that goes to management is typed into a different file. Learning to build a workbook that a stranger can audit is a professional skill with immediate value — and half of it is refusing to type data into a decorative layout.",
          },
          {
            heading: "Definition: cell references, tables, formulas, functions, pivots",
            kind: "definition",
            body:
              "**A cell reference** is its address (`B4`). Two modifiers change how a formula behaves when copied:\n\n- `$` locks a row or column: `$B$4` locks both, `$B4` locks the column, `B$4` locks the row.\n- **Relative** (`B4`) adjusts when you copy — which is what you want when a formula applies row by row.\n- **Absolute** (`$B$4`) does not adjust — what you want for a tax rate or a target held in one cell.\n\nAlmost every beginner formula bug is a missing or misplaced `$`.\n\n**A structured table** (Insert → Table, `Ctrl+T`) names the range, extends automatically when rows are added, keeps header names visible in formulas (`SUM(Sales[Amount])`) and makes formatting consistent. Using real tables instead of a manually formatted range removes an entire class of error.\n\n**Functions worth knowing properly:**\n\n- `SUM`, `AVERAGE`, `COUNT`, `COUNTA`, `MIN`, `MAX` — the arithmetic floor.\n- `SUMIFS`, `COUNTIFS`, `AVERAGEIFS` — the same, restricted by criteria; the workhorses of reporting.\n- `IF`, `IFS`, `AND`, `OR` — decisions in a column (\"overdue\", \"passed\", \"needs follow-up\").\n- `VLOOKUP` (classic) and `XLOOKUP` (modern, and better), or `INDEX` + `MATCH` for the older-but-still-robust pattern.\n- `TEXT`, `DATE`, `EOMONTH`, `YEARFRM` — formatting and date arithmetic.\n- `ROUND` — money should be rounded deliberately, not accidentally.\n- `IFERROR` — show a deliberate blank or message instead of `#N/A`.\n\n**Pivot tables** summarise a table by dragging fields into rows, columns, values and filters: totals by month, by region, by product, with counts and averages — no formulas, and they update when the source data changes. For most reporting that currently involves manual copying, a pivot table is the answer.\n\n**Conditional formatting** makes exceptions visible: arrears, values over a limit, cells outside a range. Used sparingly, it turns a wall of numbers into a list of things to do.\n\n**Data validation** restricts what can be typed: a dropdown list of classes, a date range, a whole number between limits, with an error message that explains. Validation is prevention, and it is what keeps a shared spreadsheet clean for the person who maintains it after you.",
          },
          {
            heading: "Building a workbook somebody else can use",
            kind: "paragraph",
            body:
              "**Separate the layers.** One sheet holds data (one row per record, one column per field, a header row, no merged cells, no blank rows or columns). Another holds calculations. Another holds the report or dashboard that somebody reads. Mixing all three into one sheet is what makes a workbook impossible to audit.\n\n**One row per record.** Each student, sale, payment or patient is one row. Quarterly figures entered as separate columns (`Term 1`, `Term 2`) look natural on paper and must be unpivoted before any pivot table will work.\n\n**Type your data correctly, once.** Numbers as numbers, dates as dates (a real date, not the text `12/05/26`), codes with leading zeros as text, currency in a stated unit. If Excel displays a small green triangle warning, read it.\n\n**Name the important cells.** `TaxRate`, `TermStart`, `FeeStandard` as named ranges make formulas readable: `=B4*TaxRate` rather than `=B4*$H$2`.\n\n**Never delete a column because you think it is unused.** Somebody's formula elsewhere refers to it. Delete only after checking with `Find` → `Formulas` references, or after the workbook has been replaced.\n\n**Document the workbook.** A short `README` sheet: what it is for, who maintains it, where the data comes from, what each sheet contains, which cells are inputs, and the date of the last change. It takes twenty minutes and saves hours of guessing later.\n\n**Print and share deliberately.** Set print areas, freeze header rows and panes, define a print title row so headers repeat, protect calculated cells (Review → Protect Sheet) while leaving inputs editable, and password-protect the file only if you are prepared to be responsible for the password.\n\n**The auditing habits.** Before any total leaves the workbook: check that the counts match the source, `SUM` a column twice by two different methods, sort by each column to find blanks and anomalies, and confirm that dates fall where you expect. A total that cannot be reconciled is a total that will embarrass somebody.",
          },
          {
            heading: "Worked example: a fees tracker rebuilt",
            kind: "example",
            body:
              "A school's fees spreadsheet has a layout with merged cells for each class, quarterly amounts in three columns, arrears calculated by hand in a colour-coded column, and a summary sheet where totals are typed from the class sheets. It takes a full day to update each term, and the totals can be wrong without anybody noticing.\n\nThe rebuild starts with the data: one row per student per term, with columns `Student ID`, `Name`, `Class`, `Term`, `Fee Due`, `Amount Paid`, `Payment Date`, `Method`. Zero formatting, and every value a number or a real date.\n\nThe calculations sheet adds a handful of formulas: `Balance = Fee Due - Amount Paid`, `Status = IF(balance<=0,\"Paid\",IF(balance<fee*0.5,\"Partial\",\"Arrears\"))`, and `Days Overdue = IF(balance>0, TODAY()-DueDate, \"\")`. Sums by class become `SUMIFS`.\n\nThe report sheet uses a pivot table: class by term, with sum of `Fee Due`, sum of `Amount Paid` and count of students. Conditional formatting colours balances that are still positive. A dropdown list on `Class` and `Method` means the next person cannot misspell them.\n\nThe measured change: a full-day update becomes about forty minutes, the class totals reconcile with the accounting system to the cedi, and the head teacher's weekly question — who has not paid — is answered by a filter rather than a search through four pages of colour coding.",
            code:
              "DATA sheet (one row per student per term — 1 340 rows)\n  A Student ID   B Name        C Class   D Term  E Fee Due  F Paid  G Date      H Method\n  S-0012         Ama Boateng   JHS2      T1      650        650     2026-01-14  MoMo\n  S-0013         Kofi Mensah   JHS2      T1      650        300     2026-01-20  Cash\n\nCALC sheet\n  I  Balance      =E2-F2\n  J  Status       =IF(I2<=0,\"Paid\",IF(I2<E2*0.5,\"Partial\",\"Arrears\"))\n  K  DaysOverdue  =IF(I2>0,TODAY()-G2,\"\")\n  Totals         =SUMIFS(DATA!F:F, DATA!C:C, $B$2, DATA!D:D, $C$2)\n\nREPORT sheet\n  Pivot: rows = Class, columns = Term, values = Σ Fee Due, Σ Paid, Count of students\n  Conditional format: Balance > 0 → amber; DaysOverdue > 30 → red\n  Data validation: Class list, Method list, Term list (dropdowns)\n\nBEFORE: one day per term · totals typed from class sheets · 3 reconciliation\n        errors found last year\nAFTER:  ≈40 minutes per term · totals reconcile to the cedi · arrears visible\n        in one filter · the workbook has a README sheet naming its owner",
            language: "text",
            codeLabel: "The same job, restructured as data",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Numbers stored as text.** They sort wrongly, do not sum, and produce totals that quietly exclude them. Fix with Text to Columns or `VALUE`, and check the count.\n- **Merged cells inside a data range.** They break sorting, filtering, pivot tables and most formulas. Use \"Centre Across Selection\" for presentation instead; never merge in data.\n- **Hard-coded values inside formulas.** Rates, targets and thresholds belong in named cells so that next year's change is one edit, not forty.\n- **`VLOOKUP` with a non-zero fourth argument.** `VLOOKUP(value, range, 3, FALSE)` is exact matching; omitting `FALSE` gives approximate matches that return plausible wrong answers. `XLOOKUP` does exact matching by default.\n- **Copying totals as values into a report.** They go stale immediately. Link them, or refresh the pivot.\n- **No backup, no version.** One accidental `Ctrl+A Delete` with no history is a lost term's data. Keep dated copies, or use a shared file with version history.\n- **Trusting the file because it is familiar.** Reconcile the totals against the accounting system, the bank statement or the previous report — every time, not once.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Need", "Function or tool", "Example", "Watch out for"],
              ["Total with conditions", "`SUMIFS`", "`=SUMIFS(F:F, D:D,\"T1\", C:C,\"JHS2\")`", "Ranges must be the same size"],
              ["Count with conditions", "`COUNTIFS`", "`=COUNTIFS(J:J,\"Arrears\",C:C,\"JHS2\")`", "Counting text vs numbers"],
              ["Look up a value", "`XLOOKUP` (or `INDEX`+`MATCH`)", "`=XLOOKUP(A2, Fees[ID], Fees[Fee])`", "`VLOOKUP` approximate matches"],
              ["Decide per row", "`IF` / `IFS`", "`=IF(I2<=0,\"Paid\",\"Arrears\")`", "Deeply nested IFs — use `IFS`"],
              ["Round money", "`ROUND`", "`=ROUND(E2*1.05, 2)`", "Floating-point displays"],
              ["Handle errors", "`IFERROR`", "`=IFERROR(XLOOKUP(…),\"not found\")`", "Hiding a real error you should fix"],
              ["Summarise fast", "Pivot table", "Class × Term, sum of paid", "Stale pivots — refresh on open"],
              ["Prevent bad input", "Data validation", "Dropdown of classes", "Validation does not apply to pasted data"],
              ["Repeat header rows on print", "Print titles", "Rows 1:1 repeat", "Forgetting the print area"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A reliable spreadsheet is a database with a friendly face: one row per record, one column per field, no merged cells, correct types, and a clear separation between data, calculation and report. `SUMIFS`, `XLOOKUP`, `IF` and pivot tables do the work that manual copying used to; validation and conditional formatting prevent and reveal problems; and a README sheet plus a reconciliation step turn a personal file into something a team can depend on — and audit.",
          },
        ],
        keyPoints: [
          "Structure data as one row per record with no merged cells, so that pivots and filters work.",
          "Use relative and absolute references deliberately, and lock the cells that must not move.",
          "Aggregate with SUMIFS/COUNTIFS and look up with XLOOKUP or INDEX+MATCH.",
          "Summarise with pivot tables instead of manual copying and typed totals.",
          "Prevent bad input with data validation, and reconcile every total before it leaves the workbook.",
        ],
        exercises: [
          "Take a spreadsheet with quarterly figures in separate columns, rebuild it as one row per record, and produce a pivot table from it.",
          "Write a `SUMIFS` that totals one class for one term, then copy it across every class and term with the correct locks.",
          "Convert every `VLOOKUP` in a workbook you own to `XLOOKUP` or `INDEX`+`MATCH`, and note any broken or approximate matches you find.",
          "Add data validation dropdowns and conditional formatting to a shared spreadsheet, then deliberately enter invalid data and confirm it is prevented.",
          "Write a README sheet for a workbook you maintain: purpose, owner, data sources, sheet guide, input cells and last change date.",
        ],
        challenge:
          "Rebuild one real spreadsheet that your work depends on: a proper data sheet, a calculation sheet with documented formulas, a report built on a pivot table, validation on every input, conditional formatting for exceptions, a README sheet, and a reconciliation step that ties the totals to an independent source. Measure the time it takes to update the new version against the old, and report the reconciliation difference you found in the original.",
      }),
    ]
  ),

  module(
    "presentations-and-collaboration",
    "02 · Presentations and collaboration",
    "Slides that survive being presented, and files that survive being shared.",
    [
      lesson({
        id: "powerpoint-presentations",
        title: "PowerPoint: presentations that work",
        summary:
          "A presentation is a performance with visual support, not a document projected on a wall. This lesson covers the structure that makes an argument — one idea per slide, a headline that says the point — as well as the technical craft: the slide master and layouts that make twenty slides consistent in minutes, type and contrast that read from the back of a room, charts instead of tables of numbers, images instead of bullets, and the delivery habits that decide whether the audience remembers anything at all.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The most common mistake in a business presentation is treating slides as a document: dense paragraphs, a table with thirty rows, and a presenter reading aloud. The audience reads ahead, stops listening, and remembers nothing. Slides are a visual aid for a spoken argument — and the discipline of building them that way makes the argument itself clearer.",
          },
          {
            heading: "Definition: master, layout, hierarchy, visual aid",
            kind: "definition",
            body:
              "**The slide master** controls everything that repeats: background, colours, fonts, placeholder positions, and the look of every layout. Change the master once and all twenty slides follow. This is the single biggest time-saver in PowerPoint, and the reason a deck built with the master looks consistent while a deck built slide-by-slide does not.\n\n**Layouts** are named arrangements of placeholders (title, content, two-content, picture with caption, section header). Using the built-in layouts — rather than adding text boxes at eyeballed positions — keeps content aligned and moves everything consistently when you change the design.\n\n**Hierarchy on a slide** is decided in the first two seconds: what is the one thing the audience should read? That becomes the headline, in the largest type, usually at the top left. Supporting content is subordinate, and if it competes with the headline it should not be on the slide.\n\n**A visual aid** means the slide supports what you say rather than duplicating it. A useful test: a slide should be comprehensible in three seconds, and it should not be possible to reconstruct your talk from it. If the slide contains the talk, delete the slide and keep the talk.\n\n**Structure of a deck**: title, the one-sentence claim (what you want the audience to believe or decide), the context, the evidence in two or three points, the objections answered in one slide, the recommendation, the specific ask, and a closing slide with the contact details. Ten to fifteen slides for thirty minutes, not forty.",
          },
          {
            heading: "Design rules that make slides readable from the back",
            kind: "paragraph",
            body:
              "**Type.** One family, two weights. Headlines at 28–40 pt, body at 18–24 pt, absolute minimum 16 pt for anything the audience must read. If it will not fit at that size, the content is wrong for a slide.\n\n**Contrast.** Dark text on a light background (or the reverse) with a ratio above 4.5:1; never light grey on white, and never text over a busy photograph without a scrim. Assume a projector with poor contrast, a room with sunlight, and a screen that dims.\n\n**One idea per slide.** If a slide has two headlines it has no headline. Split it.\n\n**Six words, six lines.** Not a hard rule — a useful discipline: a headline that makes a claim, and no more than about six lines of supporting text, each short.\n\n**Charts, not tables.** A chart with one message (\"revenue doubled in the north\") beats a table the audience cannot read. Label the data directly rather than using a legend where possible, state the units, and highlight the one series that matters.\n\n**Images that carry meaning.** A real photograph of the site, the customer or the product is worth more than a decorative stock image of a handshake. Ask the client for photographs and use them at full bleed with a text scrim.\n\n**Consistency.** The master's colours, the same headline position on every slide, the same spacing scale, page numbers, and a footer with the client's name and the date. Consistency is what makes a deck look considered, and it takes minutes with a master.\n\n**Motion, sparingly.** Animation should reveal information in the order you speak it, not decorate. Simple appear/fade is enough; anything that spins, bounces or flies is a distraction the audience will mention instead of your content.\n\n**Prepare for the room.** Know the projector's resolution (usually 1024×768 or 1920×1080), bring the deck as a PDF as a backup and on two devices, and check the fonts are embedded if you will present from another computer. Practise standing up, out loud, with a timer — once is the difference between a talk and a reading.",
          },
          {
            heading: "Worked example: rebuilding a dense deck",
            kind: "example",
            body:
              "A quarterly review deck arrives with 34 slides, each a paragraph of 8 pt text, three tables of numbers and a template of stock gradients. Nobody in last quarter's meeting could recall the conclusion.\n\nThe rebuild starts from the claim: the quarter's performance against target, and the decision requested about the north region's stock levels. Everything that does not support that claim is cut — the 34 slides become 11, and two of the cut slides are moved to an appendix for questions.\n\nEach remaining slide gets a headline that states a conclusion rather than a topic: not \"Northern region sales\" but \"Northern region is 18% below target because of stock-outs in two SKUs\". The numbers become one chart per slide with a single highlighted series, and the tables move to the appendix. The gradient template is replaced with a master using the client's actual brand colours, and the type is set at 32 pt headlines, 20 pt body.\n\nThe result in the meeting is measurable in behaviour rather than in aesthetics: the presentation takes nineteen minutes instead of forty, four of the six questions are about the decision rather than about what a number means, and the decision is taken in the meeting instead of being deferred for clarification. The slides did less, and achieved more.",
            code:
              "BEFORE                                AFTER\n  34 slides, 8 pt paragraphs            11 slides + 3 appendix slides\n  Topics as titles:                  Claims as titles:\n    \"Northern region sales\"            \"North is 18% below target — two SKUs\n                                        out of stock for 6 weeks\"\n  3 data tables on one slide        One chart per slide, one series highlighted\n  Stock gradient template           Master with brand colours, 32/20 pt type\n  Read aloud for 40 minutes         Spoken from notes for 19 minutes\n\nSLIDE TEMPLATE (master)\n  ▸ headline 32 pt semibold, top-left, same position every slide\n  ▸ one visual: chart / photograph / three-word key numbers\n  ▸ footer: client name · date · slide number\n  ▸ body never below 18 pt; one idea per slide; no slide needs a legend\n\nTAKEAWAY SLIDE (the one that matters)\n  \"Approve GH₵40 000 to stock the two SKUs before December.\"\n  → decision, amount, deadline. Nothing else.",
            language: "text",
            codeLabel: "Fewer slides, one claim each, a decision taken in the room",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Slides as a document.** If the audience can read it without you, they will — and then they will stop listening. The document is the handout; the deck is the talk.\n- **Titles that name topics.** \"Overview\", \"Results\", \"Next steps\" waste a slide's most valuable line. State the conclusion.\n- **Small type to fit more in.** Below 16 pt on a projector, nobody past the second row can read it. Cut the content instead.\n- **Reading the slide aloud.** The audience reads faster than you speak, and hears the same thing twice.\n- **Clip art, stock handshakes and gradient templates.** They weaken a message about a Ghanaian business; a photograph of the actual site strengthens it.\n- **Presenting from a laptop you have not tested.** A missing font, a wrong aspect ratio and a projector that will not connect are all solved before the meeting by arriving with a PDF and a second copy.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Element", "Setting", "Why", "Failure if ignored"],
              ["Headline size", "28–40 pt", "Readable from the back", "Audience stops reading and drifts"],
              ["Body size", "18–24 pt (16 pt minimum)", "Legibility at distance", "Squinting, disengagement"],
              ["Slides for 30 minutes", "10–15", "About two minutes per slide", "Rushed reading, no discussion"],
              ["Words per slide", "≈6 lines, short", "Slides support the talk", "Slides become the talk"],
              ["Contrast", "≥ 4.5:1", "Projectors and daylight", "Invisible text in a bright room"],
              ["Charts", "One message each, direct labels", "Understood in three seconds", "Audience decodes instead of deciding"],
              ["Master", "Set once, used by all layouts", "Consistency in minutes", "Twenty slides that all look different"],
              ["Backups", "PDF + second device", "Projector and font failures", "Presenting to a blank screen"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A presentation is a spoken argument with visual support: one claim per slide as the headline, large type, strong contrast, one chart or photograph instead of a table of numbers, and a slide master that gives the whole deck consistency in minutes. Cut the content to the decision you are asking for, rehearse standing up out loud, arrive with a PDF backup — and the slides will do their job, which is to be forgotten while the argument is remembered.",
          },
        ],
        keyPoints: [
          "Set up a slide master and use layouts rather than free-floating text boxes.",
          "Write headlines that state conclusions, and keep the body to legible short lines.",
          "Choose type sizes and contrast that work on a projector in a bright room.",
          "Replace tables with charts that carry one message, and bullet lists with meaningful images.",
          "Prepare backups, rehearse aloud, and end with a specific ask.",
        ],
        exercises: [
          "Take a dense slide from an old deck and rebuild it as three slides, each with a claim headline.",
          "Set up a slide master with a client's brand colours and two type sizes, then build five slides that use nothing else.",
          "Replace one table of numbers with a chart that carries one message, and label it directly instead of using a legend.",
          "Present three slides standing up, out loud, with a timer, and record how long each actually takes.",
          "Export a deck to PDF, open it on a second device, and check the fonts, aspect ratio and images.",
        ],
        challenge:
          "Build and deliver one real presentation of ten to twelve slides to a live audience: a master with consistent type, claim headlines, at least two charts and one photograph, an appendix for detail, and a closing slide that asks for a specific decision. Record the questions you were asked, and write down which part of the argument the audience found least clear — then fix that slide and present it again to somebody who was not there.",
      }),

      lesson({
        id: "collaboration-and-shared-files",
        title: "Collaboration: files, email and shared work",
        summary:
          "Office work is shared work, and the failures are almost always the same: three versions of a document, files attached that nobody can find later, a spreadsheet overwritten by somebody working offline, and a password-protected file whose password has been forgotten. This lesson covers OneDrive and SharePoint sharing, real-time collaboration, version history, comments and notifications, email practice in an office context, and backup — the habit that prevents a lost month of work.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The cost of file chaos is invisible until it is enormous: a proposal sent with an outdated price, a report edited by two people in parallel, a term's marks recovered from a backup phone. The tools that prevent it — shared drives, co-authoring, version history — have been standard in Microsoft 365 for years and are still commonly unused, which is why they are a skill worth learning deliberately.",
          },
          {
            heading: "Definition: OneDrive, SharePoint, co-authoring, version history, backup",
            kind: "definition",
            body:
              "**OneDrive** is personal storage tied to one account: useful for your own files, and for sharing a single file with an individual. **SharePoint** (or a Teams channel's files tab) is organisational storage: folders that belong to a team rather than a person, and that survive somebody leaving. The rule of thumb: if a file matters to more than one person for more than a week, it belongs in a shared library, not in somebody's OneDrive or, worse, their Downloads folder.\n\n**Sharing correctly.** Share to *named people* or to a *team*, not to \"anyone with the link\", unless it is genuinely public. Set the permission deliberately: view, comment, or edit. A link set to \"anyone\" on a folder has leaked more business data than any hacker.\n\n**Co-authoring** is several people editing one file in the browser or desktop app at the same time, with presence indicators and per-change attribution. It removes the need for `v1`, `v2`, `final` and `final-FINAL`. The old workflow — email attachment, edit, send back — is now a choice to create version confusion.\n\n**Version history** keeps previous versions of the file (OneDrive and SharePoint keep them routinely), so a bad edit can be reversed without a saved copy. Learn the two clicks: right-click the file → Version history → restore. It is the office equivalent of undo for the past month.\n\n**Comments** (Word, Excel, PowerPoint, and on files in SharePoint) keep feedback attached to the content rather than buried in an email thread, and they can be assigned and resolved. **Notifications**: set them deliberately, or you will mute one channel and miss the one that mattered.\n\n**Backup** is not the same as synchronisation. A synced file can be deleted everywhere at once, and ransomware encrypts the synced copy too. Keep a second copy: a periodic export to a separate location, a dated archive of the documents that matter, and for the accounting or client-records file, an offline copy. The three-two-one principle — three copies, on two media, one off-site — is achievable for a small office with very little effort.\n\n**Email practice in an office.** Subject lines that describe the content (\"Acme proposal — revised price for review, 14 Mar\"); one topic per email; the action required and by when, in the first two lines; replies trimmed so nobody scrolls through five screens of quoted history; careful use of To/Cc/Bcc (Cc is for information, Bcc for large lists); attachments large enough to break a receive limit replaced by a shared link; and the discipline of not discussing sensitive matters where confidentiality cannot be guaranteed. Gmail and Outlook both search well — use that and the filing question mostly disappears.",
          },
          {
            heading: "Worked example: a proposal that was lost, found, and never lost again",
            kind: "example",
            body:
              "A three-person consultancy prepares proposals. The process was: one person drafts, emails the attachment; a second edits it and emails back `proposal-v2.docx`; the third plays with formatting and sends `proposal-FINAL.docx` to the client. One week, the client received a version with last quarter's prices, because the number had been changed in a copy that never merged.\n\nThe new workflow uses the tools rather than willpower. A SharePoint library, `Proposals/<Client>/`, holds one file per proposal, named with the client and the date. Each proposal has an internal price sheet as a separate linked spreadsheet so the price lives in exactly one place. The three of them co-author in the browser; each edit is attributed, and a comment thread records why the price changed. A Team's channel gets the notification when a file is ready for review.\n\nWhen the price sheet was edited the following month, the change was visible in the version history with who changed it — and the proposal itself pulled the new figure automatically. And when somebody accidentally deleted a paragraph of the executive summary the day before sending, the version from two days earlier was one right-click away.\n\nThe rules that made the difference take two sentences: one file, one place, one price; and the link goes to the client, not the file.",
            code:
              "BEFORE (email attachments)                    AFTER (shared library)\n  proposal-v1.docx   (Amara)                    SharePoint ▸ Proposals ▸ Acme\n  proposal-v2.docx   (Kwesi)                      Acme-Proposal-2026-03-14.docx\n  proposal-FINAL.docx (Naa)                        └ co-authored in the browser\n  proposal-FINAL2.docx (Amara, 4 pm)               └ price pulled from Fees.xlsx\n  → wrong prices sent to client                    └ comments resolve the \"why\"\n                                                   └ version history: restore in 2 clicks\n\nPERMISSIONS\n  Library: Consultants team — edit\n  Price sheet: Partners — edit; consultants — view\n  Client link: view only, expires 30 days, no download\n\nEMAIL THAT WORKS WITH THE FILES\n  Subject  Acme proposal — price updated from Fees.xlsx, please review by Fri\n  Line 1   Action: approve the fees table on page 3 before Friday 12:00.\n  Line 2   Link: [shared link, view-only]\n  (no attachment; no quoted history; nobody edits a downloaded copy)\n\nRECOVERY, WHEN IT MATTERS\n  Deleted paragraph yesterday?   Right-click → Version history → restore\n  Overwritten by an offline sync?  Version history, then re-share the library\n  Malware encrypts the sync?     The dated off-site archive is the answer",
            language: "text",
            codeLabel: "One file, one place, one version of the truth",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"Anyone with the link\" for everything.** It is the most common cause of leaked business documents: the link outlives the need and copies itself into email threads and WhatsApp groups.\n- **Synchronising as a backup.** If a file is deleted or encrypted, the sync deletes or encrypts it everywhere. Keep an independent copy.\n- **Editing an emailed attachment.** You are now diverging from the master copy, and there is no version history to save you. Edit in the shared file or not at all.\n- **Version names as a system.** `final`, `final2`, `final-REAL` is not version control; it is a record of confusion. Use version history instead.\n- **Email as the filing system.** Search works, but a decision buried in a thread is not findable by the person who needs it in six months. Put decisions in the shared document.\n- **Passwords shared over WhatsApp and forgotten.** Teams make that mistake, then cannot open their own file after the person leaves. Use the organisation's account, not a password on the file.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Situation", "Right tool", "Wrong tool", "Why"],
              ["Three colleagues editing one document", "Co-authoring in a shared library", "Email attachments", "One version, attributed edits, no merging"],
              ["Sending a proposal to a client", "View-only shared link with an expiry", "Editable document", "The client cannot change prices accidentally"],
              ["Team files that must survive a departure", "SharePoint / Teams library", "Someone's OneDrive", "Ownership belongs to the team, not a person"],
              ["Undoing a bad edit", "Version history", "Saved copies on a desktop", "Restore in two clicks, any time"],
              ["Protecting against loss", "Three copies, two media, one off-site", "Sync alone", "Sync propagates deletions and encryption"],
              ["Feedback on a draft", "Comments in the file", "An email describing the changes", "Feedback stays attached to the content"],
              ["Notification overload", "Deliberate rules per channel", "Muting everything", "You miss the one that mattered"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Shared work needs one copy of every file in one place, with the right permissions, edited by co-authoring rather than by email; version history as the safety net; comments to carry feedback; and an independent backup because synchronisation is not backup. The habits are small — share to people rather than to anyone, link rather than attach, and never edit a downloaded copy — and together they remove the most common and most expensive forms of office confusion.",
          },
        ],
        keyPoints: [
          "Choose OneDrive for personal files and SharePoint/Teams libraries for anything a team depends on.",
          "Share to named people with the smallest sufficient permission, and avoid link-sharing that never expires.",
          "Co-author instead of emailing attachments, and use version history to undo bad edits.",
          "Keep an independent backup, because synchronisation is not a backup.",
          "Write office emails with a descriptive subject, the action first, and links instead of large attachments.",
        ],
        exercises: [
          "Create a shared folder structure for a real team project, with sensible names and permissions per folder. Document who can edit what.",
          "Convert one email-attachment workflow into co-authoring: put the file in a shared library, invite the collaborators, and edit it together in the browser.",
          "Delete a paragraph from a shared document, then restore the previous version from version history and record the steps.",
          "Review the sharing links you have created in the past month. Set an expiry date on any that are still open, and downgrade any \"anyone\" link that does not need to be.",
          "Rewrite three emails you have sent: action in the first line, descriptive subject, trimmed quoted history, and a link instead of an attachment.",
        ],
        challenge:
          "Establish a working file system for a real team or organisation: a folder structure with naming rules and permissions, a co-authored document with comments and version history in use, a client-facing share set to view-only with an expiry, and a backup routine that keeps an independent dated copy off the synchronised drive. Write one page of simple rules for the people who will use it, and test it by having somebody new find and edit a file using only the rules.",
      }),
    ]
  ),
];
