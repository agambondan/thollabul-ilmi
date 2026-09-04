"use client";

import { useLocale } from "@/context/Locale";
import Link from "next/link";

const Footer = () => {
    const { t } = useLocale();

    const NAV_COLUMNS = [
        {
            title: t("footer.worship"),
            links: [
                { label: t("link.quran"), href: "/quran" },
                { label: t("link.hadith"), href: "/hadith" },
                { label: t("link.prayer_guide"), href: "/panduan-sholat" },
                { label: t("link.prayer_schedule"), href: "/jadwal-sholat" },
                { label: t("link.qibla"), href: "/kiblat" },
                { label: t("link.zakat"), href: "/zakat" },
            ],
        },
        {
            title: t("footer.tracker"),
            links: [
                { label: t("link.memorization"), href: "/dashboard/hafalan" },
                { label: t("link.review"), href: "/dashboard/muroja-ah" },
                { label: t("link.recitation"), href: "/dashboard/tilawah" },
                { label: t("link.daily_deeds"), href: "/dashboard/amalan" },
                { label: t("link.statistics"), href: "/dashboard/stats" },
                {
                    label: t("link.leaderboard"),
                    href: "/dashboard/leaderboard",
                },
            ],
        },
        {
            title: t("footer.content"),
            links: [
                { label: t("link.doa"), href: "/doa" },
                { label: t("link.dhikr"), href: "/dzikir" },
                { label: t("link.asmaul_husna"), href: "/asmaul-husna" },
                { label: t("link.brief_fiqh"), href: "/fiqh" },
                { label: t("link.asbabun_nuzul"), href: "/asbabun-nuzul" },
                { label: t("link.sirah"), href: "/siroh" },
                { label: t("link.library"), href: "/library" },
                { label: t("link.blog"), href: "/blog" },
            ],
        },
        {
            title: t("footer.tools"),
            links: [
                { label: t("link.arabic_dict"), href: "/kamus" },
                { label: t("link.hijri_calendar"), href: "/hijri" },
                { label: t("link.quiz"), href: "/quiz" },
                { label: t("link.notes"), href: "/dashboard/notes" },
                { label: t("link.bookmarks"), href: "/dashboard/bookmarks" },
                { label: t("link.search"), href: "/search" },
                { label: "Browser Extension", href: "/extension" },
                {
                    label: t("link.notifications"),
                    href: "/dashboard/notifications",
                },
            ],
        },
    ];

    return (
        <footer className='bg-emerald-950 dark:bg-gray-950 text-white'>
            <div className='max-w-7xl mx-auto px-6 pt-12 pb-8'>
                <div className='grid grid-cols-2 md:grid-cols-5 gap-8 mb-10'>
                    <div className='md:col-span-1'>
                        <Link href='/' className='inline-block mb-3'>
                            <span className='text-lg font-extrabold tracking-wide text-white'>
                                Thullaabul &apos;Ilmi
                            </span>
                            <br />
                            <span
                                className='text-sm text-emerald-300 leading-tight'
                                style={{ fontFamily: "Amiri, serif" }}
                            >
                                طُلَّابُ الْعِلْمِ
                            </span>
                        </Link>
                        <p
                            className='text-sm text-emerald-300 leading-loose mb-1'
                            style={{
                                fontFamily: "Amiri, serif",
                                direction: "rtl",
                            }}
                        >
                            طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
                        </p>
                        <p className='text-xs text-emerald-500 italic'>
                            &quot;{t("footer.quote")}&quot;
                            <br />
                            &mdash; {t("footer.quote_source")}
                        </p>
                    </div>

                    {NAV_COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h3 className='text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3'>
                                {col.title}
                            </h3>
                            <ul className='space-y-2'>
                                {col.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className='text-sm text-emerald-200/70 hover:text-white transition-colors'
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className='flex items-center gap-3 mb-4'>
                    <div className='h-px bg-emerald-800 flex-1' />
                    <span className='text-emerald-400 text-sm'>✦</span>
                    <div className='h-px bg-emerald-800 flex-1' />
                </div>

                <p className='text-xs text-emerald-300 text-center'>
                    &copy; {new Date().getFullYear()} Thullaabul &apos;Ilmi
                    &middot; {t("footer.tagline")}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
