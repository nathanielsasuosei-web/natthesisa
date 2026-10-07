{
  id: "html-document",
  summary: [
    "HTML is not a programming language. It is a **markup** language: a way of wrapping text in labels that say what the text *is*. That distinction is the key to the whole subject. You never tell HTML what to do — you tell it what things mean, and the browser, the search engine, the screen reader and the CSS all decide what to do with that meaning.",
    "In this lesson you will build a complete, valid HTML document from scratch and understand every line of it: the doctype, the root element, the head, the body, elements, attributes, nesting, void elements and character references. You will also learn how browsers handle broken markup, because they do not fail the way a compiler does — and knowing that saves hours of confused debugging.",
  ],
  objectives: [
    "Write a complete HTML5 document from memory, and explain the purpose of the doctype, `html`, `head` and `body`.",
    "Distinguish block-level, inline and void elements, and use the right one for a given piece of content.",
    "Use attributes correctly — global attributes, element-specific attributes, boolean attributes, and `data-*` attributes.",
    "Nest elements correctly and identify the two nesting mistakes browsers silently tolerate.",
    "Explain how the parser recovers from invalid markup, and why you should not rely on that recovery.",
    "Escape the five characters that must never appear literally in text, and explain why.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "Markup means 'what this is', not 'how it looks'",
      paragraphs: [
        "The name says it: **HyperText Markup Language**. 'Markup' comes from the marks an editor writes on a manuscript — *this is a heading*, *this is a quotation*, *this is a list item* — and it was borrowed by the publishing industry in the 1980s for exactly that purpose. HTML descends from SGML, a standard for describing document structure, and its job has never changed: to annotate text with structure.",
        "The reason this matters practically is that HTML has **many readers**, not one. A browser reads it to paint a page. A search engine reads it to decide what your page is about and how to rank it. A screen reader reads it aloud to a blind user, using the markup to announce 'heading, level 2' and 'list, 5 items'. A reader-mode extension strips your styling and keeps only the structure. An RSS generator, a link previewer on WhatsApp, a web scraper and an AI assistant all read the same file and each of them cares about a different part of it.",
        "So when you write `<h2>` instead of `<p style=\"font-size:20px;font-weight:bold\">`, you are not choosing between two ways of making text big. You are telling every one of those readers 'this is a level-2 heading in the outline of this document', and each of them does something useful with that fact that it could never do with a font size.",
      ],
    },
    {
      kind: "definition",
      term: "Element, tag, attribute",
      text: "An **element** is a piece of content together with its meaning — for example a paragraph. It is written with a **start tag** (`<p>`), the content, and an **end tag** (`</p>`). An **attribute** is a `name=\"value\"` pair inside a start tag that adds information about the element, such as `href` on a link. Some elements have no content and no end tag — `<img>`, `<br>`, `<input>` — and are called **void** or **empty** elements.",
    },
    {
      kind: "prose",
      heading: "The skeleton of a document",
      paragraphs: [
        "Every HTML document has the same six-line skeleton, and you should be able to write it without looking. Each line has a specific job, and each is easy to get wrong in a way that produces a page that *still looks fine* — which is precisely why they go uncorrected for years.",
      ],
    },
    {
      kind: "code",
      caption: "The minimum complete document",
      language: "html",
      code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My first page</title>
  </head>
  <body>
    <h1>Hello, web!</h1>
    <p>I built this with HTML.</p>
  </body>
</html>`,
    },
    {
      kind: "list",
      style: "steps",
      heading: "What each line does",
      items: [
        "`<!doctype html>` — a declaration, not an element. It tells the browser to render in **standards mode**. Without it, older browsers switch to **quirks mode**, a compatibility setting that reproduces layout bugs from the 1990s: boxes sized differently, `font` inherited into tables, percentages resolved against the wrong ancestor. There is no reason to ever omit it, and no reason to write the long SGML doctype of HTML 4 — `<!doctype html>` is the whole of it in HTML5.",
        "`<html lang=\"en\">` — the **root element**; everything else lives inside it. The `lang` attribute is not decoration: screen readers use it to pick a pronunciation engine, browsers use it to offer translation, and search engines use it as a language signal. Use a real BCP 47 tag — `en`, `en-GB`, `fr`, `tw` for Twi — not `english`.",
        "`<head>` — the part of the document that is **not displayed**. It carries metadata about the page: its title, its character encoding, its viewport behaviour, links to stylesheets, and the tags that control how the page looks when shared.",
        "`<meta charset=\"utf-8\">` — declares the character encoding. Put it **first in the head**, because the browser must know the encoding before it can correctly decode anything that follows. UTF-8 can represent every writing system on earth; without this line, browsers guess, and guesses produce `Ã©` where you meant `é`.",
        "`<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">` — tells a phone to lay the page out at its own width instead of pretending to be a 980px desktop and letting the user pinch-zoom. Omitting this is the single most common reason a beginner's site looks tiny on a phone. The responsive design lesson returns to it.",
        "`<title>` — the name of the page. It appears in the browser tab, in bookmarks, in search results, and as the default text read aloud when the page loads. It is the only element *required* in the head, and there must be exactly one per page.",
        "`<body>` — everything the user sees. There is exactly one body, and it is rendered in document order from top to bottom.",
      ],
    },
    {
      kind: "warning",
      label: "Two silent failures",
      text: "A missing doctype puts the browser in quirks mode, and a missing `viewport` meta makes the page unusable on a phone — and in both cases the page still *renders*, so nothing tells you it is wrong. Build the habit of writing the skeleton first, before any content, so it is never the thing you forget.",
    },
    {
      kind: "prose",
      heading: "The elements you will use every day",
      paragraphs: [
        "HTML has over a hundred elements, but a working site is built from about twenty-five. They fall into families, and learning the families is far more useful than memorising tags.",
      ],
    },
    {
      kind: "table",
      caption: "The working vocabulary",
      head: ["Family", "Elements", "Notes"],
      rows: [
        ["Sections", "`h1`–`h6`, `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`", "Headings define the document outline; there should be one `h1` and no skipped levels."],
        ["Text", "`p`, `strong`, `em`, `mark`, `small`, `br`, `hr`, `blockquote`, `code`, `pre`", "`strong` is importance, `em` is emphasis, `b` and `i` are styling only."],
        ["Lists", "`ul`, `ol`, `li`, `dl`, `dt`, `dd`", "`li` may only appear inside a list. `dl` is for term/definition pairs."],
        ["Links and media", "`a`, `img`, `figure`, `figcaption`, `picture`, `video`, `audio`", "`a` needs `href`; `img` needs `src` and `alt`."],
        ["Tables", "`table`, `caption`, `thead`, `tbody`, `tr`, `th`, `td`", "For tabular data only — never for page layout."],
        ["Forms", "`form`, `label`, `input`, `select`, `option`, `textarea`, `button`, `fieldset`", "Every input needs a label; the forms lesson covers this in depth."],
        ["Generic", "`div`, `span`", "No meaning at all. Use only when no semantic element fits."],
        ["Metadata", "`meta`, `title`, `link`, `style`, `script`, `base`", "Live in the head (except `script`, which may appear in the body)."],
      ],
    },
    {
      kind: "prose",
      heading: "Block, inline and the flow of text",
      paragraphs: [
        "Elements divide by how they behave in layout. A **block-level** element — `div`, `p`, `h1`, `section`, `ul`, `header` — starts on a new line and stretches to fill the available width. An **inline** element — `span`, `a`, `strong`, `em`, `img`, `code` — sits inside a line of text and takes only as much width as its content needs.",
        "This produces the one nesting rule that genuinely matters: **inline elements go inside block elements, never the other way round.** A `<p>` containing a `<strong>` is correct. A `<strong>` containing a `<p>` is nonsense, and the parser will quietly break it apart. Similarly, `<a>` is inline and `<div>` is block, so an `<a>` that wraps a whole card is a real problem — the modern fix is that HTML5 permits block content inside `<a>`, but only if the `<a>` itself is treated as a block via CSS, and many developers still get this wrong.",
        "You should also know that the distinction is a *default*, not a law. The CSS `display` property overrides it completely: `display: block` on a `span` makes it a block; `display: inline-block` gives an inline element a width and height. Modern layout with Flexbox and Grid sets `display` on the container and largely stops caring which family its children came from. The next lesson on CSS covers this properly.",
      ],
    },
    {
      kind: "prose",
      heading: "Attributes: the settings on an element",
      paragraphs: [
        "Attributes always live in the start tag, always take the form `name=\"value\"`, and always use double quotes in hand-written HTML. They come in four kinds.",
        "**Global attributes** work on every element: `id` (a unique identifier, used by CSS, JavaScript and fragment links), `class` (a space-separated list of names, used by CSS to group elements), `style` (inline CSS — avoid it), `title` (a tooltip), `lang`, `dir`, `hidden`, and `tabindex`. **Element-specific attributes** carry the element's real payload: `href` on `a`, `src` and `alt` on `img`, `type` and `value` on `input`, `colspan` on `td`. **Boolean attributes** are present-or-absent, and their value is irrelevant: `disabled`, `checked`, `required`, `readonly`, `multiple` are all true if written at all, so `disabled=\"false\"` still means disabled — a bug that catches almost everybody once. **`data-*` attributes** are a namespace for your own information, readable from JavaScript and CSS, with no effect on rendering: `data-course-id=\"web-foundations\"`.",
        "`id` deserves a warning. An `id` must be unique in the whole document, and CSS selectors on an id are the most specific kind, which makes them hard to override later. For styling, use classes. Reserve `id` for anchors you link to (`#module-2`), for labelling form inputs, and for elements JavaScript genuinely needs to find by name.",
      ],
    },
    {
      kind: "example",
      title: "Building a real fragment",
      paragraphs: [
        "Here is a small piece of a portfolio page. Read it element by element and notice that every choice is a statement about *meaning*.",
      ],
      code: `<section class="project" id="project-market-prices" data-year="2026">
  <h2>Market price tracker</h2>
  <p>
    A single-page app that shows tomato prices in
    <strong>Accra</strong> and <em>updates hourly</em>.
  </p>

  <figure>
    <img src="images/market-prices.webp"
         alt="Screenshot of the price tracker showing three markets and today's prices"
         width="1200" height="675" loading="lazy">
    <figcaption>The live dashboard, taken on 7 October 2026.</figcaption>
  </figure>

  <ul>
    <li>Built with plain JavaScript — no framework</li>
    <li>Data from a public CSV, refreshed by a cron job</li>
    <li>Works offline once loaded</li>
  </ul>

  <p>
    <a href="https://prices.example.gh">Visit the site</a>
    · <a href="https://github.com/example/prices">Read the code</a>
  </p>
</section>`,
      trace: [
        "`section` says 'this is a thematically distinct part of the page', and its `class` lets CSS style every project card the same way.",
        "`id=\"project-market-prices\"` gives the section an anchor, so a link from the homepage can jump straight to it.",
        "`data-year=\"2026\"` holds information JavaScript can read — sorting projects by year, say — without putting it in visible text.",
        "`h2` and not `h1`: the page already has one `h1`, and this is a subsection of it.",
        "`strong` around *Accra* marks importance; `em` around *updates hourly* marks emphasis. Neither is 'bold' or 'italic' — those are how browsers happen to render them.",
        "`figure` + `figcaption` bind the caption to the image as one unit, so a reader mode keeps them together.",
        "`alt` describes the image for someone who cannot see it, and for a search engine. It is a sentence, not a filename.",
        "`width` and `height` let the browser reserve the correct space **before** the image downloads, which prevents the page jumping around.",
        "`loading=\"lazy\"` defers the download until the image is near the viewport — free performance.",
        "`ul` + `li` is a real list: a screen reader announces 'list, 3 items', which a series of `div`s would never do.",
      ],
    },
    {
      kind: "prose",
      heading: "Escaping: the five characters that are not text",
      paragraphs: [
        "HTML is parsed character by character, and five characters have a special role. If you want one of them to appear as *text*, you must write a **character reference** instead, or the parser will misread your document.",
      ],
    },
    {
      kind: "table",
      caption: "Characters that must be escaped in text",
      head: ["Character", "Write it as", "Why"],
      rows: [
        ["`<`", "`&lt;`", "Starts a tag. `<script>` in text would be parsed as an element."],
        ["`>`", "`&gt;`", "Ends a tag. Not always fatal, but escaping it is safer."],
        ["`&`", "`&amp;`", "Starts a character reference. `Tom & Jerry` should be `Tom &amp; Jerry`."],
        ["`\"`", "`&quot;`", "Needed inside double-quoted attribute values: `title=\"She said &quot;hi&quot;\"`."],
        ["`'`", "`&#39;`", "Needed inside single-quoted attribute values."],
      ],
    },
    {
      kind: "prose",
      paragraphs: [
        "The classic failure is a URL: `href=\"/search?q=a&b=c\"` is technically ambiguous, because `&b` looks like the start of a character reference. Browsers forgive it; validators reject it; write `&amp;b` and never think about it again. The other classic is teaching markup: to show `<p>` on a page you must write `&lt;p&gt;`.",
        "Note what is *not* an escaping problem: non-ASCII text. With `<meta charset=\"utf-8\">` you write `ɛ`, `é`, `ñ`, `日` and `₵` literally. Never use `&eacute;` for a character you can type — it is a relic of encodings that no longer apply.",
      ],
    },
    {
      kind: "prose",
      heading: "How the browser handles broken HTML",
      paragraphs: [
        "If you write invalid code in most languages, the program refuses to run. HTML behaves completely differently, and this is by design: the web could not survive if a single unclosed tag broke a page. The HTML5 specification defines an **error recovery algorithm** — a precise, standardised set of rules for how to fix broken markup while parsing — so that Chrome, Safari and Firefox all produce the *same* DOM from the same broken document.",
        "The consequences are worth knowing. An unclosed `<p>` is closed automatically when the next block element starts. A missing `<head>` or `<body>` is created for you. A stray `</div>` is discarded. But some errors are catastrophic rather than forgiving: an unclosed `<div>` in the middle of a page swallows everything after it, so the footer ends up nested inside a card and your layout falls apart with no error message anywhere. And `<li>` outside a list, or `<td>` outside a table, are simply dropped.",
        "The professional habit is therefore not 'rely on the parser' but 'validate as you go'. Your editor will show unclosed tags if you install an HTML linter; the W3C validator at `validator.w3.org` will check a live URL; and the browser's **Elements** panel shows you the DOM the parser *actually built*, which is frequently not the tree you think you wrote. When a layout is mysteriously wrong, open Elements and look at the nesting before you touch a single line of CSS.",
      ],
    },
    {
      kind: "note",
      label: "Whitespace",
      text: "HTML collapses runs of whitespace in text into a single space, and ignores whitespace between block elements. That is why your neatly indented source does not produce visible indentation, and why `word1    word2` renders as `word1 word2`. When you *do* need whitespace preserved — a poem, ASCII art, terminal output — that is what `<pre>` is for.",
    },
    {
      kind: "prose",
      heading: "Comments, and what not to put in them",
      paragraphs: [
        "`<!-- a comment -->` is ignored by the parser and invisible on the page. Comments are useful for sectioning a long file, for explaining a non-obvious decision, and for temporarily disabling markup while you work.",
        "Two rules. Comments may not contain `--`, and they may not nest — `<!-- a <!-- b --> c -->` ends at the first `-->`, leaving `c -->` as visible text. And never write anything in a comment that you would not publish, because **view-source shows everything**. Credentials, rude notes about a client, and TODO lists describing known security holes have all been found in production comments.",
      ],
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Markup", text: "Annotations that describe what content is, rather than instructions for how to render it." },
        { term: "Void element", text: "An element with no content and no end tag: `img`, `br`, `hr`, `input`, `meta`, `link`." },
        { term: "Standards mode", text: "The rendering mode the doctype selects, in which the browser follows the specification." },
        { term: "Quirks mode", text: "A backwards-compatible mode reproducing 1990s layout bugs, entered when the doctype is missing or wrong." },
        { term: "Character reference", text: "An escape such as `&amp;` or `&#8373;` standing in for a character that would otherwise be parsed as markup." },
        { term: "The DOM", text: "The tree of nodes the parser builds from your HTML — not always the tree you wrote." },
      ],
    },
    {
      kind: "prose",
      heading: "Writing your first document properly",
      paragraphs: [
        "Create a folder called `portfolio`. Inside it create `index.html` — that filename is a convention, not a rule, but web servers look for it by default when someone requests a folder. Open it in VS Code and type `!` then press Tab: the editor expands it to the full HTML5 skeleton, which is how you will start every file from now on.",
        "Fill in the title with something real — it is what appears in the tab and in search results. Then add content in the body, in document order, using the most specific element you can find for each piece. Resist `div` and `span`: they are what you reach for only after deciding that nothing else fits.",
        "Save, and open the file in your browser. You can double-click it, or drag it into a window — the address bar will show `file:///…/index.html`. Nothing is served, nothing is deployed; the browser reads the file from disk and renders it. That is a complete, working website, and the next lesson makes it mean something.",
      ],
    },
    {
      kind: "code",
      caption: "A first page worth keeping",
      language: "html",
      code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Portfolio of Ama Boateng, front-end developer in Accra.">
    <title>Ama Boateng — Front-end developer</title>
  </head>
  <body>
    <h1>Ama Boateng</h1>
    <p>I build fast, accessible websites from Accra, Ghana.</p>

    <h2>Projects</h2>
    <ul>
      <li><a href="projects/market-prices.html">Market price tracker</a></li>
      <li><a href="projects/church-schedule.html">Church rota printer</a></li>
    </ul>

    <h2>Contact</h2>
    <p>Email <a href="mailto:ama@example.com">ama@example.com</a>.</p>

    <hr>
    <p><small>© 2026 Ama Boateng. Built by hand with HTML and CSS.</small></p>
  </body>
</html>`,
    },
  ],
  practice: {
    challenge:
      "Create a page with one `h1`, two paragraphs, a list of three items, and a link to a site you use every day. Include the full skeleton — doctype, `lang`, `charset`, `viewport` and `title` — and validate it at `validator.w3.org` by pasting the source. Fix every error and every warning until the validator reports none.",
    exercises: [
      {
        prompt: "Write out the six-line HTML skeleton from memory, then compare it with the listing above. Note anything you missed and write one sentence on what that omission would break.",
        hint: "Most people forget `lang`, `charset` or `viewport`. Each has a distinct, silent consequence.",
      },
      {
        prompt: "For each of these, say whether it is valid and why: `<img></img>`, `<br/>`, `<input disabled=\"false\">`, `<a><div>Card</div></a>`, `<p>One<p>Two`, `<!-- a <!-- b --> c -->`.",
        hint: "Three of them are legal in HTML5 and three are not. `disabled=\"false\"` is a trap about boolean attributes.",
      },
      {
        prompt: "Take a page you like, right-click → View Page Source, and find the doctype, the `lang`, the `title` and the `viewport` meta. Then open the Elements panel and compare: where does the DOM differ from the source?",
        hint: "Look for elements the framework injected, or a `<body>` the parser created because the source omitted it.",
      },
      {
        prompt: "Write a fragment that deliberately breaks the nesting rules — an unclosed `div` before the footer — and describe in the Elements panel what the parser did to your footer.",
        hint: "The footer will have moved inside the unclosed element. That is how real layout bugs start.",
      },
      {
        prompt: "Rewrite this line so it is valid HTML, and explain both changes: `<p>Read the <a href=\"/docs?a=1&b=2\">docs</a> & don't write <script> tags in text.</p>`",
        hint: "Two characters need escaping here: `&` in the URL and `&` before `don't`. And the literal `<script>` must become text.",
      },
      {
        prompt: "Add `width` and `height` attributes to an image in your page and watch what happens to the layout while it loads. Then remove them and reload with throttled network. Describe the difference.",
        hint: "With the dimensions present the browser reserves the space, so nothing shifts. Without them the page jumps — that jump is measured as Cumulative Layout Shift.",
      },
    ],
    checkYourself: [
      "What does `<!doctype html>` actually change about how your page is rendered?",
      "Which meta tag must come first in the head, and why does its position matter?",
      "Name four void elements. What is different about how they are written?",
      "Why is `disabled=\"false\"` still disabled?",
      "What is the difference between `strong` and `b`, and which one should you use?",
      "Why must a unique `id` never be reused on a second element, and what breaks if it is?",
      "What does the browser do when it meets an unclosed `<div>`, and why is that worse than an error message?",
    ],
  },
  takeaways: [
    "HTML describes what content *is*; browsers, search engines and screen readers each decide what that means for them.",
    "The six-line skeleton — doctype, `html lang`, `head`, `charset`, `viewport`, `title` — is not optional and its omissions fail silently.",
    "Block elements contain inline elements, never the reverse; `li` lives in a list, `td` lives in a table.",
    "Boolean attributes are true by presence alone, and `id` must be unique — use `class` for styling.",
    "Escape `<`, `>`, `&` and quotes; write every other character literally under UTF-8.",
    "The parser never fails — it repairs. Open the Elements panel to see the DOM you actually built.",
  ],
  further: [
    "Next: [[Semantic & accessible HTML|/learn/web-foundations/semantic-accessible-html]] — making the structure mean something to every reader.",
    "Validate everything you write this week at `validator.w3.org`; the warnings teach you more than the errors.",
    "Keep a `snippets` file of the fragments you rewrite often — the document skeleton, a figure with caption, a form field with its label.",
  ],
},
