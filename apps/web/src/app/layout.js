import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import { AuthProvider } from "@/context/Auth";
import SettingButton from "@/components/popup/SettingButton";
import { LocaleProvider } from "@/context/Locale";
import { SettingsProvider } from "@/lib/useSettings";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { Toaster } from "react-hot-toast";
import InAppNotification from "@/components/InAppNotification";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";


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
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
    alternates: { canonical: "/" },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
    formatDetection: { telephone: false },
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
        title: SITE_NAME,
        description:
            "Islamic knowledge portal with Quran, Hadith, prayers, dhikr, Asmaul Husna, sirah, memorization tracking, recitation tracking, daily deeds, Hijri calendar, and 30+ more features.",
        type: "website",
        siteName: SITE_NAME,
        url: SITE_URL,
        locale: "id_ID",
        alternateLocale: ["en_US"],
        images: [OG_IMAGE],
    },
    twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description:
            "Islamic knowledge portal with Quran, Hadith, prayers, dhikr, and 30+ more features.",
        images: [OG_IMAGE.url],
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
