{
  id: "responsive-design",
  summary: [
    "Responsive design is not a set of tricks for particular phones. It is a way of thinking in which **one document adapts to whatever space it is given** — a 320px phone, a folded tablet, a 34-inch monitor, a browser window resized by a user who also zoomed to 200% because they cannot read small text. The viewport is not a device; it is a number that changes constantly, and your layout must be a function of that number rather than a list of exceptions.",
    "This lesson covers the viewport meta tag and the layout viewport, fluid typography and spacing, the mobile-first method and why it beats desktop-first, media and container queries, fluid images and modern formats, the touch-target and interaction differences, and the failures that account for almost every broken responsive site: horizontal overflow, inaccessible tap targets, and layouts that only work at popular device widths.",
  ],
  objectives: [
    "Explain what the `viewport` meta tag does and what breaks without it, including the difference between the layout and visual viewport.",
    "Apply the mobile-first method: base styles for the narrowest case, then add complexity with `min-width` queries.",
    "Choose breakpoints from the content rather than from a device list, and justify each one you add.",
    "Write fluid values with `clamp()`, and fluid layouts that need no query at all.",
    "Use container queries to make a component respond to its own width rather than the window's.",
    "Make images responsive with `srcset`, `sizes` and `<picture>`, and explain which problem each solves.",
    "Eliminate horizontal scrolling at every width, and diagnose the five usual causes.",
    "Test responsively the way a professional does — narrow widths, zoom, keyboard, and a real phone.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "The viewport is not a device",
      paragraphs: [
        "The word 'device' misleads people into building a fixed list: iPhone, iPad, desktop. In reality a single user changes the available width many times a minute — rotating the phone, splitting the screen, docking a browser beside another window, zooming. And the space your page gets is not even the whole window: browser chrome, scrollbars and a keyboard-on-screen all subtract from it.",
        "Mobile browsers add a further wrinkle. A phone's screen is ~390 CSS pixels wide, but early mobile browsers were built when every site assumed a desktop, so they render pages into a **layout viewport** of ~980px and then shrink the whole thing to fit the **visual viewport**. The result is the tiny, unreadable page you have to pinch-zoom. The `viewport` meta tag tells the browser to stop doing that and set the layout viewport to the device width:",
        "`<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`",
        "`width=device-width` sets the layout viewport to the ideal width for the device in its current orientation. `initial-scale=1` sets the zoom level to 1:1, so one CSS pixel equals one device-independent pixel. Do not add `maximum-scale=1` or `user-scalable=no`: they prevent pinch-zoom, which fails WCAG 1.4.4 and actively harms users with low vision. If your layout breaks when someone zooms, the layout is the problem.",
      ],
    },
    {
      kind: "definition",
      term: "Responsive web design",
      text: "An approach in which a single document adapts its layout, typography and media to the space available, using **fluid grids**, **flexible media** and **media queries**. Coined by Ethan Marcotte in 2010. The modern version adds container queries, intrinsic sizing and fluid type functions, and leans far less on hand-written breakpoints.",
    },
    {
      kind: "prose",
      heading: "Mobile first",
      paragraphs: [
        "There are two directions to write responsive CSS, and one of them is consistently better. **Desktop-first** writes the wide layout as the default and then subtracts with `max-width` queries: the page is complex by default and gets simplified as space shrinks. **Mobile-first** writes the narrow layout as the default and adds with `min-width` queries: simple by default, enhanced as space allows.",
        "Mobile-first wins for four concrete reasons. It forces you to decide what matters, because at 320px you cannot fit everything — content priority becomes explicit rather than accidental. It produces **less CSS**, since the base case needs no overrides and only the wider cases add rules. It is **more robust**: an old browser that understands no media queries at all gets the narrow layout, which still works; a desktop-first stylesheet gives that browser a broken wide layout. And it matches reality: most traffic in Ghana, and increasingly everywhere, arrives on a phone.",
        "Practically, mobile-first means your stylesheet reads as a progression. Base styles: single column, stacked, full-width, larger touch targets. Then `@media (min-width: 40rem)`: two columns where useful, more side-by-side rows. Then `@media (min-width: 64rem)`: the full multi-column layout, a sidebar, a wider measure. You never write a rule that undoes an earlier one, which is exactly why the file stays readable.",
      ],
    },
    {
      kind: "code",
      caption: "The same component, both directions",
      language: "css",
      code: `/* Desktop-first: the base is wide, and every query subtracts. */
.hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; }
@media (max-width: 63.99rem) { .hero { grid-template-columns: 1fr; gap: 1.5rem; } }
@media (max-width: 39.99rem) { .hero { gap: 1rem; padding: 1rem; } }

/* Mobile-first: the base is narrow, and every query adds. */
.hero { display: grid; gap: 1rem; padding: 1rem; }
@media (min-width: 40rem)  { .hero { gap: 1.5rem; } }
@media (min-width: 64rem)  { .hero { grid-template-columns: 1.2fr 1fr; gap: 3rem; } }`,
    },
    {
      kind: "prose",
      heading: "Breakpoints come from content, not devices",
      paragraphs: [
        "The most common beginner mistake is copying a breakpoint list from a framework and treating those numbers as laws. The professional method is the opposite: **build the layout, then slowly widen the browser, and add a breakpoint at the exact width where the design starts to look wrong.** That width is usually not 768px, and it will differ between components.",
        "A breakpoint is justified when something specific fails: the line length exceeds about 75 characters and reading becomes uncomfortable; a row of items becomes so wide the eye cannot connect them; a card's text wraps to one word per line; two columns become too narrow for their content; whitespace stops grouping related things and starts separating them. Those are content failures, and each has a different remedy — some need a new column count, some only a `max-width`, some only a larger `gap`.",
        "Use `rem` or `em` for breakpoint values, not `px`. Media queries in `rem` respond to the user's font-size setting, so a person who has set 20px text gets the wider layout sooner — which is correct, because their content really is bigger. `48rem` is 768px at default settings and something larger for them.",
        "And prefer **ranges** over single points when you need to avoid a broken middle: `@media (min-width: 40rem) and (max-width: 63.99rem)`. Most of the time, though, a chain of `min-width` queries with no upper bound is enough, and simpler to reason about.",
      ],
    },
    {
      kind: "table",
      caption: "Rough starting points — verify each against your own content",
      head: ["Query", "About", "Typical change"],
      rows: [
        ["(base, no query)", "0–40rem", "Single column, stacked sections, full-width media, `gap` around 1rem."],
        ["`min-width: 40rem`", "~640px", "Two columns for cards, side-by-side form fields, nav links inline."],
        ["`min-width: 48rem`", "~768px", "Page skeleton gains a sidebar, hero splits into two columns."],
        ["`min-width: 64rem`", "~1024px", "Three- and four-column grids, sticky table of contents, larger type scale."],
        ["`min-width: 80rem`", "~1280px", "Max content width applied; outer margins grow instead of the content."],
        ["`orientation: landscape` with a low height", "phones held sideways", "Reduce vertical padding; the height, not the width, is the constraint."],
        ["`prefers-reduced-motion: reduce`", "not a size at all", "Remove animation. Same mechanism, different axis."],
      ],
    },
    {
      kind: "prose",
      heading: "Fluid values: layouts that need no query",
      paragraphs: [
        "The best responsive code is code that responds continuously rather than in steps. Three techniques do most of the work.",
        "**Fluid typography with `clamp()`.** `font-size: clamp(1.75rem, 1.2rem + 2vw, 3rem)` gives a heading that is 28px on a phone, grows smoothly with the viewport, and stops at 48px on a large screen. No query, no jump, and — because the minimum is in `rem` — it still respects the user's font-size setting. Use it for display headings and section spacing; keep body text at a fixed `rem` size, because body text should not grow with the screen, only reflow.",
        "**Intrinsic layout with Flexbox and Grid.** As the previous lesson showed, `repeat(auto-fit, minmax(min(220px, 100%), 1fr))` produces one, two, three or six columns depending on space, with no media query. `flex-wrap: wrap` with a sensible `flex-basis` does the same for a row of tags. Reach for these before writing any query.",
        "**Fluid space with percentages and `fr`.** A container of `min(65rem, 100% - 2rem)` is 65rem wide on a desktop and always 1rem from each edge on a phone — one expression, no breakpoint. `padding-inline: clamp(1rem, 4vw, 3rem)` gives gutters that grow with the screen.",
      ],
    },
    {
      kind: "code",
      caption: "A fluid page shell in seven lines",
      language: "css",
      code: `html { font-size: 100%; }

body { margin: 0; }

/* Centred column, always with a gutter, never wider than 65rem. */
.container { width: min(65rem, 100% - 2rem); margin-inline: auto; }

/* Sections breathe more as the screen grows. */
.section { padding-block: clamp(2.5rem, 6vw, 6rem); }

/* Display type that scales continuously and stays within bounds. */
.display { font-size: clamp(2rem, 1.2rem + 4vw, 4rem); line-height: 1.05; }

/* Cards: as many as fit, never narrower than 240px, never overflowing. */
.cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); }`,
    },
    {
      kind: "prose",
      heading: "Container queries: the component's own width",
      paragraphs: [
        "Media queries ask 'how wide is the *window*?'. That is the wrong question for a component. A card in a full-width gallery and the same card in a narrow sidebar have the same window width but need completely different layouts. For years the only workaround was writing two variants with different class names.",
        "**Container queries** fix this properly. You mark an element as a query container, then style a descendant based on the *container's* size:",
      ],
    },
    {
      kind: "code",
      caption: "A card that adapts to where it is placed",
      language: "css",
      code: `.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Narrow container: stack the media above the text. */
.card { display: grid; gap: .75rem; }

/* Wide container: side by side — regardless of the window width. */
@container card (min-width: 30rem) {
  .card { grid-template-columns: 160px 1fr; align-items: center; gap: 1.25rem; }
  .card__title { font-size: 1.25rem; }
}

/* Container query units exist too: 1cqi = 1% of the container's width. */
.card__title { font-size: clamp(1rem, 4cqi, 1.5rem); }`,
    },
    {
      kind: "note",
      label: "Support and cost",
      text: "Container queries are supported in every current browser (Chrome and Safari since 2022, Firefox since 2023) and are safe to use progressively: write the base layout for the narrow case, then add the `@container` block, and an old browser simply keeps the stacked version. Do not use them where a media query is genuinely about the window — page-level layout belongs to media queries; component-level layout belongs to container queries.",
    },
    {
      kind: "prose",
      heading: "Responsive images",
      paragraphs: [
        "Images are usually the largest part of a page and the part that breaks most visibly. There are three separate problems, and three separate mechanisms.",
        "**Problem 1: the image must never overflow its container.** `img { max-width: 100%; height: auto; }` solves it in one line and belongs in every reset. Without `height: auto` the intrinsic aspect ratio is broken and faces stretch.",
        "**Problem 2: a phone should not download a 2 MB desktop image.** That is resolution switching, and `srcset` with `sizes` does it: the browser picks the smallest file that suits the *actual* display size and pixel density. Note that `srcset` never changes the aspect ratio or the crop — it only changes resolution.",
        "**Problem 3: sometimes the right image is a different crop.** A wide landscape on desktop is unreadable on a phone, where a tight portrait crop works better. That is *art direction*, and it needs `<picture>` with `<source media=…>`, because you are choosing a different file, not a different size of the same file.",
        "Alongside all three: use modern formats. **WebP** is typically 25–35% smaller than JPEG at equal quality and **AVIF** smaller again; both are widely supported. Provide `width` and `height` attributes so the browser can reserve the correct space before the image arrives — this eliminates layout shift, a measurable Core Web Vital. And use `loading=\"lazy\"` on images below the fold, but never on the largest above-the-fold image, where lazy loading makes performance worse.",
      ],
    },
    {
      kind: "code",
      caption: "Resolution switching, and art direction",
      language: "html",
      code: `<!-- Resolution switching: same crop, best file for the space available. -->
<img
  src="hero-800.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
  sizes="(min-width: 64rem) 65rem, 100vw"
  width="1600" height="900"
  alt="Students at a workshop in Accra, working in pairs on laptops"
  fetchpriority="high">

<!-- Art direction: a different crop per breakpoint. -->
<picture>
  <source media="(min-width: 48rem)" srcset="team-wide-1200.webp" width="1200" height="500">
  <source media="(max-width: 47.99rem)" srcset="team-tall-600.webp" width="600" height="800">
  <img src="team-wide-1200.webp" width="1200" height="500" alt="The teaching team">
</picture>`,
    },
    {
      kind: "prose",
      heading: "Touch, pointers and interaction differences",
      paragraphs: [
        "A phone is not a small desktop, and the differences are physical. **There is no hover.** `:hover` styles that reveal content — a dropdown that appears on hover, a card whose buttons only show when hovered — make that content unreachable by touch. Use `@media (hover: hover) and (pointer: fine)` to scope hover effects to devices that actually have them, and always provide an alternative path: the button visible by default, or a tap that expands.",
        "**Targets must be big enough.** WCAG 2.5.8 requires at least **24×24 CSS pixels** (AA), and 2.5.5 recommends 44×44 for comfortable touch. That applies to spacing as well as size: two 24px targets touching each other are worse than one 24px target with 8px of gap around it. Icon-only buttons in a toolbar are the usual failure.",
        "**There is a 300ms tap delay** on pages that do not declare a viewport, because the browser waits to see whether you meant to double-tap to zoom. Setting `width=device-width` removes it. `touch-action: manipulation` on interactive elements removes it explicitly as well.",
        "**Keyboards appear and steal space.** On a phone the on-screen keyboard can consume half the viewport, so a `100vh` layout overflows. Use `100dvh` (dynamic viewport height), which accounts for browser chrome and keyboard, and never trap a focused input below the fold.",
        "**Gesture conflicts.** If you implement swiping, do not also rely on horizontal scrolling in the same region, and never make a swipe the only way to reach something.",
      ],
    },
    {
      kind: "code",
      caption: "Pointer-aware interaction",
      language: "css",
      code: `/* Hover effects only where hovering exists. */
@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .card__actions { opacity: 0; transition: opacity .15s; }
  .card:hover .card__actions,
  .card:focus-within .card__actions { opacity: 1; }
}

/* On touch devices the actions are always visible — set that as the base. */
.card__actions { opacity: 1; }

/* Comfortable targets, with real spacing between them. */
.toolbar button { min-height: 2.75rem; min-width: 2.75rem; }
.toolbar { display: flex; gap: .5rem; }

/* No double-tap-to-zoom delay on controls. */
a, button, input, select { touch-action: manipulation; }`,
    },
    {
      kind: "prose",
      heading: "Horizontal overflow: the bug that ruins everything",
      paragraphs: [
        "If a page scrolls sideways on a phone, it is broken — text runs off-screen, the layout feels amateurish, and WCAG 1.4.10 (Reflow) fails. There are five causes and each has a one-line diagnosis.",
        "**A fixed width larger than the viewport.** Any `width: 400px`, `min-width`, or a `grid-template-columns: 400px …` on a 360px screen. Fix with `max-width: 100%`, `minmax(0, …)`, or `min(400px, 100%)`.",
        "**An unbreakable string.** A long URL, a JWT, a file path, or a `<pre>` block. Fix with `overflow-wrap: break-word` (or `anywhere`) on text, and `overflow-x: auto` on the code block so *it* scrolls internally rather than pushing the page.",
        "**A flex or grid item that will not shrink** — the `min-width: auto` trap from the layout lesson. Fix with `min-width: 0`.",
        "**Padding added to a 100% width.** `width: 100%; padding: 1rem` overflows by 2rem without `box-sizing: border-box`. Fix with the reset.",
        "**A negative margin or a transform** that pushes an element outside the container — common in full-bleed tricks. Fix by checking that the bleed technique reserves the space it consumes.",
        "To find the culprit in seconds, run this in the console on a narrow viewport: it outlines every element wider than the document.",
      ],
    },
    {
      kind: "code",
      caption: "Find every element causing horizontal overflow",
      language: "javascript",
      code: `// Paste into the DevTools console at the width you are testing.
const docWidth = document.documentElement.clientWidth;
[...document.querySelectorAll("*")]
  .filter((el) => el.getBoundingClientRect().right > docWidth + 1)
  .forEach((el) => {
    el.style.outline = "3px solid red";
    console.log(el, Math.round(el.getBoundingClientRect().right - docWidth), "px over");
  });

// And the one property that catches most text cases:
// p, li, td, h1, h2, h3 { overflow-wrap: break-word; }`,
    },
    {
      kind: "prose",
      heading: "Testing like a professional",
      paragraphs: [
        "Device emulation in DevTools is useful but it lies in two ways: it does not reproduce real touch behaviour accurately, and it makes you test the widths the emulator lists. Test wider than that.",
        "**Resize continuously.** Grab the edge of the browser window and drag from 1,600px down to 280px, watching for the width at which things break. Every awkward moment is a candidate breakpoint.",
        "**Zoom to 200% and 400%.** WCAG requires the page to work at 200% zoom and to reflow at 400% (equivalent to a 320px-wide viewport for a 1280px design). Zoom, then check that nothing is cut off and no scrolling direction was added.",
        "**Test the awkward widths**, not the popular ones: 320px (small phones, and 400% zoom), 360px, 390px, 414px, 600px (folded tablets, small landscape phones), 768px, 1024px, 1280px, 1920px, 2560px. A layout that works at all of those works everywhere.",
        "**Use a real phone.** Emulation cannot tell you that the tap target is too small for a thumb, that the font is too light in sunlight, that the animation stutters, or that the form is unusable with a keyboard open. This is worth more than any audit.",
        "**Check the keyboard at every breakpoint.** A layout change can move focus somewhere invisible, and a mobile menu that opens without moving focus into it is a keyboard trap.",
        "**Test with content that is longer than yours.** Real names, real addresses, a product title with 90 characters, German or Twi text that is 30% longer than English. Designs that only work with your placeholder copy are not finished.",
      ],
    },
    {
      kind: "warning",
      label: "The `max-width: 100%` myth",
      text: "Developers add `overflow-x: hidden` to `body` to 'fix' horizontal scrolling. It hides the symptom and keeps the bug: content is still being laid out off-screen, still unreachable, and the accessibility failure still stands. Find the element that is too wide and fix it. `overflow-x: hidden` on the body should never appear in a codebase you are proud of.",
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Layout viewport", text: "The width the page is laid out against; set by the `viewport` meta tag." },
        { term: "Visual viewport", text: "The part of the page currently visible, which changes with pinch-zoom." },
        { term: "CSS pixel", text: "A device-independent unit — not a hardware pixel. At 2× density one CSS pixel is two hardware pixels." },
        { term: "Mobile first", text: "Writing the narrow layout as the base and adding with `min-width` queries." },
        { term: "Breakpoint", text: "The width at which the design needs a change — chosen from content, not from a device list." },
        { term: "Container query", text: "`@container`, styling a component based on its own container's size rather than the window's." },
        { term: "Fluid type", text: "Font sizes that scale continuously with the viewport, usually via `clamp()`." },
        { term: "Art direction", text: "Serving a different crop or image per breakpoint, via `<picture>`." },
        { term: "Reflow", text: "WCAG 1.4.10: content must work at 320px wide without two-dimensional scrolling." },
      ],
    },
  ],
  practice: {
    challenge:
      "Audit the project you have built so far at **320px, 768px and 1280px** and fix *every* horizontal scrollbar. Then do the harder part: resize continuously from 1,600px down to 280px and add a breakpoint at each width where the design genuinely fails — justifying each one in a CSS comment by naming the content problem it solves. Finish by zooming to 400% and confirming the page still works with no scrolling in two directions.",
    exercises: [
      {
        prompt: "Convert a desktop-first component to mobile-first. Count the lines of CSS before and after, and note any rule that existed only to undo another.",
        hint: "Mobile-first is usually shorter because the base case needs no overrides. Any `max-width` chain is a sign of the wrong direction.",
      },
      {
        prompt: "Replace three fixed `px` font sizes with `clamp()` expressions. State the minimum, the ideal and the maximum for each, and test that the minimum still applies when the user's browser font size is set to 20px.",
        hint: "Minimums in `rem` respect the user's setting; minimums in `px` do not. That is the whole reason to prefer `rem`.",
      },
      {
        prompt: "Take one component and make it respond to its container instead of the window using `@container`. Place the same component in a full-width section and in a 300px sidebar and show that it lays out differently.",
        hint: "`container-type: inline-size` on the wrapper; the query goes on the descendant. The window width never changes between the two placements.",
      },
      {
        prompt: "Add `srcset` and `sizes` to your hero image with three resolutions. Use the Network panel at 360px and at 1,440px to confirm the browser chose different files, and record the bytes saved on the phone.",
        hint: "`sizes` must describe the *displayed* width, not the file width. If it says `100vw` while the image is in a 65rem column, the browser over-downloads.",
      },
      {
        prompt: "Make one hover-dependent interaction work on touch: a card whose actions appear on hover. Scope the hover with `@media (hover: hover)` and give touch users a visible alternative.",
        hint: "Base styles should show the actions; the hover query may then hide them for pointer devices. Also handle `:focus-within` for keyboard users.",
      },
      {
        prompt: "Run the overflow-finding console snippet on three of your favourite websites at 320px. Report what you find and whether it is a real bug or an intentional bleed.",
        hint: "Full-bleed sections using `100vw` often overflow by the scrollbar width — `100%` is the correct unit, not `100vw`.",
      },
      {
        prompt: "Check every interactive element on your page against the 24×24px AA minimum and the 44×44px recommendation. List the failures and fix them with `min-height`/`min-width` and `gap`, not by making the icon bigger.",
        hint: "An icon can stay 16px inside a 44px button: the *target* is the button's box, which `padding` enlarges.",
      },
      {
        prompt: "Fill your design with adversarial content: a 90-character headline, a name with diacritics, a very long email in an input, a paragraph with an unbreakable URL. Fix every overflow and every awkward wrap.",
        hint: "`overflow-wrap: break-word` for text, `text-overflow: ellipsis` with `min-width: 0` where truncation is correct, and `hyphens: auto` with a `lang` attribute for narrow columns.",
      },
    ],
    checkYourself: [
      "What does `width=device-width` change, and what does a phone do without it?",
      "Why does mobile-first produce less CSS and more robust CSS?",
      "How do you decide where a breakpoint belongs, and why should its value be in `rem`?",
      "What is the difference between `srcset`/`sizes` and `<picture>`?",
      "Why does `:hover` break a touch interface, and what query scopes it correctly?",
      "Name four causes of horizontal overflow and the fix for each.",
      "What is the minimum touch target size at WCAG AA, and what does it apply to — the icon or the button?",
      "Why is `overflow-x: hidden` on the body not a fix?",
    ],
  },
  takeaways: [
    "One document, many widths: design for a number that changes, not for a list of devices.",
    "The `viewport` meta tag is what makes a phone lay out at its own width — and never disable zoom.",
    "Mobile first: simple base styles, then `min-width` queries that add. Less CSS, better fallbacks, honest priorities.",
    "Breakpoints come from where your content fails, expressed in `rem`.",
    "Prefer fluid techniques — `clamp()`, `auto-fit` grids, `min()` widths — to queries; query only what cannot be fluid.",
    "Container queries make components responsive to where they are placed, not to the window.",
    "No hover on touch, 24px minimum targets, `100dvh` not `100vh`, and images with `width`/`height` so nothing shifts.",
    "Test by dragging, zooming to 400%, and using a real phone — and test with content longer than yours.",
  ],
  further: [
    "Next: [[Ship your portfolio|/learn/web-foundations/publish-portfolio]] — putting the responsive page on the internet.",
    "Run a Lighthouse audit at mobile emulation and read the Core Web Vitals it reports; each maps to something in this lesson.",
    "Keep a personal breakpoint list — the widths where *your* designs fail — and reuse it until you no longer need it.",
  ],
},
