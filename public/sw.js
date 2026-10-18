// Bump when the precached files change so old caches are cleaned up.
const CACHE = "mugshot-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

// Full page loads go to the network; if that fails, show the offline page.
// Soft navigations, RSC payloads, and Server Actions are left to Next.js,
// which retries them itself (experimental.useOffline).
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        return preloaded || (await fetch(event.request));
      } catch {
        const cache = await caches.open(CACHE);
        return cache.match(OFFLINE_URL);
      }
    })(),
  );
});
