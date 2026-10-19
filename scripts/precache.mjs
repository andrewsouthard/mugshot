// Runs after `next build`. Lists every file the app needs offline and writes
// that list, plus a version hash, into out/sw.js. Any change to the build
// output (new content, new code) changes sw.js, which is how the browser
// learns there's an update.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const SW = path.join(OUT, "sw.js");

// Not needed offline: the worker itself, host config, share images for
// crawlers, source maps and the not-found route.
const SKIP = [
  /^sw\.js$/,
  /^_headers$/,
  /^_redirects$/,
  /(^|\/)opengraph-image$/,
  /\.map$/,
  /^_not-found(\/|\.|$)/,
  /^404\.html$/,
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** The URL a file is served at. Cloudflare Pages serves `a/b.html` at `/a/b`. */
function toUrl(file) {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
  if (file.endsWith(".html")) return `/${file.slice(0, -".html".length)}`;
  return `/${file}`;
}

const files = walk(OUT)
  .map((full) => path.relative(OUT, full).split(path.sep).join("/"))
  .filter((file) => !SKIP.some((pattern) => pattern.test(file)))
  .sort();

const hash = createHash("sha256");
for (const file of files) {
  hash.update(file).update("\0").update(readFileSync(path.join(OUT, file)));
}
const version = hash.digest("hex").slice(0, 12);
const urls = files.map(toUrl);

const source = readFileSync(SW, "utf8");
const filled = source
  .replace("/* __PRECACHE__ */ []", JSON.stringify(urls, null, 2))
  .replace('"__VERSION__"', JSON.stringify(version));
if (filled === source || filled.includes("__PRECACHE__") || filled.includes("__VERSION__")) {
  throw new Error("scripts/precache.mjs: placeholders not found in out/sw.js");
}
writeFileSync(SW, filled);

console.log(`Service worker: precaching ${urls.length} files, version ${version}`);
