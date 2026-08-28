import "./globals.css";
import { AuthProvider } from "@/context/Auth";
import SettingButton from "@/components/popup/SettingButton";
import { LocaleProvider } from "@/context/Locale";
import { SettingsProvider } from "@/lib/useSettings";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { Toaster } from "react-hot-toast";
import InAppNotification from "@/components/InAppNotification";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tholabul-ilmi.com";

const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Thullaabul 'Ilmi",
    url: SITE_URL,
    description:
        "Islamic knowledge portal with Quran, Hadith, prayers, dhikr, Asmaul Husna, sirah, and 30+ more features.",
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
    },
};

export const metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://tholabul-ilmi.com",
    ),
    title: { default: "Thullaabul 'Ilmi", template: "%s — Thullaabul 'Ilmi" },
    description:
        "Thullaabul 'Ilmi is a complete Islamic knowledge portal with the 30 juz Quran, color-coded Tajweed, tafsir, vocabulary, recitation audio, 9 authentic Hadith books, daily prayers, dhikr, Asmaul Husna, sirah, memorization tracking, recitation tracking, daily deeds, Hijri calendar, leaderboard, Islamic blog, and 30+ more features.",
    keywords: [
        "online Quran",
        "authentic hadith",
        "quran tafsir",
        "color-coded tajweed",
        "recitation audio",
        "quran vocabulary",
        "asbabun nuzul",
        "daily prayers",
        "morning evening dhikr",
        "asmaul husna",
        "prophetic biography",
        "quran memorization",
        "recitation tracker",
        "daily deeds",
        "hijri calendar",
        "memorization leaderboard",
        "islamic blog",
        "islamic knowledge",
        "islamic portal",
        "learn quran",
    ],
    openGraph: {
        title: "Thullaabul 'Ilmi",
        description:
            "Islamic knowledge portal with Quran, Hadith, prayers, dhikr, Asmaul Husna, sirah, memorization tracking, recitation tracking, daily deeds, Hijri calendar, and 30+ more features.",
        type: "website",
        locale: "en_US",
        images: [{ url: "/og", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Thullaabul 'Ilmi",
        description:
            "Islamic knowledge portal with Quran, Hadith, prayers, dhikr, and 30+ more features.",
        images: ["/og"],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang='id' suppressHydrationWarning>
            <body>
                <script
                    dangerouslySetInnerHTML={{
                        __html: "(function(){try{var lang=(localStorage.getItem('lang')||'ID').toUpperCase()==='EN'?'en':'id';document.documentElement.lang=lang;}catch(e){}})();",
                    }}
                />
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(websiteJsonLd),
                    }}
                />
                <LocaleProvider>
                    <SettingsProvider>
                        <AuthProvider>
                            <AnalyticsTracker />
                            {children}
                            <SettingButton />
                            <NotificationPermissionPrompt />
                            <Toaster
                                position='top-right'
                                toastOptions={{
                                    duration: 5000,
                                    style: {
                                        borderRadius: "12px",
                                        background: "#fff",
                                        color: "#1e293b",
                                        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                                    },
                                    dark: {
                                        background: "#1e293b",
                                        color: "#f1f5f9",
                                    },
                                }}
                            />
                            <InAppNotification />
                        </AuthProvider>
                    </SettingsProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
