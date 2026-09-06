"use client";

import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { BsEnvelope, BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";

const contactsByLang = {
    ID: [
        {
            icon: BsEnvelope,
            label: "Email",
            value: "admin@tholabul-ilmi.com",
            href: "mailto:admin@tholabul-ilmi.com",
            desc: "Untuk pertanyaan, saran, atau laporan bug",
        },
        {
            icon: BsGithub,
            label: "GitHub",
            value: "github.com/tholabul-ilmi",
            href: "https://github.com/tholabul-ilmi",
            desc: "Source code, issue tracker, dan kontribusi",
        },
        {
            icon: BsInstagram,
            label: "Instagram",
            value: "@tholabul.ilmi",
            href: "https://instagram.com/tholabul.ilmi",
            desc: "Update fitur dan konten islami harian",
        },
        {
            icon: BsTwitter,
            label: "X / Twitter",
            value: "@tholabululmi",
            href: "https://twitter.com/tholabululmi",
            desc: "Diskusi dan pengumuman terbaru",
        },
    ],
    EN: [
        {
            icon: BsEnvelope,
            label: "Email",
            value: "admin@tholabul-ilmi.com",
            href: "mailto:admin@tholabul-ilmi.com",
            desc: "For questions, feedback, or bug reports",
        },
        {
            icon: BsGithub,
            label: "GitHub",
            value: "github.com/tholabul-ilmi",
            href: "https://github.com/tholabul-ilmi",
            desc: "Source code, issue tracker, and contributions",
        },
        {
            icon: BsInstagram,
            label: "Instagram",
            value: "@tholabul.ilmi",
            href: "https://instagram.com/tholabul.ilmi",
            desc: "Feature updates and daily Islamic content",
        },
        {
            icon: BsTwitter,
            label: "X / Twitter",
            value: "@tholabululmi",
            href: "https://twitter.com/tholabululmi",
            desc: "Discussions and latest announcements",
        },
    ],
};

const faqsByLang = {
    ID: [
        {
            q: "Apakah API bisa digunakan secara gratis?",
            a: "Ya, API publik kami tersedia gratis untuk penggunaan non-komersial. Lihat halaman Developer untuk daftar endpoint yang tersedia.",
        },
        {
            q: "Bagaimana cara melaporkan data yang salah?",
            a: "Buka issue di GitHub kami atau kirim email dengan menyertakan surah/ayat/hadith yang dimaksud beserta koreksinya.",
        },
        {
            q: "Apakah ada aplikasi mobile?",
            a: "Aplikasi mobile sedang dalam pengembangan. Pantau terus update di Instagram dan GitHub kami.",
        },
        {
            q: "Bagaimana cara berkontribusi konten?",
            a: "Kami menerima kontribusi terjemahan, tafsir, dan konten islami lainnya. Hubungi kami via email untuk informasi lebih lanjut.",
        },
    ],
    EN: [
        {
            q: "Can the API be used for free?",
            a: "Yes, our public API is free for non-commercial use. See the Developer page for the available endpoint list.",
        },
        {
            q: "How do I report incorrect data?",
            a: "Open an issue on GitHub or send an email with the relevant surah, ayah, or hadith and the correction.",
        },
        {
            q: "Is there a mobile app?",
            a: "The mobile app is under development. Follow updates on Instagram and GitHub.",
        },
        {
            q: "How can I contribute content?",
            a: "We accept contributions for translations, tafsir, and other Islamic content. Contact us by email for more details.",
        },
    ],
};

export default function ContactPageClient() {
    const { lang, t } = useLocale();
    const { isWide } = useLayoutMode();
    const contacts = contactsByLang[lang] ?? contactsByLang.ID;
    const faqs = faqsByLang[lang] ?? faqsByLang.ID;

    return (
        <div className={isWide ? "w-full px-4 py-8" : "max-w-3xl mx-auto px-4 py-8"}>
            <div className='mb-10'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    تَوَاصَلْ مَعَنَا
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("contact.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("contact.subtitle")}
                </p>
            </div>

            <div className='grid sm:grid-cols-2 gap-4 mb-10'>
                {contacts.map(({ icon: Icon, label, value, href, desc }) => (
                    <a
                        key={label}
                        href={href}
                        target={
                            href.startsWith("mailto") ? undefined : "_blank"
                        }
                        rel='noopener noreferrer'
                        className='group flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all'
                    >
                        <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors'>
                            <Icon
                                className='text-emerald-700 dark:text-emerald-400 dark:text-emerald-300'
                                size={18}
                            />
                        </div>
                        <div className='min-w-0'>
                            <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5'>
                                {label}
                            </p>
                            <p className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white truncate'>
                                {value}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5 leading-snug'>
                                {desc}
                            </p>
                        </div>
                    </a>
                ))}
            </div>

            <div>
                <h2 className='text-base font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-4'>
                    {t("contact.faq_title")}
                </h2>
                <div className='flex flex-col gap-3'>
                    {faqs.map(({ q, a }) => (
                        <div
                            key={q}
                            className='border border-gray-100 dark:border-slate-700 rounded-2xl px-4 py-4'
                        >
                            <p className='text-sm font-semibold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                                {q}
                            </p>
                            <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 leading-relaxed'>
                                {a}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <p className='mt-10 text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300'>
                {t("contact.response_time")}
            </p>
        </div>
    );
}
