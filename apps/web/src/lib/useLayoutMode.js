"use client";

import { useEffect, useState } from "react";

const LAYOUT_KEY = "layoutMode";

export const useLayoutMode = () => {
    const [isWide, setIsWide] = useState(false);

    useEffect(() => {
        setIsWide(localStorage.getItem(LAYOUT_KEY) === "wide");

        const handler = (e) => {
            if (e.key === LAYOUT_KEY) {
                setIsWide(e.newValue === "wide");
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    const setLayout = (wide) => {
        const value = wide ? "wide" : "compact";
        localStorage.setItem(LAYOUT_KEY, value);
        window.dispatchEvent(
            new StorageEvent("storage", { key: LAYOUT_KEY, newValue: value }),
        );
        setIsWide(wide);
    };

    return { isWide, setLayout };
};
