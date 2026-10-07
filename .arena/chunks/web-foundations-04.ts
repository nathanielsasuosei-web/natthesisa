{
  id: "css-foundations",
  summary: [
    "CSS is a **declarative** language: you do not write steps, you write rules, and the browser resolves them against the document. That single difference from JavaScript is why CSS feels unpredictable to beginners — there is no sequence to trace, only a set of competing declarations that an engine combines by fixed rules. Learn the combining rules and CSS becomes deterministic; ignore them and it feels like a slot machine.",
    "This lesson covers the anatomy of a rule, how selectors match, the cascade in full — origin, layer, specificity, order — inheritance, the box model, `box-sizing`, units, colour, typography, and the modern custom-property system that makes themes possible. It ends with a workflow that scales past the first page.",
  ],
  objectives: [
    "Read and write a CSS rule, and name its selector, declarations, properties and values.",
    "Match a document against selectors of every common kind — type, class, id, attribute, descendant, child, sibling, pseudo-class and pseudo-element.",
    "Predict which of two conflicting declarations wins, by working through origin, cascade layers, specificity and source order.",
    "Compute the specificity of any selector as a three-part number.",
    "Explain the box model, and say why `box-sizing: border-box` is set on every modern project.",
    "Choose between `px`, `rem`, `em`, `%`, `vw`/`vh`, and the clamp/min/max functions for a given job.",
    "Use inheritance deliberately — which properties inherit, how `inherit`, `initial` and `revert` force the issue.",
    "Define a design system in custom properties and switch it for a dark theme.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "The shape of a rule",
      paragraphs: [
        "A CSS stylesheet is a list of **rules**. Each rule has a **selector** — a pattern that matches elements — and a **declaration block** — a braced list of `property: value;` pairs that applies to whatever matched. That is the entire syntax.",
        "The browser's job, for each element in the document and each property it might style, is to collect every declaration from every matching rule and resolve them into one final value. This resolution is the **cascade**, and it is the thing you must understand. Everything else — colours, layout, animation — is vocabulary on top of it.",
        "Two details of syntax cause most early errors. Every declaration ends with a semicolon, including the last one (omitting it is legal but fragile — adding a line later silently merges two declarations). And property names are case-insensitive while values that name things — classes, ids, custom properties — are case-sensitive: `.Card` and `.card` are different selectors.",
      ],
    },
    {
      kind: "code",
      caption: "Anatomy of a rule",
      language: "css",
      code: `.card__title {          /* selector: matches class="card__title" */
  font-size: 1.25rem;   /* declaration: property + value */
  font-weight: 800;
  letter-spacing: -.02em;
  color: var(--ink);    /* value read from a custom property */
}                       /* end of the declaration block */`,
    },
    {
      kind: "prose",
      heading: "Selectors: how CSS finds elements",
      paragraphs: [
        "Selectors are patterns, evaluated right to left. For `.card__title a:hover`, the engine starts with every `a` in `:hover` state and then checks whether each one has an ancestor with the class `card__title`. Knowing the direction matters for performance and for predicting matches.",
      ],
    },
    {
      kind: "table",
      caption: "The selector vocabulary",
      head: ["Selector", "Matches", "Example"],
      rows: [
        ["`*`", "Every element", "`* { box-sizing: border-box }`"],
        ["`p`", "Every element of that type", "`h2 { … }`"],
        ["`.name`", "Elements with that class (they may have several)", "`.card { … }`"],
        ["`#name`", "The element with that id — at most one", "`#main { … }`"],
        ["`[attr]`, `[attr=\"v\"]`, `[attr^=\"v\"]`, `[attr$=\"v\"]`, `[attr*=\"v\"]`", "By attribute: present, exact, starts-with, ends-with, contains", "`a[href^=\"https\"] { … }`"],
        ["`A B`", "B anywhere inside A — a **descendant**", "`.nav a { … }`"],
        ["`A > B`", "B directly inside A — a **child**", "`.list > li { … }`"],
        ["`A + B`", "B immediately after A — **adjacent sibling**", "`h2 + p { … }`"],
        ["`A ~ B`", "B after A, same parent — **general sibling**", "`input:checked ~ .hint { … }`"],
        ["`A, B`", "Either — a **selector list**", "`h1, h2, h3 { … }`"],
        ["`:hover`, `:focus-visible`, `:active`", "Interaction state", "`button:hover { … }`"],
        ["`:first-child`, `:last-child`, `:nth-child(2n)`, `:only-child`", "Position among siblings", "`li:nth-child(2n) { … }`"],
        ["`:not(.x)`, `:is(h2, h3)`, `:where(...)`, `:has(> img)`", "Logical and relational", "`.card:has(video) { … }`"],
        ["`::before`, `::after`", "Generated content inside the element", "`.quote::before { content: \"“\" }`"],
        ["`::placeholder`, `::selection`, `::first-line`", "A part of an element", "`::selection { background: #ddd3f7 }`"],
      ],
    },
    {
      kind: "note",
      label: "`:is()` and `:where()` are grouping with a difference",
      text: "Both let you write `:is(h1, h2, h3) + p` instead of three selectors. The difference is specificity: `:is()` adopts the specificity of its **most specific** argument, while `:where()` always contributes **zero**. `:where()` is therefore the right choice when you want convenient grouping without making the rule harder to override later — a habit that prevents most specificity wars.",
    },
    {
      kind: "prose",
      heading: "The cascade, in full",
      paragraphs: [
        "When several rules declare the same property for the same element, the winner is decided by a strict order of criteria. Beginners learn only step four; professionals work through all of them. In order:",
        "**1. Origin and importance.** Declarations come from three origins: the **user agent** stylesheet (the browser's defaults), the **author** (your CSS), and the **user** (settings the person browsing has chosen, such as a larger font or forced colours). Normal author declarations beat user-agent defaults; *user* declarations beat author ones for accessibility-critical cases; and `!important` reverses the whole order, making an author `!important` beat a user `!important` in some cases and generally creating a mess. Use `!important` only to enforce an accessibility floor or to override a third-party library you cannot edit.",
        "**2. Context.** Styles in a shadow DOM are scoped and resolve separately — relevant to web components, not to hand-written pages.",
        "**3. Cascade layers.** `@layer base, components, overrides;` groups your CSS into named layers, and *later layers win over earlier ones regardless of specificity*. This is the modern answer to specificity fights: put resets in `base`, your components in `components`, and one-off fixes in `overrides`, and the outcome is predictable by construction.",
        "**4. Specificity.** Within the same layer, the more specific selector wins. Specificity is a three-part number, compared left to right.",
        "**5. Order of appearance.** Still tied? The declaration that appears **later** in the stylesheet wins. This is why the order of your rules matters, and why two identical-specificity rules in different files can behave differently depending on import order.",
        "**6. Inheritance.** If *nothing* declares the property, the value is inherited from the parent element if the property is inheritable, or falls back to its initial value if not.",
      ],
    },
    {
      kind: "formula",
      expression: "specificity = (a, b, c)  —  a: id selectors   b: class, attribute and pseudo-class selectors   c: type selectors and pseudo-elements",
      where: [
        "Compare `a` first; only if equal compare `b`, then `c`. It is **not** a decimal — 0,11,0 does not beat 1,0,0.",
        "`#id` → (1,0,0). `.class`, `[attr]`, `:hover`, `:nth-child()` → (0,1,0). `div`, `::before` → (0,0,1). `*`, `:where()`, combinators → (0,0,0).",
        "Inline `style=\"…\"` beats any selector: treat it as (1,0,0,0).",
        "`!important` beats everything in its origin, and among important declarations the same cascade runs in reverse.",
      ],
    },
    {
      kind: "example",
      title: "Which declaration wins?",
      paragraphs: [
        "A real conflict, with the arithmetic shown. Four rules set `color` for the same `<a>` inside `.nav`.",
      ],
      code: `/* A */ .nav a            { color: #333; }   /* (0,1,1) */
/* B */ #main a           { color: #111; }   /* (1,0,1) */
/* C */ .nav .list a.link { color: #6d4aff; } /* (0,3,1) */
/* D */ a                 { color: blue; }   /* (0,0,1) */`,
      trace: [
        "Compute each: A has one class and two type selectors → (0,1,1). B has one id and one type → (1,0,1). C has three classes and one type → (0,3,1). D has one type → (0,0,1).",
        "Compare the first component: B's `a = 1`, everyone else's is `0`. **B wins**, even though C looks much more elaborate.",
        "That is the practical lesson: a single `#id` in one rule outranks any number of classes elsewhere. This is why style guides say *use classes for styling and keep ids for anchors and labels*.",
        "If B were moved into an earlier `@layer` than C, C would win instead — layers are compared before specificity.",
        "If A and C tied, the later one in the file would win, which is why 'it depends on load order' is a real answer and a real bug source.",
      ],
    },
    {
      kind: "warning",
      label: "The specificity trap",
      text: "When a style will not apply, the instinct is to make the selector more specific or add `!important`. Both make the next change harder, and within a month the stylesheet is unmaintainable. Instead, find the rule that is actually winning — DevTools shows struck-through declarations in the Styles panel, which tells you exactly what lost and why — then fix the *structure*: move the rule later, put it in a higher layer, or delete the over-specific selector that caused the problem.",
    },
    {
      kind: "prose",
      heading: "Inheritance and initial values",
      paragraphs: [
        "Some properties pass from parent to child by default: nearly everything typographic (`color`, `font-family`, `font-size`, `line-height`, `text-align`, `visibility`, `cursor`) and the `list-style` family. Others do not — boxes and borders never inherit (`margin`, `padding`, `border`, `background`, `width`, `height`, `display`, `position`), which is why setting a border on a container does not border its children.",
        "Four keywords give you explicit control. `inherit` forces the parent's computed value. `initial` forces the property's spec-defined initial value — note that `color`'s initial value is *canvastext*, not 'black', and `display`'s is `inline`. `unset` means inherit if the property inherits, otherwise initial. `revert` rolls back to the previous origin, typically the browser default — useful for 'undo my reset on this element'.",
        "Inheritance is what makes typography economical: set `font-family` and `line-height` once on `body`, and the whole document follows. It is also why `font-size` on `html` matters so much — every `rem` in your stylesheet is measured against it.",
      ],
    },
    {
      kind: "prose",
      heading: "The box model",
      paragraphs: [
        "Every element in CSS is a rectangular **box**, and each box has four concentric layers: the **content** area, surrounded by **padding**, surrounded by a **border**, surrounded by **margin**. Understanding this model — and one property that changes how it is measured — removes most of the confusion about why a layout is 32 pixels wider than you expected.",
        "By default, `width` and `height` set the size of the **content box only**. So `width: 300px; padding: 16px; border: 2px solid` produces a box that occupies `300 + 32 + 4 = 336px` on the page. Add margins and the space it demands grows further. Almost every project therefore starts with the universal reset below, which makes `width` mean the *border box* — padding and border included — because that is how humans actually think about size.",
        "Margins have two behaviours that surprise people. **Vertical margins collapse**: when two block boxes meet vertically, the gap between them is the *larger* of the two margins, not the sum. A `p` with `margin-bottom: 1em` followed by an `h2` with `margin-top: 2em` produces one 2em gap. Horizontal margins never collapse. And margins are **transparent** — they show the parent's background, not their own — so a margin cannot create a coloured gap; that is what padding is for.",
        "Finally, an element with `overflow` other than `visible`, or a flex/grid container, establishes a new formatting context in which its children's margins do not collapse out of it. That is the standard fix for 'my container does not wrap its floated/margined child'.",
      ],
    },
    {
      kind: "code",
      caption: "The reset every project starts with",
      language: "css",
      code: `/* 1. Size means the whole box, including padding and border. */
*, *::before, *::after { box-sizing: border-box; }

/* 2. Remove default spacing, then add it back deliberately. */
body, h1, h2, h3, p, figure, blockquote, ul, ol, dl { margin: 0; }
ul[role="list"], ol[role="list"] { list-style: none; padding: 0; }

/* 3. Sensible document defaults. */
html { font-size: 100%; -webkit-text-size-adjust: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: var(--ink);
  background: var(--paper);
  min-height: 100dvh;
}

/* 4. Media behaves: never wider than its container. */
img, picture, video, canvas, svg { display: block; max-width: 100%; }

/* 5. Form controls inherit typography instead of using the browser's. */
input, button, textarea, select { font: inherit; color: inherit; }

/* 6. Long words and URLs cannot force horizontal scrolling. */
p { overflow-wrap: break-word; }`,
    },
    {
      kind: "prose",
      heading: "Units: choosing the right ruler",
      paragraphs: [
        "CSS offers absolute units and relative units, and on the web you almost always want relative ones, because the user may have changed their font size, zoomed, or be on any screen from 320px to 5,000px wide.",
      ],
    },
    {
      kind: "table",
      caption: "Units and when to use them",
      head: ["Unit", "Relative to", "Use it for"],
      rows: [
        ["`px`", "Nothing — one device-independent pixel", "Borders, shadows, small radii, precise 1px details. Avoid for font sizes and layout widths."],
        ["`rem`", "The **root** element's font size (16px by default)", "Font sizes, spacing, widths. Your default choice, because it respects the user's browser setting."],
        ["`em`", "The **current** element's font size", "Padding that should scale with its own text — a button's horizontal padding, an icon's gap."],
        ["`%`", "The containing block's corresponding dimension", "Fluid widths, and vertical padding as a fraction of *width* (a classic trick for aspect ratios)."],
        ["`vw` / `vh`", "1% of the viewport width / height", "Full-bleed sections, hero text. Use `dvh`/`svh` for mobile height, where the browser chrome changes size."],
        ["`dvh`, `svh`, `lvh`", "Dynamic, small or large viewport height", "`min-height: 100dvh` for a full-screen layout that behaves on a phone."],
        ["`ch`", "The width of the character `0`", "Measure: `max-width: 65ch` gives a readable line length in any font."],
        ["`fr`", "A share of free space in a grid", "Grid tracks only — `grid-template-columns: 1fr 2fr`."],
        ["`clamp(min, ideal, max)`", "A bounded fluid value", "`font-size: clamp(1.5rem, 4vw, 3rem)` — scales with the viewport but never too small or too large."],
      ],
    },
    {
      kind: "note",
      label: "Why `rem` and not `px` for text",
      text: "Browsers let users set a default font size, and people with low vision routinely set it to 20px or more. Text sized in `px` ignores that setting; text sized in `rem` honours it. WCAG requires that text be resizable to 200% without loss of content or function, and `rem` is how you comply by default. Keep `px` for the things that should not scale — a hairline border, a shadow offset.",
    },
    {
      kind: "prose",
      heading: "Colour",
      paragraphs: [
        "CSS accepts several notations. Hexadecimal (`#6d4aff`, or `#64f` as shorthand) is the most common. `rgb()` and `hsl()` take three numbers and an optional alpha; the modern space-separated syntax `rgb(109 74 255 / .5)` is clearer than the comma form and is what you should write. `hsl()` — hue, saturation, lightness — is the most *thinkable*: to make a colour darker, reduce the lightness; to make it less vivid, reduce the saturation.",
        "Newer notations exist for wider gamuts: `oklch()` and `oklab()` are perceptually uniform, meaning equal numeric changes look like equal visual changes, which makes generating a colour scale far more reliable than doing it in `hsl()`. Tailwind CSS 4, which this platform uses, is built on `oklch`. You do not need to master it to work, but knowing that 'L' is perceptual lightness explains why an `oklch` palette looks consistent and an `hsl` one often does not.",
        "Whatever the notation, put colours in **custom properties** and refer to them by role — `--ink`, `--paper`, `--accent`, `--danger` — never by appearance. `--accent` can change for a dark theme or a rebrand; `--violet-600` cannot, and a stylesheet full of the latter cannot be themed at all.",
      ],
    },
    {
      kind: "code",
      caption: "A theme in custom properties",
      language: "css",
      code: `:root {
  --paper: #f7f7f4;
  --surface: #ffffff;
  --ink: #1d1922;
  --ink-soft: #6f6975;
  --line: #e6e2e9;
  --accent: #6d4aff;
  --danger: #d95a33;

  --space-1: .25rem;
  --space-2: .5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-10: 2.5rem;

  --radius: 1rem;
  --shadow-sm: 0 1px 2px rgb(31 25 40 / .06);
}

/* One block flips the whole site. */
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #131118;
    --surface: #1b1822;
    --ink: #f2eff7;
    --ink-soft: #a19aa7;
    --line: #2a2633;
  }
}

.card {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}`,
    },
    {
      kind: "prose",
      heading: "Typography: the property set that matters",
      paragraphs: [
        "`font-family` takes a comma-separated list ending in a generic family (`sans-serif`, `serif`, `monospace`), which is the fallback when no listed font is available. `system-ui` resolves to the platform's own interface font and is the best default for an app; a stack like `system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif` covers the bases.",
        "`font-size` sets the size; `line-height` sets the height of the line box and should be **unitless** (`1.6`), so it scales with the element's own font size rather than inheriting a fixed pixel value from an ancestor. Body text wants 1.5–1.7; headings want 1.05–1.25.",
        "`font-weight` accepts 100–900 in steps of 100, with `normal` = 400 and `bold` = 700; variable fonts make the intermediate values meaningful. `letter-spacing` is best in `em` so it scales with size — negative tracking (`-.02em`) on large display headings, positive on uppercase micro-labels. `text-wrap: balance` evens out the lines of a heading, and `text-wrap: pretty` improves paragraph widows; both are cheap wins.",
        "Measure — the length of a line — is the most overlooked typographic property. Comfortable reading is 45–75 characters; set `max-width: 65ch` on prose and your text stops being a wall.",
      ],
    },
    {
      kind: "prose",
      heading: "Where CSS goes, and how it is organised",
      paragraphs: [
        "Three ways to attach CSS, in descending order of maintainability. An **external stylesheet**, linked from the head with `<link rel=\"stylesheet\" href=\"styles.css\">`, is cacheable, shared across pages, and the only professional choice for anything larger than a fragment. A `<style>` element in the head is fine for a single-page experiment. **Inline** `style=\"…\"` attributes are the worst option: they cannot be reused, cannot use pseudo-classes or media queries, and have the highest specificity in the cascade except for `!important`.",
        "Within a stylesheet, order matters and naming matters more. The two dominant conventions are **utility-first**, in which small single-purpose classes are composed in the markup (`class=\"flex gap-3 rounded-xl bg-white p-4\"` — Tailwind CSS is this, and this platform uses it), and **component-based**, in which each component owns a block of CSS with a naming scheme such as BEM (`.card`, `.card__title`, `.card--featured`). Both work. What does not work is a flat file of ad-hoc class names where every new style risks overriding an old one.",
        "The rule that keeps a stylesheet alive: **never write a selector you cannot justify**. If you need `.page .sidebar .card .card__title a` to reach an element, the fix is a class on the element, not a longer selector. Long selectors are brittle, specific, and slow.",
      ],
    },
    {
      kind: "example",
      title: "Debugging a rule that will not apply",
      paragraphs: [
        "The workflow that ends 95% of 'my CSS is not working' situations.",
      ],
      trace: [
        "Open DevTools, select the element, and look at the **Styles** panel. Every rule that matches it is listed, most specific first.",
        "If your declaration appears **struck through**, something with higher priority won. Read the rule above it to see what and why — then decide whether to fix that rule's specificity or move yours into a later layer.",
        "If your declaration does not appear at all, the selector is not matching. Check the spelling, the case, and whether the class is actually on the element in the **Elements** panel (frameworks often generate different class names than you expect).",
        "If the declaration appears, is not struck through, and still does nothing, the property may not apply to that element's `display` — `width` on an inline element, `vertical-align` on a block, `margin-top` on a non-replaced inline. Set `display: inline-block` or `block` and try again.",
        "If the value is wrong, check the computed panel: it shows the resolved value after inheritance and unit conversion, which often reveals that a `%` resolved against an unexpected ancestor.",
        "Finally, verify the file was loaded at all. The Network panel shows your stylesheet and its status; a 404 there explains everything else.",
      ],
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Rule", text: "A selector plus a declaration block." },
        { term: "Declaration", text: "One `property: value;` pair." },
        { term: "Cascade", text: "The algorithm that resolves competing declarations: origin, layers, specificity, order, inheritance." },
        { term: "Specificity", text: "The three-part weight (ids, classes/attributes/pseudo-classes, types/pseudo-elements) used to break ties." },
        { term: "Computed value", text: "What a property resolves to after the cascade — what DevTools' Computed panel shows." },
        { term: "Used value", text: "The final value after layout: a `%` width becomes a pixel count here." },
        { term: "Box model", text: "content → padding → border → margin, and the `box-sizing` switch that decides which one `width` measures." },
        { term: "Custom property", text: "`--name: value`, inherited like text properties and read with `var(--name)` — the basis of theming." },
        { term: "Formatting context", text: "A region in which layout happens independently; establishing a new one stops margin collapse leaking out." },
      ],
    },
  ],
  practice: {
    challenge:
      "Build a reusable `.card` class from scratch — spacing, a border, rounded corners and a subtle shadow — using **custom properties for every colour and every space value**, `rem` for all sizes, and no `!important` anywhere. Then add a `.card--featured` modifier that changes only the accent, and prove to yourself that it wins by order rather than by specificity. Finally flip the whole page to a dark palette by redefining the custom properties inside a `@media (prefers-color-scheme: dark)` block, without touching a single component rule.",
    exercises: [
      {
        prompt: "Compute the specificity of each: `#nav .item a`, `.btn.btn--primary`, `ul > li:nth-child(2n) a:hover`, `:where(.card) .title`, `style=\"color:red\"`, `*:not(#id)`.",
        hint: "Count ids, then classes/attributes/pseudo-classes, then types/pseudo-elements. `:where()` contributes zero; `:not()` contributes the specificity of its argument.",
      },
      {
        prompt: "A box has `width: 200px; padding: 20px; border: 5px solid; margin: 10px`. How much horizontal space does it take in the document with `content-box`, and how much with `border-box`? Show the arithmetic both ways.",
        hint: "Margins are never inside the box. With border-box the 200px includes padding and border, so the content shrinks to 150px.",
      },
      {
        prompt: "Two `<p>` elements, the first with `margin-bottom: 2rem` and the second with `margin-top: 1rem`, are adjacent siblings in the same container. What is the gap? Now wrap them in a `<div>` with `overflow: hidden` and explain what changes.",
        hint: "Vertical margins collapse to the larger one — 2rem, not 3rem. The wrapper's overflow establishes a new formatting context.",
      },
      {
        prompt: "Rewrite this rule set using one class-based selector instead of the descendant chain, and explain why it is better: `.page main .grid .tile h3 span { color: red }`.",
        hint: "Put a class on the `span`. Specificity drops from (0,2,4) to (0,1,0), and the rule survives any restructuring of the markup.",
      },
      {
        prompt: "Build a type scale with `clamp()`: a display heading, an `h2`, body text and a small caption, all fluid between a 320px and a 1280px viewport. Verify none of them exceeds or falls below a sensible bound.",
        hint: "`clamp(1rem, 0.9rem + 0.5vw, 1.125rem)` for body; larger swings for display text. Test by resizing the window, not by guessing.",
      },
      {
        prompt: "Set a readable measure on a paragraph of prose and explain why `65ch` is better than `600px` when the user increases their font size.",
        hint: "`ch` scales with the font; `px` does not. At 200% zoom a `600px` column holds half as many characters per line.",
      },
      {
        prompt: "In DevTools, find a page whose styles use `!important`. Identify which rule it was fighting, and rewrite both rules so neither needs it.",
        hint: "Usually a component rule versus an override rule. Cascade layers exist precisely for this: `@layer components, overrides;`.",
      },
    ],
    checkYourself: [
      "List the cascade's criteria in order. Which one do beginners skip?",
      "Why is specificity not a decimal number, and what does that imply about ids versus classes?",
      "Which properties inherit by default? Name four that do and four that do not.",
      "What does `box-sizing: border-box` change, and why is it in every reset?",
      "Why do vertical margins collapse and horizontal ones not?",
      "When would you use `em` instead of `rem`?",
      "What does `:where()` contribute to specificity, and why is that useful?",
    ],
  },
  takeaways: [
    "CSS is declarative: you write competing rules and the cascade resolves them — learn the resolution order and it stops being mysterious.",
    "Specificity is (ids, classes, types) compared left to right; one id outranks any number of classes.",
    "Use classes for styling, ids for anchors and labels, and never `!important` to win an argument you should win structurally.",
    "`box-sizing: border-box`, a margin reset and `img { max-width: 100% }` are the three lines every project starts with.",
    "Size text and space in `rem`, borders and shadows in `px`, widths fluidly with `clamp()` — and never in `px` where the user's font setting should apply.",
    "Put colours, spacing and radii in custom properties named by role, and theming becomes a ten-line change.",
  ],
  further: [
    "Next: [[Layouts with Flexbox & Grid|/learn/web-foundations/flexbox-grid]] — the two systems that replaced every float hack.",
    "Learn `@layer` early; it is the cheapest way to keep a growing stylesheet predictable.",
    "Read the DevTools Styles and Computed panels for ten minutes on a site you admire — you will learn more than from any tutorial.",
  ],
},
