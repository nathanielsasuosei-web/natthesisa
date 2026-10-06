export const site = {
  name: "codemasterghana",
  tagline: "Learn. Build. Become.",
  description:
    "Practical web, app and computer science courses that turn curious learners into confident builders.",
  supportEmail: "hello@codemasterghana.com",
  currency: {
    code: "GHS",
    symbol: "GH₵",
    label: "Ghana cedis",
  },
  social: {
    twitter: "#",
    linkedin: "#",
    youtube: "#",
  },
} as const;

/**
 * The public origin of this deployment.
 *
 * `NEXT_PUBLIC_SITE_URL` wins when the host sets it — that is the value to
 * configure, because a deployment can be reached on more than one hostname and
 * only the host knows which one is canonical. The fallback is the production
 * domain the site is actually served from, not a placeholder: this origin is
 * the base of `metadataBase` (link-preview images), of the URL inside a
 * certificate's QR code, and of the links in student email. A fallback that
 * pointed anywhere else would send a scanning employer, or a student following
 * a receipt, to a site that is not this one.
 *
 * Set the variable rather than editing this default when the canonical
 * hostname changes.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.codemastergh.online").replace(
  /\/+$/,
  ""
);
