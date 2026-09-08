"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/Auth";

/*
 * The feature grid is server-rendered assuming a signed-out visitor, so
 * "personal" links point at the register flow (`data-personal-href` carries
 * the real destination). Once auth resolves client-side, swap those anchors
 * to their real destination instead of the register redirect — no visible
 * UI, this only ever touches href attributes.
 */
export default function PersonalLinksAuthFix() {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;
        document.querySelectorAll("a[data-personal-href]").forEach((a) => {
            const target = a.getAttribute("data-personal-href");
            if (target) a.setAttribute("href", target);
        });
    }, [isAuthenticated]);

    return null;
}
