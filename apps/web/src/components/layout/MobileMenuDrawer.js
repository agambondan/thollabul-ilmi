"use client";

import { useLocale } from "@/context/Locale";
import { useModalA11y } from "@/lib/useModalA11y";
import { getNavGroups } from "@/lib/navGroups";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { MdClose } from "react-icons/md";

export default function MobileMenuDrawer({
    open,
    onClose,
    basePath = "",
    userName,
}) {
    const { t } = useLocale();
    const pathname = usePathname();
    const modalA11y = useModalA11y({
        open,
        onClose,
        label: t("nav.menu"),
    });

    const groups = useMemo(() => getNavGroups(basePath), [basePath]);

    if (!open) return null;

    return (
        <div className='md:hidden fixed inset-0 z-50'>
            <button
                type='button'
                aria-label={t("nav.close_menu")}
                className='absolute inset-0 bg-slate-950/50 backdrop-blur-sm'
                onClick={onClose}
            />
            <div
                {...modalA11y}
                className='absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-2xl outline-none'
            >
                <div className='sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between'>
                    <div>
                        <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {t("nav.menu")}
                        </p>
                        <p className='text-xs text-gray-400'>
                            {userName ?? t("common.user")}
                        </p>
                    </div>
                    <button
                        type='button'
                        aria-label={t("nav.close_menu")}
                        onClick={onClose}
                        className='h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                    >
                        <MdClose className='text-lg' />
                    </button>
                </div>
                <div className='px-4 py-3 space-y-5'>
                    {groups.map((group) => (
                        <section key={group.titleKey}>
                            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>
                                {t(group.titleKey)}
                            </p>
                            <div className='grid grid-cols-2 gap-2'>
                                {group.links.map((link) => {
                                    const isActive =
                                        pathname === link.href ||
                                        (link.href !== "/" &&
                                            link.href !== "/dashboard" &&
                                            pathname.startsWith(
                                                link.href + "/",
                                            ));
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={onClose}
                                            className={`min-h-11 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                                isActive
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium"
                                                    : "border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                            }`}
                                        >
                                            <span className='text-base shrink-0'>
                                                {link.icon}
                                            </span>
                                            <span className='truncate'>
                                                {t(link.labelKey)}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
