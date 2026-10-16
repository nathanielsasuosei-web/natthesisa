import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Human-Computer Interaction — designing interfaces for people who are busy,
 * distracted, on a low-end phone, in bright sunlight, paying for data.
 *
 * The course treats usability as engineering, not taste: heuristics that
 * predict problems, accessibility as a requirement rather than a courtesy,
 * mobile-first and low-bandwidth design for real Ghanaian conditions, and
 * usability testing with five people that finds most of what is wrong.
 */

export const HUMAN_COMPUTER_INTERACTION_MODULES: CourseModule[] = [
  module(
    "designing-for-people",
    "01 · Designing for people",
    "How people actually use interfaces, and the principles that follow from it.",
    [
      lesson({
        id: "how-people-use-interfaces",
        title: "How people actually use interfaces",
        summary:
          "People do not read interfaces; they scan them, guess, and use the first thing that looks right. This lesson covers the human side of HCI — perception, memory, attention and error — plus Norman's principles of discoverability, feedback, constraints and mental models, and the difference between a usable product and a usable product under pressure: on a shared phone, in a noisy market, with intermittent data.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Most usability problems are not caused by stupid users or lazy designers. They are caused by interfaces that assume attention, memory and patience that nobody has. A person using a mobile-money form at a market stall has one hand free, sunlight on the screen, and a queue behind them. Designing for that person produces an interface that is also easier for everybody else.",
          },
          {
            heading: "Definition: HCI, usability and the human limits",
            kind: "definition",
            body:
              "**Human-computer interaction (HCI)** is the study of how people use interactive systems, and the practice of designing those systems around human capabilities and limits. It draws on psychology, ergonomics and computer science, and it is evaluated by observing people rather than by opinion.\n\n**Usability** has five components, each measurable:\n\n1. **Effectiveness** — can the user complete the task at all?\n2. **Efficiency** — how much time and effort does it take?\n3. **Learnability** — how quickly can somebody do it the second time?\n4. **Memorability** — can they do it again after a week away?\n5. **Error rate and recovery** — how often do they err, and how easily do they get back on track?\n\nThe human limits that matter most:\n\n- **Working memory holds about four items at once.** Anything the interface asks the user to remember between screens is a defect. Show it, or carry it forward automatically.\n- **Attention is scarce and interruptible.** Users scan for the one thing they need, in an F-pattern, in a few seconds.\n- **Perception is relative.** Colour, size and position are judged against surroundings: a button that looks big on a laptop is small on a phone; contrast that seems fine indoors fails in sunlight.\n- **Errors are normal.** Slips (right intention, wrong action) and mistakes (wrong intention) are designed for, not punished. Confirmation dialogs are usually a poor defence; good defaults, undo and reversible actions work better.",
          },
          {
            heading: "Norman's principles, in plain language",
            kind: "paragraph",
            body:
              "**Affordances and signifiers.** A thing should look like what it does. A button that looks like a label, or a link that looks like plain text, is a defect the user pays for.\n\n**Visibility and discoverability.** If the user cannot see that an action exists, it does not exist. Menus that hide everything to look clean make the product feel empty rather than simple.\n\n**Feedback.** Every action deserves a response within about 100 milliseconds, or the user will repeat it. For anything slower than a second, show progress; for anything slower than ten seconds, allow the user to do something else and keep the work.\n\n**Constraints and prevention.** Grey out what cannot be done, disable the checkout button until the form is valid, restrict the date picker to future dates. Preventing an error is better than reporting one.\n\n**Mental models and metaphors.** Users bring expectations: a shopping cart, a bin, a folder. Honour them. When the system must differ, teach the difference instead of surprising people.\n\n**Mapping and consistency.** Controls should sit where their effects appear, and the same word should mean the same thing everywhere. If \"Course\" on one screen is \"Program\" on the next, users will conclude they are different things — because that is what the interface told them.\n\n**Recognition over recall.** Show choices rather than asking people to remember them. A dropdown of existing classes beats a text field where people type the class name three different ways.\n\n**Error messages that help.** Say what happened, why, and what to do next, in the user's language, next to the field that caused it — never a code, never a colour alone.",
          },
          {
            heading: "Worked example: a registration form under real conditions",
            kind: "example",
            body:
              "Consider a form used to register students for a short course. Version one asks for eleven fields, requires a username and password, and validates everything at submit. In an office on a laptop, it works and looks fine.\n\nNow observe it being used where it will actually be used: a desk with a queue, a mid-range Android phone, a 3G connection, and a parent registering a child. Three problems appear immediately, and none of them are about visual taste.\n\nFirst: the phone keyboard for the date field opens an alphanumeric keyboard, so every date is typed by switching layouts — thousands of needless taps. Second: the password rules are invisible until submission, so the user discovers them by failing. Third: nothing is saved between attempts, so after the fourth validation error the user starts again from the top, on a connection that drops.\n\nThe repair is a set of small, measurable changes: the correct keyboard type per field (`inputmode=\"numeric\"` for a phone number, a date picker for the date), inline validation as the field loses focus, one clear error per field in plain language, a single primary action, optional fields postponed to a second screen, and autosave on every field so a dropped connection costs nothing.\n\nMeasured again, the same task takes 90 seconds instead of four minutes, and the completion rate rises from 58% to 86% — the kind of number a form either earns or does not.",
            code:
              "BEFORE (11 fields, validation on submit)\n  ✗ Keyboard switching for dates and phone numbers\n  ✗ Password rules hidden until the form is submitted\n  ✗ All errors at once, at the top, with a code\n  ✗ Nothing saved; a dropped connection restarts the form\n  ✗ Two equally weighted buttons: \"Submit\" and \"Cancel\"\n\nAFTER (same job, fewer decisions)\n  ✓ <input inputmode=\"numeric\" autocomplete=\"tel\"> for phone\n  ✓ <input type=\"date\"> so the platform date picker appears\n  ✓ Inline rules shown before typing (\"8 characters, one number\")\n  ✓ One error per field, under that field, in plain words\n  ✓ Autosave per field; \"Saved 2 seconds ago\" as visible feedback\n  ✓ One primary button; \"Cancel\" demoted to a text link\n  ✓ Offline queue: submit later if the connection drops\n\nResult: 4 min → 90 s median completion, 58% → 86% completion rate",
            language: "text",
            codeLabel: "Same task, same office, different outcome",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Assuming the designer's device is the user's device.** A layout that is comfortable on a 15-inch laptop with fibre is a different product on a 5-inch screen on 3G. Test where people are.\n- **\"Users do not read.\"** They read what is relevant and scannable. Removing all text makes interfaces ambiguous; writing short, specific sentences works.\n- **Confirm dialogs as an error strategy.** People click through them. Prevention and undo are better in nearly every case.\n- **Red as the only error signal.** Colour-blind users, sunlight and cheap screens all defeat it. Pair colour with text or an icon.\n- **Placeholder text as a label.** It vanishes as soon as typing starts, breaking the form for anyone who is interrupted — which is everyone.\n- **Measuring taste instead of behaviour.** \"I like this design\" is not evidence. Time on task, error rate and completion rate are.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Human limit", "What it means", "Design response", "Test that proves it"],
              ["Working memory ~4 items", "Users cannot hold context between screens", "Carry values forward; summarise before confirming", "Ask users what they expect to see next"],
              ["Attention spikes and fades", "Scanning, not reading", "Hierarchy, one primary action, short labels", "Five-second test: what is this page for?"],
              ["Novelty costs learning", "New patterns are slow patterns", "Reuse platform conventions", "Watch first-time users find the main action"],
              ["Errors are inevitable", "Mistakes and slips happen", "Prevent, undo, recover with the work intact", "Count errors per task across five users"],
              ["Diverse abilities and contexts", "Glare, one hand, small screens, accessibility needs", "Contrast, large targets, responsive layout, keyboard support", "Keyboard-only and 200% zoom passes"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "People scan, guess and err, and interfaces that respect those facts are measurably better: faster, fewer errors, more completions. Usability decomposes into effectiveness, efficiency, learnability, memorability and error behaviour — all observable. The principles that produce it (affordance, feedback, constraints, consistency, recognition, human error messages) are old and unglamorous, and they are what a designer returns to when a screen is not working.",
          },
        ],
        keyPoints: [
          "Define usability through its five measurable components.",
          "Explain how working memory, attention and perception limits shape interface decisions.",
          "Apply Norman's principles — affordance, feedback, constraints, mapping, recognition — to a real screen.",
          "Design error prevention and recovery that does not rely on confirmation dialogs.",
          "Describe how context (device, connection, environment) changes usability requirements.",
        ],
        exercises: [
          "Take a form you use regularly and count the fields, the clicks to complete it, and the errors you make. Redesign it with at least four of the principles from this lesson.",
          "Watch somebody complete a task on your own project without helping them. Record every hesitation, misclick and question in order.",
          "Rewrite three error messages from systems you use into the three-part form: what happened, why, what to do next.",
          "Audit one screen for colour-only signals, placeholder labels and feedback delays. List the accessibility failures you find.",
          "Pick an interface you find frustrating and name the specific principle it violates (not \"it is bad\"), then describe the smallest fix.",
        ],
        challenge:
          "Redesign one real form or flow end to end: sketch the before and after, name the principle behind each change, then test both versions with five people who did not see the design before. Report completion rate, time on task and the errors they made, and fix the worst problem your test exposed rather than the one you expected.",
      }),

      lesson({
        id: "interaction-design-process",
        title: "The interaction design process",
        summary:
          "Good interfaces come from a process, not a flash of inspiration: understand the people and the task, design alternatives, prototype at the cheapest fidelity that answers the question, evaluate with real users, and iterate. This lesson covers user research methods that work with small budgets, personas and task flows as design tools rather than decoration, the levels of prototyping from paper to working code, and how to run a usability test with five people that finds the majority of serious problems.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The most expensive usability mistake is discovering a problem in code that a paper sketch would have exposed in ten minutes. Every method in this lesson exists to move learning earlier, where it is cheap: talk to six people, sketch three alternatives, test the sketch, throw it away if it fails.",
          },
          {
            heading: "Definition: research, personas, task flows, prototypes, evaluation",
            kind: "definition",
            body:
              "**User research** is finding out what people actually do: interviews about behaviour rather than opinions, observation in context, and data from the system. The key discipline is asking about the past (\"the last time you registered, what did you do?\") rather than the future (\"would you use this?\"), because people's predictions about their own behaviour are unreliable.\n\n**A persona** is a one-page summary of a real recurring user type: their goal, context, device, constraints and the words they use. It earns its place only when it changes a decision (\"would Ama, registering on the shared phone, be able to do this?\"). Personas invented to decorate a slide deck are worse than none.\n\n**A task flow** is the sequence of steps a user takes towards a goal, including the screens, the decisions and the failure branches. Drawing it before designing screens exposes missing steps: what happens when the payment fails, when the student has no email address, when they come back after two weeks.\n\n**Prototypes** come in levels of fidelity:\n\n- **Paper sketches** — minutes to make, test core flow and wording, throw away freely.\n- **Wireframes** — structure, hierarchy and navigation, no visual design.\n- **Interactive prototypes** — clickable screens that behave like the product for the main paths.\n- **High-fidelity designs** — real type, colour and imagery; useful for communication, dangerous for early exploration because people react to beauty rather than flow.\n- **Working code** — the only prototype that tells the truth about performance on a real phone.\n\n**Evaluation** is observing people using the design and recording what happens. There are two flavours: **formative** (finding problems, during design, with 5–8 people) and **summative** (measuring performance, after, with many more). This course insists on the first, because it is cheap and it works.",
          },
          {
            heading: "Usability testing with five people",
            kind: "paragraph",
            body:
              "The arithmetic: most severe problems appear in the first five participants, because the same three or four obstacles block nearly everyone. Five users per round, three rounds during a project, finds far more than one round of fifteen.\n\nA test is a small script and a lot of silence:\n\n1. **Give the participant a task, not instructions.** \"You want to register your sister for the September class. Show me how you would do it.\" Never \"click the green button\".\n2. **Ask them to think aloud.** Their narration is the evidence.\n3. **Do not help.** The moment you explain, you have hidden the problem. When they are truly stuck, ask what they expected to happen.\n4. **Record what they do, not what they say.** Where they tap, where they hesitate, what they re-read.\n5. **Finish with a few questions** about confidence and about the parts they skipped.\n\nThen **classify and prioritise**: a problem that stops the task is severe; one that costs time is moderate; one that merely annoys is cosmetic. Fix severity first, and ignore nobody's problem because \"they were not the target user\" — unless they genuinely were not.",
          },
          {
            heading: "Worked example: one afternoon, three rounds, one big finding",
            kind: "example",
            body:
              "A learning platform wants to add a certificate download. The team has one afternoon and no budget.\n\n**Round 1 — paper (20 minutes per person, 5 people).** Five screens drawn in a notebook. Three of the five participants looked for the certificate on the profile page, not the dashboard, because that is where they had seen the completion percentage. The flow is rearranged before a single pixel is designed.\n\n**Round 2 — clickable prototype (10 minutes per person, 5 people).** The button says \"Download your certificate\". Two participants hesitate: they are not sure the certificate is *theirs* yet, because the button appears while one lesson is still incomplete. The wording changes to \"Certificate — finish lesson 7 to unlock\", and the hesitation disappears.\n\n**Round 3 — working code on the participants' own phones.** Two people on 3G wait eleven seconds with no feedback and tap again, producing two downloads. A progress indicator and a disabled state fix it.\n\nTotal cost: one afternoon, five participants per round, zero licences. Total value: the primary navigation for the feature changed, the wording changed, and a slow-network failure that would have generated support tickets never shipped.",
            code:
              "# A usability test session, in ten lines\nGoal:      find whether the certificate flow is discoverable and completable\nParticipant: parent, 38, mid-range Android, has registered once before\n\n1. \"You have finished the IT Essentials course. Show me how you would\n    get proof of that to send to an employer.\"\n2. [participant opens dashboard, scans, taps profile, taps back]\n3. \"Keep going, take your time.\"          ← silence; no help\n4. [taps Courses → IT Essentials → sees \"Certificate locked\" — frowns]\n5. \"What did you expect to find there?\"\n   → \"Something telling me what is left. It just says locked.\"\n\nFindings:  severe  — the certificate has no route from the profile page\n           major   — \"locked\" states give no next action\n           minor   — the badge needs a text label, not only a colour\nRound:     5 participants, 3 found the same missing route → fix before design",
            language: "text",
            codeLabel: "Five participants, one hour, three real findings",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Asking whether people like it.** Liking is not usability. Ask them to do the task and watch.\n- **Testing with colleagues.** They know the product, the vocabulary and the flows. Test with somebody who has never seen it.\n- **Explaining during the test.** The explanation is the bug report: whatever you had to say should have been on the screen.\n- **Designing for the average user.** Averages hide the extremes, and the extremes — low bandwidth, older age, assistive technology, shared device — are where products fail hardest.\n- **Treating the process as a phase.** Design is iterative: research, sketch, test, revise. One pass of each produces a plausible-looking product with the same old problems.\n- **Confusing sample size with validity in formative testing.** Five people will not measure your conversion rate; they will find your broken flows, which is what you asked them for.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Method", "Cost", "Answers", "Best used"],
              ["Interview (6–8 people)", "Low", "Why do people do it this way?", "Before designing, to frame the problem"],
              ["Contextual observation", "Medium", "What actually happens at the desk or market?", "When the environment is part of the problem"],
              ["Task flow diagram", "Low", "Are all the steps and branches covered?", "Before wireframes"],
              ["Paper prototype test", "Very low", "Is the flow and wording right?", "Earliest possible design stage"],
              ["Clickable prototype test", "Low–medium", "Do people find and understand the controls?", "Before building the interface"],
              ["Analytics and recordings", "Low", "What happens in production, at scale?", "After launch, to prioritise fixes"],
              ["Summative benchmark test", "High", "How usable is it, compared with a target?", "Before commitments and releases"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Interaction design is a loop: understand the people and the task, sketch several alternatives, prototype at the cheapest level that can answer your question, watch five people use it, fix the worst problems, and repeat. Personas and task flows are tools for making decisions, not deliverables. The cost of the loop is an afternoon; the cost of skipping it is a rebuild after launch, which is the most expensive usability lesson there is.",
          },
        ],
        keyPoints: [
          "Ask about past behaviour rather than future intentions, and give an example of each.",
          "Build a persona and a task flow that actually change a design decision.",
          "Choose a prototype fidelity appropriate to the question being asked.",
          "Run a usability test with five participants: task-based, silent, recorded in findings.",
          "Prioritise findings by severity and iterate rather than defending the design.",
        ],
        exercises: [
          "Interview three people who use a service you are designing for. Ask about the last time they did the task, and record their exact words.",
          "Draw the task flow for a sign-up process, including the failure branches: invalid details, no internet, returning after a week.",
          "Sketch three paper alternatives for one screen, test each on one person, and report which parts survived.",
          "Run a five-person test of anything you have built. Classify the findings as severe, major or minor and fix the severe ones.",
          "Turn three support questions or complaints you know about into test tasks for the next round of research.",
        ],
        challenge:
          "Run a full formative round on a real project: three interviews or observations, one persona, one task flow, a paper or clickable prototype, five test participants, and a written findings list with severities and the change you made for each. Include the finding that surprised you, and what you had believed before the test.",
      }),
    ]
  ),

  module(
    "accessible-and-mobile",
    "02 · Accessible and mobile interfaces",
    "Designing for every person, every device and a real network.",
    [
      lesson({
        id: "accessibility-as-engineering",
        title: "Accessibility as engineering",
        summary:
          "Accessibility is not a feature for a minority; it is what happens when an interface works for people with different sight, hearing, movement, cognition and devices — including the many people using a cheap phone in bright light with one hand. This lesson covers the four WCAG principles, contrast and target sizes as arithmetic, keyboard and screen-reader support, forms and error handling, and how to test on a budget without ever claiming compliance you have not verified.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The accessibility argument usually made is legal or ethical, and both are true. The engineering argument is stronger: the same changes that make an interface usable with a screen reader make it usable in sunlight, with a cracked screen, with one hand, or by somebody who is simply tired. Accessibility work is usability work with a longer list of tested conditions, and it is measurable.",
          },
          {
            heading: "Definition: the four principles and the standards",
            kind: "definition",
            body:
              "The **Web Content Accessibility Guidelines (WCAG)** organise accessibility into four principles, remembered as **POUR**:\n\n1. **Perceivable** — information must be available to more than one sense: text alternatives for images, captions for video, contrast for text, and no meaning carried by colour alone.\n2. **Operable** — everything must work by keyboard, with enough time, without content that flashes, and with navigation that can be skipped. Touch targets must be large enough to hit.\n3. **Understandable** — readable language, predictable behaviour, and clear feedback on errors.\n4. **Robust** — works with the assistive technologies people actually use, which in practice means writing correct, semantic HTML.\n\nThe levels are **A**, **AA** and **AAA**. AA is the usual target and the one referenced by most legislation and procurement requirements; AAA is aspirational for whole sites, though individual AA criteria can be exceeded where it matters. Two numbers worth knowing by heart: **contrast ratio 4.5:1** for normal text (3:1 for large text and for interface components), and **24×24 CSS pixels** as the minimum target size in WCAG 2.2, with 44×44 recommended by platform guidance and much more comfortable on a phone.",
          },
          {
            heading: "The failures you will make, and their fixes",
            kind: "paragraph",
            body:
              "**Meaning carried by colour only.** A red dot for an overdue fee means nothing to a colour-blind user and nothing in a printed screenshot. Add text or an icon.\n\n**Placeholder-only labels.** They vanish on typing and are often invisible to screen readers. Use a real `<label>` bound to the field.\n\n**Divs pretending to be buttons.** `<div onclick>` is unreachable by keyboard, announces nothing, and cannot be activated by Enter or Space. Use `<button>`. This single habit fixes a large share of keyboard problems.\n\n**Images that say nothing and everything.** `alt=\"image\"` is noise; a chart needs a summary of its trend, a decorative flourish needs `alt=\"\"` so it can be skipped.\n\n**Focus thrown away.** Opening a dialog and not moving focus into it strands keyboard users behind the overlay. Move focus in, trap it while open, and return it on close.\n\n**Error messages at the top of a long form.** Put the message next to the field, associate it with `aria-describedby`, and move focus to the first error.\n\n**Motion that cannot be stopped.** Vestibular disorders are real: respect `prefers-reduced-motion`, and never autoplay video with sound.\n\n**Zoom that breaks the layout.** Text must be resizable to 200% without loss of content. If a fixed-width container breaks, that is a bug, not user error.",
          },
          {
            heading: "Worked example: auditing one screen",
            kind: "example",
            body:
              "Take a course card with an image, a title, a progress bar, a price and a button. In fifteen minutes, without any paid tools:\n\n**Keyboard pass.** Press Tab repeatedly and note where focus goes and whether it is visible. The card's image is a link with no visible focus ring; the progress bar announces nothing; the button is a link styled as a button and works.\n\n**Screen-reader pass.** With a phone's built-in screen reader, the card announces \"link, image, 68%, Buy now\". A sighted user reads \"Web Foundations, 68% complete, GH₵300\". The fix is a text alternative on the image (`alt=\"Web Foundations course cover\"`), an `aria-label` on the progress bar (\"68% complete\"), and a native `<button>` with a descriptive label.\n\n**Contrast pass.** The grey subtext on the light card measures 3.1:1 — below AA for body text, and only passable for large text. Darkening it to 4.6:1 fixes it without changing the design's character.\n\n**Zoom pass.** At 200% the price and the button overlap, because the card has a fixed height. Switching to a min-height and letting the content flow fixes it.\n\nFour fixes, none of which changed the visual design meaningfully, and the card is now usable by somebody who never uses a mouse, cannot see the difference between the greys, or reads with a screen reader. That is what accessibility work looks like in practice: unglamorous, specific and quick.",
            code:
              "<!-- Before -->\n<div class=\"card\" onclick=\"open()\">\n  <img src=\"cover.jpg\">\n  <h3>Web Foundations</h3>\n  <div class=\"bar\"><div style=\"width:68%\"></div></div>\n  <span class=\"price muted\">GH₵300</span>\n  <a href=\"#\" class=\"btn\">Buy</a>\n</div>\n\n<!-- After -->\n<article class=\"card\">\n  <img src=\"cover.jpg\" alt=\"Web Foundations course cover\">\n  <h3><a href=\"/courses/web-foundations\">Web Foundations</a></h3>\n  <div class=\"bar\" role=\"progressbar\" aria-valuenow=\"68\" aria-valuemin=\"0\"\n       aria-valuemax=\"100\" aria-label=\"Course progress\"></div>\n  <p class=\"progress-text\">68% complete</p>          <!-- number, not just a bar -->\n  <p class=\"price\">GH₵300 <span class=\"muted\">(4.6:1 contrast)</span></p>\n  <button type=\"button\">Buy Web Foundations for GH₵300</button>\n</article>\n\n<!-- Also: focus-visible ring, prefers-reduced-motion honoured,\n     card height flexible so 200% zoom does not overlap. -->",
            language: "html",
            codeLabel: "Same look, four real fixes",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"Accessibility is for a small group.\"** Vision, hearing, movement and cognition vary for everyone with age, injury, glare, noise or fatigue. Add assistive technology, small screens and old phones and the population is most of your users some of the time.\n- **\"An automated scan means we are compliant.\"** Scanners catch maybe a third of issues, mostly contrast and missing attributes. They cannot tell whether an alt text is *useful* or a flow is comprehensible.\n- **Overlays that claim to fix everything.** A widget cannot repair unsemantic HTML. Real fixes live in the markup.\n- **`aria-` everywhere.** The first rule of ARIA is not to use ARIA when a native element already does the job. A `<button>` needs no role; a `<div role=\"button\">` needs six attributes and will still be worse.\n- **Assuming a screen reader reads your visual order.** It reads the DOM order. CSS that visually reorders content creates a mismatch that is invisible to sighted reviewers and disorienting to everyone else.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Requirement", "Number or rule", "How to verify cheaply", "Common failure"],
              ["Text contrast", "≥ 4.5:1 (3:1 for large text)", "A colour-contrast checker on real colours", "Light grey text on white cards"],
              ["Large text", "≥ 24px, or 18.66px bold", "Measure it, do not guess", "Believing 16px bold is \"large\""],
              ["Touch target", "≥ 24×24 CSS px (44×44 recommended)", "Measure in developer tools", "Small icon-only buttons in dense lists"],
              ["Keyboard access", "Everything, in a visible order", "Tab through with the mouse unplugged", "Custom widgets, hidden focus, modals"],
              ["Text resize", "200% with no loss", "Browser zoom, then inspect", "Fixed heights, overlapping content"],
              ["Captions", "All video with speech", "Watch it muted", "\"It is obvious what they are saying\""],
              ["Form labels", "Programmatically associated", "Screen reader, or check the `for`/`id`", "Placeholder-only, `aria-label` instead of a visible label"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Accessible design means perceivable, operable, understandable and robust, and it is verified by testing rather than asserted: contrast measured, keyboard walked, screen reader listened to, zoom applied, motion reduced. Almost every fix is small and specific — a real button, a bound label, a text alternative, a focus ring — and the ones that matter most are exactly the ones that help a person on a cheap phone in bright sunlight. The same session that makes your product usable with a screen reader makes it usable by everybody else.",
          },
        ],
        keyPoints: [
          "Explain the four POUR principles with an example of a failure under each.",
          "Apply the contrast ratio and target size numbers to real interface colours and controls.",
          "Replace unsemantic markup with elements that work with keyboard and screen readers.",
          "Handle focus, error messages and motion without stranding users.",
          "Verify accessibility with cheap tests — keyboard, screen reader, zoom, contrast — rather than assuming.",
        ],
        exercises: [
          "Complete a keyboard-only pass of a site you use: tab through every page and record where focus is invisible or unreachable.",
          "Measure the contrast of five text elements on one of your screens and fix every pair below 4.5:1. Record the before and after ratios.",
          "Turn a `<div>`-based interactive control into a proper button and confirm it works with Enter, Space and a screen reader.",
          "Add captions or a transcript to a short video you own, then watch it muted and check the meaning survives.",
          "Zoom a page you have built to 200% and list every element that clips, overlaps or disappears. Fix one and re-test.",
        ],
        challenge:
          "Take one real screen of your own and produce an accessibility report: a keyboard pass with screenshots of focus states, a screen-reader transcript of the page, contrast measurements for every text element, a 200% zoom check, and a list of fixes with severity. Apply the fixes, then repeat the two passes and report what each change improved — and note honestly what remains unfixed and why.",
      }),

      lesson({
        id: "mobile-first-and-low-bandwidth-design",
        title: "Mobile-first and low-bandwidth design",
        summary:
          "Designing mobile-first is not a smaller version of desktop design; it is starting from the hardest conditions: a small screen, a thumb, one hand, an intermittent connection and a data budget the user is paying for. This lesson covers touch ergonomics and layout, responsive and adaptive design, progressive disclosure, offline behaviour and data-cost-awareness as design constraints — the conditions that describe most of the audience for anything built in or for Ghana.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "In Ghana the first screen is a phone, usually mid-range Android, often shared, frequently on a prepaid data bundle that a user is consciously spending. A page that loads 6 MB to show a paragraph costs the user real money and slows down on the network they actually have. Treating those constraints as the starting point produces products that are faster for everyone, including people on fibre.",
          },
          {
            heading: "Definition: mobile-first, responsive, adaptive, progressive enhancement",
            kind: "definition",
            body:
              "**Mobile-first** means designing and building the narrow layout first — one column, one primary action, the most important content visible without scrolling — then adding complexity as space allows. The alternative (design wide, then squash) produces interfaces with a dense desktop feature set crammed onto phones.\n\n**Responsive design** uses fluid layout, flexible units and media queries so one document adapts to the space available. **Adaptive design** serves different layouts or content for different device classes. Responsive is the default because it survives unknown screen sizes; adaptive has a place when the *content* should differ, not just the layout.\n\n**Progressive enhancement** builds a baseline that works everywhere — semantic HTML, a form that submits without JavaScript — then adds interactivity where available. It is the opposite of requiring a modern browser to read a paragraph.\n\n**Touch ergonomics.** Thumbs: the natural reachable area is the bottom third and the sides; corners at the top right require a hand shift. Targets should be at least 44×44 CSS pixels with 8 pixels of separation, and destructive actions should not sit within an accidental tap of frequent ones. Avoid hover-only affordances: there is no hover on a phone.\n\n**Progressive disclosure** shows what is needed now and reveals the rest on request: an accordion for a long curriculum, a second step for optional details, a \"more\" link for full terms. On a small screen, hiding the optional is a gift, not a compromise.",
          },
          {
            heading: "Designing for the network the user actually has",
            kind: "paragraph",
            body:
              "Data and time are the two costs users notice most, and both are design decisions.\n\n**Budget the page.** A target worth stating: first meaningful content under 100 KB of critical HTML and CSS, total page under 500 KB where possible, images under 100 KB each. Measure it on a real device through a throttled connection, not on a laptop on Wi-Fi.\n\n**Images are the usual culprit.** Serve modern formats (WebP, AVIF) with a `<picture>` fallback, size them to the container, never send a 3000-pixel photograph to a 400-pixel slot, use `loading=\"lazy\"` for anything below the fold, and always set width and height so the layout does not jump. A single uncompressed hero image can outweigh the entire rest of the application.\n\n**Fonts.** Self-host, subset to the characters used, and load two weights at most — or use a system font stack and pay nothing. Web fonts are frequently the second-largest asset on a page.\n\n**Scripts and third parties.** Every analytics snippet, chat widget and font CDN is more requests, more bytes and more failure points. Audit them: if a widget costs 200 KB for a feature used by 1% of users, load it on interaction instead of on page load.\n\n**Show the cost.** A \"Save data\" mode that loads text-first and images on request is a genuine feature for a prepaid audience, and it can be as simple as a user preference and a lighter template.\n\n**Offline and flaky connections.** On a 3G connection, requests fail one time in twenty. Design for it: optimistic UI where safe, a queue that retries on reconnect, a visible \"not sent yet\" state, and a service worker cache for the shell. A form that loses a user's input on a dropped connection is a form that will lose the user.\n\n**Time-to-interaction.** Perceived speed is latency management: respond to the tap within 100 ms with a pressed state, show skeletons instead of spinners where the structure is known, and never block typing on a network request.",
          },
          {
            heading: "Worked example: the same page, before and after a data budget",
            kind: "example",
            body:
              "A course page loads on a mid-range Android phone over 3G. Before: 6.2 MB, 9.4 seconds to interactive, 61 requests — of which four are third-party scripts and one is an unoptimised hero image of 2.8 MB. On a 1 GB monthly bundle, opening three such pages costs about 18 MB, roughly 2% of the user's month.\n\nThe repair does not require redesigning anything. Convert the hero to AVIF/WebP at the size it is displayed (2.8 MB → 92 KB), lazy-load the eight curriculum thumbnails, subset the two web fonts to Latin plus the accented characters used and self-host them (310 KB → 78 KB), replace the chat widget with a button that loads the widget on tap (220 KB deferred), and inline the critical CSS while deferring the rest.\n\nThe result is 780 KB and 2.1 seconds to interactive on the same connection — a 7.9× reduction in bytes and a 4.5× improvement in time. Nothing was removed from the page; only the order and the size of what is sent changed. And the same page on a laptop with fibre now feels instant, which is the point: optimising for the worst connection improves every connection.",
            code:
              "BEFORE  (mid-range Android, 3G, cold cache)\n  Transfer   6.2 MB in 61 requests\n  Interactive 9.4 s\n  Contents   hero.jpg 2 810 KB · 8 thumbnails 1.1 MB · fonts 310 KB\n             analytics 90 KB · chat widget 220 KB · JS bundle 640 KB\n  Data cost  ≈ 18 MB for three page views on a 1 GB bundle\n\nAFTER   (same device, same network, same design)\n  Transfer   780 KB in 24 requests\n  Interactive 2.1 s\n  Changes    hero → AVIF at display size        2 810 KB → 92 KB\n             thumbnails loading=\"lazy\" + sized    1.1 MB → 180 KB\n             two fonts, subset and self-hosted     310 KB → 78 KB\n             chat widget loaded on first tap      deferred 220 KB\n             critical CSS inlined, rest deferred  −140 KB blocking\n  Data cost  ≈ 2.3 MB for three page views\n\nRules that produced it:\n  • no image larger than 100 KB, ever\n  • nothing below the fold loaded until it is needed\n  • third-party scripts require an argument to exist\n  • measure on a real phone through a throttled connection",
            language: "text",
            codeLabel: "Same page, 8× fewer bytes, 4.5× faster",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Designing on a desktop and \"making it responsive\" later.** The narrow layout exposes what the hierarchy should be; discovering that after the design is locked usually means the important action sits below the fold on a phone.\n- **Hiding everything to look simple.** Progressive disclosure reveals on request; hiding without a visible route is an unfinished interface.\n- **Testing on a flagship phone on Wi-Fi.** The conditions that matter are a mid-range Android, a throttled connection and a cold cache — reproduce them deliberately.\n- **Ignoring the data bill.** Users on prepaid bundles notice megabytes. A product that is expensive to open is a product that gets opened less.\n- **Assuming offline is only for rural areas.** Lifts, basements, crowded events, tunnels and 3G handovers all disconnect a user mid-task.\n- **Hover, right-click and keyboard-only patterns.** None of them exist on a touch device; if the flow requires them, the flow is incomplete.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Constraint", "Target", "Technique", "How to verify"],
              ["Bytes", "Critical path < 100 KB, page < 500 KB", "Modern image formats, lazy loading, deferring third parties", "DevTools network panel, throttled, cold cache"],
              ["Time to interactive", "< 3 s on 3G", "Inline critical CSS, defer scripts, skeletons", "Same test on a real mid-range device"],
              ["Touch targets", "≥ 44×44 px, 8 px apart", "Full-row hits, adequate padding, spaced destructive actions", "Measure in the browser at phone width"],
              ["One-handed reach", "Primary actions in the bottom third", "Sticky action bar, bottom navigation", "Hold a phone and try to reach the top-right corner"],
              ["Flaky connections", "No lost work", "Retry queues, optimistic UI with visible state, autosave", "Throttle to \"slow 3G\" and toggle offline mid-form"],
              ["Data awareness", "User-visible choice", "\"Save data\" mode, image-on-request, size hints", "Ask a prepaid user what they noticed"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Mobile-first and low-bandwidth design is not about a smaller screen; it is about designing for the harshest real conditions: one hand, a small viewport, a metered connection that occasionally fails. Budget the bytes, respect the thumb, reveal complexity on request, keep the user's work when the network drops, and measure on a real device over a throttled connection. Every one of those decisions makes the product better for the people on fibre too, which is why nobody regrets doing it early and everybody regrets doing it late.",
          },
        ],
        keyPoints: [
          "Design the narrow layout first and explain what that forces you to prioritise.",
          "State the byte, time-to-interactive and image-size budgets, and the techniques that meet them.",
          "Apply touch target sizes and one-handed reach to a real screen.",
          "Design for flaky connections so that no user input is ever lost.",
          "Measure on a mid-range device through a throttled connection rather than on a laptop.",
        ],
        exercises: [
          "Load one of your pages on a real phone with the network throttled and record the transfer size, request count and time to interactive.",
          "Convert the largest image on a page to WebP and AVIF, serve it with `<picture>` at the right size, and report the byte saving.",
          "Redesign one screen for one-handed use: move the primary action into the bottom third and measure the target sizes of every control.",
          "Add offline handling to a form — autosave or a retry queue — then submit it with the network switched off mid-typing and verify nothing is lost.",
          "Audit every third-party script on a page, note its size, and choose one to defer or remove. Explain what the user loses, if anything.",
        ],
        challenge:
          "Take one page or screen of your own and put it on a data diet: a written budget, an optimisation plan, a before-and-after measurement of bytes, requests and time to interactive on a throttled real device, and a one-paragraph decision on what you refused to remove. Then have somebody on a prepaid bundle open it on their own phone and tell you what they noticed.",
      }),
    ]
  ),
];
