self.addEventListener("message", (event) => {
    if (event.data?.type === "ADZAN_NOTIFICATION") {
        event.waitUntil(
            self.registration.showNotification(
                event.data.title || "Thollabul Ilmi",
                {
                    body: event.data.body || "",
                    icon: "/icon.png",
                    badge: "/icon.png",
                    vibrate: [200, 100, 200],
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
        icon: data.icon || "/icon.png",
        badge: data.badge || "/icon.png",
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

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});
