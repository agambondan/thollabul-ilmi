"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for every visitor.
 *
 * It used to be registered only as a side effect of enabling push
 * notifications, so the offline cache never existed for anyone who did not
 * turn notifications on — which is most people.
 */
export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        if (process.env.NODE_ENV !== "production") return;

        const register = () => {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .catch(() => {
                    // An unavailable worker only costs offline support; the app
                    // itself keeps working, so this stays silent.
                });
        };

        if (document.readyState === "complete") register();
        else window.addEventListener("load", register, { once: true });

        return () => window.removeEventListener("load", register);
    }, []);

    return null;
}
