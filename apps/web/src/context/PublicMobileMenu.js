"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PublicMobileMenuContext = createContext(null);

export function PublicMobileMenuProvider({ children }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Navbar (which used to own this state locally) unmounts on
    // /dashboard, /admin, /auth and the Quran fullscreen reader, so its own
    // route-change effect can't be trusted to reset this — it may never run
    // before those routes render, leaving the drawer stuck open behind the
    // scenes. The provider itself never unmounts, so it resets here instead.
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <PublicMobileMenuContext.Provider value={{ open, setOpen }}>
            {children}
        </PublicMobileMenuContext.Provider>
    );
}

/**
 * Navbar's hamburger and MobileTabBar's "Menu" tile both open the same
 * drawer, so they must share one open/close state instead of each keeping
 * its own copy — otherwise both mount their own MobileMenuDrawer at once.
 * Falls back to standalone local state when rendered without the provider
 * (isolated unit tests), so components stay independently testable.
 */
export function usePublicMobileMenu() {
    const shared = useContext(PublicMobileMenuContext);
    const [localOpen, setLocalOpen] = useState(false);
    return shared ?? { open: localOpen, setOpen: setLocalOpen };
}
