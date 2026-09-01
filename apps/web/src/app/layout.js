import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import { AuthProvider } from "@/context/Auth";
import SettingButton from "@/components/popup/SettingButton";
import { LocaleProvider } from "@/context/Locale";
import { SettingsProvider } from "@/lib/useSettings";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import MobileTabBar from "@/components/MobileTabBar";
import SkipToContent from "@/components/SkipToContent";
import { PublicFooter, PublicNavbar } from "@/components/PublicChrome";
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
                {/*
                 * Runs before hydration so dark-mode users do not get a flash
                 * of the light theme on every page load. Navbar, the dashboard
                 * and admin layouts all read the same `theme` key afterwards.
                 */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: "(function(){try{var lang=(localStorage.getItem('lang')||'ID').toUpperCase()==='EN'?'en':'id';document.documentElement.lang=lang;var stored=localStorage.getItem('theme');var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark);}catch(e){}})();",
                    }}
                />
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(websiteJsonLd),
                    }}
                />
                <LocaleProvider>
                    <AuthProvider>
                        <SettingsProvider>
                            <AnalyticsTracker />
                            <ServiceWorkerRegistrar />
                            <SkipToContent />
                            <PublicNavbar />
                            <div id='main-content' tabIndex={-1}>
                                {children}
                            </div>
                            <PublicFooter />
                            <MobileTabBar />
                            <SettingButton />
                            <NotificationPermissionPrompt />
                            <Toaster
                                position='top-right'
                                toastOptions={{
                                    duration: 5000,
                                    // Tokens defined in globals.css so the
                                    // toast follows the .dark class like every
                                    // other surface. react-hot-toast has no
                                    // `dark` option — the previous one was
                                    // silently ignored.
                                    className: "app-toast",
                                    style: {
                                        borderRadius: "12px",
                                        background: "var(--toast-bg)",
                                        color: "var(--toast-fg)",
                                        boxShadow:
                                            "0 4px 24px rgba(0,0,0,0.16)",
                                    },
                                }}
                            />
                            <InAppNotification />
                        </SettingsProvider>
                    </AuthProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
