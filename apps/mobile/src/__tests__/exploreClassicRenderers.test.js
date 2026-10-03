import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { createExploreClassicRenderers } from "../screens/explore/ExploreClassicRenderers";

jest.mock("lucide-react-native", () => {
    const icons = {};
    const names = [
        "ArrowLeft",
        "BookOpen",
        "Bookmark",
        "BookmarkCheck",
        "CheckCircle2",
        "Circle",
        "ExternalLink",
        "EyeOff",
        "Flag",
        "Heart",
        "MessageCircle",
        "Pencil",
        "StickyNote",
        "Trash2",
    ];
    names.forEach((n) => {
        icons[n] = n;
    });
    return icons;
});

jest.mock("../context/SessionContext", () => ({
    useSession: () => ({ user: null, token: null }),
}));

jest.mock("../context/FeedbackContext", () => ({
    useFeedback: () => ({ showToast: jest.fn() }),
}));

jest.mock("../i18n/MobileLocaleProvider", () => ({
    useMobileLocale: () => ({ t: (k) => k, language: "idn" }),
}));

describe("createExploreClassicRenderers", () => {
    test("renders tafsir side-by-side mode with dark theme background styling", () => {
        const context = {
            activeFeature: { type: "surah-content", key: "tafsir", title: "Tafsir" },
            selectedItem: {
                id: 1,
                surah_number: 1,
                ayah_number: 1,
                tafsir: "Tafsir Kemenag",
                secondaryTafsir: "Tafsir Al-Mishbah",
            },
            tafsirMode: "side-by-side",
            isDarkTheme: true,
            isWebAppLayout: false,
            t: (k) => k,
            bookmarks: [],
            notes: [],
        };

        const renderers = createExploreClassicRenderers(context);
        const { getAllByText, getByText } = render(renderers.renderDetailScreen());

        expect(getAllByText("Kemenag").length).toBeGreaterThan(0);
        expect(getAllByText("Al-Mishbah").length).toBeGreaterThan(0);
        expect(getByText("Tafsir Kemenag")).toBeTruthy();
    });

    test("renders library book reader in dark theme with theme card background", () => {
        const context = {
            activeFeature: { key: "library", title: "Perpustakaan" },
            selectedItem: {
                id: 10,
                title: "Bulughul Maram",
                author: "Ibnu Hajar",
            },
            bookPages: [{ page_number: 1, text: "Bismillah bab taharah" }],
            activeBookPage: 1,
            isDarkTheme: true,
            isWebAppLayout: false,
            t: (k) => k,
            bookmarks: [],
            notes: [],
        };

        const renderers = createExploreClassicRenderers(context);
        const { getByText } = render(renderers.renderDetailScreen());

        expect(getByText("Bismillah bab taharah")).toBeTruthy();
    });

    test("Blog hadith citation link resolves by book-slug+number (not global id) and sets returnTo to Blog", () => {
        const onOpenTab = jest.fn();
        const context = {
            activeFeature: {
                key: "blog",
                type: "list",
                title: "Artikel",
                refType: "article",
                group: "Ilmu",
                groupLabelKey: "explore.groups.ilmu",
            },
            selectedItem: {
                id: "958fe3e3-f7f5-42d7-be14-401b34fc249d",
                title: "Panduan Lengkap Sujud Tilawah",
                body: "placeholder",
                raw: {
                    slug: "panduan-sujud-tilawah",
                    content:
                        "Dalilnya adalah [HR. Abu Dawud no. 1414](/hadith/abudaud/1414).",
                },
            },
            onOpenTab,
            isDarkTheme: false,
            isWebAppLayout: false,
            t: (k) => k,
            language: "idn",
            bookmarks: [],
            notes: [],
        };

        const renderers = createExploreClassicRenderers(context);
        const { getByText } = render(renderers.renderDetailScreen());

        fireEvent.press(getByText("HR. Abu Dawud no. 1414"));

        expect(onOpenTab).toHaveBeenCalledWith("hadith", {
            bookSlug: "abudaud",
            hadithNumber: 1414,
            returnTo: { tab: "belajar", params: { featureKey: "blog" } },
        });
    });

    test("Blog quran and doa citation links also set returnTo to Blog for back navigation", () => {
        const onOpenTab = jest.fn();
        const context = {
            activeFeature: {
                key: "blog",
                type: "list",
                title: "Artikel",
                refType: "article",
                group: "Ilmu",
                groupLabelKey: "explore.groups.ilmu",
            },
            selectedItem: {
                id: "41266737-aaaa-bbbb-cccc-000000000000",
                title: "Hijrah Nabi",
                body: "placeholder",
                raw: {
                    slug: "hijrah-nabi",
                    content:
                        "Baca [QS. Al-Baqarah](/quran/2).\n\nJuga [doa safar](/doa/safar).",
                },
            },
            onOpenTab,
            isDarkTheme: false,
            isWebAppLayout: false,
            t: (k) => k,
            language: "idn",
            bookmarks: [],
            notes: [],
        };

        const renderers = createExploreClassicRenderers(context);
        const { getByText } = render(renderers.renderDetailScreen());

        fireEvent.press(getByText("QS. Al-Baqarah"));
        expect(onOpenTab).toHaveBeenCalledWith("quran", {
            surahNumber: 2,
            ayahNumber: null,
            returnTo: { tab: "belajar", params: { featureKey: "blog" } },
        });

        fireEvent.press(getByText("doa safar"));
        expect(onOpenTab).toHaveBeenCalledWith("belajar", {
            featureKey: "doa",
            returnTo: { tab: "belajar", params: { featureKey: "blog" } },
        });
    });
});
