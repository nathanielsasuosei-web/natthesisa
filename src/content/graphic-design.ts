import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Graphic Design — the principles that make work look intentional, and the
 * practical craft of producing it.
 *
 * A beginner course that starts with the four principles (contrast, repetition,
 * alignment, proximity), moves through colour and typography with actual
 * numbers, then colour modes, file formats and resolution — the technical facts
 * that decide whether a design survives being printed on a banner or a
 * business card. It closes with a real workflow, a portfolio, and pricing your
 * own work as a freelancer.
 */

export const GRAPHIC_DESIGN_MODULES: CourseModule[] = [
  module(
    "design-principles",
    "01 · Principles that make design work",
    "The four principles, colour with numbers, and typography you can defend.",
    [
      lesson({
        id: "four-principles-of-design",
        title: "The four principles: contrast, repetition, alignment, proximity",
        summary:
          "Design that looks amateur is usually failing on one of four measurable things: insufficient contrast to guide the eye, no repetition to make a set feel like a set, elements that do not align to anything, and spacing that does not show what belongs together. This lesson treats each principle as a decision with a test, using the everyday work of a Ghanaian freelance designer — flyers, business cards, social posts, a shop's menu — as the material.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Clients rarely describe what is wrong in design terms. They say it \"does not pop\", \"looks cheap\" or \"feels busy\". All three complaints are diagnosable: nothing dominates, so there is no hierarchy; nothing repeats, so nothing coheres; nothing aligns, so the eye cannot settle; and everything is equally spaced, so nothing reads as a group. Fixing those four things account for most of the perceived improvement between an amateur design and a competent one.",
          },
          {
            heading: "Definition: the four principles and the tools that express them",
            kind: "definition",
            body:
              "**Contrast** means difference that carries meaning. If two things are not the same, make them clearly different: a heading at 36 px and a body at 16 px, not 18 and 16. Weak contrast is the single most common fault in beginner work — grey text on a light background, similar weights, sizes within a couple of points of each other. The test: squint at the design. Whatever still stands out is the hierarchy; if nothing stands out, there is no hierarchy.\n\n**Repetition** means reusing visual elements deliberately: the same typefaces, the same palette, the same button shape, the same spacing scale across every piece in a set. Repetition is what makes twelve social posts look like one brand rather than twelve experiments. The test: show three pieces side by side — do they obviously belong together?\n\n**Alignment** means every element has a visible connection to something else, usually an invisible grid. Nothing should be placed by eye. The test: draw the margins — a left edge that varies by 4 px between elements reads as sloppy even to people who cannot say why.\n\n**Proximity** means spacing communicates relationship: things that belong together sit close, unrelated things sit further apart. The corollary is that you should never use equal spacing everywhere; equal spacing destroys grouping. The test: cover the text and look at the blocks — the groups you see should be the groups that matter.\n\nSupporting decisions that make the four principles achievable: a **grid** (12 columns is standard for web and print), a **spacing scale** (4, 8, 12, 16, 24, 32, 48, 64 px — one scale, used everywhere), a **type scale** (a base size and 2–4 larger sizes, each noticeably different), and a **whitespace budget** — professional layouts are usually 30–50% empty, and beginners fill it because empty space feels like wasted money. It is not; it is what makes the content readable.",
          },
          {
            heading: "Colour with numbers",
            kind: "paragraph",
            body:
              "Colour choices can be defended or merely argued. Four facts make them defensible.\n\n**Contrast is measured.** The ratio between text and background should be at least 4.5:1 for body text and 3:1 for large text — the same WCAG numbers as in interface design, because a flyer and a website are both read by eyes. A contrast checker is free and takes seconds.\n\n**Hue carries convention and culture.** Red means danger in interfaces and celebration in Chinese and Ghanaian contexts; green means success in finance and is also a national colour; black is formal in some settings and mourning in others. Learn your client's audience rather than assuming.\n\n**Value (lightness) does most of the work.** A palette with wide value range reads clearly even when printed in greyscale or photocopied — which happens constantly with invoices, forms and posters. Test your design in greyscale: if it survives, the hierarchy is real.\n\n**Palette structure beats colour preference.** A workable starting structure: one dominant colour (60% of the area), one secondary (30%), one accent (10%); plus neutrals — near-black, mid-grey, off-white. Two or three brand colours are plenty. Limits are what create identity.\n\nPractical advice for Ghanaian small businesses that print locally: ask the printer what they can reproduce reliably, prefer fewer inks, and remember that a colour proof on cheap digital stock rarely matches a large-format print — so design for the output it will actually be seen in.",
          },
          {
            heading: "Worked example: the same business card, fixed",
            kind: "example",
            body:
              "A first card: the business name centred at 14 pt bold, the phone number at 12 pt, the email at 12 pt, the address at 11 pt, all centred, with four decorative shapes and a drop shadow. It is not terrible; it is vague. Nothing dominates, spacing is even, there is no alignment structure, and the decoration competes with the information.\n\nFour changes, in order:\n\n**Contrast.** The name becomes the clear first read at 20 pt in the brand colour; the role sits at 9 pt in letterspaced uppercase; contact details settle at 9 pt in near-black. The gap between levels is now large enough to see.\n\n**Alignment.** Everything moves to a single left edge at the same margin, with the logo on the far left and the details block aligned to it. Centred text is replaced by a strong vertical edge.\n\n**Proximity.** Name and role are 2 mm apart (they are one unit); the contact block sits 8 mm below (a different unit); the address is grouped with the contact details.\n\n**Repetition.** The three decorative shapes are deleted; only the logo mark, the brand colour and one typeface family remain — which is what makes the card recognisably from the same business as the flyer and the shopfront sign.\n\nSame content, same budget, same printer. The card now reads in the order the business wants: who, what they do, how to reach them.",
            code:
              "BEFORE (all centred, weak hierarchy, decoration competing)\n  BUSINESS NAME            14 pt  bold, dark grey\n  Phone                    12 pt  dark grey\n  email@example.com        12 pt  dark grey\n  Address line             11 pt  grey\n  + 4 decorative shapes, drop shadows, 3 typefaces\n\nAFTER (left aligned to one margin, clear levels)\n  margin 5 mm · 85 × 55 mm card\n\n  [logo mark 10 mm]     KOFI MENSAH                20 pt  semibold  #1B3A6B\n                        Graphic Designer            9 pt  uppercase  letterspacing .08em\n\n                        +233 24 000 0000            9 pt  #1B1B1B\n                        kofi@studio.gh              9 pt  #1B1B1B\n\n                        Osu, Accra · studio.gh      8 pt  #5A5A5A\n\n  rules applied: 2 spacing values (2 mm inside a group, 8 mm between groups)\n                 one typeface family, three sizes, two colours + neutrals\n                 squint test: the name is the only thing visible → correct",
            language: "text",
            codeLabel: "Four fixes, no new budget",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Choosing fonts and colours before deciding the hierarchy.** Decide what the reader must see first, second and third; then choose the type and colour that express it.\n- **Equal spacing everywhere.** It looks tidy and communicates nothing. Vary spacing to create groups.\n- **Too many typefaces and weights.** One family with several weights will almost always look better than three families. Three typefaces is a crowd, not a palette.\n- **Centred everything.** Centred text has no strong edge; it is harder to scan and nearly impossible to align anything else to.\n- **The client as designer.** \"Make my logo bigger\" is usually a request about visibility of the *business*, not the logo. Ask what the customer must be able to do, then solve for that.\n- **Designing on a laptop with squinting-distance eyes.** Zoom out to 25%, or view the design on a phone, to see what a hurried passer-by sees.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Principle", "What it does", "Test", "Typical beginner failure"],
              ["Contrast", "Creates hierarchy and directs the eye", "Squint test; greyscale test", "Sizes within 2 pt, grey on light grey"],
              ["Repetition", "Makes a set feel like one brand", "Three pieces side by side", "A new look for every post"],
              ["Alignment", "Gives structure and calm", "Check each edge against a guide", "Elements placed by eye, varying margins"],
              ["Proximity", "Communicates relationship", "Look at the blocks, not the text", "Uniform spacing, no grouping"],
              ["Whitespace", "Makes content readable and premium", "Aim for 30–50% empty", "Filling every corner"],
              ["Grid and scale", "Makes decisions repeatable", "Snap to the grid; use the scale", "Arbitrary values everywhere"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Contrast, repetition, alignment and proximity are not decoration rules; they are how a design communicates hierarchy and relationship. Contrast makes the reader look where you want; repetition makes separate pieces one brand; alignment gives the eye a structure; and spacing shows what belongs together. Backed by measured colour contrast, a limited palette, a grid and a spacing scale, these four ideas carry a beginner from \"looks like a student made it\" to \"looks like somebody was paid for it\".",
          },
        ],
        keyPoints: [
          "Apply contrast, repetition, alignment and proximity, and name the test for each.",
          "Use the squint and greyscale tests to check hierarchy in your own work.",
          "Describe colour choices with measured contrast ratios and a 60/30/10 palette structure.",
          "Set up a grid, a spacing scale and a type scale, and use them consistently.",
          "Diagnose a client's vague complaint (\"it looks cheap\") as one of the four principles.",
        ],
        exercises: [
          "Take a flyer you have made and apply the squint test and the greyscale test. List every hierarchy failure you find and fix one.",
          "Redesign a business card using a single left alignment, two spacing values and one typeface family.",
          "Build a five-colour palette for a real business using the 60/30/10 structure, stating the contrast ratio of your text colours against their backgrounds.",
          "Layout the same content twice: once with equal spacing and once with deliberate grouping. Ask three people which reads more easily and why.",
          "Find three social posts from one brand and check the repetition test. Note what makes them recognisable as the same brand.",
        ],
        challenge:
          "Design one complete set for a real small business — a flyer, a business card and three social posts. Use one grid, one type scale, one palette and one spacing scale across all five pieces, document your contrast ratios, and apply the squint and greyscale tests to each. Then revise: list every change you made after testing, and why the tested version is better than your first instinct.",
      }),

      lesson({
        id: "typography-and-layout",
        title: "Typography and layout",
        summary:
          "Type is most of graphic design, and most type decisions are technical: size, line height, measure, hierarchy and spacing. This lesson covers families and their use, the numbers that make text readable, how to build a type scale and keep it consistent, image and text balance, and the layout patterns that work for print and for social — ending with a preflight checklist that catches the mistakes clients actually notice.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A beginner can be recognised instantly by their text: too many sizes, line height left at default, a paragraph as wide as the page, headings in a decorative script, and letter spacing applied at random. All of these are fixable with a handful of numbers and a little discipline, and the difference is visible before any colour or imagery is chosen.",
          },
          {
            heading: "Definition: family, pair, scale, measure, leading, tracking",
            kind: "definition",
            body:
              "**Typeface vs font.** The typeface is the design (Inter, Playfair Display); the font is a specific file and style (Inter SemiBold).\n\n**Serif, sans-serif, slab, script, display.** Serifs have small strokes at the ends of letters and traditionally suit longer printed text; sans-serifs are cleaner on low-resolution screens and are the default for interfaces; slab serifs are heavy and confident, good for posters; scripts imitate handwriting and are almost never readable in small sizes; display faces are designed for large sizes only.\n\n**Pairing.** Two families at most, and pair them for contrast: a display or serif for headings with a neutral sans for body, or one family in several weights. What matters is *difference in kind* plus *consistency in role*: headings always from one family, body always from the other, never traded.\n\n**A type scale.** A base size (16 px for screens, 9–11 pt for print) and a small set of larger sizes, each obviously different. Ratios of roughly 1.25 or 1.333 between steps produce a scale that looks intentional. Five sizes is a generous system: 12, 14, 16, 21, 28, 48 px.\n\n**Measure (line length).** The single most-improved setting in beginner work: 45–75 characters per line for body text, around 66 as the ideal. Lines that span a full A4 page are unreadable; the eye loses the start of the next line and the reader skips or gives up.\n\n**Leading (line height).** 1.4–1.6× the font size for body text on screen; 1.2–1.4 for print; 1.0–1.2 for large headings, which need proportionally less. Set it explicitly; never accept the default.\n\n**Tracking and kerning.** Tracking is spacing across a range of characters: add 2–8% for uppercase labels and headings, never for body text. Kerning is adjusting the space between two specific characters (`AV`, `To`, `Yo`). Beginners should leave kerning alone except in logos, where it is worth the effort.\n\n**Hierarchy, then everything else.** Order the content: what is read first, second, third? Express it with size, weight, colour and space — not with underline, italics and caps all at once.",
          },
          {
            heading: "Layout for the formats you actually produce",
            kind: "paragraph",
            body:
              "**Print (flyer, poster, card).** Design at final size with a 3–5 mm bleed, keep essential content inside a safe margin (3–5 mm for a card, 10 mm for a poster), and check it at 100% zoom on the actual size, not on screen. Print will be read at a distance or held in a hand; a poster needs its main line legible from 2–3 metres, which means 50 pt or more.\n\n**Social.** Design for the crop: safe areas differ per platform (a 1:1 post, a 4:5 feed image, a 9:16 story with interface elements at the top and bottom). Put text in the middle 80% and check the design with overlays. Assume it will be seen at thumbnail size: one idea, one line, one action.\n\n**Signage and banners.** Viewed at distance, in sunlight, moving. Fewer words, much bigger type, maximum contrast, and check that the design survives being read at a glancing angle in the rain — the real conditions matter more than the mock-up.\n\n**Menus and price lists.** Alignment does the work: prices right-aligned on a dotted leader, items left-aligned, sections separated by space rather than by rules. Readability beats decoration; this is the one design piece where a customer is trying to find information while hungry.\n\n**Documents and reports.** Set a proper grid with generous margins, use one column for body text, keep headings with the content that follows them, and number the pages. A report that looks considered is read more carefully than one that looks like a word processor default — a fact that matters when the document is a proposal.",
          },
          {
            heading: "Worked example: reading the numbers in a real layout",
            kind: "example",
            body:
              "A one-page A5 flyer for a training centre, assessed line by line. The original leaves line height at default, sets the body at 11 pt across a 130 mm measure, uses 14 pt for both the heading and the subheading, and puts a full paragraph of course details in centred text.\n\nThe diagnosis, with numbers. The measure of 130 mm at 11 pt is roughly 100 characters per line — a third longer than the comfortable maximum, so nearly everybody skips lines. The heading and subheading differ by 2 pt, so there is no visible hierarchy. Centred text over six lines gives every line a different left edge, which is harder to scan than a single edge. Line height at default (1.15) is tight for body text, and the two-line paragraph touches the details block with no space between groups.\n\nThe repair, with the same numbers made deliberate: body at 10.5 pt with line height 1.45 and a 75 mm measure in two columns; the heading at 28 pt and the subheading at 13 pt letterspaced (a 15 pt gap, unmistakable); left-aligned text on a 12 mm margin; 8 mm between the heading block and the body and 4 mm between paragraphs. The same content now takes 35 seconds to read instead of two minutes of struggle — which is the only metric that matters on a flyer.",
            code:
              "BEFORE\n  measure        130 mm ≈ 100 characters per line   (target: 45–75)\n  line height    1.15 (default)                      (target: 1.4–1.6 body)\n  heading        14 pt bold  ┐ 2 pt apart — no\n  subheading     12 pt bold  ┘ visible hierarchy\n  alignment      centred, 6 lines → ragged left edge, harder to scan\n  grouping       paragraph touching the details block, equal spacing throughout\n\nAFTER\n  body           10.5 pt / 1.45 line height / two columns of 75 mm ≈ 65 chars\n  heading        28 pt semibold, -1% tracking\n  subheading     13 pt uppercase, +6% tracking, brand colour\n  body text      left aligned, 12 mm margin, single left edge\n  spacing        8 mm before the body block · 4 mm between paragraphs\n                 12 mm between sections (space, not rules)\n  test           squint → heading first, then subheading, then body\n                 greyscale → still clear; thumbnail → headline readable",
            language: "text",
            codeLabel: "Same copy, six settings made deliberate",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Too many sizes.** Six sizes for one flyer is noise. Four levels usually cover a whole piece: display, heading, subheading, body.\n- **Default line height.** The biggest single readability gain is available for free: set 1.4–1.6 for body text.\n- **Full-width paragraphs.** Anything over about 75 characters per line is read worse, and people blame the content rather than the layout.\n- **Script and display fonts for body text.** They are designed to be used large and briefly; small text in them is unreadable and looks unprofessional.\n- **Fake bold and fake italics.** Applying a computer-generated slant or weight instead of using the real font style produces a visibly distorted result. Use the family's own styles.\n- **Forgetting the bleed and safe area.** A flyer trimmed 2 mm inside your border, or a poster with its headline under a frame, is a reprint. Ask the printer for their template and use it.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Setting", "Print", "Screen", "Why"],
              ["Body size", "9–11 pt", "16 px minimum", "Comfort and legibility"],
              ["Line height", "1.2–1.4", "1.4–1.6", "Tracking across lines without effort"],
              ["Measure", "45–75 characters", "45–75 characters", "The eye loses long lines"],
              ["Heading sizes", "2–3× body for the main heading", "Same ratio, in rem", "Hierarchy must be obvious"],
              ["Uppercase labels", "+4–8% tracking", "+4–8% tracking", "Caps need space to be readable"],
              ["Margins", "10 mm (A4) to 3 mm (card)", "16–24 px", "Keeps content off the edge"],
              ["Bleed", "3 mm (card) to 5 mm (poster)", "n/a", "Trim tolerance"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Typography is mostly arithmetic: a base size, a short scale, explicit line height, a measure of 45–75 characters, and a clear hierarchy expressed in size and weight. Layout then adapts those numbers to the format and the viewing distance — print with bleed and safe areas, social with crops and thumbnails, signage with distance and glare, menus with alignment. Set the numbers deliberately once, and every piece afterwards becomes faster to produce and consistently better.",
          },
        ],
        keyPoints: [
          "Choose typeface roles (display, heading, body) and pair no more than two families.",
          "Apply the numbers: base size, scale ratio, line height, measure and tracking.",
          "Adapt a layout to print, social, signage and menu formats with their real constraints.",
          "Diagnose a layout's readability problems by measuring measure, leading and spacing.",
          "Run a preflight check — bleed, safe area, fonts, images — before sending anything to print.",
        ],
        exercises: [
          "Measure the characters per line of a paragraph you have written in any document and adjust it to 45–75.",
          "Build a five-step type scale for a project, then apply it to a single page using only those sizes.",
          "Take an existing poster and rewrite its main line at 28 pt, 40 pt and 60 pt. Choose the size by viewing it from three metres and report which worked.",
          "Set the same short text in four combinations: centred/all caps, left/uppercase labels, two columns, and one wide column. Ask three people to read each and time them.",
          "Prepare a print-ready A5 flyer with bleed and safe margins, then export it and verify every font is embedded and every image is above 300 ppi.",
        ],
        challenge:
          "Produce a small print pack for one real client or project — an A5 flyer, a business card and a poster — sharing one grid, one type scale and one palette. Document the numbers you used (sizes, leading, measure, margins, bleed), export print-ready files, and get them checked by a printer or somebody who has sent work to print. Record what the printer corrected, and update your own template with it.",
      }),
    ]
  ),

  module(
    "production-and-practice",
    "02 · Tools, output and practice",
    "Colour modes, file formats, a real workflow, and getting paid.",
    [
      lesson({
        id: "colour-modes-and-file-formats",
        title: "Colour modes, resolution and file formats",
        summary:
          "The technical half of graphic design decides whether the work survives contact with a printer or a screen: RGB versus CMYK, pixels versus vector, dots per inch and its relationship with viewing distance, the difference between JPEG, PNG, SVG and PDF, and how to prepare files that a printer, a developer and a social platform will each accept without complaint. None of it is difficult; all of it causes expensive reprints when it is skipped.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A designer who has produced beautiful work on screen and sent a 72 dpi RGB JPEG to a printer for a 3-metre banner has learned an expensive lesson. The rules here are few, and they are the ones that turn a mock-up into a deliverable: choose the right colour mode, the right resolution for the viewing distance, and the right format for the destination.",
          },
          {
            heading: "Definition: colour modes, resolution, raster and vector",
            kind: "definition",
            body:
              "**RGB** (red, green, blue) is additive: light added together, used by every screen. A larger gamut, so some vivid screen colours cannot be printed. Design for screens in RGB (sRGB is the safe space).\n\n**CMYK** (cyan, magenta, yellow, black) is subtractive: ink on paper. Printers require it, and converting from RGB will dull some colours — which is why you should choose CMYK early for print work rather than being surprised at the end. Never convert back and forth; every conversion loses information.\n\n**Pantone (spot) colours** are pre-mixed inks with exact references, used when a brand colour must be reproduced identically (a logo, a political colour, corporate identity). They cost an extra plate, so they are used for one or two colours, not for photographs.\n\n**Resolution** is measured in **ppi** (pixels per inch, for images) and **dpi** (dots per inch, for printers). For print, aim for 300 ppi at final size. For screens, the pixel dimensions themselves matter, not the ppi number — a 1200×628 px image is the same file whether you tag it 72 or 300 ppi.\n\n**Viewing distance changes the requirement.** Large-format work is set at a fraction of print resolution: a banner read from 10 metres can be designed at 30–50 ppi at final size and will look sharp. The rule of thumb is ppi ≈ 300 ÷ viewing distance in metres (approximately, with generous rounding), and the practical advice is to ask the printer what they require.\n\n**Raster vs vector.** Raster (JPEG, PNG, TIFF, PSD) is a grid of pixels: photographs and detailed artwork, with fixed resolution — enlarge it and it blurs. Vector (SVG, AI, EPS, PDF) is mathematical shapes and text: logos, icons, illustrations, layouts, and it scales to any size with no loss. A logo must exist as a vector. Always.\n\n**The formats you will actually deliver**:\n\n- **PDF** — the print standard. Export with 3–5 mm bleed, crop marks, embedded fonts and CMYK for print; or the small web-optimised version for sending.\n- **PNG** — lossless raster with transparency, for logos on screens, screenshots and images with text.\n- **JPEG** — lossy photographs for the web and social, at 70–85% quality.\n- **SVG** — vectors for the web: logos, icons, anything that must scale and stay editable.\n- **WebP/AVIF** — modern screen formats with far smaller files for the same quality.\n- **TIFF** — large lossless print files, when a printer asks for them.\n- **PSD/AI/AF** — working files, kept and handed over only if the contract says so.",
          },
          {
            heading: "Preparing files so nobody has to phone you",
            kind: "paragraph",
            body:
              "A short preflight, in order, that prevents almost every production problem:\n\n1. **Size and orientation** match the printer's specification exactly, including bleed.\n2. **Colour mode** is CMYK for print, RGB for screen. Convert images deliberately, not by saving.\n3. **Images are 300 ppi at final size** for print (or the agreed lower value for large format), and never simply scaled up in the layout — a 300-pixel logo stretched across a poster is a blur, and the printer will see it before you do.\n4. **Fonts are embedded** in the PDF, or converted to outlines in artwork-only files. A missing font is the most common cause of a reprint.\n5. **Text is inside the safe area**, not within 3 mm of the trim.\n6. **Black text** is set as 100% K for small type on print, not rich black (a four-ink mix that can blur on small text); large solid black areas may use rich black for depth, per the printer's advice.\n7. **Transparency and effects** are approved by the printer; some workflows flatten them badly.\n8. **The export is opened again** — the PDF checked at 100% for the fonts, the bleed, the colour and the trim — before it is delivered. Nobody ever regrets this step; everybody regrets skipping it.\n\nFor web and social delivery, the equivalent list is: correct pixel dimensions per platform, RGB, file size within the platform's limit and the user's patience (under 200 KB for most social images), meaningful file names (`kofi-mensah-business-card-front.pdf`, not `final-final-3.pdf`), and an organised handover folder with working files if the contract includes them.",
          },
          {
            heading: "Worked example: one logo, five outputs",
            kind: "example",
            body:
              "A client has a logo and needs it for everything from a shop sign to an app icon. The correct deliveries come from a single vector master, and each output has its own requirements.\n\nThe vector master (SVG plus the working file) is the source of truth: scalable, editable, and the only file the client should ever need to send somebody else. From it: a print PDF in CMYK for a signwriter, rasterised PNGs at the sizes a website needs (with a transparent background), a favicon set (16, 32, 180, 192, 512 px), and social avatars at each platform's size.\n\nTwo details that make the difference between a professional handover and a support problem. First, the small sizes need a *simplified version*: a logo with six details works at 300 mm and turns to mush at 32 px, so the icon set uses the mark alone, without the wordmark or the fine lines. Second, every colour is documented with its values — hex for screens, CMYK for print, and a Pantone reference if the brand uses one — with a note about the minimum size and the clear space around the mark. That document is a one-page brand sheet, and it is what stops the next person from stretching the logo or recolouring it.",
            code:
              "kofi-studio-brand/\n  logo-master.ai · logo-master.svg        ← vector source of truth\n  logo-print-cmyk.pdf                     ← signwriter / printer\n  logo-icon-512.png · logo-icon-192.png · logo-icon-32.png · favicon.ico\n  logo-horizontal-web.png (400×120, transparent)\n  social-avatar-1024.png                  ← 1:1, safe inside the crop\n  brand-sheet.pdf                         ← one page, below\n\nBrand sheet (extract)\n  Primary   #1B3A6B   C 100 M 82 Y 30 K 12   Pantone 294 C\n  Accent    #F2A33C   C 0  M 42 Y 85 K 0\n  Neutral   #1B1B1B   C 0  M 0  Y 0  K 90\n  Typeface  Inter (headings semibold, body regular)\n  Clear space  = height of the mark's inner square, on all sides\n  Minimum size digital 24 px · print 12 mm wide\n  Never        stretch, recolour, outline, rotate, add shadows or gradients\n\nWhy the icon set uses the mark alone: at 32 px the wordmark is illegible\nand the fine lines disappear — a simplified mark reads at every size.",
            language: "text",
            codeLabel: "One master, the correct output for each destination",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Designing print work in RGB.** The screen shows colours the printer cannot mix, and the output disappoints. Choose CMYK (or Pantone) early.\n- **Confusing ppi and dpi.** What matters is pixels at final size. Tagging a low-resolution file with a big dpi number changes nothing.\n- **Scaling a raster logo up.** A 200 px logo cannot become a 2-metre banner. Without a vector source, it must be redrawn.\n- **Saving a screenshot as JPEG.** Small text and sharp edges collect artefacts; use PNG for anything with text or flat colour.\n- **Forgetting bleed.** The design gets trimmed and the border disappears — the classic reprint.\n- **Sending working files without agreeing.** Handing over the source without a contract clause gives away the ability to charge for edits; charging for it when the client expected it ends the relationship. Say what is included, in writing, before the work starts.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Deliverable", "Format", "Colour mode", "Key settings"],
              ["Business card / flyer (print)", "PDF", "CMYK", "3–5 mm bleed, crop marks, 300 ppi images, fonts embedded"],
              ["Large banner / sign", "PDF or TIFF", "CMYK", "Ask the printer: often 30–72 ppi at final size, vector text"],
              ["Logo for the web", "SVG (plus PNG fallback)", "RGB", "Transparent background, optimised, simplified mark for small sizes"],
              ["Photograph for the web", "JPEG / WebP / AVIF", "RGB (sRGB)", "70–85% quality, sized to display, lazy-loaded"],
              ["Logo or text needing transparency", "PNG", "RGB", "Lossless; avoid for photographs (large files)"],
              ["App icon / favicon", "PNG + ICO", "RGB", "16/32/180/192/512 px, simplified mark"],
              ["Social image", "PNG or JPEG", "RGB", "Exact platform dimensions, text in the middle 80%, < 200 KB"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Colour modes, resolution and formats are the facts that determine whether a design survives production: CMYK and 300 ppi with bleed for print, RGB and correct pixel dimensions for screens, vector for anything that must scale, and a short preflight before delivery. Prepare one vector master, generate each output deliberately, document the colours and rules in a brand sheet, and both the printer and the next designer will work without calling you.",
          },
        ],
        keyPoints: [
          "Choose RGB, CMYK or Pantone according to the destination, and explain what conversion costs.",
          "Calculate the resolution a print job needs from its final size and viewing distance.",
          "Explain raster versus vector and name the outputs that must be vector.",
          "Select the correct export format for print, web, social and app icons, with the right settings.",
          "Run a preflight check that catches bleed, resolution, colour and font problems before printing.",
        ],
        exercises: [
          "Take a print design you have made and convert it to CMYK. Note every colour that shifts and decide whether to adjust the design.",
          "Calculate the pixel dimensions needed for a 3 m × 1 m banner viewed from 10 m, and render the artwork at that size.",
          "Export one logo as PDF (print), SVG (web), PNG (transparent) and favicon sizes. Compare the visual quality at small sizes and simplify where needed.",
          "Take a screenshot with small text and save it as both JPEG and PNG at 80% quality. View both at 100% and describe the difference.",
          "Write a one-page brand sheet for a real business: colours with hex and CMYK values, typeface, clear space, minimum size and prohibited uses.",
        ],
        challenge:
          "Prepare a complete delivery package for a real design job: a vector master, a print-ready PDF with bleed and embedded fonts, web and social exports at their exact dimensions, an app icon set with a simplified mark, and a one-page brand sheet. Have somebody else open every file — a printer or a developer if possible — and note every question they ask. Anything they had to ask about is something your package should have answered.",
      }),

      lesson({
        id: "design-workflow-and-freelancing",
        title: "A design workflow, and getting paid for it",
        summary:
          "Talent gets you the first job; process gets you the second. This lesson is the working method of a freelance designer in Ghana: briefing and asking the questions that prevent rework, concepting and presenting work so that the client can respond usefully (rather than asking for the logo to be bigger), version control for design files, handover, invoicing and pricing — including how to quote, what to put in a contract, and how to raise a rate without losing clients.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Most freelance design failures are not aesthetic. They are briefing failures (the client wanted something else, which nobody wrote down), revision failures (unlimited rounds, because nobody agreed a number), payment failures (no deposit, no written scope) and handover failures (the client cannot use the files, so every change costs another conversation). A simple process removes almost all of them, and it is what separates a designer who earns steadily from one who works constantly for less.",
          },
          {
            heading: "Definition: brief, concept, revision, deliverable, licence",
            kind: "definition",
            body:
              "**A brief** is a written agreement about the problem: what the design must achieve, who it is for, where it will appear, what content exists, what the constraints are (budget, printer, timeline, existing brand), and what success looks like. A one-page brief that both parties sign prevents the majority of disputes.\n\n**A concept** is a direction, not a finished thing: two or three distinct routes, each with a rationale in a sentence, presented as mock-ups in the context where the design will actually appear (a flyer photographed in a hand, a sign on a wall, a post in a phone frame). Presenting three variations of the same idea is not three concepts, and it invites the client to blend them into something worse.\n\n**A revision** is a change to a chosen concept. Two rounds are standard; a change of direction is new work and should be quoted separately. Define a *round* in the contract as one consolidated set of feedback — not a continuous conversation that never ends.\n\n**A deliverable** is what the client receives: the listed files, in the listed formats. **A licence** is what they may do with it. Unless the contract assigns copyright, the client usually gets a licence to use the work for the agreed purposes. Say which, in writing; many clients assume they bought exclusivity and full ownership by default.\n\n**Pricing models.** Hourly rewards slowness and punishes improvement. Per-project rewards speed and is easier for clients to approve. Value-based prices against the outcome (a shop sign that draws customers) and requires a confident designer. The practical route for beginners: fixed project prices, quoted from a real estimate of hours, raised as your portfolio grows.",
          },
          {
            heading: "The workflow, end to end",
            kind: "paragraph",
            body:
              "1. **Enquiry.** Ask for the deadline, the budget range, the deliverables and who approves the work. Budget is a legitimate question; without it, you are guessing.\n2. **Brief.** One page, signed, including scope, revisions, timeline, deposit and what is *not* included.\n3. **Deposit.** 40–50% before work starts. This single practice eliminates the clients who were never going to pay, and it is normal professional practice in Ghana and everywhere else.\n4. **Research and concepting.** Look at competitors, gather references, then sketch widely before touching the software. Sketching on paper is faster and the ideas are less attached to a tool.\n5. **Presentation.** Two or three concepts, each in context, each with a one-sentence rationale, and questions you want answered rather than a speech. Never present a design you would not defend.\n6. **Revision rounds.** Consolidate feedback, confirm it in writing (\"so, to confirm: headline larger, contacts moved to the base, no colour change\"), then implement.\n7. **Approval.** Get a written sign-off on the final design before final files are exported and delivered. Vague verbal approval followed by changes is the classic route to unpaid work.\n8. **Delivery.** Files named clearly, in a folder, with a short note listing what each one is for, the colour values and the font used. Final payment is due on delivery, not after the client's internal approval.\n9. **Handover and record.** Deliver print-ready files to the printer yourself where possible. Archive the project with the brief, the emails and the source files, and ask for a testimonial while the client is still pleased.\n\nPractical safeguards: keep every version (`client-logo-v3-2026-08-14.ai`, never `final-final`), back up to two places, work from a written brief, and never send source files before the balance is paid.",
          },
          {
            heading: "Worked example: quoting, and the hidden costs beginners forget",
            kind: "example",
            body:
              "A client asks for \"a logo and a poster\" for GH₵300. Accepting without a brief leads to eleven rounds of revisions, the client's nephew changing the design, and a request for the source files \"just in case\". The professional response is a quote based on estimated work, presented as a package with what is included and what is not.\n\nThe estimate below prices 12 hours of work. Note the three things beginners omit: the discovery and brief (2 hours), the presentation and revision rounds (3 hours), and the export, handover and brand sheet (1.5 hours). Those are real work and are invisible in the final artwork.\n\nIt also shows why the rate must include non-billable time. If a designer bills 25 hours a week — realistic with admin, marketing and quoting — then a GH₵60/hour billable rate yields GH₵1,500 per week of *work*, and the annual figure must also cover equipment, software, internet, data, electricity and the weeks with no work at all. A rate that ignores those is a rate that does not survive a slow month.\n\nFinally, note the terms: a 50% deposit, two revision rounds, final payment on delivery, and the licence explained in one sentence. The client sees a professional, and disputes mostly disappear before they start.",
            code:
              "Quote — Kofi's Kitchen (logo + A2 poster)\n\n  Discovery and brief         2.0 h\n  Research, sketches           2.5 h\n  Logo concepts (3) and build 3.0 h\n  Presentation + 2 revisions  3.0 h\n  Poster layout               2.0 h\n  Export, print files, brand sheet, handover  1.5 h\n                              -----\n                             14.0 h  × GH₵55 = GH₵770\n\n  Package includes: 3 logo concepts, 2 revision rounds, final logo as SVG/PDF/PNG,\n  A2 print-ready poster PDF with bleed, one-page brand sheet, print liaison.\n\n  NOT included: additional concepts, photography, printing costs, copywriting,\n  changes after sign-off, social templates, monthly maintenance.\n\n  Terms: 50% deposit to begin (GH₵385) · balance on delivery of final files\n         licence: client may use the artwork for their business without\n         time limit; copyright remains with the designer unless assigned\n         in writing (assignment quoted separately at 3× project fee)\n\n  Sanity check on the rate:\n   14 h × GH₵55 = GH₵770 per project\n   ~25 billable hours a week available → GH₵1 375 a week if fully booked\n   minus software, data, power, equipment, and the empty weeks\n   → a sustainable floor, not a luxury price. Quote from this, not from the\n     client's opening offer.",
            language: "text",
            codeLabel: "A quote built from estimated hours and stated terms",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Starting without a deposit or a brief.** Both are standard; refusing them is a warning about the client, not about you.\n- **Unlimited revisions.** They are the mechanism by which a small job becomes an unprofitable one. Put the number in writing and quantify what extra rounds cost.\n- **Presenting one concept and asking \"do you like it?\"** You need a comparison and a rationale, and the question should be about whether it solves the problem.\n- **Sending source files before payment.** It removes your only leverage. If the contract includes source files, deliver them on final payment.\n- **Competing on price alone.** There is always somebody cheaper, often using pirated software and template work. Compete on understanding the brief, delivering on time and being easy to work with.\n- **Keeping no record.** Emails, briefs, approved proofs and invoice numbers are what protect you in a dispute, and they make the next project faster.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Stage", "Client-facing artifact", "Protects against", "Beginner's shortcut"],
              ["Enquiry", "Short questionnaire or call", "Building for the wrong audience", "\"Send me the details\" (nothing written)"],
              ["Brief", "One page, signed", "Scope disputes and endless additions", "A verbal description"],
              ["Deposit", "Invoice for 40–50%", "Non-payment and time-wasting clients", "Starting on goodwill"],
              ["Concepts", "2–3 routes, in context, with rationale", "Endless \"not quite it\" cycles", "One option, presented casually"],
              ["Revisions", "Written log of requests per round", "Scope creep, re-litigating decisions", "Unlimited informal changes"],
              ["Sign-off", "Approved proof in writing", "Rework after delivery", "\"The client said it was fine\""],
              ["Delivery", "Named files plus a delivery note", "Handover support calls", "A ZIP with `final2.ai` inside"],
              ["Record", "Archive and testimonial request", "Losing history; no proof of work", "Starting the next job immediately"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A design career is built on process as much as taste: a written brief, a deposit, two or three real concepts presented in context, defined revision rounds, written sign-off, a clean delivery with the right files and a brand sheet, and a quote built from estimated hours that includes the invisible work. Do those things and clients treat you as a professional; skip them and even good work turns into unpaid revisions.",
          },
        ],
        keyPoints: [
          "Write a one-page brief covering objective, audience, formats, constraints, budget and timeline.",
          "Present two or three distinct concepts in context, with rationales and questions.",
          "Define revision rounds in writing and price anything beyond them.",
          "Quote from estimated hours including discovery, presentation and handover, not just artwork.",
          "Deliver named, correct files on final payment and explain the licence in writing.",
        ],
        exercises: [
          "Write a one-page brief template and use it for a real or fictional client. Include the questions that prevent rework.",
          "Price a project you have already done, hour by hour, including the hidden work. Compare with what you charged and note the difference.",
          "Prepare three concepts for one design problem and write a one-sentence rationale for each. Ask three people which solves the problem and why.",
          "Draft the terms section of your own quote: deposit, revisions, sign-off, licence and what is not included.",
          "Build a named, organised delivery folder for a past project: files, formats, a short note explaining each, and colour values.",
        ],
        challenge:
          "Run one real design job through the full process: brief, deposit, three concepts presented in context, two revision rounds logged in writing, sign-off, print-ready and screen deliveries, a brand sheet, and a final invoice issued on delivery. Then write a half-page retrospective: where the work overran, what the client asked for that the brief had not covered, and the one clause you will add to your template next time.",
      }),
    ]
  ),
];
