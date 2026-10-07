{
  id: "semantic-accessible-html",
  summary: [
    "Two ideas sit on top of plain markup and turn it into something professional. **Semantic HTML** means choosing the element whose name matches the content's role — `nav` for navigation, `button` for a button — so that every consumer of your page gets the meaning for free. **Accessibility** means the page can be used by people who do not see it, hear it, or use a mouse; and the striking fact is that most of accessibility is not extra work, it is the natural consequence of writing correct semantics.",
    "This lesson covers the landmark elements and the document outline, the accessibility tree and how assistive technology reads it, the four WCAG principles, keyboard operation, focus management, forms, images, colour contrast, and the small amount of ARIA you genuinely need — along with the first rule of ARIA, which is not to use it.",
  ],
  objectives: [
    "Choose a semantic element over `div` and `span` in the situations where one exists, and justify the choice by naming the reader it serves.",
    "Build a page outline with landmarks and headings that a screen reader user can navigate, and explain how the outline is derived.",
    "Describe the accessibility tree and name at least three things that remove a node from it.",
    "Make an interface fully operable from the keyboard, including a visible focus indicator and a logical tab order.",
    "Write accessible forms: labels bound to inputs, grouped fields, and errors announced rather than coloured.",
    "Write `alt` text that serves its three distinct purposes, and know when to write none at all.",
    "Check colour contrast against the WCAG ratios and fix a failure without redesigning the palette.",
    "Apply the first rule of ARIA and use only the attributes that native HTML cannot express.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "Why semantics is the whole game",
      paragraphs: [
        "Consider two ways of writing a button. The first is `<div class=\"btn\">Save</div>` with a click handler attached in JavaScript. The second is `<button type=\"submit\">Save</button>`. They look identical once styled. They are not remotely equivalent.",
        "The `<button>` is announced by a screen reader as *'Save, button'* — so the user knows what it is and that it can be activated. It is reachable by the Tab key and activatable with both Enter and Space, with no code. It fires a `click` event on keyboard activation as well as mouse. It is included in the accessibility tree with the role `button`. It can be disabled with one attribute. It works with voice-control software that says 'click Save'. It submits a form correctly. The `<div>` gets **none** of this: it is invisible to a screen reader's element list, unreachable by keyboard, and unresponsive to anything but a pointing device. Rebuilding all of that takes about forty lines of JavaScript, and most implementations get it wrong.",
        "This is the central lesson of accessibility: **the platform already did the work, and semantic HTML is how you collect it.** Every native element carries a role, keyboard behaviour and focusability that browsers implement to specification and assistive technology relies on. When you replace a native element with a styled `div`, you throw that away and take on an obligation you almost certainly will not meet.",
      ],
    },
    {
      kind: "definition",
      term: "Semantic HTML",
      text: "HTML in which the choice of element expresses the **role** of the content — heading, navigation, list, button, table, quotation — rather than only its appearance. Semantic markup is machine-readable structure: it gives browsers, search engines, screen readers and reader modes something to act on.",
    },
    {
      kind: "definition",
      term: "Accessibility (a11y)",
      text: "Designing so that people with disabilities can perceive, understand, navigate and interact with a page, and contribute to it. The numeral `11` stands for the eleven letters between the `a` and the `y`. Accessibility is not a feature for a minority: it covers permanent disabilities, temporary ones (a broken arm), and situational ones (bright sunlight, a noisy room, a slow connection).",
    },
    {
      kind: "prose",
      heading: "The landmarks and the document outline",
      paragraphs: [
        "HTML5 added a set of **sectioning elements** whose only purpose is to describe regions of a page. Screen readers call them **landmarks**, and they give a blind user the same thing a sighted user gets from glancing at a layout: a map. With landmarks, a user can press a key to jump directly to *navigation*, or to *main*, skipping a wall of repeated header content on every page of the site.",
      ],
    },
    {
      kind: "table",
      caption: "Landmark elements and their roles",
      head: ["Element", "Role", "Put here", "Rules"],
      rows: [
        ["`<header>`", "`banner`", "Site identity, logo, primary navigation", "Only the header of the *page* is a banner; a header inside an `article` is not."],
        ["`<nav>`", "`navigation`", "Any set of links that navigates", "Label it when there is more than one: `aria-label=\"Main\"`, `aria-label=\"Breadcrumb\"`."],
        ["`<main>`", "`main`", "The unique content of this page", "Exactly one per page, and never inside `article`, `nav`, `aside` or `footer`."],
        ["`<section>`", "`region` (when labelled)", "A thematic grouping, with its own heading", "If you cannot write a heading for it, it is probably a `div`."],
        ["`<article>`", "`article`", "Content that stands alone — a post, a card, a comment", "Can be nested; a comments section is articles inside an article."],
        ["`<aside>`", "`complementary`", "Related but separable content: sidebars, pull quotes", "Should make sense if removed."],
        ["`<footer>`", "`contentinfo`", "Copyright, secondary links, contact", "Like `header`, only the page-level one is a landmark."],
        ["`<form>`", "`form` (when labelled)", "A form", "Add `aria-label` or associate a heading so it is findable."],
      ],
    },
    {
      kind: "example",
      title: "A page skeleton that a screen reader can navigate",
      paragraphs: [
        "This is the structure of a real page. Notice that the layout is *not* expressed here at all — no floats, no columns, no wrapper divs named `left-column`. Structure and appearance are separate concerns; CSS does the second one.",
      ],
      code: `<body>
  <header class="site-header">
    <a href="/" class="logo">Codemaster Ghana</a>
    <nav aria-label="Main">
      <ul>
        <li><a href="/courses" aria-current="page">Courses</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <h1>Web Development Foundations</h1>
    <p>Seven lessons, from how the web works to a published portfolio.</p>

    <section aria-labelledby="curriculum">
      <h2 id="curriculum">Curriculum</h2>
      <ol>
        <li>
          <article>
            <h3><a href="/learn/web-foundations/how-the-web-works">How the web works</a></h3>
            <p>Requests, DNS, HTTPS and the browser pipeline.</p>
          </article>
        </li>
      </ol>
    </section>
  </main>

  <footer class="site-footer">
    <nav aria-label="Footer">
      <ul><li><a href="/privacy">Privacy</a></li></ul>
    </nav>
    <p><small>© 2026 Codemaster Ghana</small></p>
  </footer>
</body>`,
      trace: [
        "A screen reader user pressing the landmark list key hears: *banner, navigation 'Main', main, region 'Curriculum', navigation 'Footer', contentinfo*. They can jump to `main` in one keystroke and skip the header on every page.",
        "`aria-label=\"Main\"` distinguishes this `nav` from the footer `nav`; without labels both are announced as just *navigation*.",
        "`aria-current=\"page\"` tells assistive technology which link is the page you are on — the accessible equivalent of bolding it.",
        "The outline is `h1` → `h2` → `h3`. A user navigating by heading hears 'Web Development Foundations, heading level 1', then 'Curriculum, heading level 2', and can move between lessons with a single key.",
        "`aria-labelledby=\"curriculum\"` names the region by pointing at the heading's `id`, so the region is announced as *'Curriculum, region'* rather than an anonymous block.",
        "The lesson is an `article` inside an `li` inside an `ol`: a list of self-contained items, announced as 'list, 1 item'.",
      ],
    },
    {
      kind: "warning",
      label: "Heading levels are an outline, not a font size",
      text: "Skipping from `h1` to `h3` because the `h3` looked better breaks the outline: a screen reader user navigating by heading cannot tell what level they are at, and jumping 'up' a level becomes meaningless. Choose the element by structure, then change its **appearance** with CSS (`font-size`, `font-weight`). If your design needs an `h3` to look like an `h2`, that is a stylesheet problem, not a markup problem.",
    },
    {
      kind: "prose",
      heading: "The accessibility tree",
      paragraphs: [
        "Browsers maintain two parallel trees. The **DOM** is the document as you wrote it. The **accessibility tree** is a derived structure, exposed to assistive technology through platform APIs, containing only what matters for a non-visual user: for each node, a **role** (what it is), a **name** (what it is called), a **state** (checked, expanded, disabled) and its **value**.",
        "A `<button>Save</button>` becomes a node with role `button`, name `Save`, state `focusable`. A `<div>Save</div>` becomes a generic node with no role — effectively invisible in the list of interactive elements. A `<input type=\"checkbox\" checked>` carries the state `checked`, which is why a fake checkbox built from a `div` and a background image cannot report its own state no matter how carefully you style it.",
        "Three things remove content from the accessibility tree, and confusing them causes real bugs. `display: none` and `visibility: hidden` remove it from *both* trees — it is not rendered and not announced. The `hidden` attribute does the same. But `aria-hidden=\"true\"` removes it from the accessibility tree **while leaving it visible** — correct for a decorative icon beside a text label, disastrous for content a sighted user needs. And a focusable element inside an `aria-hidden` container is a specification violation: keyboard users will tab into something that was never announced to them.",
        "You can inspect the accessibility tree directly. In Chrome DevTools, open the Elements panel and look at the **Accessibility** tab; the *Inspect* tool shows the computed role and name for whatever you click. It is the fastest way to find out what a screen reader will actually say.",
      ],
    },
    {
      kind: "prose",
      heading: "WCAG: the four principles",
      paragraphs: [
        "The **Web Content Accessibility Guidelines** are the international standard, published by the W3C, and they are organised around four principles — memorable as **POUR**. Every guideline sits under one of them, and every audit question you will ever be asked maps back to one of them. Levels are A (minimum), AA (the legal and commercial target, and what almost every contract specifies) and AAA (aspirational; rarely required wholesale).",
      ],
    },
    {
      kind: "table",
      caption: "POUR, with the AA requirements you will actually implement",
      head: ["Principle", "Meaning", "Concrete AA requirements"],
      rows: [
        ["**Perceivable**", "Users can sense the content, whichever senses they have.", "`alt` text for meaningful images; captions for video; transcripts for audio; contrast of at least 4.5:1 for body text and 3:1 for large text; text resizable to 200% without loss; no information conveyed by colour alone; content reflows at 320px without horizontal scrolling."],
        ["**Operable**", "Users can drive the interface, whatever input they use.", "Everything reachable and usable by keyboard; no keyboard traps; a visible focus indicator; enough time, or a way to extend it; nothing flashes more than three times a second; a 'skip to content' link; descriptive link and button labels; targets at least 24×24 CSS pixels."],
        ["**Understandable**", "Users can comprehend the content and how to operate it.", "`lang` on the document and on passages in another language; consistent navigation across pages; clear labels and instructions; errors identified in text, not just colour; confirmation for destructive or legal actions."],
        ["**Robust**", "Content works with current and future assistive technology.", "Valid HTML; correct roles, names and states; native elements preferred over ARIA; status changes announced with `aria-live` rather than requiring a reload."],
      ],
    },
    {
      kind: "prose",
      heading: "Keyboard access and focus",
      paragraphs: [
        "Many people cannot use a mouse or a touchscreen: someone with a motor impairment may use a keyboard, a head pointer or a switch device; a blind user navigates with a screen reader whose key commands assume a keyboard; a power user simply prefers keys. Keyboard access is therefore the foundation, and it has four rules.",
        "**Everything interactive must be reachable with Tab**, in an order that matches the visual order. The tab order follows *document order*, not CSS order — which means `flex-direction: row-reverse`, `order:` and float tricks can produce a tab sequence that jumps backwards across the screen. Never use `tabindex` with a positive value to fix this; fix the DOM order instead. `tabindex=\"0\"` adds a non-interactive element to the sequence (rarely the right answer), and `tabindex=\"-1\"` removes an element from the sequence while still letting JavaScript focus it programmatically (often exactly right for modals and for 'skip' targets).",
        "**Everything reachable must be operable.** Links and buttons activate with Enter; buttons also accept Space; native form controls have their own keys — arrow keys in a `select`, arrow keys between radio buttons in a group. Custom widgets must implement the documented key bindings for the role they claim, which is why the ARIA Authoring Practices exist and why building a custom dropdown is a much larger job than it looks.",
        "**The focus indicator must be visible.** Browsers draw a focus ring by default; `outline: none` in a global reset removes it and is one of the most damaging one-line changes in CSS. If the default ring does not suit your design, replace it — never delete it. `:focus-visible` is the modern selector: it styles keyboard focus strongly while leaving mouse clicks unadorned.",
        "**Focus must be managed when the page changes without loading.** When a modal opens, focus moves into it and is trapped there until it closes, then returns to the element that opened it. When a single-page app navigates, focus should move to the new page's heading or main region, otherwise a screen reader user is left announcing the old page. This is the part of accessibility that frameworks do not do for you.",
      ],
    },
    {
      kind: "code",
      caption: "A skip link, and a focus indicator worth keeping",
      language: "css",
      code: `/* The first Tab press reveals a link that jumps past the header. */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: .75rem 1.25rem;
  background: #1b1822;
  color: #fff;
  font-weight: 700;
}
.skip-link:focus {
  left: 0;          /* moves into view only when focused */
}

/* Never delete the outline. Replace it, and only for keyboard focus. */
:focus-visible {
  outline: 3px solid rgb(109 74 255 / .55);
  outline-offset: 3px;
  border-radius: 4px;
}`,
    },
    {
      kind: "code",
      caption: "The skip link's markup — first focusable element in the body",
      language: "html",
      code: `<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>…</header>
  <main id="main" tabindex="-1">…</main>
</body>`,
    },
    {
      kind: "prose",
      heading: "Forms: where accessibility failures concentrate",
      paragraphs: [
        "Forms are the point of the web — signing up, paying, applying, searching — and they are where most accessibility bugs live. The rules are few and mechanical.",
        "**Every input needs a programmatic label.** `<label for=\"email\">Email</label>` bound to `<input id=\"email\" name=\"email\">` gives the field its accessible name, so a screen reader announces 'Email, edit text' instead of 'edit text'. Placeholder text is *not* a label: it disappears on entry, it is usually too low-contrast, and it is not exposed as the name. If a design genuinely forbids a visible label, hide the label visually but keep it in the DOM — never omit it.",
        "Wrapping also works and is often easier: `<label>Email <input name=\"email\"></label>` binds them without `for`/`id` pairs. Use `type` correctly — `email`, `tel`, `url`, `number`, `date`, `password`, `search` — because the type drives the mobile keyboard, the browser's validation and the announced role. `autocomplete=\"email\"` lets password managers fill the field, which is an accessibility feature as much as a convenience.",
        "**Group related fields.** A set of radio buttons or checkboxes that answer one question goes in a `<fieldset>` with a `<legend>`; the legend becomes part of each control's name, so 'Standard, radio button 1 of 3, Delivery speed' makes sense out of context. For a form with several sections, `aria-describedby` pointing at instructions works well.",
        "**Errors must be text, not colour.** A red border alone tells a colour-blind user nothing. Describe the problem in words, associate it with the field using `aria-describedby`, mark the field `aria-invalid=\"true\"`, and — critically — make sure the message is *announced*. The reliable technique is `role=\"alert\"` or `aria-live=\"assertive\"` on the container, so a user who cannot see the field is told what went wrong. Put the hint and the error in `aria-describedby` in the order you want them read.",
      ],
    },
    {
      kind: "example",
      title: "One accessible field, completely",
      paragraphs: [
        "This is the whole pattern: label, hint, input, error. Copy it for every field you ever build and you will be ahead of most production sites.",
      ],
      code: `<div class="field">
  <label for="email">Email address</label>
  <p class="hint" id="email-hint">We send receipts here. Never shared.</p>

  <input
    id="email"
    name="email"
    type="email"
    inputmode="email"
    autocomplete="email"
    required
    aria-describedby="email-hint"
    aria-invalid="false">

  <p class="error" id="email-error" role="alert" hidden>
    Enter an email address, like ama@example.com.
  </p>
</div>`,
      trace: [
        "`label for=\"email\"` gives the input its accessible name — clicking the label also focuses the field, which helps users with motor impairments.",
        "`type=\"email\"` produces an email keyboard on a phone and enables native validation.",
        "`autocomplete=\"email\"` lets a password manager fill it in; for users who struggle to type, that is the difference between using the form and abandoning it.",
        "`aria-describedby=\"email-hint\"` appends the hint to the announcement: 'Email address, edit text, we send receipts here'.",
        "When validation fails, JavaScript sets `aria-invalid=\"true\"`, adds `email-error` to `aria-describedby`, and removes `hidden`. Because the error has `role=\"alert\"`, it is announced immediately without the user hunting for it.",
        "The error message says what to do, in plain words, and includes an example — not 'invalid input'.",
      ],
    },
    {
      kind: "prose",
      heading: "Images and alternative text",
      paragraphs: [
        "The `alt` attribute is not one thing; it is a decision about what role the image plays. Ask first: if the image vanished, what would the reader lose?",
        "If the answer is *information*, write text that carries that information — the content and the function, not a description of pixels. 'Screenshot of the price tracker showing tomato prices in three Accra markets' is useful; 'image of a website' is not. If the image is a **link or button**, the `alt` must describe the *destination or action* — 'Go to checkout', not 'cart icon'. If the image is purely **decorative**, write `alt=\"\"` (an empty string, not a missing attribute) so assistive technology skips it cleanly; a missing `alt` makes some screen readers read the filename aloud, which is worse than either option. If the image is **complex** — a chart, a diagram — write a short `alt` and provide the full data as a real `<table>`, or a long description nearby.",
        "Never put text in an image when you can put it in HTML: it cannot be translated, resized, indexed, or read aloud, and it disappears on high-contrast settings. And `title` on an image is not a substitute for `alt` — it is a tooltip, unreachable by keyboard and by touch.",
      ],
    },
    {
      kind: "prose",
      heading: "Colour, contrast and not-colour",
      paragraphs: [
        "Contrast is measured as a ratio of relative luminance between two colours, from 1:1 (identical) to 21:1 (black on white). WCAG AA requires **4.5:1** for normal text, **3:1** for large text (18pt, or 14pt bold), and **3:1** for user-interface components and graphical objects — the border of an input, the focus ring, the segment of a chart. AAA asks for 7:1 and 4.5:1.",
        "The second rule is more often broken: **never use colour as the only channel**. 'Required fields are marked in red', 'errors are red', 'green means available' all fail for the roughly one in twelve men with colour vision deficiency. Pair colour with a symbol, a word or an icon: `*` beside the label, the text 'Required', an icon plus the message. The same applies to links in a paragraph — if they are distinguished only by colour, add an underline.",
        "Test it rather than eyeballing it. DevTools' colour picker shows the contrast ratio as you choose; the Accessibility panel flags failures; browser extensions such as axe or Lighthouse audit a whole page in seconds. And check greyscale: view the page with a greyscale filter and see whether anything became unintelligible.",
      ],
    },
    {
      kind: "formula",
      expression: "contrast ratio = (L1 + 0.05) / (L2 + 0.05)   where L1 is the lighter colour's luminance",
      where: [
        "`L` is *relative luminance*: each sRGB channel is linearised, then `L = 0.2126·R + 0.7152·G + 0.0722·B`.",
        "The `0.05` offsets model ambient glare and screen reflections, so a ratio never reaches infinity.",
        "AA body text: ≥ 4.5. AA large text and UI borders: ≥ 3. AAA body text: ≥ 7.",
        "Contrast is symmetric: it does not matter which colour is the text and which is the background.",
      ],
    },
    {
      kind: "prose",
      heading: "ARIA: the first rule is don't",
      paragraphs: [
        "**ARIA** — Accessible Rich Internet Applications — is a set of attributes that patch the accessibility tree when HTML cannot express something. `role` overrides an element's implicit role; `aria-label` and `aria-labelledby` supply a name; `aria-describedby` supplies a description; `aria-expanded`, `aria-pressed`, `aria-current`, `aria-invalid` and `aria-selected` supply state; `aria-live` announces changes without a reload.",
        "The first rule of ARIA, printed in the specification itself, is: **do not use ARIA if a native HTML element or attribute with the semantics you need already exists.** The reason is that ARIA changes only what assistive technology is *told*; it changes no behaviour. `<div role=\"button\">` announces 'button' but is still not focusable, not keyboard-operable, and does not fire click events on Enter — you must now write all of that yourself, and if you write it wrong you have produced something that *claims* to be a button and does not behave like one, which is worse than a `div` that claims nothing.",
        "So ARIA is for the cases HTML genuinely cannot cover: naming an icon-only button (`aria-label=\"Close\"`), describing the state of a disclosure widget you built (`aria-expanded`), labelling a landmark that has no heading (`aria-label=\"Footer\"`), and announcing a live region (`role=\"status\"` for polite updates such as 'Saved', `role=\"alert\"` for urgent ones such as errors). Everything else, use the element.",
      ],
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Landmark", text: "A region of the page — `banner`, `navigation`, `main`, `contentinfo` — that assistive technology can jump to." },
        { term: "Accessibility tree", text: "The role/name/state/value structure the browser exposes to assistive technology, derived from the DOM plus CSS plus ARIA." },
        { term: "Accessible name", text: "The text assistive technology announces for an element, computed from its content, `label`, `aria-labelledby` or `aria-label`." },
        { term: "Focus order", text: "The sequence in which elements receive keyboard focus — document order, not CSS order." },
        { term: "Keyboard trap", text: "A widget that takes focus but does not let Tab move it out. Fails WCAG immediately." },
        { term: "WCAG", text: "Web Content Accessibility Guidelines: the standard, with principles POUR and conformance levels A, AA, AAA." },
        { term: "ARIA", text: "Attributes that add role, name and state information HTML cannot express — and never behaviour." },
        { term: "Live region", text: "An element whose changes are announced automatically, via `aria-live`, `role=\"status\"` or `role=\"alert\"`." },
      ],
    },
    {
      kind: "prose",
      heading: "Testing it yourself, in five minutes",
      paragraphs: [
        "Automated tools catch roughly a third of real problems, but they catch it instantly, so run them always. The rest requires a human being deliberately handicapped — which is a useful exercise, and free.",
        "**Unplug the mouse.** Tab through the entire page. Can you reach everything? Can you always see where you are? Does the order match what you see? Can you complete the signup form and every dialog without a pointer? Any 'no' is a bug.",
        "**Turn on a screen reader.** VoiceOver on macOS (`Cmd+F5`), Narrator on Windows (`Win+Ctrl+Enter`), TalkBack on Android. Close your eyes and try to buy something. You will discover within two minutes what your headings, labels and button names actually sound like — and 'Read more' repeated five times is a lesson nobody forgets.",
        "**Zoom to 200%** and shrink the window to 320px wide. Nothing may disappear, overlap, or require horizontal scrolling.",
        "**Run an automated audit**: Lighthouse's Accessibility category in DevTools, or the axe extension. Fix every item; they are nearly always real.",
        "**Disable images** (DevTools has a setting) and read the page. If the meaning survives, your `alt` text is doing its job.",
      ],
    },
    {
      kind: "code",
      caption: "Patterns that fix themselves once you write them correctly",
      language: "html",
      code: `<!-- Disclosure: native, focusable, keyboard-operable, no JavaScript -->
<details>
  <summary>What is included in the program?</summary>
  <p>Every course, every lesson, forever.</p>
</details>

<!-- Icon-only button: the icon is decorative, the name comes from ARIA -->
<button type="button" aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">…</svg>
</button>

<!-- A dialog, correctly opened and closed -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm purchase</h2>
  …
</div>

<!-- Status that is announced politely -->
<p role="status" aria-live="polite">Saved · 09:14</p>

<!-- A table is a table: headers make cells meaningful -->
<table>
  <caption>Program prices in Ghana cedis</caption>
  <thead><tr><th scope="col">Program</th><th scope="col">Price</th></tr></thead>
  <tbody><tr><th scope="row">Web Development</th><td>GH₵ 240</td></tr></tbody>
</table>`,
    },
  ],
  practice: {
    challenge:
      "Take any page you have already built — or the sample markup in this lesson — and replace its generic `div` elements with at least four semantic elements (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`). Then **unplug your mouse** and complete one real task on the page using only the keyboard. Fix everything that stops you: missing focus indicators, unreachable controls, and a tab order that jumps around. Finish by running a Lighthouse accessibility audit and getting the score to 100.",
    exercises: [
      {
        prompt: "Write the landmark structure for a checkout page: header with logo and a basket summary, a two-step form as the main content, a sidebar with a security reassurance, and a footer. Give each landmark an accessible name.",
        hint: "Two `nav` elements need `aria-label`s to be distinguishable. The sidebar is an `aside`; the reassurance inside it needs a heading or a label.",
      },
      {
        prompt: "Convert `<div class=\"btn\" onclick=\"save()\">Save</div>` into a fully accessible control, and list every behaviour the `div` version was missing.",
        hint: "Count them: role, name, focusability, Enter, Space, disabled state, voice control, form submission. Then decide whether it should be a `button` or an `input type=submit`.",
      },
      {
        prompt: "Write `alt` text for these four images: (a) your own profile photo in a portfolio header, (b) a line chart of monthly revenue, (c) a decorative swirl behind a hero heading, (d) a magnifying-glass icon inside a search button.",
        hint: "One of them should be `alt=\"\"`. One needs a long description or an accompanying table. One must describe the *action*, not the picture. One should describe the person.",
      },
      {
        prompt: "Measure the contrast between `#6f6975` text and a `#f7f7f4` background. Does it pass AA for body text? If not, adjust only the text colour until it does, and say how far you had to move.",
        hint: "Use the DevTools colour picker or any contrast checker. That pair is very close to the boundary, which is exactly why you measure instead of judging by eye.",
      },
      {
        prompt: "Build a three-field form (name, email, password) with labels, hints, `autocomplete`, and error messages announced with `role=\"alert\"`. Then fill it in with a screen reader running and note what you hear for each field.",
        hint: "The order in `aria-describedby` is the order it is read. Put the hint before the error until there is an error, then put the error first.",
      },
      {
        prompt: "Find a real website with a 'Read more' link repeated many times in a list. Explain the problem and fix it two different ways: one using visible text, one using `aria-label` or `aria-labelledby`.",
        hint: "Links must make sense out of context, because screen reader users list all the links on a page. 'Read more about Web Foundations' is the fix; `aria-labelledby` pointing at the card's heading is the invisible one.",
      },
      {
        prompt: "Add a skip link to your page. Verify that it is invisible until focused, that it is the first Tab stop, and that activating it moves focus to `main`.",
        hint: "`main` needs `tabindex=\"-1\"` for the focus move to work reliably in every browser, and `scroll-mt` so the sticky header does not cover the heading.",
      },
    ],
    checkYourself: [
      "Name the four WCAG principles and give one concrete AA requirement under each.",
      "What is the difference between `hidden`, `aria-hidden=\"true\"` and `visibility: hidden`? Which one leaves content visible but unannounced?",
      "Why does `tabindex=\"3\"` on a button cause more harm than good?",
      "What is the first rule of ARIA, and why does `role=\"button\"` on a `div` not make it a button?",
      "Why is placeholder text not a label?",
      "What contrast ratio does body text need at AA, and what does a focus ring need?",
      "What happens to the tab order when you use `order: -1` in a flex container?",
    ],
  },
  takeaways: [
    "Native elements ship with a role, keyboard behaviour and focus for free; a styled `div` ships with none of it.",
    "Landmarks and an unbroken heading outline are a screen reader user's map of your page.",
    "The accessibility tree carries role, name, state and value — check it in DevTools rather than guessing what will be announced.",
    "Keyboard access means reachable, operable, visibly focused, and in an order that matches the layout.",
    "Forms need real labels, grouped fields, and errors written in words and announced — colour alone is never a message.",
    "Contrast is a number, not an opinion: 4.5:1 for text, 3:1 for large text and UI borders.",
    "ARIA changes what is announced and nothing else; use it only where HTML has no element for the job.",
  ],
  further: [
    "Next: [[CSS foundations|/learn/web-foundations/css-foundations]] — now that the structure means something, make it look like something.",
    "Read the ARIA Authoring Practices for any widget you build by hand; it documents the exact keys and roles expected.",
    "Add an accessibility pass to your personal definition of done, alongside 'works on a phone'.",
  ],
},
