const {
    closeInternalViewState,
    closeInternalViewThenOpenTabState,
    hardwareBackState,
    normalizeTabRequest,
    openInternalViewState,
    openTabState,
} = require("./appNavigation");

const makeId = (tab, suffix) => `test:${tab}:${suffix}`;
const directoryRoute = { tab: "home", view: "feature-directory" };
const initialState = () => ({
    activeTab: "home",
    deepLinkTarget: null,
    internalRoutes: {},
    returnRoutes: {},
});

const openFeatureDirectory = (state = initialState()) =>
    openInternalViewState(state, "home", "feature-directory", {}, makeId).state;

describe("normalizeTabRequest", () => {
    test("passes through regular tabs", () => {
        expect(normalizeTabRequest("home")).toEqual({
            tab: "home",
            params: null,
        });
        expect(normalizeTabRequest("quran", { surah: 1 })).toEqual({
            tab: "quran",
            params: { surah: 1 },
        });
        expect(normalizeTabRequest("hadith")).toEqual({
            tab: "hadith",
            params: null,
        });
        expect(normalizeTabRequest("belajar")).toEqual({
            tab: "belajar",
            params: null,
        });
    });

    test("redirects qibla to ibadah with view param", () => {
        const result = normalizeTabRequest("qibla");
        expect(result.tab).toBe("ibadah");
        expect(result.params.view).toBe("qibla");
    });

    test("merges params with qibla redirect", () => {
        const result = normalizeTabRequest("qibla", { extra: "val" });
        expect(result.tab).toBe("ibadah");
        expect(result.params.view).toBe("qibla");
        expect(result.params.extra).toBe("val");
    });
});

describe("openTabState", () => {
    test("opens a new tab", () => {
        const { state } = openTabState(initialState(), "quran");
        expect(state.activeTab).toBe("quran");
    });

    test("creates deepLinkTarget when params provided", () => {
        const { state } = openTabState(initialState(), "quran", {
            surahNumber: 1,
        });
        expect(state.deepLinkTarget).not.toBeNull();
        expect(state.deepLinkTarget.tab).toBe("quran");
        expect(state.deepLinkTarget.params.surahNumber).toBe(1);
    });

    test("creates internal route when view param provided", () => {
        const { state } = openTabState(initialState(), "home", {
            view: "global-search",
            query: "test",
        });
        expect(state.internalRoutes.home).toBeDefined();
        expect(state.internalRoutes.home.view).toBe("global-search");
    });

    test("stores returnTo as returnRoute when no view", () => {
        const { state } = openTabState(initialState(), "home", {
            returnTo: directoryRoute,
        });
        expect(state.returnRoutes.home).toEqual(directoryRoute);
    });

    test("keeps returnTo on internalRoute when view is present", () => {
        const state = openFeatureDirectory();
        const { state: nextState } = openTabState(state, "belajar", {
            returnTo: directoryRoute,
            view: "doa",
        });
        expect(nextState.internalRoutes.belajar.returnTo).toEqual(
            directoryRoute,
        );
        expect(nextState.returnRoutes.belajar).toBeUndefined();
    });
});

describe("openInternalViewState", () => {
    test("opens internal view on current tab", () => {
        const { state } = openInternalViewState(
            initialState(),
            "home",
            "global-search",
            {},
        );
        expect(state.activeTab).toBe("home");
        expect(state.internalRoutes.home).toBeDefined();
        expect(state.internalRoutes.home.view).toBe("global-search");
    });

    test("switches tab and sets returnTab", () => {
        const state = openFeatureDirectory();
        const { state: nextState } = openInternalViewState(
            state,
            "ibadah",
            "qibla",
            {},
        );
        expect(nextState.activeTab).toBe("ibadah");
        expect(nextState.internalRoutes.ibadah.returnTab).toBe("home");
    });
});

