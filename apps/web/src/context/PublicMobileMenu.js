"use client";

import { createContext, useContext, useState } from "react";

const PublicMobileMenuContext = createContext(null);

export function PublicMobileMenuProvider({ children }) {
    const [open, setOpen] = useState(false);
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
