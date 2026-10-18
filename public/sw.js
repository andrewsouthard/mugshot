// Mugshot's service worker. scripts/precache.mjs fills in the file list and
// version after `next build`; any change to the build changes this file, so
// the browser installs the new worker in the background. It then waits until
// the user accepts the "update available" prompt.

const PRECACHE = /* __PRECACHE__ */ [];
const VERSION = "__VERSION__";
const CACHE = `mugshot-${VERSION}`;
// Precached at its clean URL, like every page (see scripts/precache.mjs).
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Bypass the HTTP cache so every file matches this version.
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("mugshot-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Sent by the page when the user accepts the update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Cache first: everything the app needs is precached for this version, so it
// works the same online and off. Query strings are ignored, so `/?q=sour`
// and RSC requests (`?_rsc=…`) find their files. Anything else goes to the
// network, with the offline page as the fallback for navigations.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch (error) {
        if (request.mode === "navigate") {
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
        }
        throw error;
      }
    })(),
  );
});
