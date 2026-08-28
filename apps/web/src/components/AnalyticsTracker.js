"use client";

import { analyticsApi } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "tholabul_visitor_id";

const getVisitorID = () => {
    try {
        const existing = localStorage.getItem(VISITOR_KEY);
        if (existing) return existing;
        const next =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(VISITOR_KEY, next);
        return next;
    } catch {
        return "";
    }
};

const sourceFromPath = (path) => {
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/dashboard")) return "dashboard";
    return "public";
};

const AnalyticsTracker = () => {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;
        if (pathname.startsWith("/api") || pathname.startsWith("/_next"))
            return;

        const path = `${pathname}${window.location.search || ""}`;
        analyticsApi
            .trackPageView({
                visitor_id: getVisitorID(),
                path,
                source: sourceFromPath(pathname),
                referrer: document.referrer || "",
            })
            .catch((e) => console.error(e));
    }, [pathname]);

    return null;
};

export default AnalyticsTracker;
