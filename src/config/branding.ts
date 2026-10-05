/**
 * Brand assets.
 *
 * The owner supplied one piece of artwork — a "Vibe Coding" poster with the
 * laptop, the code wall and the tools on the screen. One square image cannot be
 * a wordmark, a favicon and a course cover at once, so it is used where it is
 * strong and sized for each job. Everything below lives in `public/branding/`
 * except the app icons, which are file conventions in `src/app/`.
 *
 * To swap the artwork, replace the files (or re-run the crops the README
 * describes) — every reference goes through this module, so nothing else in
 * the code needs to change.
 */

export const brandAssets = {
  /**
   * The full artwork, 1024px, for a place that can afford to be generous with
   * space (the landing page's brand panel, the Vibe Coding program cover).
   */
  poster: "/branding/logo.webp",
  posterFallback: "/branding/logo-1024.jpg",
  /** The same artwork as a JPEG, for places that cannot use WebP. */
  posterJpeg: "/branding/logo-1024.jpg",
  /** The untouched upload: 2000×2000 JPEG, kept as the master copy. */
  master: "/branding/logo-original.jpg",
  /** 1200×630 crop of the laptop and the headline, for link previews. */
  social: "/branding/og.jpg",
  /** 1200×750 crop, used as the Vibe Coding program cover. */
  vibeCoding: "/branding/vibe-coding.jpg",
} as const;

/**
 * The header lockup.
 *
 * The wordmark is set in HTML rather than baked into an image: it stays crisp
 * at every size, it is readable to a screen reader and it reflows with the
 * layout. `brandMark` is the tile glyph, `brandWordmark.split` shows how the
 * name is highlighted (the "ghana" half takes the accent colour).
 */
export const brandWordmark = {
  /** Shown inside the tile, exactly as designed. */
  glyph: "</>",
  /** The name, in the two parts that are coloured differently. */
  split: { first: "codemaster", second: "ghana" },
  name: "codemasterghana",
  tagline: "Learn. Build. Become.",
  /** The accent the second half of the name and the dot use. */
  accent: "#6d4aff",
} as const;
