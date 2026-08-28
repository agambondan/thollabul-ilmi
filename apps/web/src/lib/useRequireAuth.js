"use client";

import { useAuth } from "@/context/Auth";
import { buildLoginHref } from "@/lib/authRedirect";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRequireAuth = () => {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.isAuthenticated) {
            const currentPath =
                typeof window === "undefined"
                    ? "/dashboard"
                    : `${window.location.pathname}${window.location.search}`;
            router.push(buildLoginHref(currentPath));
        }
    }, [auth.isLoading, auth.isAuthenticated, router]);

    return auth;
};
