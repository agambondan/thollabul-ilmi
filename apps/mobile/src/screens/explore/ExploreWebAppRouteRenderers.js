import { Suspense, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export function ExploreWebAppRouteLoader({ context, featureKey, isDarkTheme }) {
    const [RouteComponent, setRouteComponent] = useState(null);

    if (!RouteComponent) {
        return (
            <Suspense fallback={<RouteLoading />}>
                <RouteImporter
                    featureKey={featureKey}
                    context={context}
                    isDarkTheme={isDarkTheme}
                    setRouteComponent={setRouteComponent}
                />
            </Suspense>
        );
    }

    return <RouteComponent {...context} isDarkTheme={isDarkTheme} />;
}

function RouteLoading() {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#10b981" />
        </View>
    );
}

function RouteImporter({ featureKey, context, isDarkTheme, setRouteComponent }) {
    const routeImports = {
        "kajian": () => import("./WebAppKajianRoute").then(m => m.WebAppKajianRoute),
        "tafsir": () => import("./WebAppTafsirRoute").then(m => m.WebAppTafsirRoute),
        "blog": () => import("./WebAppBlogRoute").then(m => m.WebAppBlogRoute),
        "library": () => import("./WebAppLibraryRoute").then(m => m.WebAppLibraryRoute),
        "perawi": () => import("./WebAppPerawiRoute").then(m => m.WebAppPerawiRoute),
        "fiqh": () => import("./WebAppFiqhRoute").then(m => m.WebAppFiqhRoute),
        "siroh": () => import("./WebAppSirohRoute").then(m => m.WebAppSirohRoute),
        "asmaul-wirid": () => import("./WebAppAsmaulRoutes").then(m => m.WebAppAsmaulWiridRoute),
        "asmaul-flashcard": () => import("./WebAppAsmaulRoutes").then(m => m.WebAppAsmaulFlashcardRoute),
        "faraidh": () => import("./WebAppFaraidhRoute").then(m => m.WebAppFaraidhRoute),
        "zakat": () => import("./WebAppZakatRoute").then(m => m.WebAppZakatRoute),
        "hijri": () => import("./WebAppHijriRoute").then(m => m.WebAppHijriRoute),
        "imsakiyah": () => import("./WebAppImsakiyahRoute").then(m => m.WebAppImsakiyahRoute),
        "doa": () => import("./WebAppDoaRoute").then(m => m.WebAppDoaRoute),
        "amalan": () => import("./WebAppAmalanRoute").then(m => m.WebAppAmalanRoute),
        "tasbih": () => import("./WebAppTasbihRoute").then(m => m.WebAppTasbihRoute),
        "quiz": () => import("./WebAppQuizRoute").then(m => m.WebAppQuizRoute),
        "forum": () => import("./WebAppForumRoute").then(m => m.WebAppForumRoute),
        "feed": () => import("./WebAppFeedRoute").then(m => m.WebAppFeedRoute),
        "kamus": () => import("./WebAppKamusRoute").then(m => m.WebAppKamusRoute),
        "lessons": () => import("./WebAppLessonsRoute").then(m => m.WebAppLessonsRoute),
        "komunitas": () => import("./WebAppKomunitasRoute").then(m => m.WebAppKomunitasRoute),
        "bookmarks": () => import("./WebAppBookmarksRoute").then(m => m.WebAppBookmarksRoute),
        "notes": () => import("./WebAppNotesRoute").then(m => m.WebAppNotesRoute),
        "goals": () => import("./WebAppGoalsRoute").then(m => m.WebAppGoalsRoute),
        "muhasabah": () => import("./WebAppMuhasabahRoute").then(m => m.WebAppMuhasabahRoute),
        "hafalan": () => import("./WebAppHafalanRoute").then(m => m.WebAppHafalanRoute),
        "murojaah": () => import("./WebAppMurojaahRoute").then(m => m.WebAppMurojaahRoute),
        "tilawah": () => import("./WebAppTilawahRoute").then(m => m.WebAppTilawahRoute),
        "stats": () => import("./WebAppStatsRoute").then(m => m.WebAppStatsRoute),
        "leaderboard": () => import("./WebAppLeaderboardRoute").then(m => m.WebAppLeaderboardRoute),
        "historical-map": () => import("../HistoricalMapScreen").then(m => m.HistoricalMapContent),
        "tokoh": () => import("../TokohTarikhContent").then(m => m.TokohTarikhContent),
        "masjid": () => import("./WebAppMasjidRoute").then(m => m.WebAppMasjidRoute),
        "radio-islamic": () => import("../RadioIslamicContent").then(m => m.RadioIslamicContent),
        "user-wird": () => import("./WebAppUserWirdRoute").then(m => m.WebAppUserWirdRoute),
    };

    const importer = routeImports[featureKey];
    if (!importer) return null;

    importer().then(mod => {
        setRouteComponent(mod.default || mod);
    });

    return null;
}