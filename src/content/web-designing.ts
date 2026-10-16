import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Web Designing — designing websites rather than writing them.
 *
 * A design-led course for the person who will be handed a client's goals, a
 * logo and a budget, and asked for a website: the design process from brief to
 * wireframe to visual design, layout and hierarchy for a screen, mobile-first
 * thinking, colour and type as a brand system, the handover a developer can
 * actually build from, and the business side — client conversations, pricing
 * and building a portfolio that gets work.
 */

export const WEB_DESIGNING_MODULES: CourseModule[] = [
  module(
    "designing-the-site",
    "01 · Designing the site",
    "From a client's goal to a layout a developer can build.",
    [
      lesson({
        id: "from-brief-to-wireframe",
        title: "From brief to wireframe",
        summary:
          "A website is a business outcome, not a picture. This lesson takes the process from the client's goal — more enquiries, fewer calls, more orders — through research and information architecture to wireframes, and shows why the cheapest artifact in the process (a grey box with a label) prevents the most expensive mistake (building the wrong pages). It covers what a sitemap and user flow decide, and how to validate a structure before anybody chooses a colour.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Most disappointing websites fail for structural reasons: the enquiry form is three clicks away, the services page never says what the business does, the phone number is buried in a footer, and the page carries four competing calls to action. None of those are visual problems, and none of them are cheap to fix once a site is built. Wireframing is where they are solved, and it requires a pencil, not a design tool.",
          },
          {
            heading: "Definition: brief, sitemap, flow, wireframe, prototype",
            kind: "definition",
            body:
              "**A website brief** states the business objective (what must change), the audience (who must act), the content that exists and who will supply it, the technical constraints (hosting, platform, integrations, deadlines, budget), the brand assets, and how success will be measured. \"A nice modern website\" is not an objective; \"twelve enquiries a month from a school's website, of which we can name the source\" is.\n\n**Information architecture** is how content is organised and named: a **sitemap** lists the pages and their hierarchy; **navigation** is what appears in the header, the footer and in-page; **taxonomy** is the vocabulary (call them Courses, Classes or Programmes — consistently, because inconsistent labels make users think they are different things).\n\n**User flows** are the sequences a visitor takes to complete a goal: home → services → price → contact, or an ad → landing page → form → thank-you page. Draw them with the failure branches: what happens if the form fails, if the office is closed, if the user only has a phone number.\n\n**A wireframe** is a grey, un-designed layout showing structure, hierarchy and content: what is on the page, in what order, and how large each block is relative to the others. It deliberately excludes colour, imagery and typeface, because a stakeholder who dislikes blue will argue about blue instead of about whether the enquiry form is visible.\n\n**A prototype** makes wireframes clickable so a person can attempt the task with a finger. Five people clicking through a prototype will find the navigation problems that a hundred opinions will not.",
          },
          {
            heading: "Research that takes an afternoon, not a month",
            kind: "paragraph",
            body:
              "**Talk to the client about customers, not about design.** Who buys, what do they ask on the phone, what made the last three customers choose you, what do people misunderstand about what you do? The answers become the page content.\n\n**Talk to three customers** if the client can introduce them. Ask how they found the business and what they looked for first. Twenty minutes each will reshape your home page.\n\n**Look at the competitors and at the sector.** You are not copying; you are collecting conventions. If every competitor puts prices on their site, the absence of prices is a decision the client must make consciously.\n\n**Look at the client's existing content.** A hairdresser with two hundred good photographs needs an image-led layout; a law firm with four paragraphs needs a typographic one. The content dictates the layout, and fighting it produces a site nobody can maintain.\n\n**Audit the material.** Logo as vector or only as a JPEG? Good photographs or phone snapshots? Real opening hours or aspirational ones? Honest answers here determine what the design can actually be.\n\nThen **write a content list** — every page, every section, every piece of text and image, with an owner and a date. The most common cause of a stalled website project is content that never arrived, and nobody asked for it in writing.",
          },
          {
            heading: "Worked example: the structure that fixed a school's enquiries",
            kind: "example",
            body:
              "A private school has a website where applications are \"down 40%\". The existing site has eight top-level menu items, a home page with a slideshow, and an application form four clicks deep under \"Admissions → Forms → Download\". The head teacher believes the problem is the colours.\n\nThe brief converts the complaint into an objective: twelve completed enquiries a month, with the source of each recorded. And the audience is not \"parents\" — it is parents *considering a change in the next term*, who are comparing three schools and want three specific facts: fees, location, and results.\n\nThe sitemap drops from eight menu items to four: Admissions, Academics, About, Contact. The fees move to the top of the Admissions page, because hiding them wastes the time of both the school and the parent. The application becomes a two-field enquiry form (name and phone number) instead of a twelve-field form and a PDF: an enquiry is not an application, and asking for everything up front loses the lead. The phone number and WhatsApp link are pinned in the header on mobile, because that is how the parents actually make contact.\n\nThe wireframe of the home page answers three questions above the fold, with one action. The result after two months: 31 enquiries, 22 traceable to the website, and a click-to-call from the mobile header in 40% of sessions. The colours never changed.",
            code:
              "Brief (extract)                     Objective: 12 completed enquiries/month, source recorded\n                                    Audience:  parents comparing 3 schools, phone-first\n\nSitemap — before                   Sitemap — after\n  1. Home                            1. Home\n  2. About / Our history             2. Admissions   (fees table on this page)\n  3. Academics                         × Fees\n  4. Admissions                        × Enquire (2 fields)\n      × Fees                           × Visit us (map, hours)\n      × Forms  → Download             3. Academics    (results, curriculum)\n      × Prospectus PDF               4. About / Contact  (staff, location, phone)\n  5. News\n  6. Gallery                        Navigation: 4 items + sticky \"Enquire\" button\n  7. Contact                        Footer: address, phone, WhatsApp, Google Maps\n  8. Login\n\nHome page wireframe (mobile first, above the fold)\n  ┌─────────────────────────────┐\n  │ [logo]              ☎ Call   │  ← sticky, tap-to-call\n  ├─────────────────────────────┤\n  │ Ranked 1st in the region    │  ← what the parent needs to know first\n  │ for BECE results, 2025      │\n  │ [ Enquire in 30 seconds ]   │  ← one primary action\n  │ [ Photograph of pupils ]    │\n  ├─────────────────────────────┤\n  │ 3 facts: fees from GH₵…,     │  ← the comparison facts, scannable\n  │ 12 km from Accra, 1:18 ratio │\n  └─────────────────────────────┘",
            language: "text",
            codeLabel: "Structure, not colour, produced the enquiries",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Designing pages before agreeing on structure.** Any layout can be made to look good; the question is whether the visitor can complete the task. Wireframe first.\n- **\"Let us put it in the menu.\"** Every item added to a menu dilutes the others. Four to six top-level items is a ceiling for a small business site, not a target.\n- **A home page that describes the company rather than answering the visitor.** Users arrive with a question; the home page should answer it in the first screen.\n- **A twelve-field form for a first contact.** Every field you add reduces completions. Ask for the minimum needed to begin the conversation.\n- **Content delivered at the end.** The site cannot be designed without real text and pictures. Put a content deadline in the contract, or write it yourself and charge for it.\n- **Approving the design by looking at a static long screenshot.** Scroll it on a phone, click the prototype, and try to complete the goal. That is the only meaningful review.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Artifact", "Time to make", "Answers", "Who approves it"],
              ["Brief (one page)", "2–3 hours with the client", "What must change, for whom, by when", "Client, in writing"],
              ["Content list", "1 hour", "What text and images are needed, and from whom", "Client"],
              ["Sitemap", "1–2 hours", "What pages exist and how they nest", "Client + designer"],
              ["User flow", "1 hour", "How the visitor completes the goal, including failure branches", "Designer"],
              ["Wireframe", "2–4 hours", "Structure, order and relative size of the content", "Client (structure only)"],
              ["Clickable prototype", "2–4 hours", "Can a real person complete the task?", "Five testers, then the client"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Website design starts with a business objective and a written content list, becomes a sitemap and user flows, and only then a wireframe: grey boxes that settle structure, order and hierarchy before anybody argues about colour. Research is an afternoon of talking to the client and three customers rather than a month of deliverables, and the two habits that most improve the result are asking for content in writing and testing the structure on real people before visual design starts.",
          },
        ],
        keyPoints: [
          "Turn a client's complaint into a measurable business objective before designing anything.",
          "Build a sitemap, navigation and user flows, including failure branches.",
          "Write a content list with owners and deadlines, and treat content as part of the project.",
          "Wireframe structure and hierarchy without colour, then test the structure with five people.",
          "Choose a layout that fits the client's real content — image-led or text-led.",
        ],
        exercises: [
          "Take a real small business website and write its brief backwards: objective, audience, what the pages would need to say to achieve it.",
          "Rebuild a site's sitemap from eight items to five, and explain what you removed and why.",
          "Draw the user flow for an enquiry, including what happens when the form fails and when the visitor only wants to phone.",
          "Wireframe one home page as three grey boxes per screen for mobile, with a single primary action.",
          "Run a five-person test on a wireframe or prototype and record every hesitation in order.",
        ],
        challenge:
          "Take one real client or organisation and produce a complete structure pack: a one-page brief, a content list with owners, a sitemap, two user flows, mobile and desktop wireframes for the three most important pages, and the findings from testing a clickable prototype with five people. Report the structural changes the testing produced, and the one page you decided the site does not need.",
      }),

      lesson({
        id: "visual-design-for-screens",
        title: "Visual design for screens",
        summary:
          "Once the structure is settled, visual design makes the hierarchy readable and the brand recognisable: layout and grid for screens, type scale and hierarchy, colour and contrast with measured values, imagery, components and design systems, and the responsive rules that keep a layout working from a 320-pixel phone to a wide monitor. This lesson ends with consistency — the tokens and components that keep twenty pages looking like one site.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Web design has two audiences: the visitor, who needs to find and do something in seconds, and the developer, who has to build it. Good visual design serves both by being systematic — a small set of type sizes, colours, spacings and components used consistently — which is faster to produce, easier to maintain and more persuasive than a page of one-off decisions.",
          },
          {
            heading: "Definition: grid, scale, tokens, components, systems",
            kind: "definition",
            body:
              "**The grid.** A 12-column layout with a consistent gutter and, on screens, a maximum content width (1100–1300 px is comfortable for text sites) with content centred. Twelve columns divide into halves, thirds, quarters and sixths, which is why it has survived. On mobile, one column with 16–24 px side margins.\n\n**Spacing scale.** One set of values used everywhere — 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Every margin, padding and gap comes from this list. Arbitrary values are what make a site feel subtly wrong, and a scale is what makes it feel deliberate.\n\n**Type scale.** One base (16 px on screens) and a short ladder of larger sizes with 1.25–1.333 ratios: 13, 16, 20, 25, 31, 39 px. Line height 1.5 for body, 1.1–1.25 for headings. Measure of 45–75 characters.\n\n**Colour tokens.** Named decisions rather than hex values scattered through a document: `brand`, `brand-dark`, `text`, `text-muted`, `surface`, `border`, `success`, `danger`. Tokens make a palette editable in one place and make dark mode possible; they also prevent the twelve slightly different greys beginners accumulate.\n\n**Components.** Repeated interface pieces with defined states: button (default, hover, pressed, disabled, loading), card, form field (default, focus, error, success), navigation, modal, table row. The states are what separate a design from a picture — a button with no disabled state is a promise the developer cannot keep.\n\n**A design system** is the tokens, components, rules and documentation together. For a small team it can be one page: here are our colours, our type sizes, our spacing, our components, and here is what not to do. The value is consistency, and consistency is what makes a site feel trustworthy.\n\n**Responsive rules.** Design three widths as a minimum — 360 px, 768 px, 1280 px — plus the in-between states where layouts break. Test at 320 px and with 200% zoom. Remember that on a phone, the first screen is the whole impression: what is above the fold decides whether a visitor continues.",
          },
          {
            heading: "Imagery and content design",
            kind: "paragraph",
            body:
              "**Photography beats stock.** The best images a small business owns are its own products, premises and people — shot on a phone in daylight, consistently framed. Stock photographs of foreign offices reduce trust; a real photograph of the actual shop increases it. Give the client a one-page shot list and specific guidance: daylight, no flash, clean the table, shoot five options of each.\n\n**Image treatment.** Crop consistently (one aspect ratio per context), keep faces intact, darken behind text for legibility, and check contrast over images — text over a busy photograph is unreadable in bright sunlight.\n\n**Alt text is content.** Describe what the image contributes, not what it depicts: \"Pupils in the science laboratory during the 2025 open day\" rather than \"students\". This is accessibility work and search-visibility work at once.\n\n**Microcopy.** Button labels, form hints and error messages are design work: \"Enquire\" beats \"Submit\"; \"Enter your phone number, for example 024 000 0000\" beats \"Phone\". Write them in the design, not in the developer's imagination.\n\n**Trust signals.** For many Ghanaian customers, the elements that convert are concrete: a physical address, a phone number that is answered, a WhatsApp option, photographs of the premises, real testimonials with names, and a payment method they recognise. Design places for them deliberately rather than hoping the visitor will search.\n\n**Performance is design.** A hero video or a stack of large photographs may look impressive in a mock-up and cost a visitor 4 MB of prepaid data before they see it. Choose the weight in the design file: state an image budget (for example, under 200 KB per image) and design within it.",
          },
          {
            heading: "Worked example: turning a mock-up into a set of tokens",
            kind: "example",
            body:
              "A first visual for a services site uses eleven text sizes, seven greys, three button styles and spacing values of 7, 13, 18, 22, 27 and 35 px. It looks fine on the one page it was designed for, and nobody can build a second page that matches it.\n\nThe repair is to derive a system from the design's *intent* — the biggest heading, the base text, the accent colour, the button shape — and then express everything as tokens. Note that this is not restriction for its own sake: the six type sizes below carry the same hierarchy the eleven did, better, because the gaps between them are large enough to see.\n\nThe practical test of a system is the second page: hand the tokens and components to somebody else and ask them to lay out a new page without asking you a question. If they can produce something that looks like the same site, the system works. That is also what makes the handover to a developer cheap, because the tokens map directly onto CSS custom properties.",
            code:
              "Design tokens (one page, the whole system)\n\n  colour   brand        #14507A     brand-dark   #0E3A59\n           accent       #F2A33C     text         #1B1B1B\n           text-muted   #5A6270     surface      #FFFFFF\n           surface-alt  #F5F7FA     border       #DDE3EA\n           success      #1E7A45     danger       #B3261E\n\n  type     base 16 px · line-height 1.5 · measure 45–75 characters\n           scale   13 · 16 · 20 · 25 · 31 · 39 px   (ratio ≈ 1.25)\n           headings 39/31/25 · weight 600 · line-height 1.15\n           family  one sans (Inter or system stack) + one display, optional\n\n  space    4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 px   (nothing else)\n\n  layout   12 columns · gutter 24 px · max content width 1200 px\n           mobile: 1 column, 20 px side margins, 44 px minimum tap targets\n\n  components with states\n           button   default · hover · pressed · disabled · loading\n           field    default · focus · error · success · disabled\n           card     image ratio 16:9 · title · meta · one action\n\n  rules    one primary action per screen · text over images needs a scrim\n           no more than 3 levels of heading on a page · images < 200 KB",
            language: "text",
            codeLabel: "Eleven sizes and seven greys become a system",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Designing only the happy path.** Screens are needed for empty lists, long titles, failed forms, loading and errors. A design without them is not finished.\n- **Low contrast grey text.** It looks elegant on a laptop and disappears on a phone in sunlight. Measure the ratio; 4.5:1 minimum for body text.\n- **More than one primary action per screen.** Two equally weighted buttons mean no decision has been made, and users pick neither.\n- **Designing at one width.** A layout that works at 1440 px must also be designed at 360 px, not merely reduced.\n- **Hoping the developer will \"make it responsive\".** Responsiveness is a design decision about order, hiding and resizing; a developer cannot invent it from a single wide mock-up.\n- **Ignoring image weight.** A beautiful design that costs 5 MB is a broken design for a customer on a prepaid bundle.\n- **Showing a design as a JPEG on a laptop.** Present it in a browser at phone and desktop widths, with real content and real interactions.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Decision", "Value on screens", "Why", "Test"],
              ["Content width", "1100–1300 px", "Comfortable reading, less eye travel", "Read a paragraph without losing the line"],
              ["Body size", "16 px minimum", "Legibility, and it prevents iOS zoom on inputs", "Read it on a phone held at arm's length"],
              ["Line height", "1.5 body, 1.1–1.25 headings", "Tracking across lines", "Long paragraph, no finger tracking"],
              ["Tap target", "44×44 px", "Thumb accuracy", "Try it with a thumb, one-handed"],
              ["Contrast", "4.5:1 body, 3:1 large", "Legibility in glare", "Contrast checker on real colours"],
              ["Spacing", "From one scale", "Consistency and rhythm", "Grep the layout for odd values"],
              ["Image weight", "< 200 KB each", "Data cost and load time", "Throttled test on a real phone"],
              ["Screens designed", "360, 768, 1280, plus breakpoints", "Real devices and awkward widths", "Resize slowly and watch for breaks"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Visual design for screens is systematic: one grid, one spacing scale, one type ladder, a small set of named colour tokens and a component library with states. Add disciplined imagery, written microcopy, deliberate trust signals and an image budget, and the design becomes something a developer can build, a client can extend, and a visitor on a cheap phone can actually use. Consistency, not ornament, is what makes a site feel professional.",
          },
        ],
        keyPoints: [
          "Set up a grid, spacing scale, type scale and named colour tokens.",
          "Specify components with all their states, including empty, loading and error.",
          "Choose and treat imagery for realism and legibility, and write the alt text and microcopy.",
          "Design at 360 px, 768 px and 1280 px rather than resizing one mock-up.",
          "Hand over a system that somebody else can extend without asking you questions.",
        ],
        exercises: [
          "Take a page you have designed and list every distinct spacing and font size value. Consolidate to a scale and report what changed visually.",
          "Define colour tokens for a small business, with measured contrast ratios for every text colour.",
          "Design the states of one component — a form field or a button — including focus, disabled, error and loading.",
          "Design the same page at 360 px, 768 px and 1280 px, and note what you reordered, hid or resized at each width.",
          "Give your tokens to somebody else and ask them to design one new page without help. Record every question they had to ask.",
        ],
        challenge:
          "Produce a complete visual design for a real five-page site: tokens, components with states, mobile and desktop layouts for every page, real content with written microcopy, images within the budget, and the empty, loading and error states. Test it on a real phone over a throttled connection, then hand it to a developer and record — without answering in person — what they could not build unambiguously from it.",
      }),
    ]
  ),

  module(
    "delivery-and-business",
    "02 · Delivery and business",
    "Handing over work developers can build, and running the design work as a business.",
    [
      lesson({
        id: "handover-development-and-seo",
        title: "Handover, development and being found",
        summary:
          "A website design is only finished when it is built and findable. This lesson covers the handover a developer can work from — specifications, tokens, assets, naming, annotations — how to work with developers without designing in code or losing your decisions, and the parts of search visibility and analytics that a designer influences: structure, metadata, page titles, headings, alt text, page speed and measurement.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Designs fail between the design and the build more often than they fail on the page: unlabelled states, images without exports, colours described as \"the blue\", a mobile layout left to imagination. Everything in this lesson is about making your intent survive translation — and then about the half of findability that you, as the designer, control more than the developer does.",
          },
          {
            heading: "Definition: specification, assets, annotation, metadata, measurement",
            kind: "definition",
            body:
              "**A handover package** contains: the design files organised by page and state; an exported asset set (images at the right sizes and formats, icons as SVG, the logo in vector); the tokens (colour values, type sizes, spacing); written notes on behaviour (what happens on hover, what scrolls, what is sticky, what animates and what it should look like when motion is reduced); and the content, final and proofread.\n\n**Annotation** is the words on the design that explain what cannot be seen in a picture: \"this number must be editable by the client\", \"this form must validate the Ghana card format\", \"this image is decorative, alt text not needed\". Annotations prevent a build that is technically correct and functionally wrong.\n\n**Designing for real content** means testing with the longest and shortest plausible text, a missing image, a long business name, a three-line address and a price with six digits. A layout that breaks at the extremes is not finished.\n\n**Search visibility (SEO), the part a designer controls.** The title of each page (unique, 50–60 characters, describing the page and the business), the meta description (150–160 characters, written to earn the click), one `<h1>` per page with the real heading text, headings in a logical order, descriptive link text (\"see our fees\" not \"click here\"), alt text on meaningful images, a clean URL structure, and page speed — where image weight and font choices are the designer's decisions.\n\n**What the designer can also influence for local search**: consistent name, address and phone number everywhere; a Google Business Profile with photographs, hours and a real location; and pages that answer the questions customers actually type (\"how much is…\", \"where is…\", \"is it open on…\"). This is content design, and it is frequently worth more than any technical tweak.\n\n**Measurement.** Every site needs a way to know whether it worked: analytics installed, the goal (enquiry form, click-to-call, WhatsApp tap, order) configured as a conversion, and one number the client will look at monthly. A design that cannot be measured cannot be improved or defended.",
          },
          {
            heading: "Working with developers without losing the design",
            kind: "paragraph",
            body:
              "The relationship works best when both sides are clear about who decides what. The designer owns structure, hierarchy, visual rules and content design; the developer owns implementation details — component structure, performance techniques, accessibility mechanics, edge cases.\n\nRules that prevent most friction:\n\n- **Involve the developer before the design is final.** Twenty minutes of conversation about the platform (a CMS, a static site, an e-commerce platform) will change what should be designed. Designing a custom component on a platform that cannot support it is a wasted week.\n- **Design within the platform's constraints** once the platform is chosen, rather than handing over something that requires rewriting it.\n- **Do not design in code, and do not let the developer design in code.** Both happen when there is no agreed source of truth; keep the design file as that source.\n- **Review on a real device, not in a screenshot.** Proportion, tap targets and legibility only reveal themselves on a phone in daylight.\n- **Keep a shared list of deviations.** Every site ships with differences between design and build. Write down each one and decide together whether to fix or accept it — silently accepting them is how a design quietly degrades.\n- **Prepare assets properly.** Correct sizes, correct formats, sensible names (`hero-open-day-1600.jpg`), compressed. Handing over a 6 MB PNG is a request for the developer to do your export work.\n- **Hand over content, not lorem ipsum.** Placeholder text hides the problems that real text causes.",
          },
          {
            heading: "Worked example: a handover that needed two questions instead of two weeks",
            kind: "example",
            body:
              "A designer hands over a five-page site. The developer's questions, in the two scenarios, show exactly where the value lies in a handover package.\n\n**Handover A (files and a message).** Where is the mobile version? Which of the two blues is the link colour? What happens when the client's name is longer than the mock-up? Is this heading a heading or just big text? What does the form do when the email is invalid? What format should the logo be? Who writes the meta descriptions? Every question costs a day of delays and produces decisions the designer should have made.\n\n**Handover B (package).** The design file has mobile and desktop frames, labelled states and annotations; a tokens file lists every colour with its hex value and use; the asset folder contains named images at the correct sizes and an SVG logo; the content document has all copy, titles and descriptions; the brief states the goal and the conversions to track. The developer asks two questions in total, both about a hosting detail.\n\nThe measurable difference: Handover A took eleven days and two rounds of corrections; Handover B shipped in four. The design's quality is identical in both — only the package changed.",
            code:
              "design/kofi-kitchen-2026/\n  01-design/       home.360.fig · home.768.fig · home.1280.fig · services…\n                   states: form-error · empty-menu · loading\n  02-tokens.txt    brand #14507A · accent #F2A33C · text #1B1B1B …\n                   type 16 base / 20 / 25 / 31 / 39 · space 4·8·16·24·32·48\n  03-assets/       logo.svg · favicon-set/ · hero-open-day-1600.jpg (180 KB)\n                   gallery-1…4-800.jpg (each < 150 KB) · icons/*.svg\n  04-content.md    every page's copy, page title (≤60 chars), meta description\n                   (≤160 chars), alt text for each meaningful image\n  05-notes.md      sticky mobile \"Order\" bar · reduced-motion behaviour\n                   form: validate GH phone format · success and failure copy\n                   \"the menu prices must be editable by the client monthly\"\n  06-brief.pdf     objective, audience, success metric, timeline\n\nDeveloper questions after this package: 2  (both about hosting)\nDeviation log:  3 items, agreed in writing, 1 fixed before launch",
            language: "text",
            codeLabel: "What makes a handover cheap for everybody",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Handing over a picture.** A JPEG or a PDF is not a specification. Design files, tokens, assets, content and notes are.\n- **Designing all pages as one long scroll.** Designers need to specify what appears above the fold on a phone, because that decides whether the visitor continues.\n- **Skipping states.** Error, loading, empty and disabled states are design work and are noticed first when they are missing.\n- **Writing the meta titles last, badly.** They are among the highest-value words on the site: they are what the customer reads in a search result.\n- **Believing SEO is somebody else's job.** Structure, headings, alt text, URLs and image weight — all design decisions — carry most of what is achievable.\n- **Launching without measurement.** If nobody knows how many enquiries came from the site, the next design decision is a guess, and the client has no evidence the work was worth it.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Handover item", "Format", "Detail level", "Common omission"],
              ["Design files", "Figma / XD, page per breakpoint + states", "Labelled, organised, annotations", "Mobile and error states"],
              ["Tokens", "Text or JSON list", "Every colour, size and spacing with its use", "Named colours without values"],
              ["Assets", "SVG, JPEG/WebP, PNG", "Correct sizes and formats, compressed, named", "Logo as a JPEG, 6 MB PNGs"],
              ["Content", "Markdown or document", "Every page's copy, title, description, alt text", "Lorem ipsum, no meta text"],
              ["Behaviour notes", "Short document", "Sticky, hover, animation, reduced motion", "\"You know what I mean\""],
              ["Measurement", "Analytics with conversions", "The one number the client will watch", "Analytics installed, conversions undefined"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A design is finished when a developer can build it from the package without asking you questions, and when a visitor can find it. That means labelled states, tokens, exported assets, real content, written behaviour notes and a defined success metric — plus the findability work a designer genuinely owns: page titles, descriptions, headings, alt text, URLs, image weight and a measurable conversion. Everything in the package costs hours and saves weeks.",
          },
        ],
        keyPoints: [
          "Assemble a handover package a developer can build from without asking questions.",
          "Annotate behaviour, states and client-editable content in the design itself.",
          "Prepare and name assets in the right formats, sizes and weights.",
          "Write page titles, meta descriptions, headings, link text and alt text as part of the design.",
          "Define and instrument the conversion the client will judge the site by.",
        ],
        exercises: [
          "Write the annotations for one screen of your own design: every behaviour, state and constraint that a picture cannot convey.",
          "Export a complete asset set for one page: images at correct sizes and weights, icons as SVG, a logo that scales.",
          "Write titles (≤60 characters) and meta descriptions (≤160) for five pages of a real business site.",
          "Take a site you have designed or built and configure two conversions in analytics. Report what they measure and what they cannot.",
          "Hand a package to a developer and ask them to build one page without asking you anything. Log every question they had.",
        ],
        challenge:
          "Deliver one complete website project from design to launch: the handover package, the built site reviewed on a real phone, the deviation log with each difference agreed or fixed, page titles and descriptions written for every page, analytics with two conversions live, and a launch report showing the before-and-after state of the client's objective. Then measure the goal for four weeks and write the honest result.",
      }),

      lesson({
        id: "clients-pricing-and-portfolio",
        title: "Clients, pricing and a portfolio that gets work",
        summary:
          "The last lesson is the business: how to find clients in Ghana's market, run the first conversation so that the brief emerges, quote a project without losing money, set terms that prevent rework, maintain a site after launch, and build a portfolio that shows outcomes rather than screenshots. It ends with the numbers a freelance designer needs to know about their own practice.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A designer who can produce good work but cannot price it, scope it or explain it will earn less than a mediocre designer who can. The gap is not talent; it is the practices in this lesson, most of which take an hour to set up once and then apply to every project afterwards.",
          },
          {
            heading: "Definition: lead, proposal, scope, maintenance, portfolio",
            kind: "definition",
            body:
              "**A lead** is someone with a problem and a budget, in that order. Sources in the Ghanaian market, roughly by conversion: referrals from past clients and other freelancers; your own visible presence (a portfolio site, a Google Business Profile, active social accounts with real work); local business associations, chambers of commerce and industry WhatsApp groups; walking into businesses that have a bad site or none, with three specific observations and a mock-up of their home page already made; and online marketplaces, which are worth using for early experience but rarely for good rates.\n\n**A proposal** is a short document: what you understood, what you propose, what is included, what the timeline is, what it costs, and what you need from the client. One to two pages, sent after a conversation, with an expiry date. Proposals that are a single price in a WhatsApp message invite negotiation on price alone; proposals that name the outcome and the deliverables invite a decision.\n\n**Scope** is the boundary that protects the project: number of pages, revision rounds, content responsibility, what counts as a new request. Change is normal; unpaid change is what kills projects. A simple line — \"any addition beyond this scope will be quoted separately\" — is enough.\n\n**Maintenance** is the recurring revenue that stabilises freelance income: hosting and domain renewal, backups, security updates, small content edits, an annual review. A monthly or annual retainer, in writing, with a defined response time and a limit on included hours. Many designers undercharge for the initial build to win the client and then earn properly on maintenance — and clients overwhelmingly prefer one person to call.\n\n**A portfolio that gets work** shows outcomes rather than screenshots. For each project: the client and the situation, the problem in the client's words, what you designed and why, the constraints (a small budget, a printer's limits, a slow connection), the result with a number where possible, and a link the reader can visit. Three well-documented projects beat twenty screenshots, and a case study that admits a constraint is more believable than one that does not.",
          },
          {
            heading: "Pricing and the numbers behind it",
            kind: "paragraph",
            body:
              "**Estimate by hours, quote by project.** Break the work into stages, estimate hours per stage, then quote a fixed price that includes the risk. Clients prefer fixed prices because their budgets are fixed, and you prefer them because efficiency pays you, not costs you.\n\n**Know your floor.** Compute it: monthly living costs plus business costs (software, internet and data, electricity, equipment replacement, a portion set aside for tax and for empty months), divided by the realistic billable hours in a month. Billable hours are never forty a week — with admin, marketing, quoting and support, twenty to twenty-five is realistic. That number is your hourly floor, and every quote should be checked against it.\n\n**Price the invisible work.** Discovery, content chasing, exporting assets, handover, launch support and revisions are real hours. Beginners quote only the artwork and then work for half their rate.\n\n**Tiered packages** make decisions easy: a one-page presence, a standard five-page site, and a full site with copywriting and a monthly retainer. Most clients choose the middle one, which is usually the one you wanted to sell.\n\n**Raising prices** is not a confrontation. Tell existing clients in advance (\"my rates change from March\"), keep their current project on the old terms, raise for new clients immediately, and let the numbers decide: if more than about 80% of your quotes are accepted, you are undercharging.\n\n**Get paid.** Deposit before starting, staged payments on larger projects, balance on delivery of files, and invoices numbered and dated. For larger clients, agree a purchase-order or payment process at the start, because a good design delivered to a slow accounts department is still unpaid. Registration and tax obligations are worth a conversation with a professional early rather than at the first large invoice.",
          },
          {
            heading: "Worked example: two quotes for the same job",
            kind: "example",
            body:
              "A restaurant asks for a website. Quote A is the beginner's version, sent as a WhatsApp message; Quote B is a proposal built from the process in this lesson.\n\nQuote A produces a negotiation about the number, a client who keeps adding pages, no deposit, and a designer who spends three weekends on a GH₵400 job and then maintains it for free forever because \"it is only small changes\". The work is not bad; the structure is.\n\nQuote B separates the build from the recurring care, states what is included and excluded, requires a deposit, and prices the content work — which is the part the client cannot do. Note the maintenance line: it is small, recurring, defined, and it is what turns a one-off project into a relationship. It also gives the client permission to call you, which prevents the alternative — unpaid ad-hoc requests for years.\n\nThe two packages differ by about GH₵1,100 up front and GH₵150 a month, and in practice they differ far more in what happens after the invoice: one client disappears, the other refers two more.",
            code:
              "QUOTE A (WhatsApp, one line)\n  \"I can do the website for GH₵400.\"\n  → negotiation on price · no deposit · no page limit · no content plan\n  → free maintenance forever · 3 weekends of work · no referral\n\nQUOTE B (proposal, one page, valid 14 days)\n\n  What you need (from our conversation)\n    A website where customers see the menu, prices, photographs and how to\n    order on WhatsApp. You want it live before the December season.\n\n  Package: Restaurant Site — GH₵1 500\n    • 5 pages: home, menu, about, gallery, contact (mobile-first design)\n    • Photograph direction for 12 dishes (shot list; you take the pictures)\n    • Menu data entry for up to 60 items, editable by your staff\n    • Page titles, descriptions and Google Business Profile setup\n    • WhatsApp order button, click-to-call, map and hours\n    • 2 revision rounds · launch support for 14 days\n    Included: hosting setup, domain connection, analytics with the \"order\" tap\n    tracked as a conversion. Excludes: photography, printing, copywriting\n    beyond editing, extra pages (quoted at GH₵250 each), e-commerce.\n\n  Care plan — GH₵150/month (optional, cancel any time)\n    Hosting and domain managed · weekly backups · security updates\n    · up to 1 hour of content changes a month · response within 2 working days\n    · an annual review with the numbers\n\n  Terms: 50% deposit (GH₵750) to begin · balance on delivery of the live site\n         timeline: 4 weeks from deposit and receipt of photographs\n         anything outside the scope above is quoted separately before it is done",
            language: "text",
            codeLabel: "The same job, two very different businesses",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Quoting before understanding the job.** A price given in the first conversation is either too high (and lost) or too low (and binding). Ask, then write, then quote.\n- **Competing on price.** Somebody will always be cheaper, often using templates. Compete on understanding the objective, delivering on time and being reachable afterwards.\n- **No deposit.** A client who will not pay 50% to start is telling you something important about the end of the project.\n- **Free unlimited maintenance.** It is invisible work with no end date. Even a small monthly retainer changes the relationship and protects your time.\n- **A portfolio of screenshots.** Nobody hires a screenshot. They hire the person who understood a problem and produced a result they can visit.\n- **Ignoring the paperwork.** Invoices, terms and records protect you, and they are what let you raise your rate later with evidence of scale.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Activity", "Frequency", "Time cost", "What it prevents"],
              ["First conversation (questions, not pitch)", "Per lead", "30–45 minutes", "Quoting the wrong job"],
              ["One-page proposal with terms", "Per project", "1–1.5 hours", "Scope disputes, price-only negotiation"],
              ["Content and asset checklist", "Per project", "1 hour", "The project stalling on missing text and photos"],
              ["Deviation and revision log", "Weekly during a build", "15 minutes", "Unpaid rework, \"that was not agreed\""],
              ["Maintenance retainer", "Monthly", "0.5–2 hours", "Free ad-hoc support and unstable income"],
              ["Case study write-up", "After each launch", "1–2 hours", "A portfolio that cannot win the next project"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Design business practice is simple and rarely followed: meet the client and ask questions before quoting, send a one-page proposal with deliverables, exclusions, price and terms, take a deposit, track revisions and content in writing, deliver on final payment, and sell a small monthly care plan that pays for itself in stability. Then write up each project as an outcome a stranger can understand, because three documented results will win more work than any number of pictures.",
          },
        ],
        keyPoints: [
          "Describe the lead sources that work in a local market and what each is worth.",
          "Write a one-page proposal with deliverables, exclusions, timeline, price and terms.",
          "Compute your hourly floor from living and business costs and realistic billable hours.",
          "Price discovery, content work, exports, handover and revisions rather than only artwork.",
          "Package maintenance as a defined retainer and write case studies that state outcomes.",
        ],
        exercises: [
          "Compute your hourly floor: monthly costs plus a tax and empty-month allowance, divided by realistic billable hours. Compare it against a price you have charged before.",
          "Write a one-page proposal for a fictional small business, including deliverables, exclusions, revisions, timeline and payment terms.",
          "List five lead sources available to you this month and the specific action you would take for each.",
          "Take one project you have completed and write it as a case study with the situation, the problem, the constraints, what you did, and the result in numbers where possible.",
          "Draft your terms paragraph: deposit, revisions, content responsibility, what counts as a change, and the licence.",
        ],
        challenge:
          "Run one complete cycle on a real opportunity: find a local business with a weak or missing website, prepare three specific observations and a mock-up of its home page before contacting them, hold the first conversation without pitching, and send a one-page proposal with a care plan attached. Then write a half-page review: what the conversation taught you that your assumptions had wrong, and which clause of your proposal you will change next time.",
      }),
    ]
  ),
];
