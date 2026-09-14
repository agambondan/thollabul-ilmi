"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { adsApi } from "@/lib/api";

export function BannerAd({ slot = "banner", className = "" }) {
    const pathname = usePathname();
    const [ad, setAd] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let mounted = true;
        adsApi
            .getActiveSlot(slot)
            .then((res) => {
                if (mounted) {
                    setAd(res?.data || res || null);
                }
            })
            .catch(() => {
                if (mounted) {
                    setAd(null);
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoaded(true);
                }
            });

        return () => {
            mounted = false;
        };
    }, [slot, pathname]);

    if (!loaded || !ad) {
        return null;
    }

    return (
        <aside
            aria-label="Iklan Sponsor"
            className={`my-4 w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${className}`}
        >
            <a
                href={ad.click_url || "#"}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group relative flex w-full flex-col sm:flex-row items-center justify-between p-3.5 gap-3"
            >
                {ad.image_url ? (
                    <div className="relative w-full max-h-28 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={ad.image_url}
                            alt={ad.title || "Iklan"}
                            className="w-full h-auto max-h-28 object-cover rounded-lg"
                        />
                    </div>
                ) : (
                    <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                                {ad.title}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                                {ad.click_url}
                            </span>
                        </div>
                        <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            Buka ↗
                        </span>
                    </div>
                )}
                <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white uppercase backdrop-blur-xs">
                    Iklan
                </span>
            </a>
        </aside>
    );
}

export default BannerAd;
