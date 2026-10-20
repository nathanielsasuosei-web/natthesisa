import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Game Development — from the game loop to 2D, 3D, 4D, 5D and n-dimensional
 * worlds, and from 1080p to 4K, 8K and beyond.
 *
 * Two families of "dimension" run through the course, and every lesson spends
 * from the same small allowance of time (16.7 ms per frame at 60 frames per
 * second). The first family is the dimensions of the world being simulated:
 * flat 2D tile maps, 3D vectors and pipelines, a fourth direction of space
 * and a fourth dimension of time, then branching timelines and any number of
 * axes. The second is the dimensions of the picture: the arithmetic of pixels,
 * memory and bandwidth at 4K, 5K, 8K and 16K, and the techniques (dynamic
 * resolution, upscaling, foveated rendering, quality tiers) that let one game
 * look right on every screen.
 *
 * Every worked example runs in the lesson workbench: the JavaScript console
 * samples print the numbers quoted in the text, and the web-playground demos
 * draw to a canvas with no libraries and no downloads, which suits a
 * mid-range phone on a metered connection.
 */

export const GAME_DEVELOPMENT_MODULES: CourseModule[] = [
  module(
    "games-from-the-loop-up",
    "01 · Games from the loop up",
    "The loop, time and state every game shares, then the two-dimensional worlds most games begin with: sprites, tile maps, collisions and cameras.",
    [
      lesson({
        id: "the-game-loop-time-and-state",
        title: "The game loop, time and state",
        summary:
          "Every game, in any number of dimensions and at any resolution, is a loop that reads input, advances a simulation by a measured slice of time, and draws the result. This lesson builds that loop properly: delta time, a fixed timestep with an accumulator, interpolation, and a frame budget you can spend on purpose.",
        objectives: [
          "Explain what a game loop does on each pass and why updating the world and drawing it are kept apart.",
          "Turn a frame rate into a budget in milliseconds and say what the budget has to pay for.",
          "Write movement in units per second, and show why movement written per frame changes the game's speed on different screens.",
          "Build a fixed-timestep loop with an accumulator, a clamp and interpolation, and explain what each part prevents.",
          "Say what makes a simulation deterministic, and why replays, rewind and multiplayer all depend on it.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A film is a recording; a game is a conversation. Sixty times a second the machine asks two questions: what is the world now, given what the player just did, and what does that world look like? Everything in this course, from a tile map to a spinning hypercube to an 8K picture, hangs from that rhythm.\n\nTwo ideas keep returning. The first is that the **world has dimensions**: two, three, four, five, and as many as you care to define. Those decide what you simulate. The second is that the **picture has dimensions too**: 1080p, 4K, 8K and beyond. Those decide how much work it takes to show the world. Both are paid for from the same small allowance of time, about 16.7 milliseconds per frame at 60 frames per second. This first lesson is about that allowance and the loop that spends it.\n\nGhana is a good place to learn this the hard way. Many players are on mid-range Android phones that heat up, slow down to protect themselves, and run on a battery between power cuts. A loop that is only correct on a fast laptop is only correct for some of your players.",
          },
          {
            heading: "Definition: the frame, the tick and the budget",
            kind: "definition",
            body:
              "A **game loop** is the cycle a game repeats for as long as it runs: read the player's input, advance the simulation, draw the result, and go round again.\n\n- **Frame** — one pass of the loop that produces one picture. **Frame rate** is how many frames are produced per second (fps). **Frame time** is how long one frame took, in milliseconds.\n- **Delta time** (written `dt`) — the real time that passed since the previous frame, in seconds. At 60 fps it is about 0.0167.\n- **Tick** or **simulation step** — one advance of the simulation by a fixed slice of time. The tick rate does not have to equal the frame rate.\n- **Refresh rate** — how often the display can show a new picture, in hertz: commonly 60, but also 90, 120 and 144.\n- **Frame budget** — the time one frame is allowed to take: 1000 ms ÷ fps. At 30 fps it is 33.3 ms; at 60 fps, 16.7 ms; at 120 fps, 8.3 ms. Miss it and the player sees a stutter.\n- **State** — everything needed to continue the game: positions, velocities, health, timers, the seed of the random generator.\n- **Deterministic** — the same starting state and the same inputs always give exactly the same next state.",
          },
          {
            heading: "The loop, and what belongs in each half",
            kind: "paragraph",
            body:
              "In its simplest form the loop is four lines:\n\n```\nwhile (running) {\n  input = readInput()\n  update(state, input, dt)    // decide and move: no drawing here\n  render(state)               // draw: no deciding here\n}\n```\n\nThe discipline is in the comments. **Update** changes the world. **Render** only reads it. Keeping them apart pays back three times: you can run the update with no screen at all (a server, an automated test, a replay), the drawing can run at a different rate from the simulation, and when something looks wrong you know which half to blame.\n\nInput is sampled once per frame, or once per tick, and stored in a small structure, so that every part of the update sees the same input. In a browser the loop is driven by `requestAnimationFrame`, which calls you just before each repaint and hands you a precise timestamp. Engines name the halves differently (`Update` and `FixedUpdate` in Unity, `_process` and `_physics_process` in Godot) but the split is the same.",
          },
          {
            heading: "Delta time: movement in units per second",
            kind: "paragraph",
            body:
              "The first bug every new game developer ships is movement written per frame: `x += 4`. On the developer's laptop at 60 fps that is 240 units a second. On a 30 fps phone it is 120. On a 144 Hz gaming monitor it is 576. The same game runs at half speed for one player and two and a half times too fast for another. Early PC games became famous for this: on a faster processor they simply became unplayable.\n\nThe fix is to measure speed in units per second and multiply by the real time that passed: `x += 240 * dt`. Now each frame moves the object by the right amount for that frame, and a second of play moves it 240 units on every device.\n\nDelta time is necessary, but it is not enough. Physics with a large or changing `dt` is unstable and unrepeatable, which is the next section.",
          },
          {
            heading: "Why a variable step is not enough: the fixed timestep",
            kind: "paragraph",
            body:
              "Using whatever `dt` the last frame happened to take has three costs.\n\n- **Accuracy.** Numerical integration gets worse as the step grows. A bouncing ball or a spring behaves differently at 16 ms steps and 50 ms steps (lesson 4 puts numbers on it).\n- **Tunnelling.** A fast object can move further in one big step than the thickness of a wall, and pass straight through it (lesson 2).\n- **Repeatability.** The same inputs on two machines, or on the same machine on a bad day, give different results. That makes replays, rewind and online play impossible (lessons 6 and 7).\n\nThe standard answer, popularised by Glenn Fiedler's article \"Fix Your Timestep!\", is to let the simulation advance only in equal steps and to let real time pay for them through an **accumulator**:\n\n```\naccumulator += frameTime              // real time since the last frame\nwhile (accumulator >= STEP) {\n  previous = current\n  update(current, STEP)               // always exactly STEP long\n  accumulator -= STEP\n}\nalpha = accumulator / STEP            // how far we are between two ticks, 0 to 1\nrender(lerp(previous, current, alpha))\n```\n\nThree details make this robust. The loop runs the update zero, one or several times per frame, whatever is needed to catch up with real time, so a hitch is repaid with extra steps and the game never loses time. **Interpolation** (`alpha`) draws the world between the last two ticks, so a 60 Hz simulation looks smooth on a 144 Hz screen. And a **clamp** on `frameTime` (the code uses 0.25 s) stops the **spiral of death**: if updating takes longer than the step, each frame falls further behind and the next one needs even more updates, so without a clamp the game never recovers. With the clamp it drops time instead and carries on.\n\nEngines do this for you by default: Unity's fixed step defaults to 0.02 seconds (50 ticks a second) and Godot's physics runs at 60 ticks a second. Knowing why lets you tune it, for example by dropping to 30 ticks on a weak phone.",
          },
          {
            heading: "Worked example: per-frame movement against per-second, then a fixed step",
            kind: "example",
            body:
              "Run this in the JavaScript console. Part 1 simulates one second at three frame rates, with movement written both ways. Part 2 drops a bouncing ball for six seconds twice, once with steady 16 ms frames and once with irregular frames that add up to exactly the same time. Predict the numbers before you run it.",
            code:
              "// PART 1 - movement written \"per frame\" versus \"per second\".\n// A ship should travel 240 units in one second, whatever the frame rate.\nfunction travelOneSecond(fps, perSecond) {\n  const dt = 1 / fps;                          // seconds per frame\n  let x = 0;\n  for (let frame = 0; frame < fps; frame++) {  // one second of frames\n    x += perSecond ? 240 * dt : 4;             // 240 units/s  versus  4 units/frame\n  }\n  return Math.round(x);\n}\nfor (const fps of [30, 60, 144]) {\n  const perFrame = travelOneSecond(fps, false);\n  const perSecond = travelOneSecond(fps, true);\n  console.log(`${fps} fps  per-frame: ${perFrame}  per-second: ${perSecond}`);\n}\n\n// PART 2 - the same bouncing ball under a variable and a fixed timestep.\n// Time is counted in whole milliseconds so both runs cover exactly 6000 ms.\nconst GRAVITY = -9.8;                          // metres per second squared\nfunction stepBall(ball, dt) {                  // semi-implicit Euler, then a bounce\n  ball.vy += GRAVITY * dt;\n  ball.y += ball.vy * dt;\n  if (ball.y < 0) { ball.y = 0; ball.vy = -ball.vy * 0.8; }\n}\n// one update per frame, sized by that frame\nfunction variableStep(frameMs) {\n  const ball = { y: 10, vy: 0 };\n  for (const ms of frameMs) stepBall(ball, ms / 1000);\n  return ball.y;\n}\n// accumulator: equal steps, whatever the frames\nfunction fixedStep(frameMs, stepMs = 20) {\n  const ball = { y: 10, vy: 0 };\n  let accumulator = 0;\n  for (const ms of frameMs) {\n    accumulator += Math.min(ms, 250);          // clamp a long stall (spiral of death)\n    while (accumulator >= stepMs) {\n      stepBall(ball, stepMs / 1000);\n      accumulator -= stepMs;\n    }\n  }\n  return ball.y;\n}\nconst steady = Array(375).fill(16);            // 375 frames of 16 ms = 6000 ms\n// irregular frames that also add up to 2000 ms\nconst burst = [\n  ...Array(40).fill(10), 120, ...Array(30).fill(20),\n  200, ...Array(10).fill(8), ...Array(25).fill(24),\n];\nconst janky = [...burst, ...burst, ...burst];  // three times over = 6000 ms\nconsole.log('frames: steady ' + steady.length + ', janky ' + janky.length);\nconsole.log(\n  'variable step  steady y = ' +\n    variableStep(steady).toFixed(3) +\n    '   janky y = ' +\n    variableStep(janky).toFixed(3)\n);\nconsole.log(\n  'fixed step     steady y = ' +\n    fixedStep(steady).toFixed(3) +\n    '   janky y = ' +\n    fixedStep(janky).toFixed(3)\n);",
            language: "javascript",
            codeLabel: "Console: per-frame against per-second, and a fixed timestep",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The first three lines are the speed bug in numbers. Written per frame, the ship covers 120, 240 or 576 units in one second depending on the display; written per second, it covers 240 on all three.\n\nThe last two lines are the determinism lesson. With a variable step the two runs end at heights of 2.262 and 2.123 metres: the same ball, the same six seconds, and a 14 centimetre disagreement caused only by how the time was sliced. With a fixed 20 ms step both runs end at exactly 2.247. The janky run took 321 frames to the steady run's 375, but the simulation neither knows nor cares: it advanced in the same 300 equal steps either way.",
            code:
              "30 fps  per-frame: 120  per-second: 240\n60 fps  per-frame: 240  per-second: 240\n144 fps  per-frame: 576  per-second: 240\nframes: steady 375, janky 321\nvariable step  steady y = 2.262   janky y = 2.123\nfixed step     steady y = 2.247   janky y = 2.247",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: watch the loop",
            kind: "example",
            body:
              "Press Run page. Two balls cross the screen at the same designed speed of 180 pixels per second. The orange one moves 3 pixels every rendered frame. The teal one comes from a fixed-step simulation and is drawn by interpolation. The white ring is where a perfect clock says the ball should be.\n\nTry three things. Press **Render: every frame** to cycle it to every 2nd and every 4th frame, which imitates a slower device: the orange ball slows down and falls behind the ring, while the teal one stays with it. Press **Stall 150 ms** to imitate a hitch: the screen freezes briefly, the teal ball catches up with extra steps, and the orange ball has lost that time for good. Press **Reset** to line them up again. On a 120 or 144 Hz screen you will see the orange ball run ahead of the ring instead.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #e8e6ff; font: 12px/1.4 system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 6px 8px;\n  }\n  button {\n    background: #6d4aff; color: #fff; border: 0; border-radius: 6px; padding: 5px 9px;\n    font: inherit; cursor: pointer;\n  }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; background: #1c1840;\n  }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <button id=\"rate\">Render: every frame</button>\n  <button id=\"stall\">Stall 150 ms</button>\n  <button id=\"reset\">Reset</button>\n</div>\n<canvas id=\"c\" width=\"480\" height=\"170\"></canvas>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst W = canvas.width;\nconst STEP = 1 / 60;        // the simulation always advances in 1/60 s steps\nconst SPEED = 180;          // design speed: pixels per second\n\nlet perFrameX = 0;          // lane 1: moves 3 px every rendered frame\nlet sim = { x: 0, prev: 0 };// lane 2: fixed-step simulation\nlet accumulator = 0, lostMs = 0;\nlet last = performance.now(), t0 = last;\nlet skip = 1, tick = 0, stallUntil = 0;\nlet shown = 0, updates = 0, hudAt = last, hud = '';\n\nfunction update() {         // one fixed step (no drawing in here)\n  sim.prev = sim.x;\n  sim.x = (sim.x + SPEED * STEP) % W;\n  updates++;\n}\n\nfunction ball(x, y, color) {\n  ctx.fillStyle = color;\n  ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();\n}\n\nfunction render(alpha, now) {\n  ctx.clearRect(0, 0, W, canvas.height);\n  // where a perfect clock says it should be\n  const ideal = (SPEED * (now - t0 - lostMs) / 1000) % W;\n  let from = sim.prev;\n  // handle wrapping at the edge\n  if (sim.x < from) from -= W;\n  // interpolate between the last two states\n  let x = from + (sim.x - from) * alpha;\n  if (x < 0) x += W;\n\n  ctx.fillStyle = '#9d98c9'; ctx.font = '11px system-ui';\n  ctx.fillText('per-frame movement: x += 3 each frame', 8, 30);\n  ctx.fillText('fixed-step simulation + interpolation', 8, 100);\n  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;\n  for (const y of [58, 128]) {\n    ctx.beginPath();\n    ctx.arc(ideal, y, 12, 0, Math.PI * 2);\n    ctx.stroke();\n  }\n  ball(perFrameX, 58, '#ff7448');\n  ball(x, 128, '#3ddcd0');\n  ctx.fillStyle = '#e8e6ff';\n  ctx.fillText(hud, 8, 160);\n}\n\nfunction frame(now) {\n  requestAnimationFrame(frame);\n  tick++;\n  // skipped frames imitate a slower device\n  if (tick % skip !== 0 || now < stallUntil) return;\n  let dt = (now - last) / 1000; last = now;\n  // clamp, and admit the time we dropped\n  if (dt > 0.25) { lostMs += (dt - 0.25) * 1000; dt = 0.25; }\n  accumulator += dt;\n  while (accumulator >= STEP) { update(); accumulator -= STEP; }\n  // right only if exactly 60 frames/second\n  perFrameX = (perFrameX + 3) % W;\n  shown++;\n  if (now - hudAt >= 500) {\n    const secs = (now - hudAt) / 1000;\n    hud =\n      'render ' +\n      (shown / secs).toFixed(0) +\n      ' fps   updates ' +\n      (updates / secs).toFixed(0) +\n      '/s   white ring = real time';\n    shown = 0; updates = 0; hudAt = now;\n  }\n  render(accumulator / STEP, now);\n}\n\ndocument.getElementById('rate').onclick = (e) => {\n  skip = skip === 1 ? 2 : skip === 2 ? 4 : 1;\n  e.target.textContent =\n    'Render: ' +\n    (skip === 1\n      ? 'every frame'\n      : 'every ' + skip + (skip === 2 ? 'nd' : 'th') + ' frame');\n};\ndocument.getElementById('stall').onclick = () => {\n  stallUntil = performance.now() + 150;\n};\ndocument.getElementById('reset').onclick = () => {\n  perFrameX = 0;\n  sim.x = sim.prev = 0;\n  accumulator = 0;\n  lostMs = 0;\n  t0 = last = performance.now();\n};\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: the game loop, with a real-time ring",
          },
          {
            heading: "Reference: frame rates and their budgets",
            kind: "table",
            rows: [
              ["Frame rate", "Budget per frame", "Where you meet it"],
              ["24 fps", "41.7 ms", "Cinema film"],
              ["30 fps", "33.3 ms", "Many phone games, battery-saver modes, some console titles"],
              ["60 fps", "16.7 ms", "The usual target on phones, consoles and PCs"],
              ["90 fps", "11.1 ms", "Common for comfortable VR"],
              ["120 fps", "8.3 ms", "High-refresh phones and competitive play"],
              ["144 fps", "6.9 ms", "Gaming monitors"],
              ["240 fps", "4.2 ms", "Esports monitors"],
            ],
          },
          {
            heading: "Spending the budget",
            kind: "paragraph",
            body:
              "A frame is a small business with a fixed income. At 60 fps there is 16.7 ms to cover input, game logic, physics, animation, deciding what to draw, telling the graphics card what to draw, the drawing itself, and the interface. A rough, invented split for a busy frame might be 2 ms of game logic, 2 ms of physics, 1.5 ms of animation, 3 ms of preparing draw commands on the processor, and 9 ms for the graphics card to render. The processor and the graphics card work in parallel on neighbouring frames, so the frame time is set by whichever is slower, not by their sum.\n\nThat is why \"profile before you optimise\" is the oldest rule in the trade. If the graphics card is the slow one, shaving a millisecond off your physics changes nothing. Every later lesson spends from this budget: 3D geometry and lighting (lessons 3 and 4), the extra mathematics of more dimensions (lessons 5 to 7), and above all the pixel count (lessons 8 and 9), which multiplies the graphics card's share.",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Movement or animation timed per frame.** It changes speed with the display. Use units per second, or a fixed step.\n- **`setInterval` or `setTimeout` as the loop.** They are not synchronised with the display, they drift, and they keep running in background tabs. Use `requestAnimationFrame`.\n- **Timing with `Date.now()`.** The wall clock can jump when the device syncs its time. Use the timestamp the loop receives, or `performance.now()`, which only moves forward.\n- **Drawing inside update, or deciding inside render.** It makes replays and tests impossible and bugs hard to place.\n- **An unclamped accumulator.** After a long stall, or when a tab is hidden, the loop tries to simulate minutes in one frame and freezes.\n- **Allocating new objects every frame.** The garbage collector pauses at awkward moments and shows up as hitches. Reuse objects in hot loops.\n- **Judging by the average.** One 200 ms freeze in a hundred frames hides inside a healthy average. Look at the worst frames (lesson 9).\n- **Hidden randomness in the update.** `Math.random()` makes two runs diverge. Keep a seeded generator inside the state (lesson 6).\n- **Assuming 60 Hz.** Displays are 60, 90, 120 and 144 Hz, and a phone can switch between them.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A game loop reads input, updates the world and renders it, and the update and the render stay separate. The frame budget, 1000 ms divided by the frame rate, is the allowance every feature spends from. Movement belongs in units per second. A fixed timestep with an accumulator, a clamp and interpolation makes the simulation stable, smooth and repeatable, and repeatability, which engineers call determinism, is what later lets you replay, rewind and branch time. The loop does not change with the number of dimensions or the number of pixels, which is exactly why it comes first.",
          },
        ],
        keyPoints: [
          "A game loop reads input, updates the simulation and renders; update changes the world and render only reads it.",
          "The frame budget is 1000 ÷ fps: 16.7 ms at 60 fps and 8.3 ms at 120 fps, and every feature spends from it.",
          "Write motion in units per second and multiply by dt; movement written per frame changes the game's speed with the display.",
          "A fixed timestep with an accumulator, a clamp and interpolation makes physics stable, smooth and reproducible.",
          "Determinism, the same state and inputs giving the same result, is what makes replay, rewind and multiplayer possible; hidden randomness and wall-clock time break it.",
        ],
        exercises: [
          "Work out the frame budget in milliseconds at 30, 72, 90 and 165 frames per second, and say which of them a phone that manages only 12 ms of work per frame can sustain.",
          "In the console sample, change the ship's speed to 300 units per second and the frame rates to 50, 75 and 240. Predict the per-frame result for 4 units per frame before you run it.",
          "Change `stepMs` in `fixedStep` to 10 and then to 50. How do the two runs behave? Which one is closest to the true physics of the ball, and what does it cost in updates per second?",
          "In the loop demo, choose \"every 4th frame\" and then press Stall. Explain why the teal ball catches up but the orange one never does.",
          "Remove the clamp (`Math.min(ms, 250)`) and feed the accumulator a single 5,000 ms frame while pretending each update costs 2 ms of real time. Explain the spiral of death in your own words.",
        ],
        challenge:
          "Build the loop for a small game of your own in the web playground: a fixed 60 Hz simulation with an accumulator and a clamp, interpolated drawing, an on-screen readout of frame time and updates per second, and a key that injects a 200 ms stall. Show, with a screenshot or written notes, that the distance an object has travelled after ten seconds is identical at 30 fps, at 60 fps and with random stalls.",
      }),

      lesson({
        id: "worlds-in-2d-sprites-tilemaps-collisions",
        title: "2D worlds: sprites, tile maps, collisions and the camera",
        summary:
          "Two-dimensional games are not simplified 3D. They are a different set of trade-offs: hand-drawn art, pixel-exact control, grids and cheap collisions. This lesson covers screen coordinates, sprites, tile maps, box collisions that cannot be tunnelled, cameras and parallax, and how to keep pixel art sharp on any screen.",
        objectives: [
          "Place and move objects in screen coordinates, with the origin at the top left and y pointing down, and convert between world and screen space with a camera offset.",
          "Explain sprites, sprite sheets, animation frames and layers, and choose between drawn shapes, images and tiles.",
          "Store a level as a tile map and convert a pixel position into tile indices and back.",
          "Resolve box-against-tile collisions one axis at a time, and prevent tunnelling with sub-steps.",
          "Build a camera that follows, clamps and scrolls a parallax layer, and scale pixel art by whole numbers so it never blurs.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Two dimensions is where most games, and most game developers, begin, and it is also where a surprising number of successful games stay. Celeste, Stardew Valley and Hollow Knight are 2D. So are the mobile games that millions of people play on modest phones. Ghana has its own tradition here: Accra's Leti Arts has published mobile games and comics rooted in African folklore since 2009.\n\nThe reason is practical. A 2D game can be a few megabytes, needs no 3D art pipeline, runs on a phone that could not hold a 3D game's textures, and its rules fit in your head. It is also the best place to learn the ideas that never go away: grids, collisions, cameras and the discipline of the fixed step from lesson 1.",
          },
          {
            heading: "Definition: the vocabulary of a 2D game",
            kind: "definition",
            body:
              "- **Screen coordinates** — the origin is the top-left corner, x grows to the right and **y grows downward**. This is the opposite of the graphs you drew at school, and it is why a jump uses a negative velocity.\n- **World and screen space** — the level has its own coordinates, usually far larger than the screen. A **camera** says which part of the world is visible, and `screen = world − camera` turns one into the other.\n- **Sprite** — an image, or a drawn shape, placed at a position. A **sprite sheet** (or atlas) packs many frames into one image, each a rectangle you can cut out. **Animation** is showing those frames in turn at a steady rate, independent of the game's frame rate.\n- **Tile** and **tile map** — a tile is a small square picture; a tile map is a grid of numbers or characters saying which tile goes where. The level is data, not code.\n- **AABB** (axis-aligned bounding box) — a rectangle `{ x, y, w, h }` that never rotates. It is the workhorse collision shape.\n- **Collision detection** answers \"do these overlap?\"; **collision resolution** answers \"so what happens now?\" They are separate steps.\n- **Layers** — things are drawn back to front: background, tiles, characters, effects, interface.\n- **Virtual resolution** — designing at a fixed small size, such as 480 × 270, and scaling the finished picture to fit the screen.",
          },
          {
            heading: "Tile maps: a level as text",
            kind: "paragraph",
            body:
              "The simplest level format is text. Each character is one tile: `#` is solid ground, `o` is a coin, `.` is empty air. A 60 × 12 level is 720 characters, a few hundred bytes and far smaller than a picture of the same level, and you can edit it in any text editor. Free tools such as Tiled give you a visual editor that exports the same idea.\n\nTwo conversions do almost all the work, for tiles `TILE` pixels square:\n\n```\ntileColumn = floor(x / TILE)        tileRow = floor(y / TILE)\npixelX     = tileColumn × TILE      pixelY  = tileRow × TILE\n```\n\nA tile map makes the three expensive jobs cheap. **Collision** becomes an array lookup: to ask whether the player is standing on something, look at the tile under their feet. **Drawing** becomes culling: compute the first and last visible column from the camera and draw only those. **Level design** becomes editing text. The demo below uses exactly these three ideas.",
          },
          {
            heading: "Collisions: overlap first, then one axis at a time",
            kind: "paragraph",
            body:
              "Two boxes overlap when they overlap on both axes, which is four comparisons: `a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y`. Boxes that merely touch along an edge do not count, which is what lets a character stand on the floor without being \"inside\" it.\n\nDetecting an overlap is the easy part. The craft is resolving it. If you move a character by its full velocity on both axes at once and then try to push it out of whatever it hit, it snags on corners and flickers between the floor and the wall. The reliable pattern is **one axis at a time**: move on x, check the tiles, snap flush against any wall you entered; then move on y and do the same. Walls stop you without sticking, a diagonal push slides along the wall, and \"I hit something while moving down\" is simply the definition of standing on the ground.\n\nThe second trap is **tunnelling**. If one step is longer than the thickness of the thing you are hitting, the check at the end of the step never sees the wall. The cheapest cure is **sub-stepping**: split the movement into pieces no longer than half a tile and resolve each piece. Faster ways exist (swept tests, continuous collision detection) and engines use them, but for a tile game sub-stepping is simple and never wrong.",
          },
          {
            heading: "Worked example: collisions you can predict",
            kind: "example",
            body:
              "This sample is the whole collision system for a tile game in under a hundred lines. The map is four rows of ten tiles, 16 pixels each, with wall tiles in the third row and a floor in the fourth. Work out by hand where each box should end up, then run it.",
            code:
              "// A tiny tile world: '#' is solid, '.' is empty. Every tile is 16 x 16 pixels.\nconst TILE = 16;\n// keeps a box that touches an edge out of the next tile\nconst EPS = 1e-6;\nconst MAP = [\n  '..........',\n  '..........',\n  '.....#.#..',\n  '##########',\n];\nconst solid = (tx, ty) => MAP[ty]?.[tx] === '#';     // off the map counts as empty\n\n// Move a box along X only, then push it back out of any solid tile it entered.\nfunction moveX(box, dx) {\n  box.x += dx;\n  if (dx === 0) return false;\n  const top = Math.floor(box.y / TILE);\n  const bottom = Math.floor((box.y + box.h - EPS) / TILE);\n  // the tile column the leading edge is in\n  const edge = Math.floor((dx > 0 ? box.x + box.w - EPS : box.x) / TILE);\n  for (let ty = top; ty <= bottom; ty++) {\n    if (solid(edge, ty)) {\n      // snap flush to the wall\n      box.x = dx > 0 ? edge * TILE - box.w : (edge + 1) * TILE;\n      return true;\n    }\n  }\n  return false;\n}\n// The same idea for Y. Hitting something while moving down means \"standing on it\".\nfunction moveY(box, dy) {\n  box.y += dy;\n  if (dy === 0) return false;\n  const left = Math.floor(box.x / TILE);\n  const right = Math.floor((box.x + box.w - EPS) / TILE);\n  const edge = Math.floor((dy > 0 ? box.y + box.h - EPS : box.y) / TILE);\n  for (let tx = left; tx <= right; tx++) {\n    if (solid(tx, edge)) {\n      box.y = dy > 0 ? edge * TILE - box.h : (edge + 1) * TILE;\n      return true;\n    }\n  }\n  return false;\n}\n// Resolve the axes one at a time, in small sub-steps so nothing can skip over a tile.\nfunction move(box, dx, dy) {\n  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (TILE / 2)));\n  let hitX = false, hitY = false;\n  for (let i = 0; i < steps; i++) {\n    hitX = moveX(box, dx / steps) || hitX;\n    hitY = moveY(box, dy / steps) || hitY;\n  }\n  return { hitX, hitY };\n}\n\n// 1) Falling onto the floor: row 3 starts at y = 48, so a 14-pixel-tall box\n// should rest at y = 34.\nconst faller = { x: 20, y: 10, w: 10, h: 14 };\nconst landing = move(faller, 0, 60);\nconsole.log('landed at y =', faller.y, ' onGround =', landing.hitY);\n\n// 2) A 30-pixel step toward the wall tile at x = 80..96 (the box is 10\n// wide, standing on the floor).\nconst naive = { x: 60, y: 34, w: 10, h: 14 };\n// one big step: only the landing column is checked\nmoveX(naive, 30);\nconsole.log('single big step: x =', naive.x, '(the box is now inside the wall)');\nconst careful = { x: 60, y: 34, w: 10, h: 14 };\nconst bump = move(careful, 30, 0);\nconsole.log(\n  'sub-stepped:     x =',\n  careful.x,\n  ' hitX =',\n  bump.hitX,\n  '(flush: 70 + 10 = 80)'\n);\n\n// 3) Sliding: push diagonally into the wall and the box keeps moving along the free axis.\nconst slider = { x: 60, y: 18, w: 10, h: 14 };\nconst slide = move(slider, 20, 12);\nconsole.log(\n  'slide:           x =',\n  slider.x,\n  ' y =',\n  slider.y,\n  ' hitX =',\n  slide.hitX,\n  ' hitY =',\n  slide.hitY\n);\n\n// 4) Two boxes overlapping (a coin pickup) is four comparisons. Touching\n// edges do not count.\nconst overlaps = (a, b) =>\n  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;\nconst player = { x: 70, y: 30, w: 10, h: 14 };          // where the slider ended up\nconsole.log('coin inside the box:   ', overlaps(player, { x: 74, y: 36, w: 8, h: 8 }));\nconsole.log('coin far away:         ', overlaps(player, { x: 120, y: 30, w: 8, h: 8 }));\nconsole.log('coin touching an edge: ', overlaps(player, { x: 80, y: 30, w: 8, h: 8 }));",
            language: "javascript",
            codeLabel: "Console: tile collision, tunnelling and sliding",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The floor row starts at y = 48 (three rows of 16 pixels), so a box 14 pixels tall comes to rest at 48 − 14 = 34, and because it was stopped while moving down, `onGround` is true.\n\nThe next two lines are the tunnelling lesson. A wall tile occupies x from 80 to 96. The box, 10 pixels wide, starts at x = 60 and is pushed 30 pixels in one step. Its right edge lands at 100, in the empty column beyond the wall, so a single check at the leading edge sees nothing wrong, and the box ends at x = 90, inside the wall. The sub-stepped version moves at most 8 pixels at a time, meets the wall, and stops flush at x = 70, since 70 + 10 = 80.\n\nIn the slide test the box is pushed diagonally into the wall. The x movement is blocked at 70 while the y movement carries on to its full 30, which is exactly the behaviour players expect from a wall. The last three lines show the pickup test: overlapping is true, far away is false, and an exact edge-to-edge touch is false.",
            code:
              "landed at y = 34  onGround = true\nsingle big step: x = 90 (the box is now inside the wall)\nsub-stepped:     x = 70  hitX = true (flush: 70 + 10 = 80)\nslide:           x = 70  y = 30  hitX = true  hitY = false\ncoin inside the box:    true\ncoin far away:          false\ncoin touching an edge:  false",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: a tile-map game with a camera",
            kind: "example",
            body:
              "Press Run page, click the game once so it receives the keyboard, then use the arrow keys (or A, D and W), or tap the left, middle and right thirds of the screen on a phone. The level, the collision code, the fixed step from lesson 1, the camera and a layer of parallax hills are all in the listing.\n\nThings to look for: the camera eases toward the player rather than snapping, stops at the ends of the level, and rounds to whole pixels so the edges do not shimmer. The hills scroll at 40% of the camera's speed, which is all it takes to suggest depth. Fall into a pit and you restart. Then edit the numbers at the top of `update`: halve gravity, change the jump speed, make the run speed 200, and see which levels become unwinnable. Level design and physics tuning are the same job.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #9d98c9; font: 12px system-ui, sans-serif;\n  }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; touch-action: none;\n    outline: none;\n  }\n  p { margin: 5px 8px; }\n</style>\n</head>\n<body>\n<canvas id=\"c\" width=\"480\" height=\"192\" tabindex=\"0\"></canvas>\n<p>Click the game first, then use the arrow keys (or tap left, middle, right).</p>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst TILE = 16, VIEW_W = 480, VIEW_H = 192, STEP = 1 / 60, EPS = 1e-6;\n\n// The level is text: '#' solid, 'o' coin, '.' empty. One character = one tile.\nconst LEVEL = [\n  '............................................................',\n  '............................................................',\n  '............................................................',\n  '............................................................',\n  '..............o.............................................',\n  '.............###.....................................oo.....',\n  '.........oo...................oo................#...####....',\n  '........####..................##...............##...........',\n  '.....................o........##.......o......###...........',\n  '..........................ooo.##.............####.o.........',\n  '####################...###############...###################',\n  '####################...###############...###################'\n];\nconst ROWS = LEVEL.length, WORLD_W = LEVEL[0].length * TILE;\nconst solid = (tx, ty) => LEVEL[ty]?.[tx] === '#';\nconst coins = [];\nLEVEL.forEach((row, ty) => [...row].forEach((ch, tx) => {\n  if (ch === 'o')\n    coins.push({ x: tx * TILE + 4, y: ty * TILE + 4, w: 8, h: 8, taken: false });\n}));\nconst overlaps = (a, b) =>\n  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;\n\n// Per-axis tile collision (the same functions as the console example).\nfunction moveX(box, dx) {\n  box.x += dx;\n  if (dx === 0) return false;\n  const top = Math.floor(box.y / TILE), bottom = Math.floor((box.y + box.h - EPS) / TILE);\n  const edge = Math.floor((dx > 0 ? box.x + box.w - EPS : box.x) / TILE);\n  for (let ty = top; ty <= bottom; ty++) {\n    if (solid(edge, ty)) {\n      box.x = dx > 0 ? edge * TILE - box.w : (edge + 1) * TILE;\n      return true;\n    }\n  }\n  return false;\n}\nfunction moveY(box, dy) {\n  box.y += dy;\n  if (dy === 0) return false;\n  const left = Math.floor(box.x / TILE), right = Math.floor((box.x + box.w - EPS) / TILE);\n  const edge = Math.floor((dy > 0 ? box.y + box.h - EPS : box.y) / TILE);\n  for (let tx = left; tx <= right; tx++) {\n    if (solid(tx, edge)) {\n      box.y = dy > 0 ? edge * TILE - box.h : (edge + 1) * TILE;\n      return true;\n    }\n  }\n  return false;\n}\nfunction move(box, dx, dy) {\n  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (TILE / 2)));\n  let hitX = false, hitY = false;\n  for (let i = 0; i < steps; i++) {\n    hitX = moveX(box, dx / steps) || hitX;\n    hitY = moveY(box, dy / steps) || hitY;\n  }\n  return { hitX, hitY };\n}\n\nconst START = { x: 36, y: 10 * TILE - 14 };\nconst player = {\n  ...START,\n  w: 10,\n  h: 14,\n  vx: 0,\n  vy: 0,\n  px: START.x,\n  py: START.y,\n  onGround: false,\n  face: 1,\n};\nconst camera = { x: 0, px: 0 };\nconst input = { left: false, right: false, jump: false };\n\n// one fixed step of the simulation\nfunction update(dt) {\n  // remember the previous state\n  player.px = player.x; player.py = player.y; camera.px = camera.x;\n  player.vx = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 120;   // pixels per second\n  if (player.vx) player.face = Math.sign(player.vx);\n  if (input.jump && player.onGround) player.vy = -420;\n  // gravity, with a speed limit\n  player.vy = Math.min(player.vy + 1400 * dt, 600);\n  const hit = move(player, player.vx * dt, player.vy * dt);\n  player.onGround = hit.hitY && player.vy > 0;\n  if (hit.hitY) player.vy = 0;\n  player.x = Math.max(0, Math.min(player.x, WORLD_W - player.w));\n  // fell down a pit: restart\n  if (player.y > ROWS * TILE + 48) {\n    Object.assign(player, START, { vx: 0, vy: 0 });\n    player.px = player.x;\n    player.py = player.y;\n  }\n  for (const coin of coins) if (!coin.taken && overlaps(player, coin)) coin.taken = true;\n  const target = Math.max(\n    0,\n    Math.min(player.x + player.w / 2 - VIEW_W / 2, WORLD_W - VIEW_W)\n  );\n  // the camera eases toward the player\n  camera.x += (target - camera.x) * Math.min(1, 6 * dt);\n}\n\nfunction render(alpha) {\n  // whole pixels: no shimmer\n  const camX = Math.round(camera.px + (camera.x - camera.px) * alpha);\n  const sx = Math.round(player.px + (player.x - player.px) * alpha) - camX;\n  const sy = Math.round(player.py + (player.y - player.py) * alpha);\n  ctx.fillStyle = '#1c1840'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);\n  // far hills scroll at 40% of the camera speed\n  ctx.fillStyle = '#2b2561';\n  for (let x = 0; x < VIEW_W; x += 4) {\n    const h =\n      46 + 22 * Math.sin((x + camX * 0.4) / 46) + 12 * Math.sin((x + camX * 0.4) / 17);\n    ctx.fillRect(x, 10 * TILE - h, 4, h);\n  }\n  // only the visible columns\n  const first = Math.floor(camX / TILE), last = Math.ceil((camX + VIEW_W) / TILE);\n  for (let ty = 0; ty < ROWS; ty++) {\n    for (let tx = first; tx <= last; tx++) {\n      if (!solid(tx, ty)) continue;\n      // lighter where nothing is above\n      ctx.fillStyle = solid(tx, ty - 1) ? '#4b37b8' : '#8b6bff';\n      ctx.fillRect(tx * TILE - camX, ty * TILE, TILE, TILE);\n      ctx.fillStyle = 'rgba(0,0,0,.18)';\n      ctx.fillRect(tx * TILE - camX, ty * TILE + TILE - 1, TILE, 1);\n    }\n  }\n  ctx.fillStyle = '#ffcf59';\n  for (const coin of coins)\n    if (!coin.taken)\n      ctx.fillRect(\n        coin.x - camX,\n        coin.y + Math.round(Math.sin(performance.now() / 200 + coin.x) * 1.5),\n        coin.w,\n        coin.h\n      );\n  ctx.fillStyle = '#ff7448'; ctx.fillRect(sx, sy, player.w, player.h);\n  ctx.fillStyle = '#fff'; ctx.fillRect(sx + (player.face > 0 ? 6 : 2), sy + 3, 2, 3);\n  ctx.fillStyle = '#e8e6ff'; ctx.font = '11px system-ui';\n  ctx.fillText(\n    'coins ' + coins.filter((c) => c.taken).length + '/' + coins.length,\n    8,\n    14\n  );\n}\n\nconst keys = {\n  ArrowLeft: 'left',\n  a: 'left',\n  ArrowRight: 'right',\n  d: 'right',\n  ArrowUp: 'jump',\n  w: 'jump',\n  ' ': 'jump',\n};\nfunction key(e, down) {\n  const k = keys[e.key];\n  if (k) {\n    input[k] = down;\n    e.preventDefault();\n  }\n}\nwindow.addEventListener('keydown', (e) => key(e, true));\nwindow.addEventListener('keyup', (e) => key(e, false));\n// left third = left, middle = jump, right third = right\nfunction touch(e, down) {\n  const rect = canvas.getBoundingClientRect();\n  const zone = Math.floor(((e.clientX - rect.left) / rect.width) * 3);\n  input.left = down && zone === 0;\n  input.jump = down && zone === 1;\n  input.right = down && zone === 2;\n  canvas.focus(); e.preventDefault();\n}\ncanvas.addEventListener('pointerdown', (e) => touch(e, true));\ncanvas.addEventListener('pointerup', (e) => touch(e, false));\ncanvas.addEventListener('pointercancel', (e) => touch(e, false));\n\nlet last = performance.now(), accumulator = 0;\nfunction frame(now) {\n  accumulator += Math.min(Math.max((now - last) / 1000, 0), 0.25); last = now;\n  while (accumulator >= STEP) { update(STEP); accumulator -= STEP; }\n  render(accumulator / STEP);\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: a tile-map game with a camera",
          },
          {
            heading: "The camera, parallax and layers",
            kind: "paragraph",
            body:
              "A camera is one subtraction, `screen = world − camera`, and everything else is taste.\n\n- **Follow with smoothing.** Moving the camera a fraction of the way toward the target each step, `camera += (target − camera) × k × dt`, removes the jerk of snapping. The demo uses the simple form with `k` = 6; the exponential form `1 − e^(−k × dt)` behaves the same at any step size.\n- **Clamp to the world.** Never let the camera show beyond the edge of the level.\n- **Look ahead.** Aim slightly in front of a moving character so the player sees what is coming.\n- **Round once, at the end.** Round the final screen position to whole pixels. Rounding the player and the camera separately makes things vibrate against each other.\n- **Parallax.** Layers that scroll at a fraction of the camera's speed, 0.2 to 0.8, read as distance. This is called 2.5D and costs almost nothing.\n- **Isometric views** are a 2D grid drawn diagonally: `screenX = (x − y) × tileWidth ÷ 2` and `screenY = (x + y) × tileHeight ÷ 2`. The game logic is still two-dimensional.",
          },
          {
            heading: "Pixel art, scaling and one number that will come back",
            kind: "paragraph",
            body:
              "Pixel art breaks when it is scaled by the wrong amount. Scale it by 2.5 and some pixels become two screen pixels wide and some three, so shapes wobble as they move. The remedy is to design at a small **virtual resolution** and scale by **whole numbers only**, adding black bars where the screen does not fit.\n\nChoose the virtual resolution well and the whole numbers line up with real screens. A 480 × 270 picture is exactly 16:9. Multiply by 4 and you have 1920 × 1080. Multiply by 8 and you have 3840 × 2160, which is 4K. Multiply by 16 and you have 7680 × 4320, which is 8K. One art style, drawn once, is sharp on a phone, a television and a wall, and the game itself only ever draws 480 × 270 pixels; the screen does the scaling. That is the cheapest way to meet \"4K and 8K\" in this course, and we will count the expensive ways in lesson 8.\n\nIn a browser, switch off smoothing when you scale, with `ctx.imageSmoothingEnabled = false` (or `image-rendering: pixelated` in CSS), and remember that phones have more device pixels than CSS pixels: set the canvas to its CSS size times `devicePixelRatio` if you draw text or fine lines. Sprite sheets also pay off at runtime, because one image means one texture bound, and 2D engines batch hundreds of sprites into a single draw call.",
          },
          {
            heading: "Reference: collision shapes in 2D",
            kind: "table",
            rows: [
              ["Shape", "Test", "Cost", "Use it for"],
              ["Tile lookup", "One array read", "Cheapest", "Static level geometry"],
              ["Box (AABB)", "Four comparisons", "Very cheap", "Characters, pickups, platforms"],
              ["Circle", "distance² < (r1 + r2)²", "Very cheap", "Bullets, balls, radius triggers"],
              ["Rotated box or polygon", "Separating axis theorem", "Moderate", "Crates, vehicles, shapes that turn"],
              ["Pixel mask", "Compare bitmaps", "Expensive", "Rarely worth it; avoid"],
            ],
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Resolving x and y together.** The character snags on corners. Move and resolve one axis at a time.\n- **Frame-rate-dependent gravity.** Use the fixed step from lesson 1, or the character jumps higher on slow devices.\n- **Tunnelling at speed.** Anything faster than one tile per step needs sub-steps or a swept test.\n- **Blurry sprites.** Smoothing left on, fractional positions, or scaling by a number that is not a whole number.\n- **Camera jitter.** The player and the camera rounded separately. Round the final position once.\n- **Forgetting that y points down.** Jumping is negative, gravity is positive, and \"above\" means a smaller y.\n- **Testing \"on the ground\" with exact positions.** Use the collision result, not `y === floor`.\n- **Drawing the whole level every frame.** Draw only the columns the camera can see.\n- **Hard-coding the level into the logic.** Keep it as data so that you, or a friend, can change it without touching the code.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Screen coordinates start at the top left with y pointing down, and a camera turns world coordinates into screen coordinates by subtraction. A tile map stores a level as data, turns collision into array lookups and drawing into culling. Box collisions are resolved one axis at a time and sub-stepped so that nothing tunnels. A smoothed, clamped camera and a parallax layer give a flat world depth. And designing at a small virtual resolution, then scaling by whole numbers, keeps pixel art sharp from a phone to an 8K screen.",
          },
        ],
        keyPoints: [
          "Screen coordinates start top left with y pointing down; a camera converts world to screen with a subtraction.",
          "A tile map stores a level as a grid of small numbers or characters and turns collision into array lookups.",
          "Resolve box collisions one axis at a time, and sub-step so a fast object cannot skip a thin wall.",
          "Follow with a smoothed, clamped camera, round to whole pixels once at the end, and let parallax layers move at fractions of the camera's speed.",
          "Design at a small virtual resolution and scale by whole numbers: 480 × 270 becomes 1080p at ×4, 4K at ×8 and 8K at ×16 without blur.",
        ],
        exercises: [
          "Convert pixel (137, 91) to tile indices for 16-pixel tiles, and give the top-left pixel of tile (9, 4).",
          "The demo has a jump speed of 420 pixels per second and a gravity of 1400 pixels per second squared. Work out how high the player can jump and how far they can travel in the air at a run speed of 120, then widen a pit in the level until the jump fails.",
          "In the console sample, make the wall two tiles thick and the step 50 pixels. Does sub-stepping still work? Explain why a sub-step of half a tile can never skip a tile.",
          "Replace the rectangle player with a four-frame walking animation drawn in code, advancing at 8 frames per second regardless of the game's speed.",
          "Make the camera look ahead by 40 pixels in the direction the player faces, smoothly. Describe what happens when the player reverses direction quickly, and how the smoothing hides it.",
        ],
        challenge:
          "Extend the demo into a three-screen game: coins that count, a spike tile that sends the player back to the start of the screen, a goal flag that loads a second map from text, and a switch that draws the world at 480 × 270 and scales it by whole numbers. Hand in the map text, a paragraph explaining how your collisions are resolved, and screenshots at two different window sizes with pixels that stay sharp.",
      }),
    ]
  ),
  module(
    "three-dimensions",
    "02 · Three dimensions",
    "Vectors, matrices and the render pipeline, then the practical side: light, physics, performance and choosing an engine.",
    [
      lesson({
        id: "worlds-in-3d-vectors-matrices-and-projection",
        title: "3D worlds: vectors, matrices and projection",
        summary:
          "A third dimension adds one axis and one new problem: showing a 3D world on a flat screen. The mathematics is small, with vectors, the dot and cross products and 4 × 4 matrices, and getting a point onto the screen is a chain of coordinate spaces, from model to world to view to screen. This lesson builds both by hand and ends with a spinning cube drawn from nothing but numbers.",
        objectives: [
          "Use vectors, the dot product and the cross product to answer questions of direction, angle, facing and surface orientation.",
          "Name the coordinate spaces from model to screen and the transform that carries a point from each to the next.",
          "Explain perspective projection as division by depth, and say what the field of view and the near plane change.",
          "Tell apart the axis and handedness conventions of common tools, so imported models are not mirrored or turned on their side.",
          "Describe rasterisation, the depth buffer, culling and shaders well enough to reason about what a scene costs.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The step from 2D to 3D looks like adding a `z`. It is really a change of kind. In 2D you place pictures; in 3D you place objects in a world and the screen becomes a window onto it, so \"where does this point land on the screen?\" becomes a calculation rather than a position you chose.\n\nThe good news is that the mathematics is small. Everything in this lesson fits in a few hundred lines, and you will write a working 3D renderer from scratch before the end. The reason to do it once by hand is that every call you will later make in an engine, the camera, `lookAt`, the projection matrix, the normals, stops being magic.",
          },
          {
            heading: "Definition: vectors, dot and cross products",
            kind: "definition",
            body:
              "- **Vector** — an ordered list of numbers, here `[x, y, z]`. It can be a position, a direction, a velocity or a colour.\n- **Length** (magnitude) — √(x² + y² + z²). To **normalise** a vector is to divide it by its length, leaving a **unit vector**: a pure direction.\n- **Dot product** — `a · b = ax × bx + ay × by + az × bz`, which also equals |a| × |b| × cos θ, where θ is the angle between them. For unit vectors the dot product is the cosine of the angle: 1 means the same direction, 0 means at right angles, −1 means opposite. It answers \"how much does this point where that points?\", which covers field-of-view tests, lighting and \"is it in front of me?\".\n- **Cross product** — `a × b` is a vector at right angles to both, with length |a| × |b| × sin θ. In a right-handed system its direction follows the right-hand rule. It builds surface normals and camera axes.\n- **Normal** — a unit vector at right angles to a surface.\n- **Matrix** — a grid of numbers that transforms vectors. A 4 × 4 matrix working on `[x, y, z, w]` can express moving, turning, scaling and projecting in one form. The fourth number, `w`, is 1 for a point and 0 for a direction; lesson 5 returns to it.",
          },
          {
            heading: "From model space to a pixel: the chain of spaces",
            kind: "paragraph",
            body:
              "A 3D object is stored in its own private coordinates, with its origin somewhere sensible such as the middle of its feet. To appear on screen, each of its vertices passes through a chain of coordinate spaces.\n\n```\nmodel space  → world space  → view space  → clip space → NDC     → screen\n  (the file)   (the level)    (the camera)  (projected)  (-1..1)    (pixels)\n              model matrix    view matrix   projection   divide     viewport\n                                            matrix       by w\n```\n\nWritten as one line, with the convention that vectors are columns, `clip = projection × view × model × vertex`, and the matrices act from right to left. The order matters because matrix multiplication is not commutative: turning an object and then moving it is not the same as moving it and then turning it. Most \"my object is flying around the origin\" bugs are a multiplication in the wrong order.\n\nThe **model matrix** places the object in the world (position, rotation, scale). The **view matrix** is the inverse of the camera's own placement: moving the camera right is the same as moving the whole world left. The **projection matrix** squeezes the visible region into a standard box, and dividing by its fourth coordinate gives **normalised device coordinates**, where x and y run from −1 to 1. The final step stretches that to the window.",
          },
          {
            heading: "Perspective: the division by depth",
            kind: "paragraph",
            body:
              "A pinhole camera explains the whole of perspective in one line: `screenX = f × x ÷ z`. An object twice as far away has twice the `z`, so its offset from the middle of the screen is halved. That single division is why distant things are small and parallel railway lines meet at the horizon.\n\nThe focal length `f` comes from the **field of view**: `f = 1 ÷ tan(fov ÷ 2)`. A vertical field of view of about 60 degrees is a common default; first-person games often go wider. A wide lens exaggerates perspective, so near objects balloon and the edges stretch. A narrow lens flattens it, as a telephoto lens does. The cube demo below keeps the cube the same size on screen as you change the field of view (a \"dolly zoom\"), so you see only the change in perspective. An **orthographic** projection skips the division entirely: parallel lines stay parallel, which suits isometric games, technical drawings and interfaces.\n\nTwo planes bound the view. Everything nearer than the **near plane** or farther than the **far plane** is not drawn. The near plane must be greater than zero, because dividing by `z = 0` is impossible and points behind the camera would come out mirrored, so they must be clipped first. Depth precision is not spread evenly: it is concentrated near the camera. A near plane of 0.001 with a far plane of 100,000 leaves surfaces that are close together with nothing to tell them apart, and they flicker against each other, which is called **z-fighting**. Push the near plane out as far as the game can tolerate.",
          },
          {
            heading: "Triangles, rasterisation, depth and shaders",
            kind: "paragraph",
            body:
              "Every 3D surface is built from triangles, because three points are always flat, and graphics hardware is designed around them. **Rasterisation** takes a projected triangle and works out which pixels it covers, interpolating colours and coordinates across it. The **depth buffer** stores the nearest depth drawn so far at every pixel, so a nearer surface overwrites a farther one regardless of the order in which they are drawn. **Back-face culling** skips triangles that face away from the camera, decided by the order in which their corners are listed: this is the cross product from above, put to work.\n\nA **shader** is a small program that runs on the graphics card. A **vertex shader** runs once per vertex and carries out the transforms in the pipeline. A **fragment shader** (or pixel shader) runs once per covered pixel and decides its colour, including lighting. That gives the cost model that governs the rest of this course: vertex work grows with the number of vertices, but fragment work grows with the number of pixels multiplied by overdraw, so resolution is paid for in the shaders. The loop in the cube demo handles one corner at a time; a graphics card runs thousands of copies of the same idea in parallel.",
          },
          {
            heading: "Worked example: dot, cross, light and one vertex's journey",
            kind: "example",
            body:
              "Each part of this sample answers one question. Which targets can a guard see? Which way does a triangle face? How bright is a surface lit from four directions? Where does one corner of a cube land on a 1920 × 1080 screen, and what happens when it moves away?",
            code:
              "// A vector is just three numbers: [x, y, z].\nconst sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];\nconst dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];\nconst cross = (a, b) => [\n  a[1] * b[2] - a[2] * b[1],\n  a[2] * b[0] - a[0] * b[2],\n  a[0] * b[1] - a[1] * b[0],\n];\nconst length = (a) => Math.sqrt(dot(a, a));\nconst normalize = (a) => a.map((v) => v / length(a));\nconst round = (n) => Math.round(n * 1000) / 1000;\nconst deg = (radians) => (radians * 180) / Math.PI;\n\n// 1) The dot product answers \"how much does this point where I am looking?\"\n//    A guard at the origin faces +z and sees 90 degrees: 45 to either side.\nconst guard = { position: [0, 0, 0], facing: [0, 0, 1], fov: 90 };\nfunction canSee(guard, target) {\n  const toTarget = normalize(sub(target, guard.position));\n  const cosHalfAngle = Math.cos(((guard.fov / 2) * Math.PI) / 180);\n  return dot(guard.facing, toTarget) >= cosHalfAngle;       // no inverse cosine needed\n}\nfor (const target of [[3, 0, 4], [5, 0, 1], [0, 0, -3]]) {\n  const d = dot(guard.facing, normalize(sub(target, guard.position)));\n  console.log(\n    'target',\n    JSON.stringify(target),\n    ' dot =',\n    round(d),\n    ' angle =',\n    round(deg(Math.acos(d))),\n    'deg ',\n    ' sees it:',\n    canSee(guard, target)\n  );\n}\n\n// 2) The cross product answers \"which way does this surface face?\"\nconst A = [0, 0, 0], B = [1, 0, 0], C = [0, 1, 0];\nconsole.log(\n  'normal, counter-clockwise corners:',\n  JSON.stringify(normalize(cross(sub(B, A), sub(C, A))))\n);\nconsole.log(\n  'normal, clockwise corners:        ',\n  JSON.stringify(normalize(cross(sub(C, A), sub(B, A))))\n);\n\n// 3) Diffuse (Lambert) light: brightness = max(0, normal . direction-to-light)\nconst normal = normalize(cross(sub(B, A), sub(C, A)));\nconst lambert = (n, toLight) => Math.max(0, dot(n, normalize(toLight)));\nfor (const toLight of [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, -1]]) {\n  console.log(\n    'light from',\n    JSON.stringify(toLight),\n    ' brightness =',\n    round(lambert(normal, toLight))\n  );\n}\n\n// 4) One vertex, all the way down the pipeline: model -> world -> view -> clip -> screen.\nconst SCREEN_W = 1920, SCREEN_H = 1080;\n// focal length for a 60 degree vertical field of view\nconst f = 1 / Math.tan((60 * Math.PI) / 180 / 2);\nconst aspect = SCREEN_W / SCREEN_H;\nfunction toScreen(p, distance) {\n  // model -> world: turn 30 degrees about Y,\n  const a = (30 * Math.PI) / 180;\n  // then place it in front of the camera\n  const world = [\n    p[0] * Math.cos(a) + p[2] * Math.sin(a),\n    p[1],\n    -p[0] * Math.sin(a) + p[2] * Math.cos(a) + distance,\n  ];\n  // world -> view: the camera is at the origin, looking down +z\n  const view = world;\n  // view -> clip -> NDC: divide by depth, the whole trick\n  const ndcX = ((f / aspect) * view[0]) / view[2];\n  const ndcY = (f * view[1]) / view[2];\n  // NDC (-1 to 1) -> pixels; screen y points down\n  return [\n    round((ndcX * 0.5 + 0.5) * SCREEN_W),\n    round((1 - (ndcY * 0.5 + 0.5)) * SCREEN_H),\n  ];\n}\nconsole.log(\n  'corner (1, 1, 1), 6 units away: pixel',\n  JSON.stringify(toScreen([1, 1, 1], 6))\n);\nconst top6 = toScreen([0, 1, 0], 6), top12 = toScreen([0, 1, 0], 12);\nconsole.log(\n  'top of the axis, 6 units away: pixel',\n  JSON.stringify(top6),\n  ' height above centre =',\n  round(SCREEN_H / 2 - top6[1]),\n  'px'\n);\nconsole.log(\n  'top of the axis, 12 units away: pixel',\n  JSON.stringify(top12),\n  ' height above centre =',\n  round(SCREEN_H / 2 - top12[1]),\n  'px'\n);",
            language: "javascript",
            codeLabel: "Console: dot, cross, light and one vertex's journey",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The guard sees 90 degrees, 45 to each side. The first target is 36.87 degrees off the facing direction, so it is visible; the second is 78.69 degrees off, so it is not; the third has a dot product of −1, which means directly behind. The test compared cosines directly and never needed the comparatively expensive inverse cosine.\n\nThe two normals show how corner order decides which way a surface faces: swapping the order of the corners flips the normal from `[0, 0, 1]` to `[0, 0, -1]`, and that is how a renderer tells a front face from a back face. The lighting lines are Lambert's cosine law: 1 when the light shines straight on, 0.707 (the cosine of 45 degrees) at an angle, 0 when it grazes the surface edge-on, and 0 again behind it, where the raw value of −1 is clamped.\n\nIn the last block, the cube corner passes through the model, world and view steps and arrives at pixel (1160.7, 393.1). The final two lines isolate perspective. The top of the cube's axis stands 155.885 pixels above the centre of the screen at a distance of 6 and exactly 77.942 pixels above it at a distance of 12: double the distance, half the height.",
            code:
              "target [3,0,4]  dot = 0.8  angle = 36.87 deg   sees it: true\ntarget [5,0,1]  dot = 0.196  angle = 78.69 deg   sees it: false\ntarget [0,0,-3]  dot = -1  angle = 180 deg   sees it: false\nnormal, counter-clockwise corners: [0,0,1]\nnormal, clockwise corners:         [0,0,-1]\nlight from [0,0,1]  brightness = 1\nlight from [1,0,1]  brightness = 0.707\nlight from [1,0,0]  brightness = 0\nlight from [0,0,-1]  brightness = 0\ncorner (1, 1, 1), 6 units away: pixel [1160.699,393.078]\ntop of the axis, 6 units away: pixel [960,384.115]  height above centre = 155.885 px\ntop of the axis, 12 units away: pixel [960,462.058]  height above centre = 77.942 px",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: a cube from numbers",
            kind: "example",
            body:
              "Press Run page. Eight corners, twelve edges, three small transforms and one projection are all it takes. Drag the **Field of view** slider and watch the perspective change while the cube stays the same size: at 20 degrees the lens is nearly orthographic, and at 100 degrees the near face looms and the far face shrinks. Tick **orthographic** and the slider stops mattering, because there is no division by depth.\n\nRead the code in the order the maths runs. The corners are all combinations of ±1. An edge joins two corners that differ in exactly one coordinate (hold on to that rule: lesson 5 uses it unchanged on a tesseract). `rotateY`, `rotateX` and `translate` carry the model into view space, and `project` divides by depth.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee; font: 12px system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 6px 8px;\n  }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; background: #1c1840;\n  }\n  input[type=range] { width: 130px; vertical-align: middle; }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <label>Field of view\n    <input id=\"fov\" type=\"range\" min=\"20\" max=\"100\" value=\"60\"> <b id=\"fovText\">60°</b>\n  </label>\n  <label><input id=\"ortho\" type=\"checkbox\"> orthographic</label>\n</div>\n<canvas id=\"c\" width=\"480\" height=\"220\"></canvas>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst W = canvas.width, H = canvas.height;\nconst PIXELS = H * 0.7;                       // how many pixels one screen unit is worth\nconst fovInput = document.getElementById('fov');\nconst orthoInput = document.getElementById('ortho');\ndocument.getElementById('fov').addEventListener('input', () => {\n  document.getElementById('fovText').textContent = fovInput.value + '°';\n});\n\n// 1. The model: 8 corners, and 12 edges = pairs of corners that differ in\n// exactly one coordinate.\nconst corners = [];\nfor (const x of [-1, 1])\n  for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x, y, z]);\nconst edges = [];\nfor (let i = 0; i < corners.length; i++) {\n  for (let j = i + 1; j < corners.length; j++) {\n    let differences = 0;\n    for (let k = 0; k < 3; k++) if (corners[i][k] !== corners[j][k]) differences++;\n    if (differences === 1) edges.push([i, j]);\n  }\n}\n\n// 2. Transforms: each takes a point and returns a new point.\nconst rotateY = (p, a) => [\n  p[0] * Math.cos(a) + p[2] * Math.sin(a),\n  p[1],\n  -p[0] * Math.sin(a) + p[2] * Math.cos(a),\n];\nconst rotateX = (p, a) => [\n  p[0],\n  p[1] * Math.cos(a) - p[2] * Math.sin(a),\n  p[1] * Math.sin(a) + p[2] * Math.cos(a),\n];\nconst translate = (p, dx, dy, dz) => [p[0] + dx, p[1] + dy, p[2] + dz];\n\n// 3. Projection: perspective divides by depth, orthographic does not.\nfunction project(p, f, distance, orthographic) {\n  // perspective: farther means smaller\n  const scale = orthographic ? f / distance : f / p[2];\n  return { x: W / 2 + p[0] * scale * PIXELS, y: H / 2 - p[1] * scale * PIXELS, z: p[2] };\n}\n\nlet angle = 0, last = performance.now();\nfunction frame(now) {\n  angle += Math.min((now - last) / 1000, 0.1); last = now;\n  const fov = Number(fovInput.value);\n  // focal length from the vertical field of view\n  const f = 1 / Math.tan((fov * Math.PI) / 360);\n  // dolly: a wider lens means standing closer,\n  const distance = 3.5 * f;\n                                                                  // so the\n                                                                  // cube\n                                                                  // keeps\n                                                                  // the\n                                                                  // same\n                                                                  // size on\n                                                                  // screen\n  const points = corners.map((c) => {\n    // model space -> world space\n    let p = rotateY(c, angle * 0.8);\n    p = rotateX(p, angle * 0.5);\n    // world space -> view space: put it in front of the camera\n    p = translate(p, 0, 0, distance);\n    return project(p, f, distance, orthoInput.checked);           // view space -> screen\n  });\n\n  ctx.clearRect(0, 0, W, H);\n  ctx.lineWidth = 2;\n  for (const [i, j] of edges) {\n    // nearer edges are drawn brighter\n    const depth = (points[i].z + points[j].z) / 2;\n    const t = Math.max(0, Math.min(1, (distance + 1.8 - depth) / 3.6));\n    ctx.strokeStyle = 'rgba(61, 220, 208,' + (0.25 + 0.75 * t).toFixed(2) + ')';\n    ctx.beginPath();\n    ctx.moveTo(points[i].x, points[i].y);\n    ctx.lineTo(points[j].x, points[j].y);\n    ctx.stroke();\n  }\n  ctx.fillStyle = '#ff7448';\n  for (const p of points) {\n    ctx.beginPath();\n    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);\n    ctx.fill();\n  }\n  ctx.fillStyle = '#c9c5ee'; ctx.font = '11px system-ui';\n  ctx.fillText(\n    (orthoInput.checked ? 'orthographic' : 'perspective') +\n      '   fov ' +\n      fov +\n      '°   camera distance ' +\n      distance.toFixed(1),\n    8,\n    14\n  );\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: a software-rendered cube",
          },
          {
            heading: "Reference: axes, handedness and units in common tools",
            kind: "table",
            rows: [
              ["Tool", "Up axis", "Handedness", "Camera looks along", "One unit is usually"],
              ["Unity", "Y", "Left-handed", "+Z", "1 metre (by convention)"],
              ["Unreal Engine", "Z", "Left-handed", "+X", "1 centimetre"],
              ["Godot", "Y", "Right-handed", "−Z", "1 metre (by convention)"],
              ["three.js, OpenGL, glTF", "Y", "Right-handed", "−Z", "Unitless (1 metre by convention)"],
              ["Blender", "Z", "Right-handed", "−Z (a camera's own axis)", "1 metre"],
            ],
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Multiplying matrices in the wrong order.** Rotate-then-move and move-then-rotate differ, and a library that stores vectors as rows reverses the order again.\n- **Mixing handedness.** The result is a mirrored model, faces that look inside out, or an asset that arrives lying on its side from a Z-up tool. Check the table when moving assets between programs.\n- **Using a dot product as an angle without normalising.** The cosine relationship only holds for unit vectors.\n- **Transforming normals with the model matrix when the scale is not uniform.** The lighting skews. Normals need the inverse transpose of the matrix.\n- **Dividing by `z` for points behind the camera.** The geometry mirrors itself. Clip against the near plane first.\n- **A tiny near plane and a huge far plane.** Depth precision collapses and surfaces flicker.\n- **Euler angles for everything.** Three angles can lose a degree of freedom (\"gimbal lock\") and drift when they are accumulated. Engines use quaternions, which lesson 5 shows are points on a four-dimensional sphere.\n- **Doing per-vertex maths on the processor every frame** when the engine or the graphics card can do it.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Vectors, the dot product and the cross product answer almost every geometric question a 3D game asks: facing, angle, field of view, surface orientation and light. A vertex travels through model, world, view, clip and screen space, and perspective is nothing more than a division by depth. Field of view, the near plane and handedness are the three settings that most often spoil a first 3D scene. A graphics card runs the same pipeline for millions of vertices and pixels at once, charging vertices for geometry and pixels multiplied by overdraw for shading.",
          },
        ],
        keyPoints: [
          "The dot product of unit vectors is the cosine of the angle between them; it answers facing, field-of-view and lighting questions without trigonometry.",
          "The cross product of two edges is the surface normal, and the order of the corners decides which side the normal points to.",
          "A vertex travels model → world → view → clip → NDC → screen, and perspective is the single division by depth.",
          "Field of view, the near plane and handedness are the three settings that most often break a first 3D scene.",
          "A GPU runs the same pipeline for millions of vertices and pixels in parallel; geometry costs vertices, shading costs pixels × overdraw.",
        ],
        exercises: [
          "A guard faces +z with a 120 degree field of view. Use the dot product to decide whether targets at (4, 0, 2) and (4, 0, −1) are visible.",
          "Compute by hand the normal of the triangle (0, 0, 0), (2, 0, 0), (0, 0, 3). Then swap two corners and compute it again.",
          "In the cube demo, replace the dolly distance with a fixed distance of 3 and move the field-of-view slider. What happens to the cube's apparent size, and why was the dolly version easier to read?",
          "Write the camera's forward, right and up unit vectors from a camera position and a target point, using cross products (the first step of a `lookAt` function).",
          "Add back-face culling to the cube demo: draw each of the six faces as a filled square and skip the faces whose projected corners run clockwise.",
        ],
        challenge:
          "Extend the cube demo into a small scene: three objects (a cube, a pyramid and a plane) each with its own model transform, a camera that orbits when you drag, back-face culling, and Lambert shading using normals from cross products. Report the vertex and triangle counts and how long a frame takes, measured with `performance.now()`.",
      }),

      lesson({
        id: "building-in-3d-light-physics-and-engines",
        title: "Building in 3D: light, physics, performance and engines",
        summary:
          "Almost nobody ships a game by writing their own renderer. This lesson covers what an engine gives you: scenes and transforms, meshes, materials and light, physics that stays stable, and the levers that keep a scene inside its frame budget. It ends with a practical way to choose between Godot, Unity, Unreal and the web libraries.",
        objectives: [
          "Describe a scene as a tree of transforms carrying components, and say what an engine adds to a hand-written loop.",
          "Explain meshes, textures, materials and the common light types, and compute simple diffuse and specular lighting.",
          "Pick a stable integrator, step physics at a fixed rate, and use ray casts for aiming, picking and line of sight.",
          "Reduce the cost of a scene with culling, batching, instancing and level of detail, after finding out which processor is the bottleneck.",
          "Compare Godot, Unity, Unreal and the web 3D libraries for a given project, team and target device.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Lesson 3 built a renderer in under a hundred lines of JavaScript. A modern engine is millions of lines, and the question is what you are buying. The answer is a scene editor, importers for models and sound, a physics engine, animation, input, interface tools, and build tools that produce an Android package or a web page. You are paying for time.\n\nWhat you are not buying is judgment. The engine hands you the controls: a normal map, a shadow distance, a draw-call count. It does not tell you which ones matter on a phone with 3 GB of memory. For that you need the ideas in this lesson, and the frame budget from lesson 1.",
          },
          {
            heading: "Definition: the parts of a 3D game",
            kind: "definition",
            body:
              "- **Scene graph** — the world as a tree. Each node has a transform relative to its parent, so moving an arm moves the hand attached to it.\n- **Component** or **node behaviour** — data or logic attached to an object: a renderer, a collider, a light, a script. An **entity-component-system (ECS)** is the data-oriented variant, with entities as plain ids and components as arrays of data processed in bulk, which suits thousands of similar objects. Unity's DOTS and the Bevy engine are built that way.\n- **Mesh** — the vertices of a model (position, normal, texture coordinates) plus indices that group them into triangles.\n- **Texture** — an image looked up with texture coordinates. **Mipmaps** are a chain of smaller copies, and the graphics card picks the one that matches the object's size on screen.\n- **Material** — how a surface answers light. In **physically based rendering (PBR)** the usual inputs are base colour (albedo), metallic, roughness, a normal map and an emissive colour.\n- **Light** — directional (the sun), point (a bulb) or spot (a torch), plus ambient or environment light. **Shadow maps** draw the scene's depth from the light's point of view.\n- **Collider** and **rigid body** — the shape the physics engine uses, which is almost never the shape you draw. Bodies are static (never move), dynamic (moved by forces) or kinematic (moved by your code).\n- **Draw call** — one command to the graphics card to draw a batch of triangles. Each one costs processor time.\n- **Culling** — not drawing what cannot be seen: outside the view (frustum), hidden behind something (occlusion), or too far away.\n- **Level of detail (LOD)** — swapping a model for a simpler one as it shrinks on screen.",
          },
          {
            heading: "Light and materials: the model behind the sphere",
            kind: "paragraph",
            body:
              "Real-time lighting is a handful of dot products. With a surface normal `N`, a unit vector `L` toward the light and `V` toward the viewer:\n\n```\ndiffuse  = max(0, N · L)                  how directly the light hits\nH        = normalize(L + V)               halfway between light and viewer\nspecular = max(0, N · H) ^ shininess      the highlight\ncolour   = albedo × (ambient + diffuse) + specular\n```\n\nThe diffuse term is the Lambert cosine law from lesson 3. The specular term is the Blinn-Phong highlight: a higher `shininess` makes a smaller, sharper glint. PBR replaces these ad hoc terms with physically motivated ones, energy conservation, a Fresnel effect that makes glancing angles reflective, and a roughness model, but it still works from the same vectors.\n\nThree production facts matter more than the formulas. First, **baked lighting**: for things that never move, light and shadow can be computed once, ahead of time, and stored in textures. It costs disk space and no frame time, which is why mobile games lean on it. **Real-time shadows** cost an extra render of the scene per light, so a phone game usually has one shadowed directional light and nothing else. Second, **colour spaces**: colour textures are stored in sRGB, but data textures such as normal, roughness and metallic maps must be treated as linear data. Marking a normal map as sRGB is the most common reason a material looks wrong. Third, lighting arithmetic is done in linear space and converted to sRGB at the end.",
          },
          {
            heading: "Worked example: lighting a sphere per pixel",
            kind: "example",
            body:
              "Press Run page. Two spheres are lit from a light that orbits them. Their surface normals are never stored: for a sphere, the normal at a point is simply that point divided by the radius, so the code computes `nz = sqrt(1 − nx² − ny²)` and has everything it needs. The left sphere uses diffuse light only; the right adds the specular highlight. When the light swings behind them, the lit part shrinks to a thin rim, because `max(0, N · L)` is zero wherever the surface faces away.\n\nDrag **Shininess** and watch the highlight tighten. Then try a change of your own: add a coloured light, add a rim light with `pow(1 − N · V, 3)`, or quantise the diffuse value into three bands to get a cartoon look.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee; font: 12px system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 6px 8px;\n  }\n  canvas { display: block; width: 100%; max-width: 480px; height: auto; }\n  input[type=range] { width: 120px; vertical-align: middle; }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <label>Shininess\n    <input id=\"shine\" type=\"range\" min=\"2\" max=\"128\" value=\"40\"> <b id=\"shineText\">40</b>\n  </label>\n  <label><input id=\"spin\" type=\"checkbox\" checked> orbit the light</label>\n</div>\n<canvas id=\"c\" width=\"480\" height=\"190\"></canvas>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst W = canvas.width, H = canvas.height;\nconst image = ctx.createImageData(W, H);\nconst pixels = image.data;\nconst shineInput = document.getElementById('shine');\nshineInput.addEventListener('input', () => {\n  document.getElementById('shineText').textContent = shineInput.value;\n});\n\nconst BACKGROUND = [28, 24, 64];\n// the surface colour: what the material reflects\nconst ALBEDO = [61, 220, 208];\nconst AMBIENT = 0.12;                     // a little light that comes from everywhere\n\nfunction normalize(v) {\n  const l = Math.hypot(v[0], v[1], v[2]);\n  return [v[0] / l, v[1] / l, v[2] / l];\n}\n\n// Shade one sphere. The normal of a sphere at a point is just that point,\n// divided by the radius.\nfunction drawSphere(cx, cy, radius, light, specular, shininess) {\n  // halfway between the light and the viewer (+z)\n  const half = normalize([light[0], light[1], light[2] + 1]);\n  for (let y = -radius; y < radius; y++) {\n    for (let x = -radius; x < radius; x++) {\n      const nx = x / radius, ny = -y / radius, d2 = nx * nx + ny * ny;\n      if (d2 > 1) continue;\n      // the z that puts (nx, ny, nz) on the sphere\n      const nz = Math.sqrt(1 - d2);\n      // Lambert: N . L\n      const diffuse = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);\n      const spec = specular\n        ? Math.pow(Math.max(0, nx * half[0] + ny * half[1] + nz * half[2]), shininess) *\n          (diffuse > 0 ? 1 : 0)\n        : 0;\n      // soft edge instead of a staircase\n      const coverage = Math.min(1, (1 - Math.sqrt(d2)) * radius);\n      const i = ((cy + y) * W + (cx + x)) * 4;\n      for (let c = 0; c < 3; c++) {\n        const lit = ALBEDO[c] * (AMBIENT + diffuse * (1 - AMBIENT)) + 255 * spec * 0.9;\n        pixels[i + c] = BACKGROUND[c] + (Math.min(255, lit) - BACKGROUND[c]) * coverage;\n      }\n      pixels[i + 3] = 255;\n    }\n  }\n}\n\nlet angle = 0.9, last = performance.now();\nfunction frame(now) {\n  if (document.getElementById('spin').checked)\n    angle += Math.min((now - last) / 1000, 0.1) * 0.9;\n  last = now;\n  for (let i = 0; i < pixels.length; i += 4) {\n    pixels[i] = BACKGROUND[0];\n    pixels[i + 1] = BACKGROUND[1];\n    pixels[i + 2] = BACKGROUND[2];\n    pixels[i + 3] = 255;\n  }\n  // a direction, pointing toward the light\n  const light = normalize([Math.sin(angle), 0.45, Math.cos(angle)]);\n  const shininess = Number(shineInput.value);\n  drawSphere(125, 88, 72, light, false, shininess);\n  drawSphere(355, 88, 72, light, true, shininess);\n  ctx.putImageData(image, 0, 0);\n  ctx.fillStyle = '#c9c5ee'; ctx.font = '11px system-ui';\n  ctx.fillText('diffuse only', 8, 14);\n  ctx.fillText('diffuse + specular', 240 + 8, 14);\n  ctx.fillText(\n    'light angle ' + Math.round(((angle * 180) / Math.PI) % 360) + '\\u00b0',\n    8,\n    H - 8\n  );\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: lighting a sphere per pixel",
          },
          {
            heading: "Physics that does not explode",
            kind: "paragraph",
            body:
              "Physics runs at a fixed step (lesson 1) and the choice of integrator decides whether it stays sane.\n\n- **Integrators.** Explicit Euler moves with the old velocity and then updates the velocity. It quietly adds energy to anything that oscillates, so springs and orbits gain energy and fly apart. **Semi-implicit Euler** updates the velocity first and moves with the new one. It is as cheap and it stays bounded, which is why it is the default in most engines. Verlet and Runge-Kutta methods trade more work for more accuracy.\n- **A stability limit exists.** Even the good integrator explodes if the step is too long for how stiff the system is: for a spring it must be shorter than 2 ÷ ω, where ω = √(stiffness ÷ mass).\n- **Tunnelling.** Fast bodies skip thin walls in 3D just as in 2D. Engines offer continuous collision detection for bullets and other fast bodies.\n- **Colliders.** Boxes, spheres and capsules are cheap. Convex hulls are moderate. Triangle meshes are for static scenery only. Keep colliders far simpler than the visible models.\n- **Ray casts.** A ray from an origin along a direction asks \"what does this hit first?\" Aiming, bullets, ground checks, line of sight and mouse picking (a ray through the cursor) are all ray casts.\n- **Character controllers.** Player characters are usually kinematic capsules that slide along surfaces, not dynamic bodies tossed around by forces, because predictable movement beats realism.",
          },
          {
            heading: "Worked example: integrators, a ray and level of detail",
            kind: "example",
            body:
              "Three questions, three short programs. How wrong does a spring get at 60 steps a second with each integrator? Where does a ray from the origin meet a sphere? And which model should an object use at four distances on three screens?",
            code:
              "// PART 1 - integrators. A spring pulls a 1 kg mass toward zero (stiffness 100).\n// Nothing adds or removes energy, so it should stay at 0.5 * 100 * 1 * 1 = 50 joules.\nconst K = 100, MASS = 1;\nconst energy = (s) => 0.5 * MASS * s.v * s.v + 0.5 * K * s.x * s.x;\n\nfunction explicitEuler(s, dt) {            // move first, using the OLD velocity\n  const a = (-K * s.x) / MASS;\n  s.x += s.v * dt;\n  s.v += a * dt;\n}\n// update velocity first, then move with the NEW velocity\nfunction semiImplicitEuler(s, dt) {\n  s.v += ((-K * s.x) / MASS) * dt;\n  s.x += s.v * dt;\n}\nfunction simulate(step, seconds, dt) {\n  const s = { x: 1, v: 0 };\n  for (let i = 0; i < Math.round(seconds / dt); i++) step(s, dt);\n  return energy(s);\n}\nconsole.log(\n  'explicit Euler,      60 steps/s: ' +\n    simulate(explicitEuler, 10, 1 / 60).toExponential(2) +\n    ' J after 10 s'\n);\nconsole.log(\n  'semi-implicit Euler, 60 steps/s: ' +\n    simulate(semiImplicitEuler, 10, 1 / 60).toFixed(1) +\n    ' J after 10 s'\n);\nconsole.log(\n  'semi-implicit Euler,  4 steps/s: ' +\n    simulate(semiImplicitEuler, 10, 0.25).toExponential(2) +\n    ' J (step too big for this spring)'\n);\n\n// PART 2 - a ray against a sphere: the question behind aiming, picking and line of sight.\nconst sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];\nconst dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];\nconst round = (n) => Math.round(n * 1000) / 1000;\nfunction raySphere(origin, dir, center, radius) {      // dir must have length 1\n  const oc = sub(origin, center);\n  const b = dot(oc, dir);\n  const c = dot(oc, oc) - radius * radius;\n  const discriminant = b * b - c;\n  if (discriminant < 0) return null;                   // the ray misses\n  const t = -b - Math.sqrt(discriminant);              // distance to the nearest hit\n  return t >= 0 ? t : null;                            // behind the origin does not count\n}\nfor (const center of [[0, 0, 10], [1, 0, 10], [5, 0, 10], [0, 0, -10]]) {\n  const t = raySphere([0, 0, 0], [0, 0, 1], center, 2);\n  console.log(\n    'sphere at',\n    JSON.stringify(center),\n    t === null ? 'no hit' : 'hit at distance ' + round(t)\n  );\n}\n\n// PART 3 - level of detail (LOD): choose a model by how many pixels the object covers.\nfunction screenDiameter(radius, distance, screenHeight, fovDegrees) {\n  const f = 1 / Math.tan((fovDegrees * Math.PI) / 360);\n  return ((2 * radius) / distance) * f * (screenHeight / 2);\n}\nfunction pickLod(pixels) {\n  if (pixels > 200) return 'LOD0';                     // 10,000 triangles\n  if (pixels > 50) return 'LOD1';                      // 2,500 triangles\n  if (pixels > 10) return 'LOD2';                      // 600 triangles\n  return 'billboard';                                  // a flat picture\n}\nfor (const distance of [5, 20, 80, 320]) {\n  const parts = [1080, 2160, 4320].map((height) => {\n    const px = screenDiameter(1, distance, height, 60);\n    return height + 'p ' + Math.round(px) + ' px ' + pickLod(px);\n  });\n  console.log(String(distance).padStart(3) + ' m: ' + parts.join(' | '));\n}",
            language: "javascript",
            codeLabel: "Console: integrators, a ray cast and level of detail",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The spring should hold 50 joules forever. Explicit Euler ends at 6.89 × 10⁸ joules, about fourteen million times too much, after only ten seconds at 60 steps a second. Semi-implicit Euler ends at 53.2 joules, within 7% and bounded however long you run it. The third line shows the stability limit: this spring has ω = 10, so steps must be shorter than 0.2 seconds, and at 0.25 seconds even the good integrator blows up to 10⁵⁰.\n\nThe ray tests are simple geometry. A sphere of radius 2 centred 10 units ahead is hit at distance 8. Shifted 1 unit sideways, the hit moves to 10 − √3 = 8.268. At 5 units sideways the ray misses, and a sphere behind the origin is not hit at all.\n\nThe last block is the one to remember. The LOD decision is made in **pixels**, so the same object at the same distance changes model when the resolution changes. At 80 metres the prop is 23 pixels tall at 1080p and uses LOD2; at 8K it is 94 pixels tall and needs LOD1. Higher resolution costs more than the pixel count alone, because it also demands more detailed assets. Lesson 8 returns to this.",
            code:
              "explicit Euler,      60 steps/s: 6.89e+8 J after 10 s\nsemi-implicit Euler, 60 steps/s: 53.2 J after 10 s\nsemi-implicit Euler,  4 steps/s: 1.62e+50 J (step too big for this spring)\nsphere at [0,0,10] hit at distance 8\nsphere at [1,0,10] hit at distance 8.268\nsphere at [5,0,10] no hit\nsphere at [0,0,-10] no hit\n  5 m: 1080p 374 px LOD0 | 2160p 748 px LOD0 | 4320p 1496 px LOD0\n 20 m: 1080p 94 px LOD1 | 2160p 187 px LOD1 | 4320p 374 px LOD0\n 80 m: 1080p 23 px LOD2 | 2160p 47 px LOD2 | 4320p 94 px LOD1\n320 m: 1080p 6 px billboard | 2160p 12 px LOD2 | 4320p 23 px LOD2",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Performance levers: find the bottleneck first",
            kind: "paragraph",
            body:
              "A frame is limited by either the processor or the graphics card, and fixing the wrong one wastes the afternoon. The test is quick: lower the resolution. If the frame time drops roughly in proportion to the pixels, the graphics card is the bottleneck (**fill-rate** or shader bound). If it barely moves, the processor is: too many draw calls, too much script, physics, or garbage collection. Lesson 9 turns this into a method.\n\nOnce you know which side is slow, the levers are well known.\n\n- **Fewer draw calls.** Batch objects that share a material, merge static meshes, use texture atlases, and use **instancing** to draw one mesh many times in a single call (forests, crowds, bullets).\n- **Culling.** Frustum culling is automatic. Occlusion culling and distance culling for small props are worth switching on.\n- **LOD and impostors.** Swap meshes as they shrink; replace distant trees with flat pictures that face the camera.\n- **Sensible triangle counts.** Cards handle millions of triangles, but triangles smaller than a few pixels waste work because pixels are shaded in 2 × 2 blocks.\n- **Texture discipline.** Compress textures and match their size to how much of the screen they cover. On phones, memory is usually the real limit (lesson 8).\n- **Test on the target.** A phone shares memory with the processor and slows itself down when hot. Measure a release build on a mid-range phone after ten minutes, not the editor on your laptop.",
          },
          {
            heading: "Reference: engines and libraries at a glance",
            kind: "table",
            rows: [
              ["Tool", "Language", "Strong at", "Reaches", "Watch for"],
              ["Godot", "GDScript, C#, C++", "2D and light 3D, small downloads, open source (MIT licence)", "Android, iOS, desktop, web", "A smaller asset ecosystem; 3D is lighter than Unreal's"],
              ["Unity", "C#", "2D and 3D, mobile-first projects, a large store and body of tutorials", "Android, iOS, desktop, console, web", "Licence terms have changed before, so read the current terms; a heavy editor"],
              ["Unreal Engine", "C++ and Blueprints", "High-end 3D, large worlds, cinematic graphics", "Desktop, console, mobile", "Needs a strong computer; large projects and builds"],
              ["three.js, Babylon.js", "JavaScript, TypeScript", "3D in the browser, shared by a link", "Any modern browser", "They are libraries, not editors (Babylon has more tooling); limited by the device's browser"],
              ["Phaser, PixiJS", "JavaScript", "2D in the browser", "Web, wrapped for mobile", "2D only; PixiJS is just a renderer, so physics and tools are yours to add"],
              ["Bevy, Raylib, MonoGame", "Rust, C, C#", "Learning and control", "Desktop, some web", "You build the tools yourself"],
            ],
          },
          {
            heading: "Choosing an engine",
            kind: "paragraph",
            body:
              "Choose with questions, not trailers.\n\n- **What is the weakest device you must support?** A mid-range Android phone points at Godot, Unity or the web. Photorealism on a gaming PC points at Unreal.\n- **What does your team already know?** JavaScript leads to the web libraries, C# to Unity or Godot, C++ to Unreal. Learning a language and an engine at once is slow.\n- **How big can the download be?** A web build or a small Godot export is megabytes; a large engine's default build is far bigger.\n- **What are the licence and platform terms today?** They change, so check them before you commit and again before you ship.\n- **How much help exists?** Tutorials, answers and ready-made assets decide how quickly you get unstuck.\n\nThen do the one experiment that settles most arguments: build your riskiest mechanic in two candidates over a weekend and compare. The mechanic that makes you fight the engine is information.",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Stepping physics by frame time.** Use a fixed step, or bodies behave differently at different frame rates.\n- **Mesh colliders everywhere.** Use boxes, spheres and capsules, and keep triangle meshes for static scenery.\n- **Oversized textures.** A 4K map on a small prop, uncompressed and without mipmaps, is the quickest way to run out of memory.\n- **Normal maps marked as sRGB colour.** They are data and must be linear.\n- **One unique material per object.** It multiplies draw calls. Share materials and atlases.\n- **Real-time shadows on every light on a phone.** One shadowed light is usually the limit.\n- **Profiling in the editor.** Editor overhead is not your game. Test a release build on the target.\n- **Optimising before measuring.** Lower the resolution first and find out which processor is slow.\n- **Choosing an engine by its trailer** instead of by device, team and download size.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A scene is a tree of transforms with components, and an engine supplies the tools while you keep ownership of the frame budget. Diffuse light is the dot product of normal and light direction, specular adds a highlight from the half vector, and data textures live in a different colour space from colour textures. Physics steps at a fixed rate with at least semi-implicit Euler, uses simple colliders, and answers questions with ray casts. Lowering the resolution reveals which processor is the bottleneck. And an engine is chosen by target device, team skills, download size and current licence terms, then tested on the riskiest mechanic.",
          },
        ],
        keyPoints: [
          "A scene is a tree of transforms with components; the engine supplies tools, but you still own the frame budget.",
          "Diffuse light is the dot of normal and light direction, specular adds a highlight from the half vector, and colour textures and data textures need different colour spaces.",
          "Step physics at a fixed rate with semi-implicit Euler or better, keep colliders simple, and use ray casts for aiming, picking and line of sight.",
          "Find the bottleneck first: lowering the resolution tells you whether a frame is limited by the graphics card or the processor.",
          "Choose an engine by target device, team skills, download size and current licence terms, then test your riskiest mechanic in two candidates.",
        ],
        exercises: [
          "Compute the Lambert brightness for a surface normal (0, 1, 0) and light directions (0, 1, 0), (1, 1, 0) and (1, −1, 0).",
          "Change the spring stiffness in the console sample to 400. Use the stability limit 2 ÷ ω to predict the largest stable step for semi-implicit Euler, then test it.",
          "Write a ray–plane intersection for a floor at y = 0 and use it to find where a ray from a camera through a cursor lands on the ground.",
          "A scene has 200 crates and 3 materials. Count the draw calls with no batching, with batching by material, and with instancing.",
          "Pick a game idea and a target device. Write one paragraph choosing an engine and one paragraph rejecting another, using the \"watch for\" column of the table.",
        ],
        challenge:
          "Build a small 3D prototype in the engine or library you chose: a character on a fixed-step capsule controller, a ray-cast ground check, three kinds of light, two LOD levels for one prop and an on-screen frame-time counter. Test it on a mid-range phone or the weakest machine you own, and write half a page on what the bottleneck was and how you proved it by changing the resolution.",
      }),
    ]
  ),
  module(
    "four-five-and-beyond",
    "03 · Four dimensions, five dimensions and beyond",
    "A fourth direction of space, the fourth dimension of time and sensation, and what happens when a dimension is simply an axis of state.",
    [
      lesson({
        id: "the-fourth-dimension-of-space",
        title: "The fourth dimension of space",
        summary:
          "A fourth spatial dimension is not mystical: it is a fourth number in every point. This lesson builds a tesseract from a rule you already know, rotates it in six planes, shows two ways a flat screen can see it (projection and slicing), and explains how real games such as Miegakure, 4D Toys and 4D Golf make a four-dimensional world playable.",
        objectives: [
          "Describe a point, a distance and a cube in four spatial dimensions, and count the parts of a tesseract.",
          "Rotate in a plane rather than around an axis, name the six rotation planes of 4D, and say what a double rotation is.",
          "Compare projection and slicing as ways to show 4D, and predict how the slice of a tesseract changes with the hyperplane.",
          "Use dimension analogy to reason about 4D mechanics and puzzle design.",
          "Name the real games and the techniques that make 4D playable, and the design problems they had to solve.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Four different things get called \"4D\" in games, and they have little in common except the name. There is a **fourth direction of space**, at right angles to the three we live in. There is **time**, treated as a dimension you can store and replay. There is the **fourth number** that sits in every vertex and every rotation inside a normal 3D engine. And there is **4D entertainment**, the cinema seat that tilts and sprays mist. This lesson is about the first. Lesson 6 takes the other three.\n\nSo for this lesson, \"4D\" means a fourth spatial direction. Not time. The developers of the 4D games below are firm about it, and so should you be: if you let the two meanings blur, none of the mathematics makes sense.\n\nThe good news is that the mathematics is not harder than 3D, only longer. If you can write the cube in lesson 3, you can write a tesseract by changing one number.",
          },
          {
            heading: "Definition: space with four directions",
            kind: "definition",
            body:
              "- **A 4D point** is four numbers, `(x, y, z, w)`. Distance is Pythagoras with four terms, √(x² + y² + z² + w²), and the dot product adds four products. We cannot point at the `w` direction, but arithmetic does not care.\n- **A tesseract** (or hypercube) has a corner at every combination of ±1 in all four coordinates: 2 × 2 × 2 × 2 = **16 corners**. Two corners are joined by an **edge** when they differ in exactly one coordinate, which gives **32 edges**. It has **24 square faces** and **8 cubic cells**. Check: corners − edges + faces + cells with alternating signs, 16 − 32 + 24 − 8, is 0, as it must be for the surface of a 4D shape.\n- **Parts of an n-cube.** An n-dimensional cube has C(n, k) × 2^(n − k) parts of dimension k. For n = 4 and k = 2 that is 6 × 4 = 24 squares.\n- **Plane of rotation.** Rotating means turning one axis toward another. In 3D we say \"around the z axis\", but that is really \"in the xy plane\", with z left fixed. In 4D, turning in the xy plane leaves **two** axes fixed, z and w, so \"around an axis\" stops making sense and \"in a plane\" is the only honest wording. There are six planes: xy, xz, yz, xw, yw and zw. Any pair of axes is a plane, so n dimensions have n × (n − 1) ÷ 2 of them.\n- **Double rotation.** In 4D you can turn in two perpendicular planes at once, for example xy and zw. When both angles are equal (an isoclinic rotation) every point moves along a circle of constant size. There is no equivalent in 3D.\n- **Projection and slice** are the two ways of showing 4D on a flat screen. A projection is a shadow. A slice is the cross-section a three-dimensional being would actually meet.",
          },
          {
            heading: "Rotating in a plane",
            kind: "paragraph",
            body:
              "Turning in the xw plane by an angle θ changes only x and w:\n\n```\nx' = x × cos θ − w × sin θ\nw' = x × sin θ + w × cos θ        (y and z stay as they are)\n```\n\nThe same three lines turn any pair of axes in any number of dimensions, so one function, `rotate(point, a, b, angle)`, serves 3D, 4D and beyond. To keep a long-running spin, keep the orientation as a 4 × 4 matrix and multiply a small rotation into it every frame. The order matters, as in 3D: turning in xw and then yw is not the same as the other way round.\n\nRotations that involve `w` are the interesting ones. Spin in xy, xz or yz and the tesseract just turns like an ordinary cube; the `w` coordinates never change. Spin in any plane containing `w` and corners that were far in `w` swing near while near ones swing far, so the nested cubes trade places and the whole shape appears to turn through itself. That is as close as a flat screen gets to seeing the fourth dimension move.",
          },
          {
            heading: "Seeing 4D: projection",
            kind: "paragraph",
            body:
              "A projection squeezes one dimension away, and we can do it twice. Put the viewer at `w = d` and scale each point by `d ÷ (d − w)`: points with smaller `w` are farther away and come out smaller. That turns 4D into 3D, and lesson 3's perspective turns 3D into 2D. Seen this way a tesseract is the famous **cube within a cube**: the small far cube inside the big near one, joined by eight edges that run along `w`.\n\nThe picture is a shadow, not the shape. The \"inner\" cube is not inside the outer one; it is simply farther along `w`, and the edges that look as if they cross do not touch. Colouring by `w`, fading by depth and, above all, rotating are the cues that let the structure emerge. The viewer distance must be larger than the shape's radius or the division by `d − w` flips sign, which is the 4D version of a point sliding behind the camera.",
          },
          {
            heading: "Seeing 4D: slicing",
            kind: "paragraph",
            body:
              "A projection shows all of the object at once and is hard to read. A **slice** shows what you would actually experience if the 4D world passed through your 3D space: the cross-section where the shape meets the hyperplane `w = w0`. Move `w0` and the slice moves through the object, so things grow, change shape and disappear. Miegakure, the best known 4D game, works this way: it renders two-dimensional pictures of three-dimensional slices of its world, and the player can both move the slice along the fourth dimension and turn it.\n\nSlicing an edge is a small calculation. If the two ends of an edge lie on opposite sides of the hyperplane, with signed distances `da` and `db`, the crossing is at `t = da ÷ (da − db)` along the edge, and the point is `a + t × (b − a)`. That is the whole of the sample's `slice` function. For solid shapes a standard approach is to cut each cube into tetrahedra and slice those.\n\nWhat you see depends on how the hyperplane sits. A slice of a tesseract at `w = 0` is a cube. Tilt the hyperplane and it becomes a box, and slide a hyperplane tilted across the long diagonal from the centre to a corner and a whole family appears. This is the 4D version of pushing a cube through a flat world: a plane crossing a cube is a point, then a growing triangle, a hexagon, a shrinking triangle and a point again.",
          },
          {
            heading: "Worked example: a tesseract, counted, turned and sliced",
            kind: "example",
            body:
              "Everything above, in about a hundred lines. The sample builds the tesseract from the \"differ in one coordinate\" rule, checks the counts against the formula, turns it in the xw plane and slices it three ways. Predict how many points each slice will have before you run it.",
            code:
              "// A 4D point is four numbers: [x, y, z, w].\n// The tesseract (a 4D cube) has a corner at every combination of +1 or -1\n// in all four coordinates.\nconst corners = [];\nfor (let i = 0; i < 16; i++)\n  corners.push([0, 1, 2, 3].map((axis) => ((i >> axis) & 1 ? 1 : -1)));\n\n// An edge joins two corners that differ in exactly one coordinate (the same\n// rule as the 3D cube).\nconst differences = (a, b) => a.filter((value, axis) => value !== b[axis]).length;\nconst edges = [];\nfor (let i = 0; i < 16; i++) {\n  for (let j = i + 1; j < 16; j++)\n    if (differences(corners[i], corners[j]) === 1) edges.push([i, j]);\n}\n\n// Faces follow a general rule: an n-cube has C(n, k) * 2^(n - k) faces of dimension k.\nfunction faces(n, k) {\n  let choose = 1;\n  for (let i = 0; i < k; i++) choose = (choose * (n - i)) / (i + 1);\n  return choose * 2 ** (n - k);\n}\nconsole.log(\n  'corners:',\n  corners.length,\n  ' edges:',\n  edges.length,\n  '(rule says',\n  faces(4, 1) + ')'\n);\nconsole.log(\n  'squares:',\n  faces(4, 2),\n  ' cubes:',\n  faces(4, 3),\n  ' Euler check V - E + F - C =',\n  faces(4, 0) - faces(4, 1) + faces(4, 2) - faces(4, 3)\n);\n\n// Rotation happens in a PLANE, not around an axis: pick two axes and turn\n// one into the other.\nfunction rotate(p, a, b, angle) {\n  const c = Math.cos(angle), s = Math.sin(angle), q = [...p];\n  q[a] = p[a] * c - p[b] * s;\n  q[b] = p[a] * s + p[b] * c;\n  return q;\n}\nconst planes = [];\nfor (let a = 0; a < 4; a++)\n  for (let b = a + 1; b < 4; b++) planes.push('xyzw'[a] + 'xyzw'[b]);\nconsole.log('rotation planes:', planes.join(' '), '(' + planes.length + ')');\n// 30 degrees in the xw plane\nconst tilted = corners.map((p) => rotate(p, 0, 3, (30 * Math.PI) / 180));\nconsole.log(\n  'distance from the centre, before and after turning:',\n  Math.hypot(...corners[0]),\n  Math.hypot(...tilted[0]).toFixed(6)\n);\n\n// A slice: where does the shape cross the flat 3D \"hyperplane\" dot(normal, p) = offset?\nfunction slice(points, edgeList, normal, offset) {\n  const side = (p) => p.reduce((sum, v, axis) => sum + v * normal[axis], 0) - offset;\n  // corners lying exactly on the plane\n  const hits = points.filter((p) => Math.abs(side(p)) < 1e-9);\n  for (const [i, j] of edgeList) {\n    const da = side(points[i]), db = side(points[j]);\n    // the edge passes through the plane\n    if (da * db < 0) {\n      const t = da / (da - db);\n      hits.push(points[i].map((v, axis) => v + t * (points[j][axis] - v)));\n    }\n  }\n  return hits;\n}\nconst distances = (pts) => {\n  const found = {};\n  for (let i = 0; i < pts.length; i++) {\n    for (let j = i + 1; j < pts.length; j++) {\n      const d = Math.hypot(...pts[i].map((v, k) => v - pts[j][k])).toFixed(3);\n      found[d] = (found[d] || 0) + 1;\n    }\n  }\n  return JSON.stringify(found);\n};\nconst flat = slice(corners, edges, [0, 0, 0, 1], 0);\nconsole.log(\n  'slice at w = 0:          ',\n  flat.length,\n  'points, distances',\n  distances(flat),\n  ' a cube'\n);\nconst turned = slice(tilted, edges, [0, 0, 0, 1], 0);\nconsole.log(\n  'after the 30 degree turn:',\n  turned.length,\n  'points, distances',\n  distances(turned),\n  ' a box'\n);\n\n// Slide a slice along the long diagonal, from the centre toward a corner,\n// and count what a 3D being would see.\nconst shapes = [\n  'octahedron',\n  'truncated tetrahedron',\n  'tetrahedron',\n  'small tetrahedron',\n  'a single point',\n];\nfor (let offset = 0; offset <= 4; offset++) {\n  const hits = slice(corners, edges, [1, 1, 1, 1], offset);\n  console.log(\n    'diagonal slice, offset',\n    offset + ':',\n    String(hits.length).padStart(2),\n    hits.length === 1 ? 'point ' : 'points',\n    '->',\n    shapes[offset]\n  );\n}\nconsole.log('offset 1 distances:', distances(slice(corners, edges, [1, 1, 1, 1], 1)));",
            language: "javascript",
            codeLabel: "Console: a tesseract, rotated and sliced",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The counts match the formulas: 16 corners, 32 edges, 24 squares and 8 cubes, with an Euler check of 0. Every corner is at distance 2 from the centre (the square root of four ones), and turning in the xw plane leaves that distance exactly unchanged, because rotation moves points without stretching them.\n\nThe slice at `w = 0` has eight points with three distinct distances between them: 12 pairs 2 apart, 12 pairs 2.83 apart and 4 pairs 3.46 apart. Those are the 12 edges, 12 face diagonals and 4 space diagonals of a cube of side 2. After the 30 degree turn there are still eight points, but the distances are different: 8 pairs at 2, 4 at 2.309, and so on. It is now a box, 2 × 2 × 2.309, and the stretched side is 2 ÷ cos 30 degrees. Same tesseract, same hyperplane, different slice, because the shape was turned.\n\nThe last block slides a hyperplane across the long diagonal. From the centre outward, the slice has 6 points (a regular octahedron), then 12 (a truncated tetrahedron, whose 18 equal edges show up as the 18 distances of 1.414), then 4 (a tetrahedron), then 4 more (a smaller tetrahedron) and finally a single point at the corner. A creature living in the slice would see an octahedron change into a different shape and shrink to nothing.",
            code:
              "corners: 16  edges: 32 (rule says 32)\nsquares: 24  cubes: 8  Euler check V - E + F - C = 0\nrotation planes: xy xz xw yz yw zw (6)\ndistance from the centre, before and after turning: 2 2.000000\nslice at w = 0:           8 points, distances {\"2.000\":12,\"2.828\":12,\"3.464\":4}  a cube\nafter the 30 degree turn: 8 points, distances {\"2.309\":4,\"2.000\":8,\"3.055\":8,\"2.828\":4,\"3.651\":4}  a box\ndiagonal slice, offset 0:  6 points -> octahedron\ndiagonal slice, offset 1: 12 points -> truncated tetrahedron\ndiagonal slice, offset 2:  4 points -> tetrahedron\ndiagonal slice, offset 3:  4 points -> small tetrahedron\ndiagonal slice, offset 4:  1 point  -> a single point\noffset 1 distances: {\"1.414\":18,\"2.449\":24,\"2.828\":12,\"3.162\":12}",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: spin a tesseract in six planes",
            kind: "example",
            body:
              "Press Run page. Two planes, xw and zw, are already spinning. Turn planes on and off with the buttons.\n\nTry these in order. Switch off everything and switch on only **xy**: the tesseract turns like a cube, because nothing touches `w`. Switch on only **xw**: the nested cubes melt into a six-sided outline about halfway through the turn, then settle into nested cubes again with different cells playing the near and far parts. Switch on **xy** and **zw** together, and nothing else: that is the double rotation, and every corner travels along a circle of the same size. Colour shows `w`: cyan is far in the fourth dimension, coral is near.\n\nCompare the structure of the code with lesson 3's cube. The corner and edge rules are the same, the projection simply runs twice, and the orientation is a 4 × 4 matrix updated by `spin(a, b, angle)`.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee; font: 12px system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 5px; align-items: center; padding: 6px 8px;\n  }\n  button {\n    background: #2a2560; color: #c9c5ee; border: 1px solid #4a42a0; border-radius: 6px;\n    padding: 4px 9px; font: inherit; cursor: pointer;\n  }\n  button.on { background: #6d4aff; border-color: #6d4aff; color: #fff; }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; background: #1c1840;\n  }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <span>Spin in plane:</span>\n  <button data-plane=\"0,1\">xy</button><button data-plane=\"0,2\">xz</button>\n  <button data-plane=\"1,2\">yz</button>\n  <button data-plane=\"0,3\" class=\"on\">xw</button><button data-plane=\"1,3\">yw</button>\n  <button data-plane=\"2,3\" class=\"on\">zw</button>\n</div>\n<canvas id=\"c\" width=\"480\" height=\"220\"></canvas>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst W = canvas.width, H = canvas.height;\n\n// Corners and edges of the tesseract: the same two rules as the cube, with\n// one more coordinate.\nconst corners = [];\nfor (let i = 0; i < 16; i++)\n  corners.push([0, 1, 2, 3].map((axis) => ((i >> axis) & 1 ? 1 : -1)));\nconst edges = [];\nfor (let i = 0; i < 16; i++) {\n  for (let j = i + 1; j < 16; j++) {\n    let differences = 0;\n    for (let k = 0; k < 4; k++) if (corners[i][k] !== corners[j][k]) differences++;\n    if (differences === 1) edges.push([i, j]);\n  }\n}\n\n// The orientation is a 4x4 matrix. Spinning in a plane (a, b) turns axis a into axis b.\nlet orientation = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];\nfunction spin(a, b, angle) {\n  const c = Math.cos(angle), s = Math.sin(angle);\n  for (let col = 0; col < 4; col++) {\n    const p = orientation[a][col], q = orientation[b][col];\n    orientation[a][col] = p * c - q * s;\n    orientation[b][col] = p * s + q * c;\n  }\n}\nconst apply = (m, p) =>\n  m.map((row) => row[0] * p[0] + row[1] * p[1] + row[2] * p[2] + row[3] * p[3]);\n\n// Show 4D on a flat screen: squash w away (4D -> 3D), then squash z away (3D -> 2D).\nfunction project(p) {\n  // the viewer sits at w = 4, looking back toward w = 0\n  const k4 = 4 / (4 - p[3]);\n  const x = p[0] * k4, y = p[1] * k4, z = p[2] * k4;\n  // and at z = 5, looking back toward z = 0\n  const k3 = 1 / (5 - z);\n  return { x: W / 2 + x * k3 * 170, y: H / 2 - y * k3 * 170, w: p[3] };\n}\n\nconst active = new Set(['0,3', '2,3']);\ndocument.querySelectorAll('button[data-plane]').forEach((button) => {\n  button.addEventListener('click', () => {\n    const key = button.dataset.plane;\n    if (active.has(key)) active.delete(key); else active.add(key);\n    button.classList.toggle('on', active.has(key));\n  });\n});\n\nlet last = performance.now();\nfunction frame(now) {\n  const dt = Math.min((now - last) / 1000, 0.1); last = now;\n  active.forEach((key, i) => {\n    const [a, b] = key.split(',').map(Number);\n    spin(a, b, dt * 0.7);\n  });\n  const points = corners.map((c) => project(apply(orientation, c)));\n  ctx.clearRect(0, 0, W, H);\n  ctx.lineWidth = 1.6;\n  for (const [i, j] of edges) {\n    // colour by 4D depth: cyan = far in w, coral = near\n    const w = (points[i].w + points[j].w) / 2;\n    const t = (w + 1) / 2;\n    ctx.strokeStyle =\n      'rgba(' +\n      Math.round(61 + 194 * t) +\n      ',' +\n      Math.round(220 - 104 * t) +\n      ',' +\n      Math.round(208 - 136 * t) +\n      ', 0.85)';\n    ctx.beginPath();\n    ctx.moveTo(points[i].x, points[i].y);\n    ctx.lineTo(points[j].x, points[j].y);\n    ctx.stroke();\n  }\n  ctx.fillStyle = '#ffffff';\n  for (const p of points) {\n    ctx.beginPath();\n    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);\n    ctx.fill();\n  }\n  ctx.fillStyle = '#c9c5ee'; ctx.font = '11px system-ui';\n  ctx.fillText('16 corners, 32 edges. Colour shows the w coordinate.', 8, 14);\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: spin a tesseract in six planes",
          },
          {
            heading: "Designing for 4D: dimension analogy and its limits",
            kind: "paragraph",
            body:
              "You cannot picture 4D, but you can reason about it by **dimension analogy**, the method Edwin A. Abbott used in his 1884 novella _Flatland_. Imagine a flat creature whose world is a plane. A line drawn around it is a wall it cannot cross. To us, in 3D, the wall is nothing: we lift the creature over it. Step up one dimension and the same story applies to us. A wall that blocks our 3D slice may not exist a small step away along `w`, so a player can walk around, or through, something that looks solid. That is the basis of the puzzles in 4D games.\n\nMaking it playable is hard in ways 3D never was.\n\n- **Orientation.** There are no landmarks in `w`. Games show shadows of neighbouring slices, colour by `w`, or draw several slices at once.\n- **Controls.** A mouse has two axes and 4D has six rotation planes, so games use modes and keys, or let the player turn the slice only in steps of 90 degrees.\n- **Physics.** Rigid-body dynamics extends to any number of dimensions, but angular velocity becomes a six-component quantity in 4D and engines have to be written from scratch. A 2020 SIGGRAPH paper by Marc ten Bosch described rigid-body physics in any number of dimensions, which was developed for his 4D games.\n- **Collisions** are the easy part: the box test of lesson 2 just compares four axes instead of two.",
          },
          {
            heading: "Reference: real games with a fourth spatial dimension",
            kind: "table",
            rows: [
              ["Game", "By", "What it is", "How it makes 4D visible"],
              ["Miegakure", "Marc ten Bosch", "A puzzle-platformer set in a 4D world, in development for many years", "Renders 2D pictures of 3D slices; the player moves and turns the slice"],
              ["4D Toys", "Marc ten Bosch", "A physics sandbox released in 2017 for iOS and VR", "3D sections and perspective projection, including stereoscopic VR"],
              ["4D Miner", "Mashpoe", "A voxel mining sandbox with a demo from 2022", "3D sections"],
              ["4D Golf", "CodeParade", "A golf game released on Steam in March 2024, with over 120 levels", "3D sections, with several visualisation options"],
            ],
          },
          {
            heading: "The fourth number you already use",
            kind: "paragraph",
            body:
              "Even a plain 3D engine is full of four-dimensional arithmetic.\n\n- **Homogeneous coordinates.** A vertex is really `(x, y, z, w)`, with `w` = 1 for a position and 0 for a direction. That is what lets one 4 × 4 matrix both turn and move a point, and the graphics card's clip space is four-dimensional: the \"divide by depth\" of lesson 3 is a divide by this `w`.\n- **Quaternions.** Engines store a 3D rotation as four numbers of total length 1, which is a point on the surface of a four-dimensional sphere. Every 3D rotation corresponds to a pair of opposite points on it. Blending two rotations smoothly means travelling along a great circle of that sphere, and it never suffers the gimbal lock that three separate angles do.\n- **Colour.** Red, green, blue and alpha are four numbers. A fade from one colour to another is a straight line in a four-dimensional cube.\n\nSo when you read \"4D\" in an engine's documentation, check which of the four meanings it intends.",
          },
          {
            heading: "Reference: what a tesseract is made of",
            kind: "table",
            rows: [
              ["Part", "Count", "Where the number comes from"],
              ["Corners", "16", "2 × 2 × 2 × 2 sign choices"],
              ["Edges", "32", "Each corner has 4 edges and each edge joins 2 corners: 16 × 4 ÷ 2"],
              ["Squares", "24", "C(4, 2) = 6 pairs of axes, times 4 settings of the other two"],
              ["Cubes", "8", "C(4, 3) = 4 triples of axes, times 2 settings of the last one"],
              ["Rotation planes", "6", "C(4, 2) pairs of axes"],
            ],
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Rotating \"around an axis\" or \"around a plane\" in 4D.** The rotation is in a plane, and two axes stay fixed.\n- **Taking the projection for the shape.** The inner cube is not inside the outer one. It is farther along `w`.\n- **Mixing time and `w`.** In this lesson `w` is space. Time is lesson 6.\n- **Using three Euler angles in 4D.** Six planes make that unmanageable. Accumulate a matrix, as the demo does.\n- **Never re-normalising.** After a very long run, rounding drifts a rotation matrix away from a true rotation, and the shape slowly stretches. Re-orthonormalise it from time to time.\n- **Giving the player six controls.** Map rotation to the mouse with modes, not six sliders.\n- **A viewer too close.** The viewing distance in `d ÷ (d − w)` must exceed the shape's radius.\n- **Trusting 3D intuition about distance and volume.** Lesson 7 shows it fails in high dimensions.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A 4D point is four numbers, and distance, dot product and the \"differ in one coordinate\" cube rule extend with no new ideas. A tesseract has 16 corners, 32 edges, 24 squares and 8 cubes. Rotation happens in a plane, so 4D has six rotation planes, and rotations that include `w` turn the shape through the fourth dimension. A flat screen shows 4D either by projecting it, a shadow that is hard to read, or by slicing it, which shows what a 3D being would meet and changes with the hyperplane's position and tilt. Dimension analogy is the design tool, and real 4D games hide the mathematics behind a slice the player can turn.",
          },
        ],
        keyPoints: [
          "A 4D point is four numbers; distance, the dot product and the cube rule (corners that differ in one coordinate share an edge) extend with no new ideas.",
          "A tesseract has 16 corners, 32 edges, 24 squares and 8 cubes; an n-cube has C(n, k) × 2^(n − k) parts of dimension k.",
          "Rotation happens in a plane: 4D has six rotation planes, and a rotation that includes w turns the shape through the fourth dimension.",
          "A flat screen shows 4D by projection (a shadow) or by slicing (what a 3D being would meet), and a slice changes shape as the hyperplane moves or tilts.",
          "Dimension analogy is the design tool: solve the puzzle one dimension down, then move up; real 4D games hide the mathematics behind a slice the player can turn.",
        ],
        exercises: [
          "Count the edges, squares and cubes of a tesseract by hand, then check that corners − edges + squares − cubes is 0.",
          "Rotate the corner (1, 1, 1, 1) by 90 degrees in the xw plane. Which corner does it become? What if you rotate in the zw plane instead?",
          "In the demo, find which pair of planes, switched on together, gives a rotation in which every corner moves along a circle of constant size. Explain why using the idea of a double rotation.",
          "Change the slice code to cut at w = 0.5 instead of 0 for the unrotated tesseract and report the number of points and the shape.",
          "Design a small grid puzzle with an extra axis w in which a wall blocks movement in x and y but not in w. Describe how a player would solve it and why it would look impossible in a single slice.",
        ],
        challenge:
          "Build a 4D toy of your own: a tesseract or a small 4D grid of cubes with mouse-driven rotation in at least three planes, a slice view beside the projection view, and a colour scheme that encodes w. Write half a page on what a player can and cannot work out from each of the two views.",
      }),

      lesson({
        id: "the-fourth-dimension-of-time-and-sensation",
        title: "The fourth dimension of time and sensation",
        summary:
          "Time is the fourth dimension every game already has. This lesson turns it into something you can design with: deterministic simulations that can be replayed and rewound, time as a coordinate in noise that makes seamless animation loops, and the engineering of 4D experiences, where seats, wind, mist and rumble are timed on a cue sheet with safety limits.",
        objectives: [
          "Explain why a deterministic simulation can be replayed from its inputs and rewound from keyframes, and cost the memory of each approach.",
          "Name the usual sources of nondeterminism and say how to remove each one.",
          "Use time as a coordinate: 3D noise plus time is 4D noise, and a circle in two extra dimensions makes a seamless loop.",
          "Schedule physical effects on a timeline using each device's lead time, and enforce safety limits in the data.",
          "Tell the four meanings of \"4D\" in games apart, and say which one a given product means.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Ask ten people what a 4D game is and you will hear at least three answers. Lesson 5 covered a fourth direction of space. This lesson covers the other two. One is **time**, which games manipulate constantly: pausing, slowing, rewinding, looping. The other is **sensation**, the cinema-seat sense of 4D, where the world pushes back with motion, wind and mist.\n\nBoth reduce to the same discipline: treat time as an axis you can index, store and schedule. A game that can say \"what was the state at tick 1,800?\" can replay, rewind, make ghosts and reproduce bugs. A game that can say \"send the fan cue 400 milliseconds before the splash\" can build a ride.",
          },
          {
            heading: "Definition: time as a coordinate",
            kind: "definition",
            body:
              "- **Tick** — one step of the fixed-timestep simulation from lesson 1. The **tick index** is the game's own clock, and unlike wall-clock time it can be stored, compared and replayed.\n- **Timeline** — the ordered sequence of states, one per tick.\n- **Snapshot** — a full copy of the state at one tick. A **keyframe** is a snapshot taken every so often, for example once a second.\n- **Input log** — the player's actions, tick by tick. It is tiny compared with a snapshot.\n- **Replay** — running the simulation again from a start state using the logged inputs. **Rewind** — restoring an earlier state. **Ghost** — a past run replayed alongside the present one.\n- **Deterministic** — the same starting state and the same inputs always give exactly the same states. Online strategy games depend on it: they send each player's inputs rather than the position of every unit.\n- **Cue** — a scheduled effect: at this time, do that. **Lead time** — how long a device needs between the command and the effect being felt.\n- **Seamless loop** — an animation whose last frame leads straight into its first.",
          },
          {
            heading: "Rewind, replay and ghosts",
            kind: "paragraph",
            body:
              "There are two ways to remember the past. You can store **snapshots**, which cost memory in proportion to the number of ticks times the size of the state. Or you can store the **inputs** and rely on determinism to regenerate the states, which is almost free but means getting to tick 3,000 requires simulating 3,000 ticks. The practical answer is both: inputs plus a keyframe every second. To reach any tick, restore the nearest earlier keyframe and re-simulate at most 59 ticks.\n\nGames have built whole designs on this. Braid (2008) is a puzzle game built around rewinding time, Prince of Persia: The Sands of Time (2003) lets you undo a mistake, many racing games offer a rewind or flashback, and time-loop games such as Outer Wilds (2019) reset the world on a schedule. A racing **ghost** records the best lap's inputs, or just its position ten times a second, and replays it beside you.\n\nReplays are also the best debugging tool a developer can have. A bug report that includes the starting seed and the input log can be replayed exactly, as often as needed, on the programmer's machine. Automated tests can run recorded games as regression tests.",
          },
          {
            heading: "Determinism: what breaks it",
            kind: "paragraph",
            body:
              "Determinism is easy to lose and hard to notice, because the game still runs. The usual culprits:\n\n- **Unseeded randomness**, such as `Math.random()`. Use a seeded generator whose state is part of the game state.\n- **Wall-clock time.** `Date.now()` differs on every run. Use the tick index.\n- **A variable timestep.** Lesson 1's fixed step is a prerequisite.\n- **Unordered collections.** If a hash map or set is iterated in a different order, anything that depends on the order (who is hit first, which enemy decides first) changes. Iterate in a sorted or id-based order.\n- **Floating-point differences.** Basic arithmetic gives the same answer everywhere, but functions such as `sin`, `cos` and `exp` can differ slightly between processors, compilers and browsers (the JavaScript specification lets each implementation approximate them). Lockstep games use fixed-point or integer arithmetic, or avoid those functions in the simulation.\n- **Threads** that finish in a different order, **uninitialised memory**, and input read halfway through an update.\n\nTwo habits make determinism manageable. Keep everything the simulation needs in one state object, and **hash the state every tick**. The sample below calls this a fingerprint. If two machines, or a replay and the original, disagree, you know the exact tick where they diverged.",
          },
          {
            heading: "Worked example: replay, rewind and the cost of memory",
            kind: "example",
            body:
              "A tiny deterministic game, a thing sliding left and right and bouncing off walls, driven by 3,600 seeded inputs (60 seconds at 60 ticks a second). The sample plays it live and saves a keyframe each second, then replays it from the inputs alone, rewinds to tick 2,500, counts the memory each approach would need for 2,000 moving things, and finally shows what one hidden `Math.random()` does.",
            code:
              "// A deterministic game: the whole state is one small object, and one\n// function advances it by one tick.\nconst newWorld = () => ({ tick: 0, x: 0, vx: 0, bumps: 0 });\nconst copy = (world) => ({ ...world });\nfunction step(world, input) {                       // input is -1 (left), 0 or +1 (right)\n  world.vx = (world.vx + input * 0.5) * 0.95;\n  world.x += world.vx;\n  if (Math.abs(world.x) > 50) {\n    world.x = Math.sign(world.x) * 50;\n    world.vx = -world.vx * 0.5;\n    world.bumps++;\n  }\n  world.tick++;\n}\n// A short fingerprint of a state, so two runs can be compared at a glance (FNV-1a hash).\nfunction fingerprint(world) {\n  let h = 2166136261;\n  for (const ch of JSON.stringify(world))\n    h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;\n  return h.toString(16).padStart(8, '0');\n}\n// A seeded generator stands in for a player's thumbs: the same seed gives\n// the same \"player\".\nfunction seeded(seed) {\n  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;\n}\nconst random = seeded(7);\nconst TICKS = 3600;                                 // 60 seconds at 60 ticks per second\nconst inputs = Array.from({ length: TICKS }, () => Math.floor(random() * 3) - 1);\n\n// PLAY LIVE, saving a keyframe (a full copy of the state) once per second.\nconst live = newWorld(), keyframes = [];\nfor (let t = 0; t < TICKS; t++) {\n  if (t % 60 === 0) keyframes.push(copy(live));\n  step(live, inputs[t]);\n}\nconsole.log('live run:                ', fingerprint(live), ' bumps:', live.bumps);\n\n// REPLAY from tick 0 using nothing but the recorded inputs.\nconst replay = newWorld();\nfor (let t = 0; t < TICKS; t++) step(replay, inputs[t]);\nconsole.log(\n  'replay from the inputs:  ',\n  fingerprint(replay),\n  ' same as live:',\n  fingerprint(replay) === fingerprint(live)\n);\n\n// REWIND to any tick: restore the nearest earlier keyframe, then re-simulate the gap.\nfunction stateAt(tick) {\n  const world = copy(keyframes[Math.floor(tick / 60)]);\n  for (let t = world.tick; t < tick; t++) step(world, inputs[t]);\n  return world;\n}\nconst full = newWorld();\nfor (let t = 0; t < 2500; t++) step(full, inputs[t]);\nconsole.log(\n  'rewind to tick 2500:     ',\n  fingerprint(stateAt(2500)),\n  ' same as a full replay:',\n  fingerprint(stateAt(2500)) === fingerprint(full),\n  ' (re-simulated 40 ticks, not 2500)'\n);\n\n// WHAT IT COSTS, for a game with 2,000 moving things at 32 bytes each.\nconst snapshot = 2000 * 32;\nconsole.log(\n  'a snapshot every tick, 60 s:  ' +\n    (snapshot * TICKS).toLocaleString('en-US') +\n    ' bytes'\n);\nconsole.log(\n  'a keyframe per second + inputs: ' +\n    (snapshot * 60 + TICKS).toLocaleString('en-US') +\n    ' bytes'\n);\n\n// THE TRAP: one hidden random number and the replay no longer matches.\nfunction runWithRandomness() {\n  const world = newWorld();\n  for (let t = 0; t < TICKS; t++) step(world, inputs[t] + (Math.random() < 0.01 ? 1 : 0));\n  return fingerprint(world);\n}\nconsole.log(\n  'with Math.random() inside the step, two runs agree:',\n  runWithRandomness() === runWithRandomness()\n);",
            language: "javascript",
            codeLabel: "Console: replay, rewind and the cost of memory",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The replay, built from nothing but the inputs, ends in a state with the same fingerprint as the live run: `56ed8678` both times. The rewind to tick 2,500 matches a replay from tick 0, but it only had to re-simulate 40 ticks from the keyframe at tick 2,460, not 2,500 from the start.\n\nThe memory lines are the reason keyframes exist. For 2,000 things at 32 bytes each, a snapshot every tick for a minute needs 230,400,000 bytes, which is far too much for a phone, while a keyframe a second plus the inputs needs 3,843,600 bytes, about 3.8 megabytes. Last, a single hidden `Math.random()` in the update is enough to make two runs of identical inputs disagree.\n\nThe sample uses only addition, multiplication, `Math.abs` and `Math.sign`, which give the same results on every browser. That is deliberate.",
            code:
              "live run:                 56ed8678  bumps: 46\nreplay from the inputs:   56ed8678  same as live: true\nrewind to tick 2500:      c957800d  same as a full replay: true  (re-simulated 40 ticks, not 2500)\na snapshot every tick, 60 s:  230,400,000 bytes\na keyframe per second + inputs: 3,843,600 bytes\nwith Math.random() inside the step, two runs agree: false",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Time as a coordinate in content: noise and seamless loops",
            kind: "paragraph",
            body:
              "Noise is smooth randomness: each point in space gets a value that changes gently from its neighbours, which makes clouds, terrain, fire and water. **2D noise** is a texture. **3D noise** is a volume. And here is the trick: if you treat the third coordinate as **time**, 3D noise is a 2D texture that animates, and 4D noise is an animated volume. Time is just another coordinate.\n\nLooping is the problem. Walk along a straight line through noise space and you never come back, so the animation has a seam where it restarts. Walk around a **circle** and you do. With two spare coordinates, set `z = R × cos(2π × t)` and `w = R × sin(2π × t)`, and as `t` goes from 0 to 1 you travel once around a circle and arrive exactly where you began. The radius `R` controls how much the picture changes during one loop.\n\nThis is a practical use of four dimensions that ships in real games: looping menu backgrounds, water, lava, clouds and effects. It also suits a metered connection: a ten-second looping video background can weigh several megabytes, while a procedural loop is a few kilobytes of code.",
          },
          {
            heading: "Worked example: a seamless loop from 4D noise",
            kind: "example",
            body:
              "Press Run page. The picture is made from three layers of value noise, and time moves around a circle in z and w. The text under the picture compares the first and last frames of the loop at 200 sample points: the biggest difference is 0.000000.\n\nPress **Path** to switch to a straight line through z instead. The picture still animates, but the readout jumps to about 0.37 and you can see the pop each time the loop restarts. Then change numbers in the listing: the radius `0.9` (a smaller circle means a calmer picture), `LOOP_SECONDS`, the three octaves, and the palette stops (try reds for lava).",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee; font: 12px system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 6px 8px;\n  }\n  button {\n    background: #6d4aff; color: #fff; border: 0; border-radius: 6px; padding: 5px 9px;\n    font: inherit; cursor: pointer;\n  }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; background: #1c1840;\n  }\n  #hud { padding: 4px 8px; }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <button id=\"mode\">Path: circle in z and w (loops)</button>\n  <span>loop length 4 s</span>\n</div>\n<canvas id=\"c\" width=\"192\" height=\"96\"></canvas>\n<div id=\"hud\"></div>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst W = canvas.width, H = canvas.height;\nconst image = ctx.createImageData(W, H);\nconst LOOP_SECONDS = 4;\n\n// Value noise in four dimensions: a random number at every whole-number\n// point, blended smoothly in between.\nfunction hash(i, j, k, l) {\n  let h =\n    Math.imul(i, 374761393) ^\n    Math.imul(j, 668265263) ^\n    Math.imul(k, 1274126177) ^\n    Math.imul(l, 2147483629);\n  h = Math.imul(h ^ (h >>> 13), 1274126177);\n  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;\n}\nconst fade = (t) => t * t * (3 - 2 * t);\nconst mix = (a, b, t) => a + (b - a) * t;\nfunction noise4(x, y, z, w) {\n  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), wi = Math.floor(w);\n  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi), wf = fade(w - wi);\n  const corner = (dx, dy, dz, dw) => hash(xi + dx, yi + dy, zi + dz, wi + dw);\n  const alongW = (dx, dy, dz) => mix(corner(dx, dy, dz, 0), corner(dx, dy, dz, 1), wf);\n  const alongZ = (dx, dy) => mix(alongW(dx, dy, 0), alongW(dx, dy, 1), zf);\n  const alongY = (dx) => mix(alongZ(dx, 0), alongZ(dx, 1), yf);\n  return mix(alongY(0), alongY(1), xf);\n}\n\n// Where in noise space does time take us? (z, w) is a circle if it loops, a\n// straight line if it does not.\nlet loops = true;\n// t goes from 0 to 1 over one loop\nfunction timeCoords(t) {\n  if (loops) return [Math.cos(t * 2 * Math.PI) * 0.9, Math.sin(t * 2 * Math.PI) * 0.9];\n  return [t * 3, 0];\n}\n// three octaves of noise, each twice as detailed\nfunction cloud(x, y, t) {\n  const [z, w] = timeCoords(t);\n  let sum = 0, amplitude = 0.55, frequency = 1, total = 0;\n  for (let octave = 0; octave < 3; octave++) {\n    sum += amplitude * noise4(x * frequency, y * frequency, z * frequency, w * frequency);\n    total += amplitude; amplitude /= 2; frequency *= 2;\n  }\n  return sum / total;\n}\n\nconst palette = [];\nconst stops = [\n  [0, [22, 20, 58]],\n  [0.5, [45, 130, 160]],\n  [0.8, [110, 215, 215]],\n  [1, [225, 250, 255]],\n];\nfor (let i = 0; i < 256; i++) {                           // navy -> teal -> pale cyan\n  const v = i / 255;\n  let k = 1; while (v > stops[k][0]) k++;\n  const [v0, c0] = stops[k - 1], [v1, c1] = stops[k];\n  palette.push(c0.map((c, n) => c + (c1[n] - c) * ((v - v0) / (v1 - v0))));\n}\n\n// Does the last frame match the first? Compare 200 sample points at t = 0 and t = 1.\nfunction seamError() {\n  let worst = 0;\n  for (let i = 0; i < 200; i++) {\n    const x = (i * 0.37) % 4, y = (i * 0.61) % 3;\n    worst = Math.max(worst, Math.abs(cloud(x, y, 0) - cloud(x, y, 1)));\n  }\n  return worst;\n}\nfunction report() {\n  document.getElementById('hud').textContent =\n    'first frame vs last frame: biggest difference ' +\n    seamError().toFixed(6) +\n    (loops ? '  (a seamless loop)' : '  (a visible jump)');\n}\ndocument.getElementById('mode').addEventListener('click', (e) => {\n  loops = !loops;\n  e.target.textContent = loops\n    ? 'Path: circle in z and w (loops)'\n    : 'Path: straight line in z (jumps)';\n  report();\n});\nreport();\n\nfunction frame(now) {\n  const t = ((now / 1000) % LOOP_SECONDS) / LOOP_SECONDS;\n  for (let py = 0; py < H; py++) {\n    for (let px = 0; px < W; px++) {\n      const v = Math.max(0, Math.min(1, (cloud(px / 24, py / 24, t) - 0.22) * 2));\n      const color = palette[Math.round(v * 255)];\n      const i = (py * W + px) * 4;\n      image.data[i] = color[0];\n      image.data[i + 1] = color[1];\n      image.data[i + 2] = color[2];\n      image.data[i + 3] = 255;\n    }\n  }\n  ctx.putImageData(image, 0, 0);\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: a seamless loop from 4D noise",
          },
          {
            heading: "4D as sensation: effects on a timeline",
            kind: "paragraph",
            body:
              "In cinemas and theme parks \"4D\" means a 3D film plus physical effects: seats that tilt and shake, puffs of air, water mist, scent, and flashes, all triggered from a timeline locked to the film. In games the same idea shows up as controller rumble and richer haptics, VR vests and gloves, racing and flight simulator rigs, arcade cabinets and location-based attractions.\n\nThe engineering is a **cue sheet**: a list of `(felt at, device, effect)`. The catch is that every device is late. A gamepad motor answers in a few milliseconds, a motion-seat actuator has to move, a mist valve opens and then the spray has to travel, and a fan must spin up before anybody feels wind. So the controller sends each cue early by that device's **lead time**: `send at = felt at − lead time`. The sample's lead times are illustrative; measure your own hardware. For a gamepad, aim to land the haptic within a frame or two of the visual impact.\n\nSafety belongs in the data, not in someone's memory.\n\n- **Flashing.** The Web Content Accessibility Guidelines (success criterion 2.3.1) say content must not flash more than three times in any one second, unless the flashes are below the general and red flash thresholds. Free tools such as the PEAT analyser test footage against the real thresholds.\n- **Motion.** Put hard limits on seat angle, speed and acceleration, and make any fault return the rig to neutral.\n- **Players.** Warn about flashing, strong motion, mist and scent. Provide separate switches for rumble, camera shake and flashes, and a reduced-motion option.\n- **Comfort.** Unexpected camera motion causes sickness, especially in VR, where a steady horizon, a high frame rate and low latency matter.",
          },
          {
            heading: "Worked example: a cue sheet with lead times and a flash limiter",
            kind: "example",
            body:
              "The first half converts \"felt at\" times into \"send at\" times. Notice that the fan and the seat are both felt at 2,500 ms but must be sent 280 ms apart. The second half is the three-flashes rule as code: it finds the worst one-second window in a list of flash times.",
            code:
              "// A 4D experience is a timeline of effects. Every device needs a little time to respond,\n// so a cue must be SENT earlier than it should be FELT: sendAt = feltAt - leadTime.\nconst devices = {\n  rumble: { leadMs: 5 },      // a gamepad motor: almost instant\n  seat: { leadMs: 120 },      // a motion-seat actuator has to move\n  mist: { leadMs: 250 },      // a water valve, then the spray travels through air\n  fan: { leadMs: 400 },       // a fan must spin up before anyone feels wind\n};\nconst cues = [\n  { feltAt: 1000, device: 'rumble', what: 'door slam' },\n  { feltAt: 2500, device: 'seat', what: 'tilt back 8 degrees as the car jumps' },\n  { feltAt: 2500, device: 'fan', what: 'wind rush' },\n  { feltAt: 4000, device: 'mist', what: 'splash' },\n  { feltAt: 4000, device: 'rumble', what: 'landing' },\n];\nconst schedule = cues\n  .map((cue) => ({ ...cue, sendAt: cue.feltAt - devices[cue.device].leadMs }))\n  .sort((a, b) => a.sendAt - b.sendAt);\nfor (const item of schedule) {\n  console.log(\n    String(item.sendAt).padStart(5) +\n      ' ms  send ' +\n      item.device.padEnd(6) +\n      ' (felt at ' +\n      item.feltAt +\n      ' ms)  ' +\n      item.what\n  );\n}\n\n// Safety belongs in the data. A strobe must never flash more than three\n// times in any one second.\nfunction worstSecond(flashTimes) {\n  let worst = 0;\n  for (const start of flashTimes) {\n    const inWindow = flashTimes.filter((t) => t >= start && t < start + 1000).length;\n    worst = Math.max(worst, inWindow);\n  }\n  return worst;\n}\n// a fast burst, then two slow flashes\nconst strobe = [0, 150, 300, 450, 600, 3000, 3600];\n// the same moment, with the burst thinned out\nconst thinned = [0, 400, 800, 3000, 3600];\nconsole.log(\n  'strobe: worst second has',\n  worstSecond(strobe),\n  'flashes ->',\n  worstSecond(strobe) > 3 ? 'FAILS the three-flash limit' : 'ok'\n);\nconsole.log(\n  'thinned: worst second has',\n  worstSecond(thinned),\n  'flashes ->',\n  worstSecond(thinned) > 3 ? 'FAILS the three-flash limit' : 'ok'\n);",
            language: "javascript",
            codeLabel: "Console: effect cues with lead times",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The fan, with the longest lead time at 400 ms, is sent first at 2,100 ms, and the seat follows at 2,380 ms, so that both are felt at 2,500 ms. The rumble and the mist are scheduled the same way.\n\nThe flash check finds that the strobe has five flashes in its worst second, which fails the rule of three. Thinning the burst to three flashes passes. In a real product, a check like this belongs in the tool that authors the effects, so that an unsafe sequence cannot be saved at all.",
            code:
              "  995 ms  send rumble (felt at 1000 ms)  door slam\n 2100 ms  send fan    (felt at 2500 ms)  wind rush\n 2380 ms  send seat   (felt at 2500 ms)  tilt back 8 degrees as the car jumps\n 3750 ms  send mist   (felt at 4000 ms)  splash\n 3995 ms  send rumble (felt at 4000 ms)  landing\nstrobe: worst second has 5 flashes -> FAILS the three-flash limit\nthinned: worst second has 3 flashes -> ok",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Reference: four meanings of \"4D\" in games",
            kind: "table",
            rows: [
              ["Meaning", "What the fourth thing is", "What you build", "Where you meet it"],
              ["A fourth direction of space", "The w axis", "4D maths, slicing, projection (lesson 5)", "Miegakure, 4D Toys, 4D Golf, 4D Miner"],
              ["Time", "The tick index", "Snapshots, replays, rewind, loops (this lesson)", "Braid, racing-game rewind, ghost laps"],
              ["The fourth number in a vertex", "w in (x, y, z, w)", "Homogeneous coordinates, quaternions, RGBA", "Every 3D engine"],
              ["Sensation", "Physical effects", "Cue sheets, device lead times, safety limits", "4D cinemas, motion rigs, haptic controllers"],
            ],
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Hidden nondeterminism.** `Math.random()` or `Date.now()` inside the simulation, or iterating an unordered collection, breaks every replay.\n- **Snapshotting everything every frame.** It exhausts memory and triggers garbage collection. Use keyframes plus inputs.\n- **Rewinding the world but not its side effects.** Sounds, particles, the interface and network messages all need to rewind or be cleared.\n- **An unbounded history.** Keep a ring buffer of the last N seconds, not everything since launch.\n- **A loop with a seam.** Time moved along a line, or velocities that do not match at the join. Move around a circle.\n- **Sending cues when they should be felt.** Every device has a lead time, and ignoring it puts the effects out of step.\n- **Safety as an option.** Limits belong in data and in the authoring tool, and every rig needs a stop that does not depend on the software working.\n- **Calling something 4D without saying what it needs.** Players should know the space, the hardware and the warnings before they start.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Time is a coordinate: index the world by tick and you can store, replay, rewind and branch it. Inputs plus keyframes are a tiny, random-access history, but only if the simulation is deterministic, so remove hidden randomness, wall-clock time, unordered iteration and variable steps, and hash the state to detect drift. Animated noise is noise with time as a coordinate, and moving time around a circle in two extra dimensions makes a perfectly seamless loop. Physical effects need a cue sheet with per-device lead times and safety limits stored as data, including the rule of three flashes per second.",
          },
        ],
        keyPoints: [
          "Time is a coordinate: index the world by tick and you can store, replay, rewind and branch it.",
          "Inputs plus keyframes are a tiny, random-access history, but only if the simulation is deterministic.",
          "Remove hidden randomness, wall-clock time, unordered iteration and variable steps, and hash the state every tick to detect drift.",
          "Animated noise is noise with time as a coordinate; moving time around a circle in two extra dimensions makes a perfectly seamless loop.",
          "Physical effects need a cue sheet with per-device lead times and safety limits stored as data, including the three-flashes-per-second rule.",
        ],
        exercises: [
          "For 500 entities of 24 bytes each at 30 ticks per second, compute the memory for a two-minute history of full snapshots, and for a keyframe every two seconds plus the inputs.",
          "Add a `rewindSeconds(world, seconds)` function to the rewind sample and show that rewinding 5 seconds from the end gives the same fingerprint as a replay stopped at tick 3,300.",
          "List five sources of nondeterminism in a game you know well, and say how you would remove each.",
          "In the loop demo, change the circle radius from 0.9 to 0.3 and then to 2. Describe what changes in the loop and explain why.",
          "Write a cue sheet for a 30-second racing-game crash using rumble, a seat tilt, a fan and a flash, then run it through the flash limiter.",
        ],
        challenge:
          "Add a ghost to your game from lesson 2: record the player's inputs for their best run, replay it as a translucent second player at the same time, prove with a fingerprint that two replays match, and add a rewind key limited to the last five seconds using keyframes. Write down your memory budget for history in bytes.",
      }),

      lesson({
        id: "five-dimensions-and-beyond",
        title: "Five dimensions and beyond",
        summary:
          "After the fourth dimension, \"dimension\" simply means \"independent axis of state\". This lesson uses 5D Chess with Multiverse Time Travel to show timelines as an axis, builds an immutable multiverse data structure, generalises rotation, projection and search to any number of dimensions, and meets the curse of dimensionality, the reason high dimensions behave nothing like three.",
        objectives: [
          "Define a dimension as an independent axis of state and give spatial, temporal and non-spatial examples.",
          "Describe how 5D Chess addresses a square with four coordinates, and why moving into the past creates a new timeline instead of changing history.",
          "Implement an immutable timeline structure with branching and explain what it costs to store.",
          "Generalise rotation planes, hypercube counts, projection and breadth-first search to n dimensions.",
          "Explain the curse of dimensionality with numbers, and say what it does to search, sampling and collision tests.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "\"Dimension\" is the most overloaded word in this course. In lessons 2 to 5 it meant a direction in space. In lesson 6 it meant time. Here we meet the general meaning: a dimension is one independent number you need in order to say where you are in a space of states. By that definition a chessboard square has two (file and rank), and the graphics menu of a game, with its resolution, shadow quality, texture quality and frame cap, is a four-dimensional space that you ask the player to navigate.\n\nOnce dimension means \"independent axis of state\", the number five is no longer exotic. It is simply one more axis, and the code you have already written does not care how many there are.",
          },
          {
            heading: "Definition: dimension, state space and timeline",
            kind: "definition",
            body:
              "- **Dimension** — an independent axis along which something can vary: a direction in space, a point in time, the branch of a timeline, or a setting. The number of dimensions is the number of independent numbers needed to name a state.\n- **State space** — the set of all possible states. Each state is a point, and each legal move is a step between points.\n- **Hypercube** (n-cube) — the n-dimensional cube: 2^n corners, n × 2^(n − 1) edges and n × (n − 1) ÷ 2 planes of rotation.\n- **Timeline, branch, multiverse** — a timeline is a sequence of states. A branch starts when someone enters the past and acts differently, and the multiverse is the set of all timelines.\n- **Immutable snapshot** and **structural sharing** — past states are never modified. A new state is built by copying only what changed and sharing the rest.\n- **Branching factor** — the number of moves available from a state. It drives the cost of searching.\n- **Curse of dimensionality** — the exponential growth of volume, and of the effort of searching it, as dimensions are added, together with the way distance and volume stop behaving as 3D intuition expects.",
          },
          {
            heading: "5D Chess with Multiverse Time Travel: the data model",
            kind: "paragraph",
            body:
              "5D Chess with Multiverse Time Travel, made by Conor Petersen at Thunkspace and released in 2020, extends chess with two extra axes. Alongside the file and rank of an ordinary board it has a **turn** axis, which is time, and a **timeline** axis, which numbers the parallel versions of the game. Every square is therefore addressed by four coordinates. The title says five dimensions; the board itself uses four, and players usually explain the missing one as the third spatial axis the board does not use.\n\nThe pieces generalise by counting axes. A rook slides along exactly one axis, a bishop along exactly two axes equally, and a queen along any number of axes equally, so a queen can move one square diagonally through time and across a timeline in a single step. Because a queen may use any mix of the four axes, it has 3^4 − 1 = **80 directions** to choose from, against 8 on an ordinary board.\n\nThe design decision worth studying is how it treats the past. When you move a piece, the resulting position is created as a new board one half-turn to the right, and the board you moved from is left unchanged. If a move sends a piece to a board that is no longer the latest in its timeline, the game does not rewrite that board. It creates a **new timeline** that starts from a copy of that position with your move applied.\n\nFor an engineer, that is a lesson in four parts.\n\n- **Immutable history makes branching cheap and safe.** A board that can never be edited cannot be corrupted, so \"paradoxes\" never reach the code.\n- **Address everything by coordinates**: timeline, turn, file, rank. Moves, attacks and arrows all become arithmetic on four numbers.\n- **Check detection grows with the multiverse.** A king can be attacked from another timeline, so the rules must search every playable board along every axis.\n- **The interface is the hardest part.** Players have to see many boards at once, with arrows between them, and the game has to make that readable.",
          },
          {
            heading: "Beyond: the same code in any number of dimensions",
            kind: "paragraph",
            body:
              "The tools from lesson 5 never mentioned the number four, so they work unchanged for any n.\n\n- **Corners** are the numbers 0 to 2^n − 1 read as bits, each bit meaning −1 or +1 on one axis. An **edge** joins two corners that differ in one bit, so you find the edges by flipping each bit in turn.\n- **Rotation** is `rotate(point, a, b, angle)` for any pair of axes, and there are n × (n − 1) ÷ 2 pairs.\n- **Projection** squashes one dimension at a time, n to n − 1 to … to 2, dividing by the distance along each axis.\n- **Search** over a grid looks at the 2n neighbours of a cell: one step either way along each axis.\n\nProjections get hopeless as n grows, because so many edges overlap. Games that really use higher dimensions show **slices** (lesson 5), and tools that explore high-dimensional data show **several linked views at once**, such as scatterplot matrices and parallel coordinates. The same idea would help a player explore the four-axis settings menu.",
          },
          {
            heading: "Worked example: a multiverse of timelines",
            kind: "example",
            body:
              "A `Multiverse` class with one rule: playing on the newest board of a timeline extends it, and playing on an older board forks a new timeline. Boards are frozen, so history cannot be changed even by accident. The sample plays three moves on the original timeline, goes back to turn 1 and plays differently, then goes back again inside the new timeline.",
            code:
              "// A tiny multiverse. Every board is frozen, and is addressed by (timeline, turn).\n// Playing on the newest board of a timeline extends it. Playing on an OLDER board\n// never rewrites history: it forks a brand-new timeline from that moment.\nclass Multiverse {\n  constructor(start) {\n    this.timelines = [\n      { id: 0, parent: null, firstTurn: 0, boards: [Object.freeze({ ...start })] },\n    ];\n  }\n  boardAt(timeline, turn) {\n    const line = this.timelines[timeline];\n    return line.boards[turn - line.firstTurn];\n  }\n  play(timeline, turn, makeMove) {\n    const board = this.boardAt(timeline, turn);\n    if (!board) throw new Error('no board at timeline ' + timeline + ', turn ' + turn);\n    const next = Object.freeze({ ...board, ...makeMove(board) });\n    const line = this.timelines[timeline];\n    // the newest board: just continue\n    if (turn === line.firstTurn + line.boards.length - 1) {\n      line.boards.push(next);\n      return { timeline, turn: turn + 1 };\n    }\n    const fork = {\n      id: this.timelines.length,\n      parent: { timeline, turn },\n      firstTurn: turn + 1,\n      boards: [next],\n    };\n    // an older board: branch the multiverse\n    this.timelines.push(fork);\n    return { timeline: fork.id, turn: turn + 1 };\n  }\n  describe() {\n    for (const line of this.timelines) {\n      const boards = line.boards\n        .map((b, i) => 't' + (line.firstTurn + i) + ': ' + b.coins + ' coins')\n        .join('  |  ');\n      const from = line.parent\n        ? 'forked from timeline ' + line.parent.timeline + ' turn ' + line.parent.turn\n        : 'the original';\n      console.log('timeline ' + line.id + ' (' + from + ')  ' + boards);\n    }\n  }\n}\n\nconst world = new Multiverse({ coins: 0 });\nworld.play(0, 0, (board) => ({ coins: board.coins + 1 }));           // timeline 0, turn 1\nworld.play(0, 1, (board) => ({ coins: board.coins + 1 }));           // timeline 0, turn 2\nworld.play(0, 2, (board) => ({ coins: board.coins + 1 }));           // timeline 0, turn 3\n// back in time: forks timeline 1 at turn 2\nworld.play(0, 1, (board) => ({ coins: board.coins + 10 }));\n// timeline 1 carries on to turn 3\nworld.play(1, 2, (board) => ({ coins: board.coins * 2 }));\n// back in time AGAIN: forks timeline 2 at turn 3\nworld.play(1, 2, () => ({ coins: 0 }));\nworld.describe();\n\nconst past = world.boardAt(0, 1);\nconsole.log(\n  'is the past frozen?',\n  Object.isFrozen(past),\n  '  can it be changed?',\n  Reflect.set(past, 'coins', 999),\n  '  still',\n  past.coins,\n  'coin'\n);\nconsole.log(\n  'boards stored:',\n  world.timelines.reduce((sum, line) => sum + line.boards.length, 0),\n  'across',\n  world.timelines.length,\n  'timelines'\n);",
            language: "javascript",
            codeLabel: "Console: a multiverse of timelines",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "Timeline 0 is the original: 0, 1, 2 and 3 coins. Going back to turn 1 (where there was 1 coin) and adding 10 did not touch timeline 0. It created timeline 1, whose first board is turn 2 with 11 coins, and the next move on timeline 1 doubled that to 22. Going back again to turn 2 inside timeline 1 and setting the coins to 0 forked timeline 2, whose single board is turn 3.\n\nThe last two lines are the point. The past board is frozen and `Reflect.set` returns false when we try to change it, so it still holds 1 coin. And the whole multiverse of three timelines stores only 7 boards, because each new timeline stores only the boards from its fork onward.",
            code:
              "timeline 0 (the original)  t0: 0 coins  |  t1: 1 coins  |  t2: 2 coins  |  t3: 3 coins\ntimeline 1 (forked from timeline 0 turn 1)  t2: 11 coins  |  t3: 22 coins\ntimeline 2 (forked from timeline 1 turn 2)  t3: 0 coins\nis the past frozen? true   can it be changed? false   still 1 coin\nboards stored: 7 across 3 timelines",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: n dimensions by the numbers",
            kind: "example",
            body:
              "Four short programs. The first tabulates what an n-cube is made of, up to ten dimensions. The second counts the directions of a chess queen. The third measures the curse of dimensionality: how much of a cube a ball fills, and where the volume sits. The fourth is one breadth-first search that works in any number of dimensions, run on random mazes with 40% of their cells walled off.",
            code:
              "// PART 1 - what an n-dimensional cube is made of.\n// Corners: 2^n. Edges: n * 2^(n-1). Squares: C(n,2) * 2^(n-2). Rotation\n// planes: C(n,2).\nconst choose2 = (n) => (n * (n - 1)) / 2;\nconsole.log(' n  corners   edges  squares  rotation planes');\nfor (const n of [2, 3, 4, 5, 6, 8, 10]) {\n  const corners = 2 ** n, edges = n * 2 ** (n - 1), squares = choose2(n) * 2 ** (n - 2);\n  console.log(\n    String(n).padStart(2),\n    String(corners).padStart(8),\n    String(edges).padStart(7),\n    String(squares).padStart(8),\n    String(choose2(n)).padStart(10)\n  );\n}\n\n// PART 2 - a chess queen slides along any mix of axes: each axis is -1, 0\n// or +1, except \"all zero\".\nfor (const n of [2, 3, 4, 5])\n  console.log('queen directions in ' + n + 'D: ' + (3 ** n - 1));\n\n// PART 3 - the curse of dimensionality.\n// How much of the cube [-1, 1]^n does the ball of radius 1 inside it fill?\n// Volume of the unit ball: V(n) = V(n-2) * 2*pi / n.\nconst ball = [1, 2];\nfor (let n = 2; n <= 10; n++) ball[n] = (ball[n - 2] * 2 * Math.PI) / n;\nfor (const n of [2, 3, 4, 5, 8, 10]) {\n  const filled = ball[n] / 2 ** n;\n  // volume within 10% of the boundary\n  const nearSurface = 1 - 0.8 ** n;\n  console.log(\n    n +\n      'D: ball fills ' +\n      (filled * 100).toFixed(2) +\n      '% of the cube; corner is ' +\n      Math.sqrt(n).toFixed(2) +\n      'x farther than a face; ' +\n      (nearSurface * 100).toFixed(1) +\n      '% of the volume is near the surface'\n  );\n}\n\n// PART 4 - one breadth-first search that works in any number of dimensions.\n// A cell is a single number (its position written in base 'side'), so\n// nothing is allocated while searching.\nfunction shortestPath(n, side, density, random) {\n  const cells = side ** n, goal = cells - 1;\n  const strides = Array.from({ length: n }, (_, axis) => side ** axis);\n  const blocked = new Uint8Array(cells);\n  for (let i = 1; i < goal; i++) blocked[i] = random() < density ? 1 : 0;\n  const distance = new Int32Array(cells).fill(-1);\n  const queue = new Int32Array(cells);\n  let head = 0, tail = 1;\n  distance[0] = 0;\n  const visit = (from, next) => {\n    if (blocked[next] || distance[next] !== -1) return;\n    distance[next] = distance[from] + 1;\n    queue[tail++] = next;\n  };\n  while (head < tail) {\n    const cell = queue[head++];\n    // 2n neighbours: one step either way along each axis\n    for (let axis = 0; axis < n; axis++) {\n      const stride = strides[axis], coordinate = Math.floor(cell / stride) % side;\n      if (coordinate > 0) visit(cell, cell - stride);\n      if (coordinate < side - 1) visit(cell, cell + stride);\n    }\n  }\n  return distance[goal];                                  // -1 means \"no way through\"\n}\n// Make 60 random mazes per dimension, each with 40% of its cells walled\n// off, and count the crossable ones.\nlet seed = 2024;\nconst random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;\nfor (const n of [2, 3, 4, 5, 6, 7]) {\n  let crossable = 0;\n  for (let maze = 0; maze < 60; maze++)\n    if (shortestPath(n, 5, 0.4, random) >= 0) crossable++;\n  console.log(\n    n +\n      'D (' +\n      (5 ** n).toLocaleString('en-US') +\n      ' cells): ' +\n      crossable +\n      ' of 60 mazes can be crossed from corner to corner'\n  );\n}",
            language: "javascript",
            codeLabel: "Console: n dimensions by the numbers",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The table reproduces lesson 5's tesseract in the n = 4 row (16 corners, 32 edges, 24 squares, 6 rotation planes) and shows how quickly it grows: a 10-cube has 1,024 corners, 5,120 edges and 45 planes of rotation. A queen has 8, 26, 80 and 242 directions in two to five dimensions, which is 3^n − 1.\n\nThe next block is where intuition breaks. A ball touching the middle of every face of a cube fills 78.5% of it in 2D, 52.4% in 3D, 30.8% in 4D, 16.4% in 5D and only 0.25% in 10D. The cube's corners are √n times farther from its centre than its face centres are, so in high dimensions almost the whole cube is corner. And the share of the volume within 10% of the surface climbs from 36% in 2D to 89.3% in 10D, so a random point is almost always near the edge.\n\nThe maze counts show the other side of the same coin. In a 5 × 5 grid with 40% of the cells walled off, only 15 of 60 random mazes can be crossed from corner to corner. In 3D it is 48, in 4D it is 57, and from 5D upward it is 59 or 60. With more neighbours per cell, a wall is easier to walk around, which is the mathematics behind a 4D puzzle where a wall disappears one step away along `w`.",
            code:
              " n  corners   edges  squares  rotation planes\n 2        4       4        1          1\n 3        8      12        6          3\n 4       16      32       24          6\n 5       32      80       80         10\n 6       64     192      240         15\n 8      256    1024     1792         28\n10     1024    5120    11520         45\nqueen directions in 2D: 8\nqueen directions in 3D: 26\nqueen directions in 4D: 80\nqueen directions in 5D: 242\n2D: ball fills 78.54% of the cube; corner is 1.41x farther than a face; 36.0% of the volume is near the surface\n3D: ball fills 52.36% of the cube; corner is 1.73x farther than a face; 48.8% of the volume is near the surface\n4D: ball fills 30.84% of the cube; corner is 2.00x farther than a face; 59.0% of the volume is near the surface\n5D: ball fills 16.45% of the cube; corner is 2.24x farther than a face; 67.2% of the volume is near the surface\n8D: ball fills 1.59% of the cube; corner is 2.83x farther than a face; 83.2% of the volume is near the surface\n10D: ball fills 0.25% of the cube; corner is 3.16x farther than a face; 89.3% of the volume is near the surface\n2D (25 cells): 15 of 60 mazes can be crossed from corner to corner\n3D (125 cells): 48 of 60 mazes can be crossed from corner to corner\n4D (625 cells): 57 of 60 mazes can be crossed from corner to corner\n5D (3,125 cells): 60 of 60 mazes can be crossed from corner to corner\n6D (15,625 cells): 59 of 60 mazes can be crossed from corner to corner\n7D (78,125 cells): 60 of 60 mazes can be crossed from corner to corner",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "The curse of dimensionality",
            kind: "paragraph",
            body:
              "Those results have names and consequences.\n\n- **Volume grows exponentially.** A grid with side `s` in `n` dimensions has `s^n` cells: 6^7 is 279,936, and 8^8 is 16.7 million. Dense arrays stop being an option. Use sparse structures (a hash map of occupied cells), hierarchies, or heuristic searches such as A-star.\n- **Bounding spheres lie.** In high dimensions a ball that fits inside a cube fills a vanishing fraction of it, and a sphere around a cube is mostly empty. \"Inside the bounding sphere\" no longer means \"inside the box\".\n- **Everything is near the boundary.** Random points land close to the surface, which matters for procedural generation, sampling and the feature spaces used in game AI.\n- **Distances bunch up.** The nearest and farthest points of a random set become almost equally far away, so \"nearest neighbour\" loses meaning.\n- **But routes multiply.** More neighbours means more ways around an obstacle. That is why extra axes help puzzle design, and why a search in five dimensions can succeed where the same walls would seal a 2D maze.",
          },
          {
            heading: "Worked example: an n-cube from three to ten dimensions",
            kind: "example",
            body:
              "Press Run page, then drag **Dimensions n**. At 3 you have the cube from lesson 3; at 4, the tesseract; at 5, a cube bounded by ten tesseracts, with 32 corners and 80 edges. Every plane of rotation turns at its own speed at the same moment. The projection squashes one dimension at a time with the same perspective divide you have seen twice already.\n\nBy 8 and 10 the picture is a glowing mass of 1,024 and 5,120 edges, which is the lesson: nobody can read it, and that is why games use slices. Colour shows one hidden coordinate. On a slow phone, stay at 8 or lower.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee; font: 12px system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 6px 8px;\n  }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; background: #1c1840;\n  }\n  input[type=range] { width: 140px; vertical-align: middle; }\n  #facts { padding: 4px 8px; }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <label>Dimensions n\n    <input id=\"dims\" type=\"range\" min=\"3\" max=\"10\" value=\"5\"> <b id=\"nText\">5</b>\n  </label>\n</div>\n<canvas id=\"c\" width=\"480\" height=\"210\"></canvas>\n<div id=\"facts\"></div>\n<script>\nconst canvas = document.getElementById('c');\nconst ctx = canvas.getContext('2d');\nconst W = canvas.width, H = canvas.height;\nconst dimsInput = document.getElementById('dims');\n\nlet n, corners, edges, orientation, speeds;\n\nfunction build(dimensions) {\n  n = dimensions;\n  // A corner is a number whose n bits say \"-1 or +1\" on each axis. Scaled\n  // so every corner sits at distance 1.\n  corners = [];\n  for (let i = 0; i < 2 ** n; i++) {\n    const p = [];\n    for (let axis = 0; axis < n; axis++)\n      p.push(((i >> axis) & 1 ? 1 : -1) / Math.sqrt(n));\n    corners.push(p);\n  }\n  // An edge joins two corners that differ in exactly one bit, so flip each bit in turn.\n  edges = [];\n  for (let i = 0; i < corners.length; i++) {\n    for (let axis = 0; axis < n; axis++) {\n      const j = i ^ (1 << axis);\n      if (i < j) edges.push([i, j]);\n    }\n  }\n  orientation = Array.from({ length: n }, (_, r) =>\n    Array.from({ length: n }, (_, c) => (r === c ? 1 : 0))\n  );\n  // every plane (a, b) gets its own turning speed\n  speeds = [];\n  for (let a = 0; a < n; a++)\n    for (let b = a + 1; b < n; b++)\n      speeds.push({ a, b, rate: 0.12 + 0.08 * ((a * 7 + b * 3) % 5) });\n  document.getElementById('nText').textContent = n;\n  document.getElementById('facts').textContent =\n    n +\n      'D cube: ' +\n      corners.length.toLocaleString('en-US') +\n      ' corners, ' +\n      edges.length.toLocaleString('en-US') +\n      ' edges, ' +\n      speeds.length +\n      ' rotation planes, all turning at once.';\n}\n\n// turn axis a into axis b, inside the whole matrix\nfunction spin(a, b, angle) {\n  const c = Math.cos(angle), s = Math.sin(angle);\n  for (let col = 0; col < n; col++) {\n    const p = orientation[a][col], q = orientation[b][col];\n    orientation[a][col] = p * c - q * s;\n    orientation[b][col] = p * s + q * c;\n  }\n}\n\n// Squash one dimension at a time: n -> n-1 -> ... -> 2, dividing by\n// distance from a viewer on each axis.\nfunction toScreen(vertex) {\n  const p = orientation.map((row) => row.reduce((sum, v, k) => sum + v * vertex[k], 0));\n  for (let k = n - 1; k >= 2; k--) {\n    const scale = 4 / (4 - p[k]);\n    for (let m = 0; m < k; m++) p[m] *= scale;\n  }\n  return {\n    x: W / 2 + p[0] * 76,\n    y: H / 2 - p[1] * 76,\n    last: orientation[n - 1].reduce((sum, v, k) => sum + v * vertex[k], 0),\n  };\n}\n\ndimsInput.addEventListener('input', () => build(Number(dimsInput.value)));\nbuild(Number(dimsInput.value));\n\n// edges are drawn in 8 colour groups: one stroke per group, not per edge\nconst BUCKETS = 8;\nconst groups = Array.from({ length: BUCKETS }, () => []);\nlet last = performance.now();\nfunction frame(now) {\n  const dt = Math.min((now - last) / 1000, 0.1); last = now;\n  for (const plane of speeds) spin(plane.a, plane.b, dt * plane.rate);\n  const points = corners.map(toScreen);\n  ctx.clearRect(0, 0, W, H);\n  for (const group of groups) group.length = 0;\n  for (const [i, j] of edges) {\n    // colour by one hidden coordinate\n    const t = ((points[i].last + points[j].last) * Math.sqrt(n)) / 4 + 0.5;\n    groups[\n      Math.min(BUCKETS - 1, Math.floor(Math.max(0, Math.min(0.999, t)) * BUCKETS))\n    ].push(i, j);\n  }\n  ctx.lineWidth = 1;\n  const alpha = n >= 8 ? 0.3 : n >= 6 ? 0.45 : 0.8;\n  groups.forEach((group, g) => {\n    const k = (g + 0.5) / BUCKETS;\n    ctx.strokeStyle =\n      'rgba(' +\n      Math.round(61 + 194 * k) +\n      ',' +\n      Math.round(220 - 104 * k) +\n      ',' +\n      Math.round(208 - 136 * k) +\n      ',' +\n      alpha +\n      ')';\n    ctx.beginPath();\n    for (let m = 0; m < group.length; m += 2) {\n      ctx.moveTo(points[group[m]].x, points[group[m]].y);\n      ctx.lineTo(points[group[m + 1]].x, points[group[m + 1]].y);\n    }\n    ctx.stroke();\n  });\n  if (n <= 7) {\n    ctx.fillStyle = '#ffffff';\n    for (const p of points) {\n      ctx.beginPath();\n      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);\n      ctx.fill();\n    }\n  }\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: an n-cube from 3 to 10 dimensions",
          },
          {
            heading: "Reference: n-cubes and n-dimensional chess",
            kind: "table",
            rows: [
              ["n", "Corners", "Edges", "Squares", "Rotation planes", "Queen directions"],
              ["2", "4", "4", "1", "1", "8"],
              ["3", "8", "12", "6", "3", "26"],
              ["4", "16", "32", "24", "6", "80"],
              ["5", "32", "80", "80", "10", "242"],
              ["6", "64", "192", "240", "15", "728"],
              ["8", "256", "1,024", "1,792", "28", "6,560"],
              ["10", "1,024", "5,120", "11,520", "45", "59,048"],
            ],
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Dense arrays for sparse high-dimensional worlds.** Memory grows as side^n. Store only what exists.\n- **Trusting 3D intuition about distance and volume.** In high dimensions, corners dominate and everything is near the surface.\n- **Mutating history.** \"Paradoxes\" are bugs from shared mutable state. Freeze past states and fork.\n- **Unbounded branching.** Without a cap or a rule for discarding unreachable timelines, the multiverse grows without limit.\n- **Showing every dimension at once.** Offer linked slices and let the player choose what to look at.\n- **Calling any extra field \"a dimension\"** without saying whether it is spatial, temporal or a setting.\n- **Three Euler angles in n dimensions.** Use matrices, as the demo does.\n- **Assuming more dimensions make a better design.** Each axis must give the player something they can understand and use.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A dimension is an independent axis of state: a direction, a moment, a timeline or even a menu option. 5D Chess addresses each square by file, rank, turn and timeline, and moving into the past forks a new timeline and never edits the old board. Immutable snapshots with structural sharing make branching cheap and paradox-free in code. Corners, edges, rotation planes, projection and search all generalise to n dimensions with the same few loops. The curse of dimensionality, with its exponential state counts, volume packed into corners and points near the surface, pushes you to sparse data, while the extra neighbours make obstacles easier to bypass.",
          },
        ],
        keyPoints: [
          "A dimension is an independent axis of state: a direction in space, a moment in time, a timeline or even a setting.",
          "5D Chess addresses squares by file, rank, turn and timeline; moving into the past forks a new timeline and never edits the old board.",
          "Immutable snapshots with structural sharing make branching cheap and paradox-free in code.",
          "Corners, edges, rotation planes, projection and search all generalise to n dimensions with the same few loops.",
          "The curse of dimensionality (exponential state growth, volume in the corners, most points near the surface) forces sparse data structures, while extra neighbours make obstacles easier to bypass.",
        ],
        exercises: [
          "Work out the number of rotation planes in 6D and 7D, and the number of corners of a 7-cube.",
          "Extend the `Multiverse` class with a `playable()` method that returns the newest board of every timeline, and a rule that refuses to create a sixth timeline.",
          "Change the maze sample to a side of 4 and 50% walls. In which dimension do at least 50 of the 60 mazes first become crossable?",
          "Use V(6) = π³ ÷ 6 to work out what fraction of a 6-cube's volume is filled by the ball inside it.",
          "Treat a game's four settings (resolution, shadows, textures, frame cap), each with five levels, as a 4D grid. How many states does it have, and which neighbours does a \"lower quality by one step\" button move to?",
        ],
        challenge:
          "Choose a game idea whose state has at least five independent axes, for example grid x, grid y, time, timeline and a power level. Write down its state space and a move generator that takes steps of ±1 along axes, a breadth-first search that proves a puzzle is solvable and reports the shortest solution, and a plan for showing it to a player with linked 2D views. Estimate the memory needed with dense and with sparse storage.",
      }),
    ]
  ),
  module(
    "resolution-4k-8k-and-beyond",
    "04 · 4K, 8K and beyond",
    "The arithmetic of pixels, memory and bandwidth, and the techniques that let one game look right on every screen.",
    [
      lesson({
        id: "ultra-high-resolution-4k-8k-and-beyond",
        title: "Ultra-high resolution: 4K, 8K and beyond",
        summary:
          "Resolution is the other kind of dimension in this course, and it multiplies the cost of every pixel you shade. This lesson puts numbers on 4K, 5K, 8K and 16K: pixels, nanoseconds per pixel, frame-buffer memory, memory traffic, cable bandwidth and texture memory. It ends with the question that decides everything: how many of those pixels can a human eye actually use?",
        objectives: [
          "Compute pixel counts, pixels per second and the time available per pixel for common resolutions and frame rates.",
          "Estimate frame-buffer, texture and bandwidth costs, and explain why compressed textures and mipmaps exist.",
          "Explain why 8K at 60 Hz does not fit uncompressed in an HDMI 2.1 link, and what is done about it.",
          "Calculate pixels per degree from screen size, viewing distance and resolution, and use it to decide whether a higher resolution is visible.",
          "Name the cases where very high resolution genuinely matters, and the cases where it is wasted.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A 4K screen has four times as many pixels as a 1080p one. An 8K screen has sixteen times as many, and 16K has sixty-four times. Every one of those pixels runs your shader sixty times a second. Resolution is the most expensive setting in most games and the one players ask for first, because the number is printed on the box.\n\nThis lesson is arithmetic. Not because the arithmetic is hard, but because the results are always surprising, and surprising results are cheaper to meet on paper than in the last week of a project. Run the numbers before you promise 8K.\n\nA note on names. The \"K\" in 4K and 8K counts thousands of pixels across, roughly, while the \"p\" in 1080p counts lines of height. So \"4K\" and \"2160p\" are the same thing wearing different labels, and the two systems should not be mixed.",
          },
          {
            heading: "Definition: resolution and the units of cost",
            kind: "definition",
            body:
              "- **Resolution** — width × height in pixels. **4K UHD** is 3840 × 2160, **5K** is 5120 × 2880, **8K UHD** is 7680 × 4320 and **16K** is 15360 × 8640. Cinema's DCI 4K (4096 × 2160) is a slightly different shape.\n- **Megapixel** — a million pixels. **Pixel rate** — pixels per frame times frames per second.\n- **Render resolution and display resolution** — what the engine draws and what the screen shows. They need not be equal, because a picture can be drawn smaller and stretched (lesson 9).\n- **Overdraw** — shading the same pixel more than once, because several surfaces cover it.\n- **Render target** or **frame buffer** — an image the graphics card draws into. An 8-bit colour image takes 4 bytes per pixel (RGBA8), a high-dynamic-range one 8 bytes (RGBA16F), and a depth buffer 4 bytes.\n- **Bandwidth** — bytes moved per second, between the graphics card and its memory (gigabytes per second) or from the console to the display (gigabits per second).\n- **Texture compression** — block formats such as BC7 on desktops and ASTC on phones, which the graphics card reads directly without unpacking.\n- **Pixels per degree (ppd)** — how many pixels fit into one degree of what you see. It measures how fine the picture is for the person looking at it.",
          },
          {
            heading: "Reference: the resolution ladder",
            kind: "table",
            rows: [
              ["Name", "Size", "Megapixels", "Times 1080p"],
              ["720p", "1280 × 720", "0.92", "0.4×"],
              ["1080p", "1920 × 1080", "2.07", "1.0×"],
              ["1440p", "2560 × 1440", "3.69", "1.8×"],
              ["4K", "3840 × 2160", "8.29", "4.0×"],
              ["5K", "5120 × 2880", "14.75", "7.1×"],
              ["8K", "7680 × 4320", "33.18", "16.0×"],
              ["16K", "15360 × 8640", "132.71", "64.0×"],
            ],
          },
          {
            heading: "The time budget per pixel",
            kind: "paragraph",
            body:
              "From lesson 1, a 60 fps frame lasts 16.67 ms. Divide that by the number of pixels and you have each pixel's share of the time: about 8.04 nanoseconds at 1080p, 2.01 at 4K, **0.50 at 8K** and 0.13 at 16K. A graphics card has thousands of shader units working at once, so this does not mean one core has half a nanosecond. It means the whole card must finish 33 million shader runs in 16.7 milliseconds.\n\nPut it in operations. If a lit, textured, shadowed pixel costs 500 arithmetic operations, which is modest, 8K at 60 fps needs 33,177,600 × 60 × 500, about **a trillion operations per second**, for a single layer of shading. Overdraw, transparent effects and post-processing multiply that. This is why \"native 8K\" at a smooth frame rate is rare, and why the next lesson is about rendering fewer pixels than the screen shows.",
          },
          {
            heading: "Memory: frame buffers, textures and bandwidth",
            kind: "paragraph",
            body:
              "**Frame buffers.** A modest modern renderer keeps five full-screen images: high-dynamic-range colour (8 bytes a pixel), depth (4), last frame's colour for temporal anti-aliasing (8), motion vectors (4) and a post-processing copy (8). That is 32 bytes for every pixel: 66 MB at 1080p, 265 MB at 4K, **1.06 GB at 8K** and 4.2 GB at 16K, before a single texture or model is loaded. On a desktop card with 8 GB, a gigabyte is a large slice. On a phone with 4 to 6 GB shared with everything else, it is out of the question.\n\n**Bandwidth.** Suppose a frame touches every pixel 20 times, reading or writing 8 bytes each time. That is 19.9 GB per second at 1080p and 60 fps, 79.6 at 4K, and 318.5 at 8K, rising to 637 at 8K and 120 fps. The assumptions are only illustrative; the point is that sixteen times the pixels is sixteen times the memory traffic.\n\n**Textures.** A 4096 × 4096 texture is 16.8 million texels. At 4 bytes each it is 67.1 MB, and with mipmaps (every smaller copy, which add one third) 89.5 MB. Compressed with BC7 it is 16.8 MB, and with ASTC 6 × 6 only 7.5 MB. An 8192 × 8192 texture is four times as big at every step. One hero character with four uncompressed 4K maps is 268 MB. Compression is not optional on phones. Mipmaps cost a third more memory but let a distant surface use a small copy, which is cheaper to read and shimmers less.\n\n**Texel density.** A texture only helps while there is at least one texel per screen pixel. An object one metre wide that covers a quarter of the screen width is 480 pixels wide at 1080p, 960 at 4K and 1,920 at 8K. To look equally sharp it needs a texture four times as wide at 8K as at 1080p, for the near surfaces only. Streaming systems load only the mipmap levels the current view needs. And remember lesson 4: level-of-detail thresholds are measured in pixels, so a higher resolution also switches models to finer ones sooner.",
          },
          {
            heading: "The cable",
            kind: "paragraph",
            body:
              "The picture also has to reach the screen. Counting only the active pixels at 10 bits for each of red, green and blue, 4K at 60 Hz is 14.9 Gbit/s, 4K at 120 Hz is 29.9 Gbit/s, and **8K at 60 Hz is 59.7 Gbit/s**; real signals add timing overhead, which brings 8K60 to about 64 Gbit/s. An HDMI 2.1 link carries 48 Gbit/s, of which about 42.6 are available for the picture after encoding. So uncompressed 8K at 60 Hz does not fit. Displays and consoles get around it by using Display Stream Compression (visually lossless, up to about 3:1), by dropping the colour detail to 4:2:0, or by lowering the frame rate or bit depth.\n\nTwo more places where resolution turns into data matter in Ghana. **Streaming:** a cloud-gaming or video stream at an illustrative 20 Mbit/s uses 9 GB an hour. **Downloads:** a 50 GB game at 10 Mbit/s takes about 11 hours. For a player on metered mobile data, download size is part of the price of the game, and shipping 8K textures to players who own 1080p phones is waste.",
          },
          {
            heading: "Worked example: the pixel budget",
            kind: "example",
            body:
              "Five questions in one program: how big is each step of the ladder, how long does each pixel get at 60 fps, how much memory do the frame buffers take, how much memory traffic does a frame cause, and what does the picture cost on the cable?",
            code:
              "// PART 1 - the resolution ladder. Pixels are width x height, so doubling\n// both sides is four times the work.\nconst ladder = [\n  ['720p', 1280, 720], ['1080p', 1920, 1080], ['1440p', 2560, 1440], ['4K', 3840, 2160],\n  ['5K', 5120, 2880], ['8K', 7680, 4320], ['16K', 15360, 8640],\n];\nconst fullHd = 1920 * 1080;\n// the four sizes the rest of the lesson keeps coming back to\nconst headline = ladder.filter((row) => ['1080p', '4K', '8K', '16K'].includes(row[0]));\nconsole.log('name   size           megapixels  times 1080p');\nfor (const [name, w, h] of ladder) {\n  console.log(\n    name.padEnd(6),\n    (w + ' x ' + h).padEnd(14),\n    ((w * h) / 1e6).toFixed(2).padStart(10),\n    (((w * h) / fullHd).toFixed(1) + 'x').padStart(11)\n  );\n}\n\n// PART 2 - the time budget. At 60 frames per second every pixel gets a share of 16.67 ms.\nconsole.log('');\nconst frameNs = 1e9 / 60;\nfor (const [name, w, h] of headline) {\n  const perSecond = (w * h * 60) / 1e6;\n  console.log(\n    name.padEnd(6) +\n      'shades ' +\n      perSecond.toFixed(0).padStart(5) +\n      ' million pixels per second, so each pixel gets ' +\n      (frameNs / (w * h)).toFixed(2) +\n      ' ns'\n  );\n}\n\n// PART 3 - memory for the frame itself. A modest modern renderer keeps five\n// full-screen buffers:\n// HDR colour (8 bytes), depth (4), last frame's colour for temporal anti-aliasing (8),\n// motion vectors (4) and a post-processing copy (8) = 32 bytes for every pixel.\nconsole.log('');\nfor (const [name, w, h] of headline) {\n  console.log(\n    name.padEnd(6) +\n      'frame buffers: ' +\n      ((w * h * 32) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 }) +\n      ' MB'\n  );\n}\n\n// PART 4 - memory traffic. Suppose a frame touches every pixel 20 times\n// (reads and writes), 8 bytes each time.\nconsole.log('');\nconst modes = [\n  ['1080p', 1920, 1080, 60], ['4K', 3840, 2160, 60],\n  ['8K', 7680, 4320, 60], ['8K', 7680, 4320, 120],\n];\nfor (const [name, w, h, fps] of modes) {\n  console.log(\n    (name + ' at ' + fps + ' fps').padEnd(14) +\n      ((w * h * 8 * 20 * fps) / 1e9).toFixed(1).padStart(7) +\n      ' GB per second'\n  );\n}\n\n// PART 5 - the cable. Just the picture, 10 bits for each of red, green and\n// blue (30 bits per pixel).\nconsole.log('');\nconst links = [\n  ['4K', 3840, 2160, 60], ['4K', 3840, 2160, 120],\n  ['8K', 7680, 4320, 60], ['8K', 7680, 4320, 120],\n];\nfor (const [name, w, h, fps] of links) {\n  const gbit = (w * h * fps * 30) / 1e9;\n  console.log(\n    (name + ' at ' + fps + ' Hz').padEnd(13) +\n      gbit.toFixed(1).padStart(6) +\n      ' Gbit/s' +\n      (gbit > 48 ? '   more than the 48 Gbit/s of an HDMI 2.1 link' : '')\n  );\n}",
            language: "javascript",
            codeLabel: "Console: the pixel budget",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "Read the first column of numbers as \"how many times 1080p\". It climbs 4.0 for 4K, 16.0 for 8K and 64.0 for 16K, because pixels grow with the square of the linear size. At 60 fps those shades per second go from 124 million at 1080p to nearly 2 billion at 8K, and each pixel's share drops from 8.04 to 0.50 nanoseconds.\n\nThe memory block is the number most people do not expect: **1,061.7 MB** of frame buffers at 8K. The traffic block shows the bill going from about 20 GB per second to over 300. And the last block shows the two 8K lines flagged as more than an HDMI 2.1 link can carry.",
            code:
              "name   size           megapixels  times 1080p\n720p   1280 x 720           0.92        0.4x\n1080p  1920 x 1080          2.07        1.0x\n1440p  2560 x 1440          3.69        1.8x\n4K     3840 x 2160          8.29        4.0x\n5K     5120 x 2880         14.75        7.1x\n8K     7680 x 4320         33.18       16.0x\n16K    15360 x 8640       132.71       64.0x\n\n1080p shades   124 million pixels per second, so each pixel gets 8.04 ns\n4K    shades   498 million pixels per second, so each pixel gets 2.01 ns\n8K    shades  1991 million pixels per second, so each pixel gets 0.50 ns\n16K   shades  7963 million pixels per second, so each pixel gets 0.13 ns\n\n1080p frame buffers: 66.4 MB\n4K    frame buffers: 265.4 MB\n8K    frame buffers: 1,061.7 MB\n16K   frame buffers: 4,246.7 MB\n\n1080p at 60 fps   19.9 GB per second\n4K at 60 fps     79.6 GB per second\n8K at 60 fps    318.5 GB per second\n8K at 120 fps   637.0 GB per second\n\n4K at 60 Hz    14.9 Gbit/s\n4K at 120 Hz   29.9 Gbit/s\n8K at 60 Hz    59.7 Gbit/s   more than the 48 Gbit/s of an HDMI 2.1 link\n8K at 120 Hz  119.4 Gbit/s   more than the 48 Gbit/s of an HDMI 2.1 link",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Can the eye use the pixels?",
            kind: "paragraph",
            body:
              "The most important number in this lesson is not a cost. It is **pixels per degree**.\n\nNormal (20/20) vision can just tell apart two features one **arcminute** apart, which is 1/60 of a degree. A display with 60 pixels per degree matches that. The sharpest eyes, about 20/10, can use up to about twice as many, around 120 ppd. Anything beyond that is detail nobody can see.\n\nPixels per degree depends on the screen's width, how far away you sit, and how many pixels span it. The sample computes it from the diagonal and the distance. A 65-inch television viewed from 2.5 metres fills 32.1 degrees of your view. Its 1080p picture is 60 ppd, its 4K picture is 120 ppd, and its 8K picture is 239 ppd, which is twice what the best eye can use. To reach 20/20 it needs only about 1,927 pixels across, which 1080p almost exactly provides. A 27-inch monitor at 0.7 metres fills 46 degrees: 4K gives 83 ppd and 5K gives 111 ppd, which is why 27-inch 5K monitors exist, while 8K, at 166 ppd, adds nothing. A phone at 30 centimetres is the surprise: at 1080p it already has 71 ppd, so a mobile game rendered above 1080p is mostly wasted work and wasted battery.\n\nWhere does more resolution genuinely pay? On very large displays seen from close by, such as LED walls, domes, planetariums and cinema screens. In head-mounted displays, where lenses magnify a small panel until it fills your vision: a panel 3,840 pixels wide stretched across a 100 degree view gives only about 38 pixels per degree, which is why headsets chase resolution and foveated rendering (lesson 9). And in close professional work such as editing, drawing and design. Where does it not? Television from the sofa, phones, and any screen already past about 120 ppd.\n\nSo the working rule is to **choose the render resolution from pixels per degree, not from the number on the box**, and to give the player a render-scale slider.",
          },
          {
            heading: "Worked example: textures and eyes",
            kind: "example",
            body:
              "The first half of the sample prices textures in four formats and three sizes. The second computes pixels per degree for a television, a monitor and a phone, and what a television needs to match 20/20 and the sharpest eyes.",
            code:
              "// PART 1 - texture memory. Bytes = texels x bits per texel / 8. Mipmaps\n// (every smaller copy) add one third.\nconst formats = [\n  ['RGBA8, uncompressed', 32],\n  ['BC7 (desktop)', 8],\n  // ASTC always packs 128 bits into a block, here 6 x 6 texels\n  ['ASTC 6x6 (phones)', 128 / 36],\n  ['ASTC 8x8 (phones)', 128 / 64],\n];\nfor (const size of [2048, 4096, 8192]) {\n  console.log(size + ' x ' + size + ' texture');\n  for (const [name, bits] of formats) {\n    const mb = (size * size * bits) / 8 / 1e6;\n    console.log(\n      '  ' +\n        name.padEnd(20) +\n        mb.toFixed(1).padStart(7) +\n        ' MB   ' +\n        ((mb * 4) / 3).toFixed(1).padStart(7) +\n        ' MB with mipmaps'\n    );\n  }\n}\n// four 4096 x 4096 RGBA8 maps for one character\nconst character = 4 * 4096 * 4096 * 4;\nconsole.log(\n  'one hero character, four uncompressed 4K maps: ' +\n    (character / 1e6).toFixed(0) +\n    ' MB'\n);\n\n// PART 2 - can the eye use the pixels? Count pixels per degree of what you\n// actually look at.\n// Normal (20/20) vision resolves about 1 arc-minute = 60 pixels per degree;\n// the very best eyes about twice that.\nfunction pixelsPerDegree(horizontalPixels, diagonalInches, distanceMetres) {\n  const aspect = 16 / 9;\n  const widthMetres = (diagonalInches * 0.0254 * aspect) / Math.sqrt(aspect * aspect + 1);\n  const degreesWide = (2 * Math.atan(widthMetres / 2 / distanceMetres) * 180) / Math.PI;\n  return { ppd: horizontalPixels / degreesWide, degreesWide };\n}\nconst screens = [\n  ['65-inch TV from 2.5 m', 65, 2.5],\n  ['27-inch monitor from 0.7 m', 27, 0.7],\n  ['6.5-inch phone (16:9 shape) from 0.3 m', 6.5, 0.3],\n];\nconst widths = [\n  ['1080p', 1920],\n  ['1440p', 2560],\n  ['4K', 3840],\n  ['5K', 5120],\n  ['8K', 7680],\n];\nfor (const [name, inches, metres] of screens) {\n  const view = pixelsPerDegree(1920, inches, metres);\n  const row = widths.map(\n    ([label, px]) => label + ' ' + Math.round(pixelsPerDegree(px, inches, metres).ppd)\n  );\n  console.log(\n    name + ' (' + view.degreesWide.toFixed(1) + ' degrees wide):  ' + row.join(' | ')\n  );\n}\nconst tv = pixelsPerDegree(1, 65, 2.5).degreesWide;\nconsole.log(\n  'the TV needs ' +\n    Math.round(60 * tv) +\n    ' pixels across for 20/20 vision and ' +\n    Math.round(120 * tv) +\n    ' for the sharpest eyes'\n);",
            language: "javascript",
            codeLabel: "Console: textures and pixels per degree",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "The texture lines give 67.1 MB for an uncompressed 4096 × 4096 map and 16.8 MB for the same map in BC7, a quarter of the size. ASTC 6 × 6 brings it to 7.5 MB and ASTC 8 × 8 to 4.2 MB, which is why phones use it. The last texture line is the hero character: 268 MB for four uncompressed 4K maps.\n\nThe pixels-per-degree lines say the same thing in numbers. On the television, 1080p gives 60, 4K gives 120 and 8K gives 239. On the monitor, 4K gives 83 and 5K gives 111. On the phone, even 1080p gives 71. The final line gives the pixels across the television needs: 1,927 for 20/20 vision and 3,853 for the sharpest eyes.",
            code:
              "2048 x 2048 texture\n  RGBA8, uncompressed    16.8 MB      22.4 MB with mipmaps\n  BC7 (desktop)           4.2 MB       5.6 MB with mipmaps\n  ASTC 6x6 (phones)       1.9 MB       2.5 MB with mipmaps\n  ASTC 8x8 (phones)       1.0 MB       1.4 MB with mipmaps\n4096 x 4096 texture\n  RGBA8, uncompressed    67.1 MB      89.5 MB with mipmaps\n  BC7 (desktop)          16.8 MB      22.4 MB with mipmaps\n  ASTC 6x6 (phones)       7.5 MB       9.9 MB with mipmaps\n  ASTC 8x8 (phones)       4.2 MB       5.6 MB with mipmaps\n8192 x 8192 texture\n  RGBA8, uncompressed   268.4 MB     357.9 MB with mipmaps\n  BC7 (desktop)          67.1 MB      89.5 MB with mipmaps\n  ASTC 6x6 (phones)      29.8 MB      39.8 MB with mipmaps\n  ASTC 8x8 (phones)      16.8 MB      22.4 MB with mipmaps\none hero character, four uncompressed 4K maps: 268 MB\n65-inch TV from 2.5 m (32.1 degrees wide):  1080p 60 | 1440p 80 | 4K 120 | 5K 159 | 8K 239\n27-inch monitor from 0.7 m (46.2 degrees wide):  1080p 42 | 1440p 55 | 4K 83 | 5K 111 | 8K 166\n6.5-inch phone (16:9 shape) from 0.3 m (27.0 degrees wide):  1080p 71 | 1440p 95 | 4K 142 | 5K 190 | 8K 285\nthe TV needs 1927 pixels across for 20/20 vision and 3853 for the sharpest eyes",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: what can your eyes use?",
            kind: "example",
            body:
              "Press Run page. Drag the screen size and the viewing distance, or press a preset, and watch the bars. The two white ticks mark 60 and 120 pixels per degree. A bar that stops short of the first tick is under 20/20 detail, a bar between the ticks is at or above it, and a grey bar is beyond what the eye can use.\n\nTry **Phone**: 1080p is already past the first tick. Try **Monitor**, then slide the distance out to 1.5 m and see how quickly the extra resolution stops mattering. Try **Wall** (150 inches from 2 m): 4K is only 48 ppd there, but 8K reaches 97, so this is where 8K earns its keep.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee;\n    font: 12px/1.35 system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center;\n    padding: 6px 8px 2px;\n  }\n  label { white-space: nowrap; }\n  input[type=range] { width: 110px; vertical-align: middle; }\n  button {\n    background: #2a2560; color: #c9c5ee; border: 1px solid #4a42a0; border-radius: 6px;\n    padding: 3px 8px; font: inherit; cursor: pointer;\n  }\n  table { width: calc(100% - 16px); margin: 4px 8px; border-collapse: collapse; }\n  td { padding: 2px 4px 2px 0; white-space: nowrap; }\n  .track {\n    position: relative; width: 100%; height: 12px; background: #231f50;\n    border-radius: 3px;\n  }\n  .fill { height: 100%; border-radius: 3px; }\n  .tick {\n    position: absolute; top: -2px; bottom: -2px; width: 1px; background: #ffffff;\n    opacity: .7;\n  }\n  #summary { padding: 2px 8px 6px; color: #e8e6ff; }\n  .low {\n    background: #ff7448; } .good { background: #3ddcd0; } .wasted { background: #6d6798;\n  }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <label>Screen\n    <input id=\"inches\" type=\"range\" min=\"5\" max=\"200\" step=\"0.1\" value=\"65\">\n    <b id=\"inchesText\"></b>\n  </label>\n  <label>Distance\n    <input id=\"metres\" type=\"range\" min=\"0.2\" max=\"5\" step=\"0.05\" value=\"2.5\">\n    <b id=\"metresText\"></b>\n  </label>\n</div>\n<div class=\"bar\" style=\"padding-top:0\">\n  <button data-i=\"6.5\" data-m=\"0.3\">Phone</button>\n  <button data-i=\"15.6\" data-m=\"0.55\">Laptop</button>\n  <button data-i=\"27\" data-m=\"0.7\">Monitor</button>\n  <button data-i=\"65\" data-m=\"2.5\">TV</button>\n  <button data-i=\"150\" data-m=\"2\">Wall</button>\n</div>\n<table id=\"rows\"></table>\n<div id=\"summary\"></div>\n<script>\nconst inches = document.getElementById('inches'),\n  metres = document.getElementById('metres');\nconst resolutions = [\n  ['720p', 1280],\n  ['1080p', 1920],\n  ['1440p', 2560],\n  ['4K', 3840],\n  ['5K', 5120],\n  ['8K', 7680],\n  ['16K', 15360],\n];\n\n// 16:9 screen, viewer centred in front of it\nfunction degreesWide(diagonalInches, distanceMetres) {\n  const aspect = 16 / 9;\n  const widthMetres = (diagonalInches * 0.0254 * aspect) / Math.sqrt(aspect * aspect + 1);\n  return (2 * Math.atan(widthMetres / 2 / distanceMetres) * 180) / Math.PI;\n}\n\nfunction update() {\n  const d = Number(inches.value), m = Number(metres.value);\n  const wide = degreesWide(d, m);\n  document.getElementById('inchesText').textContent = d + ' in';\n  document.getElementById('metresText').textContent = m.toFixed(2) + ' m';\n  const rows = document.getElementById('rows');\n  rows.innerHTML = '';\n  for (const [name, px] of resolutions) {\n    const ppd = px / wide;                                       // pixels per degree\n    const shown = Math.round(ppd);\n    const verdict =\n      shown < 60\n        ? ['low', 'under 20/20 detail']\n        : shown <= 120\n          ? ['good', 'at or above 20/20']\n          : ['wasted', 'beyond the eye'];\n    const tr = document.createElement('tr');\n    const bar = Math.min(100, (ppd / 240) * 100);\n    tr.innerHTML =\n      `<td><b>${name}</b></td><td style=\"text-align:right\">${shown} ppd</td>` +\n      `<td style=\"width:100%\"><div class=\"track\">` +\n      `<div class=\"fill ${verdict[0]}\" style=\"width:${bar}%\"></div>` +\n      `<div class=\"tick\" style=\"left:25%\"></div>` +\n      `<div class=\"tick\" style=\"left:50%\"></div></div></td>` +\n      `<td>${verdict[1]}</td>`;\n    rows.appendChild(tr);\n  }\n  const needs = (ppd) => Math.round(ppd * wide).toLocaleString('en-US');\n  document.getElementById('summary').textContent =\n    `This screen fills ${wide.toFixed(1)}\\u00b0 of your view. ` +\n    `60 ppd (the left tick) needs ${needs(60)} pixels across; ` +\n    `120 ppd (the right tick) needs ${needs(120)}.`;\n}\ninches.addEventListener('input', update);\nmetres.addEventListener('input', update);\ndocument.querySelectorAll('button[data-i]').forEach((button) =>\n  button.addEventListener('click', () => {\n    inches.value = button.dataset.i;\n    metres.value = button.dataset.m;\n    update();\n  })\n);\nupdate();\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: what can your eyes use?",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Promising \"native 8K\"** without computing buffers, bandwidth and shading cost.\n- **Mixing up the names.** 4K counts width and 1080p counts height, and DCI 4K is not UHD 4K.\n- **Ignoring screen size and viewing distance.** Pixels per degree decides what is visible, not the pixel count.\n- **Oversized or uncompressed textures**, no mipmaps, and textures bigger than their on-screen coverage.\n- **Shipping assets the player cannot see.** An 8K texture pack on a 1080p phone costs the player data and storage for nothing.\n- **Rendering the interface at the scene's resolution.** Text blurs when the scene is rendered small. Draw the interface at the screen's own resolution.\n- **Treating resolution as the only quality.** Frame rate, latency, contrast, HDR and clear motion usually matter more to the player than extra pixels.\n- **Forgetting heat.** A phone that runs flat out for ten minutes slows itself down; peak speed is not sustained speed.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Pixels grow with the square of the linear resolution: 4K is four times 1080p, 8K sixteen times and 16K sixty-four times, and shading cost follows. At 60 fps, 8K leaves about half a nanosecond for each pixel across the whole graphics card, its frame buffers alone can take about a gigabyte, and uncompressed 8K at 60 Hz needs about 60 Gbit/s, more than HDMI 2.1's 48 Gbit/s. Compressed textures and mipmaps are what make high-resolution assets affordable. And pixels per degree decides whether any of it can be seen: about 60 matches 20/20 vision, about 120 is the most the sharpest eye can use, and beyond that the extra pixels are wasted.",
          },
        ],
        keyPoints: [
          "Pixels scale with the square of the linear resolution: 4K is 4× 1080p, 8K is 16× and 16K is 64×, and shading cost follows the pixels.",
          "At 60 fps, 8K leaves about half a nanosecond per pixel for the whole GPU, and its frame buffers alone can take about a gigabyte.",
          "Uncompressed 8K at 60 Hz and 10 bits needs about 60 Gbit/s, more than HDMI 2.1's 48 Gbit/s, so compression or colour subsampling is used.",
          "Compressed textures and mipmaps make high-resolution assets affordable, and texture size should follow on-screen coverage.",
          "Pixels per degree decides whether a resolution is visible: about 60 ppd matches 20/20 vision and about 120 is the most the sharpest eye can use.",
        ],
        exercises: [
          "Compute the pixels, the megapixels and the nanoseconds per pixel at 60 and at 120 fps for 1440p and for 5K.",
          "How much memory do five buffers of 32 bytes per pixel take at 2560 × 1440 and at 5120 × 2880?",
          "How big is an 8192 × 8192 BC7 texture with mipmaps, and how many of them fit in 2 GB?",
          "A 32-inch 4K monitor is viewed from 0.8 m. What are its pixels per degree, and would 8K be worth paying for?",
          "A phone game renders at 1080p and 60 fps. You want to offer an \"ultra\" mode at 1440p. Estimate the extra pixel cost and describe the risk to battery and temperature.",
        ],
        challenge:
          "Write a one-page resolution policy for a game of your own: the default render resolution for three device classes (a low-end phone, a laptop and a 4K television), the texture sizes and compression for each, the memory budget for frame buffers and textures, and the download size per class, each justified with pixels per degree and the arithmetic from this lesson.",
      }),

      lesson({
        id: "scaling-to-every-screen-and-shipping",
        title: "Scaling to every screen, and shipping",
        summary:
          "Players own screens from a 720p phone to an 8K television, and one build has to look right on all of them. This lesson covers measuring performance honestly, dynamic resolution, upscaling, foveated rendering, quality tiers, and the practicalities of shipping a game from Ghana: download size, metered data, heat, testing on real devices and accessibility. It ends with the course project.",
        objectives: [
          "Measure frame time properly, with averages, percentiles and the test that separates a processor bottleneck from a graphics-card bottleneck.",
          "Implement dynamic resolution scaling with a controller that falls fast, rises slowly and does not oscillate.",
          "Explain spatial and temporal upscalers and their usual scale factors, and say how they make 4K and 8K output affordable.",
          "Describe foveated rendering and where it is used.",
          "Define quality tiers and a release checklist, and finish the course project with a performance report.",
        ],
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Lesson 8 ended with an uncomfortable answer: you cannot simply shade every pixel of every screen. This lesson is the toolbox for not having to. The ideas fall into three groups. **Measure**, so you know what is slow. **Adapt**, changing how many pixels you shade while the game runs. And **ship**, so the game reaches the player and runs on the device in their hand, not the one on your desk.",
          },
          {
            heading: "Definition: the vocabulary of scaling",
            kind: "definition",
            body:
              "- **Percentile frame time** — the frame time that a given share of frames beat. The **99th percentile** (p99) is the time that 99 frames in 100 come in under. A **\"1% low\"** figure is a related summary of the slowest 1% of frames; tools define it differently, so say which one you mean.\n- **Frame pacing** — how evenly frames are delivered. A steady 30 fps often feels smoother than an uneven 45.\n- **CPU-bound and GPU-bound** — limited by the processor (draw calls, scripts, physics) or by the graphics card (pixels, shaders, bandwidth).\n- **Dynamic resolution scaling (DRS)** — changing the render resolution from frame to frame to hold a frame-time target.\n- **Render scale** — the ratio of the internal render resolution to the output resolution, per axis.\n- **Upscaling** — producing more output pixels than were rendered. **Spatial** upscalers use one frame (bilinear, bicubic, Lanczos, AMD's FSR 1). **Temporal** upscalers combine several frames using motion vectors and a tiny camera jitter (temporal anti-aliasing upsampling, Unreal's TSR, FSR 2 and later, NVIDIA's DLSS, Intel's XeSS, Apple's MetalFX).\n- **Foveated rendering** — shading fewer pixels away from where the eye is looking.\n- **Quality tier** — a bundle of settings chosen for a class of device.\n- **Thermal throttling** — hardware lowering its own clock speed to avoid overheating.",
          },
          {
            heading: "Measuring honestly",
            kind: "paragraph",
            body:
              "**The average hides the hitch.** Take 59 frames of 10 ms and one frame of 200 ms. The average frame time is 13.2 ms, which is 76 fps, a number any player would be happy with, yet the player saw a freeze. Report the **worst frames** and a high percentile as well as the mean: p95, p99 and the maximum. A spreadsheet will do: sort the frame times and read the value 99% of the way down the list.\n\n**Find the bottleneck with one experiment.** Lower the render scale to 50%. If the frame time falls by roughly the amount the pixel count did, you are limited by the graphics card, and every fix that reduces pixels, shader cost or bandwidth will help. If it barely moves, you are limited by the processor, and cheaper shaders will do nothing. Then use a profiler for the details, and fix the biggest cost first.\n\n**Measure where the player plays.** Use a release build, on the real device, after it has been running for ten minutes, on battery, with the usual apps open in the background. Phones throttle: the first minute is not the fifteenth. In a browser, the timestamps that `requestAnimationFrame` provides give you frame times, and GPU timer queries exist where the browser supports them.",
          },
          {
            heading: "Dynamic resolution scaling",
            kind: "paragraph",
            body:
              "The idea is a thermostat for pixels. Each frame, measure how long the graphics card took. If the frame was late, render the next one at a lower resolution; if there is time to spare, raise it. The details decide whether it feels good.\n\n- **Cost follows pixels, pixels follow the square of the scale.** To correct a frame time by a factor `r`, change the scale by `√r`, not `r`.\n- **Fall fast, rise slowly.** Dropping 10% in a frame removes a hitch quickly. Climbing 4% a frame avoids a ping-pong of sharp and soft images.\n- **Keep headroom.** Aim a little under the budget (16 ms for 16.7) and do not creep upward while within 90% of the target.\n- **Clamp and quantise.** Never go below about 50% per axis, and move in steps. Allocate the render targets once at full size and draw into part of them, instead of re-allocating whenever the scale changes.\n- **Leave the interface alone.** Draw text and menus after the upscale, at the screen's native resolution, so they stay sharp however low the scene goes.\n- **Only help what it can help.** If lowering the resolution does not lower the GPU time, the frame is processor-bound and the controller should stop chasing it.\n\nMany console games use some form of this. The sample puts a number on the benefit.",
          },
          {
            heading: "Worked example: a dynamic resolution controller",
            kind: "example",
            body:
              "A pretend 4K graphics card, a fixed 2 ms of geometry plus a cost that grows with pixels, and a two-second explosion that makes every pixel almost twice as expensive. The controller uses the square-root rule, falls at up to 10% a frame, rises at 4%, and stays within 50% to 100%.",
            code:
              "// Dynamic resolution scaling: render fewer pixels when the frame is late,\n// more when there is time to spare.\n// A pretend GPU: a fixed cost (geometry, shadows) plus a cost that grows\n// with the pixels shaded.\n// what the player's screen shows (4K)\nconst OUTPUT = { width: 3840, height: 2160 };\n// a little under 16.67 ms, to leave headroom\nconst TARGET_MS = 16;\nfunction gpuMs(scale, frame) {\n  // two seconds of heavy effects\n  const explosion = frame >= 120 && frame < 240;\n  const nsPerPixel = explosion ? 2.9 : 1.6;\n  const pixels = OUTPUT.width * scale * OUTPUT.height * scale;\n  return 2 + (pixels * nsPerPixel) / 1e6;\n}\nfunction nextScale(scale, measuredMs) {\n  // cost follows pixels, and pixels follow scale squared\n  const ideal = Math.sqrt(TARGET_MS / measuredMs);\n  // fall fast (10% a frame), rise slowly (4%)\n  let change = Math.min(1.04, Math.max(0.9, ideal));\n  // do not creep upward while close to the limit\n  if (change > 1 && measuredMs > TARGET_MS * 0.9) change = 1;\n  // never below half the width and height\n  return Math.min(1, Math.max(0.5, scale * change));\n}\n\nlet scale = 1, lateWithScaler = 0, lateWithout = 0, worstScale = 1;\nconsole.log('frame  scale  internal size   gpu ms');\nfor (let frame = 0; frame < 400; frame++) {\n  const ms = gpuMs(scale, frame);\n  if (ms > 1000 / 60) lateWithScaler++;\n  if (gpuMs(1, frame) > 1000 / 60) lateWithout++;\n  worstScale = Math.min(worstScale, scale);\n  if ([0, 119, 120, 122, 125, 130, 160, 239, 240, 260, 300, 399].includes(frame)) {\n    console.log(\n      String(frame).padStart(5),\n      (Math.round(scale * 100) + '%').padStart(6),\n      (\n        Math.round(OUTPUT.width * scale) +\n        ' x ' +\n        Math.round(OUTPUT.height * scale)\n      ).padStart(13),\n      ms.toFixed(1).padStart(8)\n    );\n  }\n  scale = nextScale(scale, ms);\n}\nconsole.log('frames over 16.7 ms with the scaler:    ' + lateWithScaler + ' of 400');\nconsole.log('frames over 16.7 ms at fixed 4K:        ' + lateWithout + ' of 400');\nconsole.log(\n  'lowest scale used: ' +\n    Math.round(worstScale * 100) +\n    '% (' +\n    Math.round(worstScale * worstScale * 100) +\n    '% of the pixels)'\n);",
            language: "javascript",
            codeLabel: "Console: a dynamic resolution controller",
          },
          {
            heading: "What it prints",
            kind: "note",
            body:
              "Up to frame 119 the 4K picture costs 15.3 ms and all is well. At frame 120 the explosion arrives and the same frame needs 26.1 ms, nearly ten milliseconds over budget. By frame 122 the scale has fallen to 81%, and by frame 125 it has settled at 76% (2930 × 1648), where the frame costs 16.0 ms, and it holds there for the whole explosion.\n\nAt frame 240 the effects stop and the frame time drops to 9.7 ms. The scale now climbs by 4% a frame and is back to 100% by frame 247, with no overshoot. Over 400 frames the scaler produced only 3 late frames, frames 120 to 122 at 26.1, 21.5 and 17.8 ms, against 120 for a fixed 4K picture, at the price of rendering 58% of the pixels at its lowest.",
            code:
              "frame  scale  internal size   gpu ms\n    0   100%   3840 x 2160     15.3\n  119   100%   3840 x 2160     15.3\n  120   100%   3840 x 2160     26.1\n  122    81%   3110 x 1750     17.8\n  125    76%   2930 x 1648     16.0\n  130    76%   2930 x 1648     16.0\n  160    76%   2930 x 1648     16.0\n  239    76%   2930 x 1648     16.0\n  240    76%   2930 x 1648      9.7\n  260   100%   3840 x 2160     15.3\n  300   100%   3840 x 2160     15.3\n  399   100%   3840 x 2160     15.3\nframes over 16.7 ms with the scaler:    3 of 400\nframes over 16.7 ms at fixed 4K:        120 of 400\nlowest scale used: 76% (58% of the pixels)",
            language: "text",
            codeLabel: "Output",
          },
          {
            heading: "Worked example: dynamic resolution, live",
            kind: "example",
            body:
              "Press Run page. A per-pixel effect is drawn into a smaller image and stretched over the screen, with the controller above running every frame. The strip chart shows the frame time in coral against the dashed target and the render scale in teal.\n\nDrag **Shader cost** up to pretend the effect, or the device, is heavier. The scale falls until the frame fits the target, and the thin grid and the \"scene text\" go soft, while \"UI text\" stays crisp because it is drawn after the upscale. Drag it back down and the scale recovers. Untick **dynamic resolution** to see the frame time climb past the target, and try the 30 fps target. The demo times the processor's work because that is what a browser lets us read easily; a real engine reads graphics-card timestamps.",
            code:
              "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  html, body {\n    margin: 0; background: #14112b; color: #c9c5ee;\n    font: 12px/1.35 system-ui, sans-serif;\n  }\n  .bar {\n    display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center;\n    padding: 6px 8px 4px;\n  }\n  input[type=range] { width: 100px; vertical-align: middle; }\n  select {\n    background: #2a2560; color: #c9c5ee; border: 1px solid #4a42a0; border-radius: 6px;\n    font: inherit; padding: 2px 4px;\n  }\n  canvas {\n    display: block; width: 100%; max-width: 480px; height: auto; background: #1c1840;\n  }\n  #hud { padding: 4px 8px; color: #e8e6ff; }\n</style>\n</head>\n<body>\n<div class=\"bar\">\n  <label>Shader cost\n    <input id=\"cost\" type=\"range\" min=\"1\" max=\"20\" value=\"4\"> <b id=\"costText\">4x</b>\n  </label>\n  <label><input id=\"auto\" type=\"checkbox\" checked> dynamic resolution</label>\n  <label>Target\n    <select id=\"target\">\n      <option value=\"16\">60 fps (16 ms)</option>\n      <option value=\"33\">30 fps (33 ms)</option>\n    </select>\n  </label>\n</div>\n<canvas id=\"screen\" width=\"480\" height=\"200\"></canvas>\n<canvas id=\"chart\" width=\"480\" height=\"56\"></canvas>\n<div id=\"hud\"></div>\n<script>\nconst screen = document.getElementById('screen'), sctx = screen.getContext('2d');\nconst chart = document.getElementById('chart'), cctx = chart.getContext('2d');\n// the size of the \"display\"\nconst OUT_W = screen.width, OUT_H = screen.height;\nconst costInput = document.getElementById('cost'),\n  autoInput = document.getElementById('auto'),\n  targetInput = document.getElementById('target');\ncostInput.addEventListener('input', () => {\n  document.getElementById('costText').textContent = costInput.value + 'x';\n});\n\n// what the controller wants: any number from 0.25 to 1\nlet desired = 1;\n// scale: the stepped size we really render at\nlet scale = 1, buffer = null, image = null;\n// buffer: the smaller canvas we really render into\n// recent frames: { ms, scale }\nconst history = [];\n\nfunction setScale(next) {\n  // render targets come in steps, not smoothly\n  scale = Math.round(next * 20) / 20;\n  const w = Math.round(OUT_W * scale), h = Math.round(OUT_H * scale);\n  if (!buffer || buffer.width !== w || buffer.height !== h) {\n    buffer = document.createElement('canvas'); buffer.width = w; buffer.height = h;\n    image = buffer.getContext('2d').createImageData(w, h);\n  }\n}\nsetScale(1);\n\n// The \"shader\": run once per pixel, and repeated 'cost' times to pretend\n// the effect is more complicated.\nfunction render(t, cost) {\n  // k converts buffer pixels to screen pixels\n  const w = buffer.width, h = buffer.height, data = image.data, k = OUT_W / w;\n  for (let y = 0; y < h; y++) {\n    for (let x = 0; x < w; x++) {\n      const X = x * k, Y = y * k;\n      let v = 0;\n      for (let r = 0; r < cost; r++)\n        v +=\n          Math.sin(X * 0.045 + t) +\n          Math.sin(Y * 0.06 - t * 1.3) +\n          Math.sin((X + Y) * 0.03 + t * 0.7 + r * 0.01);\n      v = v / (3 * cost) * 0.5 + 0.5;\n      const i = (y * w + x) * 4;\n      data[i] = 28 + 200 * v * v;\n      data[i + 1] = 30 + 210 * v;\n      data[i + 2] = 90 + 150 * v;\n      data[i + 3] = 255;\n    }\n  }\n  const b = buffer.getContext('2d');\n  b.putImageData(image, 0, 0);\n  // fine detail drawn INTO the small picture\n  b.strokeStyle = 'rgba(255, 255, 255, 0.6)'; b.lineWidth = 1; b.beginPath();\n  for (let gx = 0; gx <= OUT_W; gx += 40) { b.moveTo(gx / k, 0); b.lineTo(gx / k, h); }\n  for (let gy = 0; gy <= OUT_H; gy += 40) { b.moveTo(0, gy / k); b.lineTo(w, gy / k); }\n  b.stroke();\n  b.fillStyle = '#ffffff';\n  b.font = Math.round(15 / k) + 'px system-ui';\n  b.fillText('scene text: rendered small', 12 / k, 30 / k);\n  sctx.imageSmoothingEnabled = true;\n  // stretch the small picture over the whole screen\n  sctx.drawImage(buffer, 0, 0, OUT_W, OUT_H);\n  // the interface is drawn afterwards, at full size\n  sctx.fillStyle = '#ffffff'; sctx.font = '15px system-ui';\n  sctx.fillText('UI text: always sharp', 12, 58);\n}\n\n// the same controller as the console example\nfunction nextScale(current, measuredMs, targetMs) {\n  const ideal = Math.sqrt(targetMs / measuredMs);\n  let change = Math.min(1.04, Math.max(0.9, ideal));\n  if (change > 1 && measuredMs > targetMs * 0.9) change = 1;\n  return Math.min(1, Math.max(0.25, current * change));\n}\n\nfunction drawChart(targetMs) {\n  cctx.clearRect(0, 0, chart.width, chart.height);\n  // the chart's vertical range in ms\n  const top = Math.max(40, targetMs * 2);\n  cctx.strokeStyle = '#ffffff'; cctx.setLineDash([4, 4]); cctx.globalAlpha = 0.6;\n  const ty = chart.height - (targetMs / top) * chart.height;\n  cctx.beginPath(); cctx.moveTo(0, ty); cctx.lineTo(chart.width, ty); cctx.stroke();\n  cctx.setLineDash([]); cctx.globalAlpha = 1;\n  const trace = (pick, color, range) => {\n    cctx.strokeStyle = color; cctx.lineWidth = 1.6; cctx.beginPath();\n    history.forEach((entry, i) => {\n      const x = (i / 119) * chart.width,\n        y = chart.height - Math.min(1, pick(entry) / range) * (chart.height - 2) - 1;\n      if (i === 0) cctx.moveTo(x, y); else cctx.lineTo(x, y);\n    });\n    cctx.stroke();\n  };\n  // coral: how long the frame took\n  trace((e) => e.ms, '#ff7448', top);\n  // teal: the render scale\n  trace((e) => e.scale, '#3ddcd0', 1);\n}\n\nlet t = 0, last = performance.now();\nfunction frame(now) {\n  t += Math.min((now - last) / 1000, 0.1); last = now;\n  const targetMs = Number(targetInput.value), cost = Number(costInput.value);\n  const started = performance.now();\n  render(t, cost);\n  // how long this frame's work took\n  const ms = performance.now() - started;\n  history.push({ ms, scale }); if (history.length > 120) history.shift();\n  const used = scale;\n  desired = autoInput.checked ? nextScale(desired, ms, targetMs) : 1;\n  setScale(desired);\n  drawChart(targetMs);\n  const pixelShare = Math.round(used * used * 100);\n  document.getElementById('hud').textContent =\n    `scale ${Math.round(used * 100)}%  (${Math.round(OUT_W * used)} x ` +\n    `${Math.round(OUT_H * used)}, ${pixelShare}% of the pixels)   ` +\n    `work ${ms.toFixed(1)} ms   target ${targetMs} ms`;\n  requestAnimationFrame(frame);\n}\nrequestAnimationFrame(frame);\n</script>\n</body>\n</html>",
            language: "html",
            codeLabel: "Demo: dynamic resolution, live",
          },
          {
            heading: "Upscaling: render less, show more",
            kind: "paragraph",
            body:
              "DRS only goes so far, because below about 70% per axis a plain stretched image looks soft. **Upscalers** are smarter. A spatial upscaler sharpens a single frame. A temporal upscaler jitters the camera by a fraction of a pixel each frame and accumulates the samples over several frames, guided by motion vectors and depth, and AI-based versions add a neural network trained on high-quality images. Done well, the result looks close to native at a fraction of the cost.\n\nTheir presets use standard factors per axis, and the table shows what that means for 4K and 8K output. At Performance, an 8K picture is rendered at 4K, four times fewer pixels. At Ultra Performance, which NVIDIA introduced for 8K, it is rendered at 1440p, nine times fewer.\n\nThe costs are real, and so are the limits. The upscaler itself takes time: AMD's published figures for FSR 2 at 4K output range from under a millisecond on a fast card to several milliseconds on an old one. You must supply motion vectors and depth. Fast motion can leave **ghosting trails**, thin details can shimmer, and text must not be upscaled. Some upscalers are tied to one vendor's hardware and some run broadly, so check support and licence terms. **Frame generation**, which interpolates extra frames, is a different tool: it raises the displayed frame rate but not the responsiveness.",
          },
          {
            heading: "Reference: upscaler presets and the pixels they save",
            kind: "table",
            rows: [
              ["Preset", "Scale per axis", "Pixels saved", "4K output is rendered at", "8K output is rendered at"],
              ["Quality", "1.5×", "2.25× fewer", "2560 × 1440", "5120 × 2880"],
              ["Balanced", "1.7×", "2.89× fewer", "2259 × 1271", "4518 × 2541"],
              ["Performance", "2.0×", "4× fewer", "1920 × 1080", "3840 × 2160"],
              ["Ultra Performance", "3.0×", "9× fewer", "1280 × 720", "2560 × 1440"],
            ],
          },
          {
            heading: "Foveated rendering and the future of \"8K and beyond\"",
            kind: "paragraph",
            body:
              "The eye sees sharply only in the **fovea**, a small region at the centre of its gaze. **Foveated rendering** exploits that by shading at full rate where you look and more coarsely elsewhere. **Fixed foveation** keeps the centre of the screen sharp and needs no eye tracking. **Eye-tracked foveation** moves the sharp region with your gaze, and hardware features such as variable-rate shading make it cheap to switch rates across the image.\n\nThe savings depend on the scene, the headset and how fast the tracking is. Meta's own test of the Quest Pro found fixed foveation saved 26–36% of the performance cost and eye-tracked foveation 33–45%, and research systems have cut the number of pixels shaded by up to 70%. Where it matters most is the headset: lesson 8 showed that a 3,840-pixel panel across a 100 degree view is only about 38 pixels per degree, so headsets need both more pixels and a way to stop paying for the ones you cannot see.\n\nThat is the direction for 8K, 16K and beyond. The number of pixels a display can show will keep growing, and the number of pixels a game shades should not. **Decouple what you shade from what you display.**",
          },
          {
            heading: "Quality tiers, shipping and Ghana",
            kind: "paragraph",
            body:
              "**Quality tiers.** One \"ultra\" setting that only runs on the developer's machine is a bug. Define tiers for classes of device, choose a default from a quick measurement, and let the player override it. The table is a starting point, not a standard.\n\n**Choosing the default.** In a browser, `navigator.deviceMemory` gives a rough figure for memory on some browsers, but a short benchmark is better: render a test scene for two seconds at first launch, look at the frame times, and pick the tier. Dynamic resolution then absorbs the rest.\n\n**Download size and data.** Ship a small base game and stream or download the rest on demand. Ask what 1 GB of mobile data costs your players today, put that number next to your download size, and cut. Offer high-resolution texture packs as optional downloads, not the default.\n\n**Heat and power.** Cap the frame rate on battery, avoid running the graphics card flat out, and test a fifteen-minute session. A **battery-saver** option that lowers the frame rate and render scale is worth having where power cuts are part of life.\n\n**Distribution.** A web build can be played from a link. Android needs a signed package and a store listing, desktop stores have their own review, and some charge a one-time developer fee, so check the current terms and prices of each. Plan privacy and age ratings from the start, and collect only the data you need and say so, as Ghana's Data Protection Act expects.\n\n**Accessibility and safety.** Remappable controls, subtitles, colour-blind-safe palettes, a text size option, a reduce-motion switch, no more than three flashes a second, and clear help for unusual mechanics such as 4D or 5D worlds. A game nobody can read or control is not finished.",
          },
          {
            heading: "Reference: example quality tiers",
            kind: "table",
            rows: [
              ["Tier", "Example device", "Output", "Rendered at", "Frame target", "Textures"],
              ["A", "Mid-range Android phone, 3–4 GB", "720p to 1080p", "540p to 720p, upscaled", "30 fps, 60 optional", "ASTC 6 × 6, mostly 1K–2K"],
              ["B", "Laptop with integrated graphics", "1080p", "720p to 900p with an upscaler", "60 fps", "BC7, 2K"],
              ["C", "Gaming PC or console", "1440p to 4K", "1080p to 1440p with an upscaler", "60 to 120 fps", "2K to 4K"],
              ["D", "Enthusiast hardware", "4K to 8K", "Performance or Ultra Performance upscaling", "60 fps or more", "4K where visible"],
            ],
          },
          {
            heading: "Before you ship: the checklist",
            kind: "paragraph",
            body:
              "- Frame times measured on each tier's reference device: p50, p95, p99 and the worst frame, after ten minutes.\n- The bottleneck identified for each tier, with the experiment that proved it.\n- Dynamic resolution or a render-scale slider, interface at native resolution, and a player override.\n- Download size per tier, optional high-resolution packs, and the data cost stated honestly.\n- A battery-saver mode, and a 15-minute heat test on a phone.\n- Controls remappable, subtitles, colour-blind check, reduce-motion, flash limit respected.\n- A crash and performance report that asks for as little personal data as possible, with consent.\n- A replay or seed for every bug that matters (lesson 6).",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Reporting average fps only.** Report the slowest frames and the percentiles.\n- **Measuring only in the editor or on the development laptop.** Use a release build on the target device after it has warmed up.\n- **A symmetrical controller.** One that rises as fast as it falls ping-pongs between sharp and soft.\n- **Re-allocating render targets on every scale change.** It causes hitches. Allocate once and use a viewport.\n- **Scaling the interface with the scene.** Text goes soft. Draw it after the upscale.\n- **Applying dynamic resolution to a processor-bound frame.** Lowering the resolution cannot help.\n- **One preset, no tiers, no override.** It runs on the developer's machine and nowhere else.\n- **Giant downloads with no optional packs**, and no thought for battery or heat.\n- **Believing upscaled equals native**, or that native is always better. A good upscale at a smooth frame rate often beats native at a poor one, and each has artefacts.",
          },
          {
            heading: "The course project: Dimensions",
            kind: "paragraph",
            body:
              "Build one small game across the dimensions of this course, and prove it runs well. It is the course's final deliverable, and each part uses a lesson.\n\n- **The loop and 2D (lessons 1 and 2).** A fixed-step loop with an accumulator and a clamp, a tile map, per-axis collisions and a smoothed camera. Show that the simulated distance after ten seconds is identical at 30 and 144 fps.\n- **3D (lessons 3 and 4).** A 3D scene, in the web playground or an engine, with a rotating object, a camera, lighting and an on-screen frame-time counter.\n- **4D and 5D (lessons 5 to 7).** A tesseract or a 4D grid toy with rotation in at least three planes and a slice view, plus either a rewind or ghost mechanic, or a timeline branch.\n- **Resolution (lessons 8 and 9).** A render-scale control with dynamic resolution. Measure frame times at 25%, 50%, 75% and 100% render scale on two devices. Calculate the pixels per degree of the target screen. Write a one-page report with p50, p95 and p99 frame times, a CPU-bound or GPU-bound verdict with the experiment that proved it, a tier table, and the download size.\n- **Hand in** a playable build (a web link or an Android package), the source, and the two-page report.",
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Judge performance by percentiles and the slowest frames, on the target device, once it has warmed up. Lowering the resolution tells you whether a frame is limited by the graphics card or the processor, and dynamic resolution helps only the former. A good controller drops quickly, rises slowly, keeps headroom, moves in steps and leaves the interface at native resolution. Upscalers render at 1.5 to 3 times lower resolution per axis and reconstruct the rest, so 8K output at 3 times is rendered at 1440p, nine times fewer pixels. Ship quality tiers with a player override, small downloads, a battery-saver mode and accessibility options, and remember that foveated rendering points the way for very high pixel counts: shade only what the eye can use.",
          },
        ],
        keyPoints: [
          "Judge performance by percentiles and the slowest frames, on the target device, after it has warmed up.",
          "Lowering the resolution tells you whether a frame is GPU-bound or CPU-bound, and dynamic resolution helps only the former.",
          "A good controller drops quickly, rises slowly, keeps headroom, moves in steps and keeps the interface at native resolution.",
          "Upscalers render at 1.5× to 3× lower resolution per axis and reconstruct the rest: 8K output at 3× is rendered at 1440p, nine times fewer pixels.",
          "Ship quality tiers with a player override, small downloads, a battery-saver mode and accessibility options; foveated rendering shows where very high pixel counts are heading: shade only what the eye can use.",
        ],
        exercises: [
          "For 59 frames of 10 ms followed by one frame of 200 ms, compute the mean frame time, the average fps and the p99 frame time, and explain which number the player would notice.",
          "Make the controller quantise to 5% steps and test whether the slow rise still works. If it does not, explain why, and fix it by keeping a continuous desired scale (the demo shows how).",
          "For 1440p and 4K outputs, list the internal resolutions at Quality, Balanced, Performance and Ultra Performance, and the percentage of pixels each saves.",
          "Design the first-launch benchmark for your game: what it renders, for how long, and which frame-time thresholds select each tier.",
          "Write the download plan for your game: base install, optional packs, estimated sizes, and what the data costs a player with a 1 GB budget.",
        ],
        challenge:
          "Deliver the course project, Dimensions: a playable build with a fixed-step loop, a 2D level, a 3D scene, a 4D or 5D toy and a render-scale control with dynamic resolution. Include a two-page report with p50, p95 and p99 frame times at four render scales on two devices, the pixels per degree of your target screen, a CPU-bound or GPU-bound verdict with the experiment that proved it, a quality-tier table and the download size per tier.",
      }),
    ]
  ),
];
