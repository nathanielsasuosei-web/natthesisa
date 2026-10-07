{
  id: "flexbox-grid",
  summary: [
    "For fifteen years CSS had no layout system, and developers built every page with floats, inline-block hacks and absolute positioning. Two specifications ended that: **Flexbox**, for one-dimensional arrangement, and **Grid**, for two-dimensional layout. Between them they cover essentially every layout a web interface needs, and both work by the same principle — you describe the *container's* rules and let the browser position the children.",
    "This lesson teaches both properly: the axes and the properties that belong to the container versus the item, alignment in four directions, `flex` shorthand decoded, `fr` tracks, `minmax()`, `auto-fit` versus `auto-fill`, named areas, implicit tracks, and the decision rule for choosing between them. It ends with the responsive card grid that appears in almost every real project.",
  ],
  objectives: [
    "Explain the difference between one-dimensional and two-dimensional layout, and choose Flexbox or Grid on that basis.",
    "Name the main axis and cross axis of a flex container, and say which properties act on each.",
    "Distinguish container properties from item properties, and use `justify-content`, `align-items`, `align-self` and `gap` correctly.",
    "Decode `flex: 1 1 0%` into grow, shrink and basis, and predict the resulting widths.",
    "Build a grid with explicit tracks, `fr` units, `minmax()`, `repeat()`, `auto-fit` and `auto-fill`, and explain the difference between the last two.",
    "Lay a whole page out with named grid areas and re-arrange it at a breakpoint.",
    "Control placement and spanning from the item side with `grid-column` and `grid-row`.",
    "Debug overflow, unexpected stretching and the `min-width: auto` trap.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "One dimension or two",
      paragraphs: [
        "The decision is simpler than most tutorials make it. **Flexbox lays out in a single direction** — a row *or* a column — and the items' sizes influence the layout: content can push the row wider, items can shrink, and wrapping creates new lines only when it must. **Grid lays out in two directions at once** — rows *and* columns — and the container's tracks are defined first, then items are placed into them; the content does not get a vote about where the columns are.",
        "That distinction produces the rule of thumb: use **Flexbox for components** — a nav bar, a button with an icon, a row of tags, a toolbar with something pushed to the right — and use **Grid for page structure and collections** — the overall layout of header, sidebar, main and footer, or a gallery of cards that must line up in both directions.",
        "They are not rivals and you should not choose a camp. Real pages nest them constantly: a Grid page layout, whose header is a Flexbox row, containing a Grid of cards, each card being a Flexbox column with its footer pushed to the bottom. Learning to see which system a given piece uses is the actual skill.",
      ],
    },
    {
      kind: "table",
      caption: "Choosing between them",
      head: ["You need…", "Use", "Why"],
      rows: [
        ["A nav bar with links left and a button right", "Flexbox", "One row; `margin-left: auto` pushes the button to the end."],
        ["A row of tags that wrap when they run out of space", "Flexbox + `flex-wrap`", "Content-driven: the number of lines depends on the text."],
        ["A card whose footer sticks to the bottom", "Flexbox column", "`margin-top: auto` on the footer absorbs the free space."],
        ["The page skeleton: header, sidebar, main, footer", "Grid + named areas", "Rows and columns defined once, re-arranged per breakpoint."],
        ["A gallery that is 1 column on a phone, 3 on a desktop", "Grid + `auto-fit`/`minmax`", "One declaration, no media query needed."],
        ["Items that must line up across separate rows", "Grid", "Tracks are shared; flex lines are independent."],
        ["Equal-height columns", "Either", "Both stretch by default; Grid does it per track, Flexbox per line."],
        ["A form: label, input, error in aligned columns", "Grid", "`grid-template-columns: auto 1fr` keeps every row aligned."],
      ],
    },
    {
      kind: "prose",
      heading: "Flexbox: the axes",
      paragraphs: [
        "Everything in Flexbox follows from two perpendicular lines. The **main axis** runs in the direction set by `flex-direction` — left to right for `row` (the default), top to bottom for `column`. The **cross axis** runs perpendicular to it. Every alignment property must be understood as acting on one of those two axes, and the two directions reverse when you switch `flex-direction`, which is the source of most Flexbox confusion.",
        "`justify-content` aligns along the **main** axis. `align-items` aligns along the **cross** axis. So in a `row`, `justify-content: center` centres horizontally and `align-items: center` centres vertically; in a `column`, the roles swap. Do not memorise 'horizontal' and 'vertical' — memorise main and cross.",
        "Also note the start and end are *writing-mode* aware. `flex-start` means left in English, right in Arabic. This is why modern CSS prefers `justify-content: flex-start` and logical values over `left` and `right`, and why `margin-inline-start` exists.",
      ],
    },
    {
      kind: "table",
      caption: "Flexbox properties, split by who they go on",
      head: ["On the container", "On each item", "Values and effect"],
      rows: [
        ["`display: flex`", "—", "Makes the element a flex container; its direct children become flex items."],
        ["`flex-direction`", "—", "`row` (default), `row-reverse`, `column`, `column-reverse`. Sets the main axis."],
        ["`flex-wrap`", "—", "`nowrap` (default), `wrap`, `wrap-reverse`. Whether items may move to a new line."],
        ["`gap`, `row-gap`, `column-gap`", "—", "Space between items. Replaces all margin hacks — use it."],
        ["`justify-content`", "—", "Main axis: `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly`."],
        ["`align-items`", "—", "Cross axis for all items: `stretch` (default), `flex-start`, `center`, `flex-end`, `baseline`."],
        ["`align-content`", "—", "Cross axis for *multiple wrapped lines* as a group. Does nothing on a single line."],
        ["—", "`order`", "Re-orders visually. **Does not change DOM order**, so it breaks tab order — avoid."],
        ["—", "`flex-grow`", "How much of the free space this item takes: `0` (default) means never grow."],
        ["—", "`flex-shrink`", "How much this item shrinks when space is short: `1` (default) means shrink."],
        ["—", "`flex-basis`", "The item's starting size along the main axis before growing or shrinking. `auto` means 'use my width/content'."],
        ["—", "`flex`", "Shorthand for the three above. `flex: 1` = `1 1 0%`; `flex: auto` = `1 1 auto`; `flex: none` = `0 0 auto`."],
        ["—", "`align-self`", "Overrides `align-items` for this one item."],
        ["—", "`margin-*: auto`", "Absorbs free space on that side — the cleanest way to push an item to the end."],
      ],
    },
    {
      kind: "definition",
      term: "The `flex` shorthand decoded",
      text: "`flex: <grow> <shrink> <basis>`. **grow** is a proportion of *leftover* space; **shrink** is a proportion of *deficit*; **basis** is the starting main-axis size. `flex: 1` expands to `1 1 0%`, which means 'ignore my content, start at zero, and share all available space equally' — that is what makes equal columns. `flex: 1 1 auto` means 'start at my content size and then distribute', which gives *nearly* equal columns that differ by content length. The distinction between `0%` and `auto` basis is the single most useful piece of Flexbox knowledge.",
    },
    {
      kind: "example",
      title: "Predicting widths",
      paragraphs: [
        "A 900px container with `gap: 20px` holds three items. What width does each get? The gap consumes space before any distribution.",
      ],
      code: `.row { display: flex; gap: 20px; width: 900px; }
.a { flex: 1 1 0%; }        /* grow 1 */
.b { flex: 2 1 0%; }        /* grow 2 */
.c { flex: 0 0 150px; }     /* fixed 150px */`,
      trace: [
        "Total gaps: two gaps × 20px = 40px. Space for items = 900 − 40 = 860px.",
        "Item `.c` is `0 0 150px`: it neither grows nor shrinks, and its basis is 150px. It takes exactly **150px**.",
        "Remaining free space = 860 − 150 = 710px, to be shared by grow factors 1 and 2.",
        "Total grow = 3, so one share = 710 / 3 ≈ 236.67px.",
        "`.a` gets 1 share ≈ **236.67px**; `.b` gets 2 shares ≈ **473.33px**.",
        "Check: 150 + 236.67 + 473.33 + 40 = 900px. ✓",
        "Now shrink the container to 400px: items' space becomes 360px, `.c` still demands 150px (it cannot shrink), leaving 210px split 70/140. If it shrank further, `.c` would overflow — which is exactly the behaviour you want for a fixed sidebar.",
      ],
    },
    {
      kind: "warning",
      label: "`min-width: auto` — the invisible trap",
      text: "A flex item's automatic minimum size is its **content's** minimum size, not zero. So an item containing a long unbreakable word, a `<pre>` block, or a large image will refuse to shrink below that, and will blow out the row — producing horizontal scrolling on a phone with no obvious cause. The fix is one line on the item: `min-width: 0` (or `overflow: hidden`). For a column flex container the same trap applies vertically as `min-height: auto`. If a flex child mysteriously will not shrink, this is why.",
    },
    {
      kind: "code",
      caption: "The four Flexbox patterns you will write constantly",
      language: "css",
      code: `/* 1. Perfectly centred, both axes. */
.centre { display: flex; place-items: center; min-height: 100dvh; }
/* place-items sets align-items and justify-items at once. */

/* 2. Nav bar: links left, action pushed to the right. */
.nav { display: flex; align-items: center; gap: 1rem; }
.nav__actions { margin-left: auto; }

/* 3. Equal columns that wrap, never narrower than 220px. */
.cols { display: flex; flex-wrap: wrap; gap: 1rem; }
.cols > * { flex: 1 1 220px; }

/* 4. A card whose footer always sits at the bottom. */
.card { display: flex; flex-direction: column; min-height: 100%; }
.card__body { flex: 1; }          /* absorbs the free space */
.card__footer { margin-top: auto; }`,
    },
    {
      kind: "prose",
      heading: "Grid: tracks, not children",
      paragraphs: [
        "Grid inverts Flexbox's thinking. Instead of arranging children and letting their sizes decide, you define the **tracks** — the columns and rows — and then place items into the cells those tracks create. Because the tracks are shared by every item in the grid, things line up across rows in a way Flexbox can never guarantee.",
        "Track numbering starts at **1**, not 0, and lines are numbered between tracks: a grid with three columns has four column lines, numbered 1 to 4. `grid-column: 1 / 3` means 'start at line 1, end at line 3', which spans two columns. `-1` always means the last explicit line, so `grid-column: 1 / -1` spans the whole grid — a very common way to make one item full-bleed.",
        "The `fr` unit is Grid's own invention: one share of the *free* space left after fixed tracks and gaps are subtracted. `grid-template-columns: 200px 1fr` is the classic app layout — a fixed sidebar and a main area that takes everything else. `1fr 2fr 1fr` gives a centred column twice as wide as its neighbours.",
      ],
    },
    {
      kind: "code",
      caption: "A page skeleton with named areas",
      language: "css",
      code: `.page {
  display: grid;
  gap: 1.5rem;
  min-height: 100dvh;
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "main"
    "sidebar"
    "footer";
}
.site-header { grid-area: header; }
.content     { grid-area: main; }
.side        { grid-area: sidebar; }
.site-footer { grid-area: footer; }

@media (min-width: 48rem) {
  .page {
    grid-template-columns: minmax(0, 1fr) 280px;
    grid-template-areas:
      "header  header"
      "main    sidebar"
      "footer  footer";
  }
}`,
    },
    {
      kind: "prose",
      paragraphs: [
        "Named areas are the most readable layout technique in CSS: the template literally draws the page in your stylesheet, and a breakpoint re-draws it. `minmax(0, 1fr)` on the main column deserves attention — the plain `1fr` is actually shorthand for `minmax(auto, 1fr)`, and `auto` as a minimum means 'never smaller than my content', which is the Grid version of the `min-width: auto` trap. Writing `minmax(0, 1fr)` allows the track to shrink below its content size, which prevents a wide table or a long code block from stretching the whole layout.",
      ],
    },
    {
      kind: "table",
      caption: "Grid properties",
      head: ["On the container", "On each item", "Effect"],
      rows: [
        ["`display: grid`", "—", "Makes the element a grid container."],
        ["`grid-template-columns` / `-rows`", "—", "Defines the explicit tracks: lengths, `fr`, `auto`, `minmax()`, `repeat()`."],
        ["`grid-template-areas`", "`grid-area: name`", "Named rectangular regions, drawn as ASCII art."],
        ["`gap` / `row-gap` / `column-gap`", "—", "Space between tracks. Not outside the edges — that is `padding`."],
        ["`justify-items`, `align-items`", "`justify-self`, `align-self`", "Alignment of items **inside their own cell**."],
        ["`justify-content`, `align-content`", "—", "Alignment of the **whole track structure** inside the container, when tracks are smaller than it."],
        ["`grid-auto-flow`", "—", "`row` (default) or `column`; add `dense` to back-fill holes left by spanning items."],
        ["`grid-auto-rows` / `-columns`", "—", "Sizes for **implicit** tracks — those created when items overflow the explicit template."],
        ["—", "`grid-column`, `grid-row`", "`start / end` line numbers, or `span n`."],
        ["—", "`order`", "As in Flexbox: visual only, and equally harmful to keyboard order."],
      ],
    },
    {
      kind: "prose",
      heading: "`repeat()`, `minmax()`, `auto-fit` and `auto-fill`",
      paragraphs: [
        "Four functions combine into the most valuable single line of layout CSS in the language. `repeat(n, track)` avoids writing the same track n times, and accepts the keywords `auto-fill` and `auto-fit` in place of a number, meaning 'as many as will fit'. `minmax(min, max)` gives each track a floor and a ceiling.",
        "Put together: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` says *'create as many columns as will fit, each at least 220px wide, and stretch them to fill the row.'* On a 320px phone you get one column. At 700px you get three. At 1,400px you get six. **No media query at all.** The layout responds to available space rather than to a device width, which is a strictly better model.",
        "The difference between `auto-fill` and `auto-fit` only appears when there are fewer items than columns. `auto-fill` **keeps the empty tracks**, reserving space for items that might arrive — so two items in a wide container stay 220px-ish and the rest is empty. `auto-fit` **collapses the empty tracks to zero and lets the items stretch** to fill the row. For card grids you almost always want `auto-fit`; for a layout where item widths must stay constant regardless of count, `auto-fill`.",
      ],
    },
    {
      kind: "example",
      title: "The responsive card grid, traced",
      paragraphs: [
        "This is the pattern you will reuse in every project. It is worth understanding exactly what happens at each width.",
      ],
      code: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1.25rem;
}`,
      trace: [
        "`minmax(min(220px, 100%), 1fr)` — the inner `min()` matters. Without it, on a 200px-wide viewport the 220px minimum would force horizontal scrolling. `min(220px, 100%)` says 'whichever is smaller', so the track can shrink below 220px when the container is narrower than that.",
        "At 360px (a phone, minus page padding ≈ 320px): only one 220px column fits. It then stretches to `1fr` = 320px. **One column, full width.**",
        "At 768px (tablet, content ≈ 700px): three columns of 220px = 660px, plus two 20px gaps = 700px. **Three columns.** A fourth would need 900px, so it does not happen.",
        "At 1,280px (laptop, content ≈ 1,100px): four columns of 220px = 880px + 60px gaps = 940px, which fits; five would need 1,160px, which does not. So **four columns**, each stretched to (1,100 − 60) / 4 = 260px.",
        "Because `auto-fit` collapses empty tracks, a grid with two cards at 1,280px shows two wide cards, not two narrow ones followed by empty space.",
        "Resize the browser and watch: columns appear and disappear purely from available width. There is no device detection and no breakpoint to maintain.",
      ],
    },
    {
      kind: "note",
      label: "Gap is not margin",
      text: "`gap` puts space *between* tracks only — never at the outer edges, and never doubled where two items meet. That is exactly what margins did wrong for a decade: `margin-right` on every item plus a negative margin on the container, or `:last-child` exceptions. If you still have margin arithmetic in a layout, replacing it with `gap` will delete several rules and one bug.",
    },
    {
      kind: "prose",
      heading: "Alignment in Grid: items, cells and tracks",
      paragraphs: [
        "Grid has six alignment properties and confusing them is normal. Split them into two groups. The **`-items`** pair (`justify-items`, `align-items`) positions each item *within its own cell*; the **`-self`** pair overrides that for a single item. The **`-content`** pair (`justify-content`, `align-content`) positions the *entire track structure* within the container, and only has a visible effect when the tracks are collectively smaller than the container — for example a grid of fixed 100px columns inside a 900px box.",
        "Both axes use the same keyword sets: `start`, `end`, `center`, `stretch`; `justify-content` additionally takes `space-between`, `space-around` and `space-evenly`, which distribute the leftover space among the tracks.",
        "`place-items` and `place-content` are the two-value shorthands (`place-items: center` sets both axes), and `place-items: center` on a grid container is the shortest possible perfect-centring rule in CSS.",
      ],
    },
    {
      kind: "code",
      caption: "Spanning, offsetting and full-bleed",
      language: "css",
      code: `/* A feature card twice as wide and one row taller. */
.card--feature { grid-column: span 2; grid-row: span 2; }

/* Start at the second column and run to the end of the grid. */
.wide { grid-column: 2 / -1; }

/* A full-bleed band inside a centred content grid. */
.layout {
  display: grid;
  grid-template-columns:
    1fr                       /* left bleed */
    min(65rem, 100% - 3rem)   /* the content column */
    1fr;                      /* right bleed */
}
.layout > * { grid-column: 2; }
.layout > .full-bleed { grid-column: 1 / -1; }
.layout > .wider { grid-column: 1 / -1; padding-inline: 1.5rem; }`,
    },
    {
      kind: "prose",
      heading: "When Grid and Flexbox disagree: three real bugs",
      paragraphs: [
        "**The row that will not shrink.** A flex item containing a wide table or a `<pre>` refuses to go below its content's minimum width. Fix: `min-width: 0` on the item, or `overflow-x: auto` if it should scroll internally.",
        "**Equal-height columns that are not equal.** In Flexbox, `align-items: stretch` equalises items *on the same flex line*; wrapped lines are independent, so a wrapped grid of cards has unequal rows. In Grid, tracks are shared, so every card in a row is the same height automatically. If you need equal heights across wrapped content, use Grid.",
        "**The tab order that does not match the layout.** `order`, `row-reverse`, `flex-direction: column-reverse` and any CSS-driven rearrangement change what the user sees but not what the keyboard visits. A screen-reader or keyboard user following the DOM will move through the page in a different order than the eye does. The rule: **if the visual order changes, the DOM order must change too** — at a breakpoint, that usually means restructuring markup rather than re-ordering it with CSS.",
      ],
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Main axis / cross axis", text: "The Flexbox direction and its perpendicular. `justify-*` is main, `align-*` is cross." },
        { term: "Flex item", text: "A direct child of a flex container. Grandchildren are not items." },
        { term: "Track", text: "A Grid column or row — the space between two grid lines." },
        { term: "Grid line", text: "The numbered boundary between tracks, starting at 1; `-1` is the last explicit line." },
        { term: "Cell / area", text: "A cell is one intersection of a row and a column; an area is any rectangle of cells." },
        { term: "`fr`", text: "One share of the free space remaining after fixed tracks and gaps." },
        { term: "Implicit track", text: "A track created automatically when items are placed outside the explicit template; sized by `grid-auto-rows`." },
        { term: "`auto-fit` / `auto-fill`", text: "'As many tracks as fit'. `auto-fit` collapses the empty ones; `auto-fill` keeps them." },
        { term: "Formatting context", text: "A flex or grid container creates one, so its children's layout is independent of the outside." },
      ],
    },
    {
      kind: "prose",
      heading: "How to learn this properly",
      paragraphs: [
        "Layout cannot be learned by reading. Open DevTools, select a flex or grid container, and use the **flexbox/grid overlays**: tick the box next to `display: grid` in the Styles panel and the browser draws the track numbers, lines and gaps over your page. Then change a value and watch the drawing update. Ten minutes of that teaches more than an hour of prose.",
        "Build the same small layouts repeatedly until the properties are automatic: a nav bar, a hero with two columns, a card grid, a form, a page skeleton with a sidebar, a footer pinned to the bottom of a short page. Each is twenty lines, and together they are 90% of everything you will ever lay out.",
      ],
    },
  ],
  practice: {
    challenge:
      "Build a card grid that shows **one column on a phone and three columns when there is room for them**, using `repeat(auto-fit, minmax(…))` and **no media query**. Then add a featured card that spans two columns and two rows, and verify at 320px, 768px and 1,280px that nothing overflows, nothing scrolls horizontally, and the tab order still matches what you see.",
    exercises: [
      {
        prompt: "A 600px flex row with `gap: 12px` contains items with `flex: 1 1 0%`, `flex: 1 1 0%` and `flex: 0 0 100px`. Compute each width, showing the arithmetic.",
        hint: "Subtract gaps first (2 × 12 = 24), then the fixed 100px, then divide the remainder by the total grow factor.",
      },
      {
        prompt: "Explain the difference in outcome between `flex: 1 1 0%` and `flex: 1 1 auto` on three items whose text lengths differ. Build both and observe.",
        hint: "With `0%` basis all three end up identical. With `auto` basis each starts at its content width, so the longer one stays wider.",
      },
      {
        prompt: "Create a footer-pinned layout: header, content that grows, footer always at the bottom of the viewport even when the content is two lines. Do it once with Flexbox and once with Grid.",
        hint: "Flexbox: `flex-direction: column; min-height: 100dvh` with `flex: 1` on the content. Grid: `grid-template-rows: auto 1fr auto`.",
      },
      {
        prompt: "Lay out a two-column app shell — a 260px sidebar and a fluid main area — that collapses to a single column below 48rem, using named grid areas. Make sure a wide table in the main area does not stretch the layout.",
        hint: "`grid-template-columns: 260px minmax(0, 1fr)`. The `minmax(0, …)` is what stops the table from winning.",
      },
      {
        prompt: "Reproduce this pattern: a centred content column of 65rem with a full-bleed image band that spans the whole viewport width. Use the three-column Grid technique.",
        hint: "`grid-template-columns: 1fr min(65rem, 100% - 3rem) 1fr`, everything in column 2, the band in `1 / -1`.",
      },
      {
        prompt: "Build a form with Grid: `auto 1fr` columns, labels in the first and inputs in the second, every row aligned. Then make it single-column on a phone without changing the markup.",
        hint: "One media query changing `grid-template-columns` to `1fr`, plus `grid-column: 1 / -1` on the buttons row.",
      },
      {
        prompt: "Deliberately create the `min-width: auto` bug: a flex row containing a `<pre>` with a long line, inside a 320px viewport. Diagnose it in DevTools, then fix it two different ways.",
        hint: "`min-width: 0` on the item, or `overflow-x: auto` so the block scrolls internally instead of pushing the row.",
      },
      {
        prompt: "Take a grid you built and change `auto-fit` to `auto-fill` with only two items in a wide container. Describe exactly what changed and when each is the right choice.",
        hint: "With `auto-fill` the two items stay narrow and empty tracks occupy the rest of the row. With `auto-fit` they stretch.",
      },
    ],
    checkYourself: [
      "In a `flex-direction: column` container, which property centres items horizontally?",
      "What is the difference between `flex: 1` and `flex: auto`?",
      "Why does `minmax(0, 1fr)` exist, and what does plain `1fr` really mean?",
      "What is the difference between `auto-fit` and `auto-fill`, and which only matters when items are few?",
      "Why does `order: -1` create an accessibility bug, and what should you do instead?",
      "What does `gap` do that margins cannot?",
      "Which alignment property positions the whole track structure inside an oversized grid container?",
    ],
  },
  takeaways: [
    "Flexbox is one-dimensional and content-driven; Grid is two-dimensional and container-driven. Pages use both, nested.",
    "`justify-*` is the main axis, `align-*` is the cross axis — and the axes swap with `flex-direction`.",
    "`flex: 1 1 0%` gives true equal columns; `1 1 auto` gives columns biased by content length.",
    "`min-width: 0` is the fix for a flex item that refuses to shrink; `minmax(0, 1fr)` is the Grid equivalent.",
    "`repeat(auto-fit, minmax(min(220px, 100%), 1fr))` is a responsive grid with no media query.",
    "`gap` replaces every margin-and-negative-margin hack; it never doubles and never touches the edges.",
    "CSS can reorder what the eye sees but not what the keyboard visits — change the DOM, not just the `order`.",
  ],
  further: [
    "Next: [[Responsive design|/learn/web-foundations/responsive-design]] — making these layouts behave on every screen.",
    "Turn on the grid and flexbox overlays in DevTools and rebuild one existing layout while watching them.",
    "Keep the four Flexbox patterns and the card grid as snippets; you will write them every week.",
  ],
},
