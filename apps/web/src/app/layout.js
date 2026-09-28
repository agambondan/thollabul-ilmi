import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";
import { cookies } from "next/headers";
import Script from "next/script";
import { AuthProvider } from "@/context/Auth";
import { LocaleProvider } from "@/context/Locale";
import { SettingsProvider } from "@/lib/useSettings";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import MobileTabBar from "@/components/MobileTabBar";
import SkipToContent from "@/components/SkipToContent";
import { PublicFooter, PublicNavbar } from "@/components/PublicChrome";
import { PublicMobileMenuProvider } from "@/context/PublicMobileMenu";
import FloatingOverlays from "@/components/FloatingOverlays";

const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Thullaabul 'Ilmi",
    url: SITE_URL,
    description:
        "Portal ilmu Islam dengan Al-Quran, Hadits, doa, dzikir, Asmaul Husna, sirah, dan 30+ fitur lainnya.",
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
    },
};

const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Thullaabul 'Ilmi",
    url: SITE_URL,
    logo: `${SITE_URL}${OG_IMAGE.url}`,
    sameAs: [
        "https://instagram.com/tholabul.ilmi",
        "https://twitter.com/tholabululmi",
        "https://github.com/tholabul-ilmi",
    ],
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
        "Thullaabul 'Ilmi adalah portal ilmu Islam lengkap dengan Al-Quran 30 juz, Tajweed berwarna, tafsir, kosakata, audio murottal, 9 kitab Hadits shahih, doa harian, dzikir, Asmaul Husna, sirah, pelacak hafalan, pelacak tilawah, amalan harian, kalender Hijriyah, leaderboard, blog Islami, dan 30+ fitur lainnya.",
    keywords: [
        "Al-Quran online",
        "hadits shahih",
        "tafsir Al-Quran",
        "tajweed berwarna",
        "audio murottal",
        "kosakata Al-Quran",
        "asbabun nuzul",
        "doa harian",
        "dzikir pagi petang",
        "asmaul husna",
        "sirah nabawiyah",
        "hafalan Al-Quran",
        "pelacak tilawah",
        "amalan harian",
        "kalender hijriyah",
        "leaderboard hafalan",
        "blog islami",
        "ilmu Islam",
        "portal Islam",
        "belajar Al-Quran",
    ],
    openGraph: {
        title: SITE_NAME,
        description:
            "Portal ilmu Islam dengan Al-Quran, Hadits, doa, dzikir, Asmaul Husna, sirah, pelacak hafalan dan tilawah, amalan harian, kalender Hijriyah, dan 30+ fitur lainnya.",
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
            "Portal ilmu Islam dengan Al-Quran, Hadits, doa, dzikir, dan 30+ fitur lainnya.",
        images: [OG_IMAGE.url],
    },
    other: {
        "google-adsense-account": "ca-pub-2005235442054436",
    },
};

export default async function RootLayout({ children }) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value?.toUpperCase();
    const initialLang = langCookie === "EN" ? "EN" : "ID";

    return (
        <html
            lang={initialLang === "EN" ? "en" : "id"}
            suppressHydrationWarning
        >
            <head>
                <Script id='gtm-script' strategy='afterInteractive'>
                    {`
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','GTM-5KG4F8QG');
                    `}
                </Script>
                <Script
                    async
                    src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2005235442054436'
                    crossOrigin='anonymous'
                    strategy='afterInteractive'
                />
                <link
                    rel='preconnect'
                    href='https://i.ytimg.com'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    href='/fonts/LPMQ-Isep-Misbah.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    href='/fonts/Kitab-Regular.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                />
            </head>
            <body>
                <noscript>
                    <iframe
                        src='https://www.googletagmanager.com/ns.html?id=GTM-5KG4F8QG'
                        height='0'
                        width='0'
                        style={{ display: "none", visibility: "hidden" }}
                    />
                </noscript>
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
                        __html: serializeJsonLd(websiteJsonLd),
                    }}
                />
                <script
                    type='application/ld+json'
                    dangerouslySetInnerHTML={{
                        __html: serializeJsonLd(organizationJsonLd),
                    }}
                />
                <LocaleProvider initialLang={initialLang}>
                    <AuthProvider>
                        <SettingsProvider>
                            <AnalyticsTracker />
                            <ServiceWorkerRegistrar />
                            <SkipToContent />
                            <PublicMobileMenuProvider>
                                <PublicNavbar />
                                <div id='main-content' tabIndex={-1}>
                                    {children}
                                </div>
                                <PublicFooter />
                                <MobileTabBar />
                            </PublicMobileMenuProvider>
                            <FloatingOverlays />
                        </SettingsProvider>
                    </AuthProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
