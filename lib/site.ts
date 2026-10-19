/**
 * The public origin, used for canonical URLs, Open Graph tags and JSON-LD.
 * Set SITE_URL for production builds. Cloudflare Pages sets CF_PAGES_URL to
 * the deployment's own URL, which is right for preview builds.
 */
export const SITE_URL = new URL(
  process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? "http://localhost:3000",
);

export const SITE_NAME = "Mugshot";

export const DESCRIPTION =
  "Cocktail and coffee recipes to make at home, with step-by-step timers. Works offline.";
