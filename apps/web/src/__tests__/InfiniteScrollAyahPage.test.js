import { render, screen, waitFor, act } from "@testing-library/react";
import InfiniteScrollAyahPage from "@/app/quran/[...slug]/InfiniteScrollAyahPage";

jest.mock("next/dynamic", () => () => {
    const Stub = () => null;
    Stub.displayName = "DynamicStub";
    return Stub;
});

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

jest.mock("@/app/quran/[...slug]/AyahPage", () => ({ ayah }) => (
    <li data-testid='ayah'>{ayah?.number}</li>
));

jest.mock("@/components/quran/MushafContinuousView", () => () => null);

jest.mock("@/components/skeleton/Skeleton", () => ({
    SkeletonReader: () => <div data-testid='skeleton' />,
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "id" }),
}));

jest.mock("@/lib/api", () => ({
    progressApi: { saveQuran: jest.fn().mockResolvedValue(undefined) },
    streakApi: { logActivity: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("@/lib/surahList", () => ({
    getSurahMeaning: () => "",
    getSurahName: () => "Al-Fatihah",
}));

jest.mock("@/lib/useLayoutMode", () => ({
    useLayoutMode: () => ({ isWide: false }),
}));

jest.mock("@/lib/useQuranFont", () => ({
    useQuranFont: () => ({ fontCls: "" }),
}));

jest.mock("@/lib/useSettings", () => ({
    useSettings: () => ({ settings: {} }),
}));

const SURAH_PAYLOAD = {
    number: 1,
    number_of_ayahs: 7,
    translation: { latin_en: "Al-Fatihah", ar: "الفاتحة" },
    ayahs: Array.from({ length: 7 }, (_, i) => ({
        id: `a${i + 1}`,
        number: i + 1,
    })),
};

beforeEach(() => {
    global.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        json: async () => SURAH_PAYLOAD,
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("InfiniteScrollAyahPage", () => {
    // Regression test for a self-triggering effect: the mount effect used to
    // depend on the very `surah`/`ayahs` state it set, so every fetch
    // immediately re-triggered another fetch of page 0, forever. This only
    // surfaced when no `initialSurah` is provided (the dashboard route never
    // passes one — see apps/web/src/app/dashboard/quran/[slug]/page.js), so
    // this test deliberately omits it, matching that exact code path.
    test("fetches page 0 exactly once and does not loop when initialSurah is absent", async () => {
        render(
            <InfiniteScrollAyahPage
                params={{ slug: "Al-Faatiha" }}
                searchParams={{}}
                basePath='/dashboard/quran'
            />,
        );

        await waitFor(() => {
            expect(screen.getAllByTestId("ayah").length).toBe(7);
        });

        // Give any runaway re-fetch loop a real chance to spin before we
        // assert — a regression here would blow well past 1 within this
        // window, not sit exactly at it.
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch.mock.calls[0][0]).toContain(
            "/api/v1/surah/name/Al-Faatiha?page=0",
        );
    });
});
