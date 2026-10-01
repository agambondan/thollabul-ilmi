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

    test("remembers the tab it was opened from when a view is requested", () => {
        const { state } = openTabState(
            initialState(),
            "ibadah",
            { view: "qibla" },
            makeId,
        );
        expect(state.internalRoutes.ibadah.returnTab).toBe("home");
    });

    test("honors an explicit returnTab when a view is requested", () => {
        const { state } = openTabState(
            {
                ...initialState(),
                activeTab: "profile",
                returnRoutes: { profile: { tab: "ibadah" } },
            },
            "ibadah",
            { returnTab: null, view: "khatam" },
            makeId,
        );
        expect(state.internalRoutes.ibadah.returnTab).toBeNull();
        expect(state.returnRoutes.profile).toBeUndefined();
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

describe("Ibadah hub feature rows", () => {
    const ibadahRoute = { tab: "ibadah" };
    const ibadahState = () => ({ ...initialState(), activeTab: "ibadah" });

    test("a feature opened from the Ibadah hub goes back to the Ibadah hub", () => {
        let state = openTabState(
            ibadahState(),
            "belajar",
            { featureKey: "doa", returnTo: ibadahRoute },
            makeId,
        ).state;

        expect(state.activeTab).toBe("belajar");
        expect(state.returnRoutes.belajar).toEqual(ibadahRoute);
        expect(state.deepLinkTarget.params.returnTo).toEqual(ibadahRoute);

        const backResult = hardwareBackState(state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("ibadah");
        expect(backResult.state.internalRoutes.ibadah).toBeUndefined();
        expect(backResult.state.returnRoutes.belajar).toBeUndefined();
    });

    test("the same feature opened from the Belajar hub still goes back to Home", () => {
        const state = openTabState(
            { ...initialState(), activeTab: "belajar" },
            "belajar",
            { featureKey: "doa" },
            makeId,
        ).state;

        expect(state.returnRoutes.belajar).toBeUndefined();

        const backResult = hardwareBackState(state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
    });

    test("opening the feature from the bottom nav drops the stale Ibadah return route", () => {
        let state = openTabState(
            ibadahState(),
            "belajar",
            { featureKey: "doa", returnTo: ibadahRoute },
            makeId,
        ).state;

        state = openTabState(state, "belajar", null, makeId).state;

        expect(state.returnRoutes.belajar).toBeUndefined();
        expect(hardwareBackState(state, makeId).state.activeTab).toBe("home");
    });

    test("leaving the Belajar tab discards its pending return route", () => {
        let state = openTabState(
            ibadahState(),
            "belajar",
            { featureKey: "doa", returnTo: ibadahRoute },
            makeId,
        ).state;

        state = openTabState(state, "quran", null, makeId).state;

        expect(state.activeTab).toBe("quran");
        expect(state.returnRoutes.belajar).toBeUndefined();
    });

    test("returning to Ibadah through openTab leaves the hub without a view", () => {
        let state = openTabState(
            ibadahState(),
            "belajar",
            { featureKey: "doa", returnTo: ibadahRoute },
            makeId,
        ).state;

        state = openTabState(state, "ibadah", null, makeId).state;

        expect(state.activeTab).toBe("ibadah");
        expect(state.internalRoutes.ibadah).toBeUndefined();
        expect(state.returnRoutes.belajar).toBeUndefined();
    });
});

describe("Profile opened from Khatam", () => {
    const khatamRoute = {
        params: { returnTab: null, view: "khatam" },
        tab: "ibadah",
    };
    const khatamState = () =>
        openInternalViewState(
            { ...initialState(), activeTab: "ibadah" },
            "ibadah",
            "khatam",
            {},
            makeId,
        ).state;
    const profileFromKhatam = () =>
        openTabState(
            khatamState(),
            "profile",
            { returnTo: khatamRoute },
            makeId,
        ).state;

    test("records the Khatam view as the Profile return route", () => {
        const state = profileFromKhatam();

        expect(state.activeTab).toBe("profile");
        expect(state.returnRoutes.profile).toEqual(khatamRoute);
        expect(state.internalRoutes.ibadah?.view).toBe("khatam");
    });

    test("without a return route Profile goes back to Home", () => {
        const state = openTabState(
            khatamState(),
            "profile",
            null,
            makeId,
        ).state;

        const backResult = hardwareBackState(state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("home");
    });

    test("hardware back reopens Khatam and the next back lands on the Ibadah hub", () => {
        let backResult = hardwareBackState(profileFromKhatam(), makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("ibadah");
        expect(backResult.state.internalRoutes.ibadah?.view).toBe("khatam");
        expect(backResult.state.returnRoutes.profile).toBeUndefined();

        backResult = hardwareBackState(backResult.state, makeId);

        expect(backResult.handled).toBe(true);
        expect(backResult.state.activeTab).toBe("ibadah");
        expect(backResult.state.internalRoutes.ibadah).toBeUndefined();
    });

    test("the header back arrow reopens Khatam and Khatam still closes to the Ibadah hub", () => {
        const profileState = profileFromKhatam();
        const route = profileState.returnRoutes.profile;

        const reopened = openTabState(
            profileState,
            route.tab,
            route.params,
            makeId,
        ).state;

        expect(reopened.activeTab).toBe("ibadah");
        expect(reopened.internalRoutes.ibadah?.view).toBe("khatam");
        expect(reopened.returnRoutes.profile).toBeUndefined();

        const closed = hardwareBackState(reopened, makeId);

        expect(closed.handled).toBe(true);
        expect(closed.state.activeTab).toBe("ibadah");
        expect(closed.state.internalRoutes.ibadah).toBeUndefined();
    });

    test("tapping the Ibadah tab from Profile drops the return route and keeps Khatam open", () => {
        const state = openTabState(
            profileFromKhatam(),
            "ibadah",
            null,
            makeId,
        ).state;

        expect(state.activeTab).toBe("ibadah");
        expect(state.returnRoutes.profile).toBeUndefined();
        expect(state.internalRoutes.ibadah?.view).toBe("khatam");
    });
});

describe("getShellActiveTab", () => {
    const { getShellActiveTab } = require("./appNavigation");

    test("keeps the real active tab by default", () => {
        expect(getShellActiveTab({ activeTab: "quran" })).toBe("quran");
        expect(
            getShellActiveTab({
                activeTab: "belajar",
                internalRoutes: {},
                returnRoutes: {},
            }),
        ).toBe("belajar");
    });

    test("highlights Ibadah while a feature opened from the Ibadah hub is active", () => {
        expect(
            getShellActiveTab({
                activeTab: "belajar",
                returnRoutes: { belajar: { tab: "ibadah" } },
            }),
        ).toBe("ibadah");
    });

    test("keeps Belajar highlighted for features opened from the Home directory", () => {
        expect(
            getShellActiveTab({
                activeTab: "belajar",
                returnRoutes: {
                    belajar: { tab: "home", view: "feature-directory" },
                },
            }),
        ).toBe("belajar");
    });

    test("highlights Beranda while Global Search is open", () => {
        expect(
            getShellActiveTab({
                activeTab: "home",
                internalRoutes: { home: { view: "global-search" } },
            }),
        ).toBe("home");
    });
});
