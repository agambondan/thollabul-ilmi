self.addEventListener("message", (event) => {
    if (event.data?.type === "ADZAN_NOTIFICATION") {
        event.waitUntil(
            self.registration.showNotification(
                event.data.title || "Thollabul Ilmi",
                {
                    body: event.data.body || "",
                    icon: "/icon.svg",
                    badge: "/icon.svg",
                    vibrate: [500, 250, 500, 250, 500],
                    tag: event.data.tag || "adzan-alert",
                    renotify: true,
                    requireInteraction: true,
                    silent: false,
                    urgency: "high",
                    data: { url: event.data.url || "/", type: "adzan" },
                },
            ),
        );
    }
});

self.addEventListener("push", (event) => {
    let data;
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = {};
    }

    const title = data.title || "Thollabul Ilmi";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icon.svg",
        badge: data.badge || "/icon.svg",
        vibrate: [200, 100, 200],
        data: {
            url: data.url || "/",
            type: data.type || "",
            title,
            body: data.body || "",
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    client.postMessage({
                        type: "PUSH_NOTIFICATION",
                        title,
                        body: data.body || "",
                        url: data.url || "/",
                    });
                }
            }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if ("focus" in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(url);
            }),
    );
});

/* ── Offline support ──────────────────────────────────────────────
 *
 * The worker used to handle notifications only — no fetch handler at all — so
 * an installed PWA showed the browser's error page the moment the connection
 * dropped. For a Quran and dhikr app, reading offline is close to the point.
 *
 * Three strategies, chosen per request type:
 *
 *   navigation  network-first, falling back to the cached page and finally to
 *               the offline shell. Keeps content fresh online, keeps the app
 *               usable offline.
 *   static      cache-first for immutable build output and fonts (hashed
 *               filenames, so a stale entry is never wrong).
 *   API GET     stale-while-revalidate, so a surah or hadith read once stays
 *               readable and refreshes in the background.
 *
 * Writes (POST/PUT/DELETE) are never cached or replayed — a queued "mark
 * memorised" firing days later would corrupt the user's progress.
 */
const VERSION = "v1";
const SHELL_CACHE = `shell-${VERSION}`;
const STATIC_CACHE = `static-${VERSION}`;
const API_CACHE = `api-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icon.svg", "/manifest.webmanifest"];

const isStaticAsset = (url) =>
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/assets/");

const isApiRead = (request, url) =>
    request.method === "GET" && url.pathname.startsWith("/api/v1/");

const trimCache = async (name, maxEntries) => {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    await Promise.all(
        keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)),
    );
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .catch(() => {})
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    const keep = new Set([SHELL_CACHE, STATIC_CACHE, API_CACHE]);
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((n) => !keep.has(n))
                        .map((n) => caches.delete(n)),
                ),
            )
            .then(() => clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Never cache auth or admin traffic.
    if (
        url.pathname.startsWith("/api/v1/auth") ||
        url.pathname.startsWith("/admin")
    ) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches
                        .open(SHELL_CACHE)
                        .then((cache) => cache.put(request, copy))
                        .catch(() => {});
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    return cached ?? caches.match(OFFLINE_URL);
                }),
        );
        return;
    }

    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ??
                    fetch(request).then((response) => {
                        const copy = response.clone();
                        caches
                            .open(STATIC_CACHE)
                            .then((cache) => cache.put(request, copy))
                            .catch(() => {});
                        return response;
                    }),
            ),
        );
        return;
    }

    if (isApiRead(request, url)) {
        event.respondWith(
            caches.open(API_CACHE).then(async (cache) => {
                const cached = await cache.match(request);
                const network = fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                            trimCache(API_CACHE, 300);
                        }
                        return response;
                    })
                    .catch(() => cached);
                return cached ?? network;
            }),
        );
    }
});