describe("closeInternalViewState", () => {
    test("closes internal view without return", () => {
        let state = openFeatureDirectory();
        const { handled, state: nextState } = closeInternalViewState(state);
        expect(handled).toBe(true);
        expect(nextState.internalRoutes.home).toBeUndefined();
    });

    test("returns to returnTab when specified", () => {
        let state = openFeatureDirectory();
        state = openInternalViewState(state, "ibadah", "qibla", {}).state;
        const { state: nextState } = closeInternalViewState(state, "ibadah");
        expect(nextState.activeTab).toBe("home");
    });

    test("returns via returnTo route when present", () => {
        let state = openFeatureDirectory();
        state = openInternalViewState(state, "belajar", "doa", {
            returnTo: directoryRoute,
        }).state;
        const { state: nextState } = closeInternalViewState(state, "belajar");
        expect(nextState.activeTab).toBe("home");
        expect(nextState.internalRoutes.home?.view).toBe("feature-directory");
    });

    test("returns handled=false when no internal route", () => {
        const { handled } = closeInternalViewState(initialState());
        expect(handled).toBe(false);
    });
});

describe("hardwareBackState", () => {
    test("closes internal view when one is open", () => {
        let state = openFeatureDirectory();
        const { handled, state: nextState } = hardwareBackState(state);
        expect(handled).toBe(true);
        expect(nextState.internalRoutes.home).toBeUndefined();
    });

    test("returns to home when not on home tab", () => {
        const state = { ...initialState(), activeTab: "quran" };
        const { handled, state: nextState } = hardwareBackState(state);
        expect(handled).toBe(true);
        expect(nextState.activeTab).toBe("home");
    });

    test("returns not handled when on home with no internal route", () => {
        const { handled } = hardwareBackState(initialState());
        expect(handled).toBe(false);
    });

    test("follows returnRoute chain", () => {
        const state = {
            ...initialState(),
            activeTab: "belajar",
            returnRoutes: { belajar: directoryRoute },
        };
        const { handled, state: nextState } = hardwareBackState(state);
        expect(handled).toBe(true);
        expect(nextState.activeTab).toBe("home");
        expect(nextState.internalRoutes.home?.view).toBe("feature-directory");
    });
});

describe("closeInternalViewThenOpenTabState", () => {
    test("feature from homepage directory returns to directory, then homepage", () => {
        let state = openFeatureDirectory();
        state = closeInternalViewThenOpenTabState(
            state,
            "home",
            "belajar",
            {
                featureKey: "doa",
                returnTo: directoryRoute,
            },
            makeId,
        ).state;

        expect(state.activeTab).toBe("belajar");
        expect(state.returnRoutes.belajar).toEqual(directoryRoute);

        state = openInternalViewState(
            state,
            directoryRoute.tab,
            directoryRoute.view,
            { returnTab: null },
            makeId,
        ).state;

        expect(state.activeTab).toBe("home");
        expect(state.internalRoutes.home?.view).toBe("feature-directory");

        const backResult = hardwareBackState(state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
        expect(backResult.state.internalRoutes.home).toBeUndefined();
    });

    test("tab opened from homepage directory returns to directory before homepage", () => {
        let state = openFeatureDirectory();
        state = closeInternalViewThenOpenTabState(
            state,
            "home",
            "quran",
            {
                returnTo: directoryRoute,
            },
            makeId,
        ).state;

        expect(state.activeTab).toBe("quran");
        expect(state.returnRoutes.quran).toEqual(directoryRoute);

        let backResult = hardwareBackState(state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
        expect(backResult.state.internalRoutes.home?.view).toBe(
            "feature-directory",
        );

        backResult = hardwareBackState(backResult.state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
        expect(backResult.state.internalRoutes.home).toBeUndefined();
    });

    test("internal view opened from homepage directory returns to directory before homepage", () => {
        let state = openFeatureDirectory();
        state = closeInternalViewThenOpenTabState(
            state,
            "home",
            "ibadah",
            {
                returnTo: directoryRoute,
                view: "qibla",
            },
            makeId,
        ).state;

        expect(state.activeTab).toBe("ibadah");
        expect(state.internalRoutes.ibadah?.view).toBe("qibla");
        expect(state.internalRoutes.ibadah?.returnTo).toEqual(directoryRoute);

        let backResult = hardwareBackState(state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
        expect(backResult.state.internalRoutes.home?.view).toBe(
            "feature-directory",
        );

        backResult = hardwareBackState(backResult.state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
        expect(backResult.state.internalRoutes.home).toBeUndefined();
    });
});
