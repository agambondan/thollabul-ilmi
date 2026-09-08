"use client";

import Link from "next/link";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { buildRegisterHref } from "@/lib/authRedirect";

export default function DashboardCTA({ className, icon = null }) {
    const { isAuthenticated } = useAuth();
    const { t } = useLocale();

    return (
        <Link
            href={
                isAuthenticated ? "/dashboard" : buildRegisterHref("/dashboard")
            }
            className={className}
        >
            {icon}
            {isAuthenticated ? t("link.dashboard") : t("home.cta_register")}
        </Link>
    );
}
