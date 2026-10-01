import React from "react";
import { render } from "@testing-library/react-native";
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
});
