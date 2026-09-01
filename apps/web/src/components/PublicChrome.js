"use client";

import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import { usePathname } from "next/navigation";

/*
 * Routes that bring their own chrome. /dashboard and /admin have full app
 * shells with a sidebar; /auth is a deliberately bare sign-in surface.
 */
const OWN_CHROME = ["/dashboard", "/admin", "/auth"];

const hasOwnChrome = (pathname) =>
    OWN_CHROME.some(
        (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`),
    );

/**
 * The public navbar and footer used to be rendered by each of the 56 public
 * pages individually, so both unmounted and remounted on every navigation —
 * menu state was lost, every effect re-ran, and the header visibly flickered.
 * Rendering them once from the root layout keeps them mounted across route
 * changes.
 */
export function PublicNavbar() {
    const pathname = usePathname();
    if (hasOwnChrome(pathname)) return null;
    return <NavbarTailwindCss />;
}

export function PublicFooter() {
    const pathname = usePathname();
    if (hasOwnChrome(pathname)) return null;
    return <Footer />;
}
