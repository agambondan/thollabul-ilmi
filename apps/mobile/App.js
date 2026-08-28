import * as Linking from "expo-linking";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    Keyboard,
    Platform,
    StyleSheet,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AnalyticsTracker from "./src/components/AnalyticsTracker";
import { SwipeBackView } from "./src/components/SwipeBackView";
import { FeedbackProvider } from "./src/context/FeedbackContext";
import { SessionProvider } from "./src/context/SessionContext";
import { TabActivityProvider } from "./src/context/TabActivityContext";
import { quranFontAssets } from "./src/constants/quranFonts";
import { MobileLocaleProvider } from "./src/i18n/MobileLocaleProvider";
import { LayoutModeProvider } from "./src/layout/LayoutModeProvider";
import { MobileAppShell } from "./src/layout/MobileAppShell";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { HadithScreen } from "./src/screens/HadithScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { IbadahScreen } from "./src/screens/IbadahScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { QuranScreen } from "./src/screens/QuranScreen";
import { colors } from "./src/theme";
import { parseDeepLink } from "./src/utils/deepLinks";
import {
    closeInternalViewState,
    closeInternalViewThenOpenTabState,
    hardwareBackState,
    normalizeTabRequest,
    openInternalViewState,
    openReturnRouteState,
    openTabState,
} from "./src/navigation/appNavigation";

export default function App() {
    const [quranFontsLoaded, quranFontsError] = useFonts(quranFontAssets);
    const [activeTab, setActiveTab] = useState("home");
    const [deepLinkTarget, setDeepLinkTarget] = useState(null);
    const [internalRoutes, setInternalRoutes] = useState({});
    const [returnRoutes, setReturnRoutes] = useState({});
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Refs so the single BackHandler registration never goes stale
    const activeTabRef = useRef("home");
    const deepLinkTargetRef = useRef(null);
    const internalRoutesRef = useRef({});
    const returnRoutesRef = useRef({});
    const screenBackRef = useRef(null); // set by active screen when it has sub-navigation

    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);
    useEffect(() => {
        deepLinkTargetRef.current = deepLinkTarget;
    }, [deepLinkTarget]);
    useEffect(() => {
        internalRoutesRef.current = internalRoutes;
    }, [internalRoutes]);
    useEffect(() => {
        returnRoutesRef.current = returnRoutes;
    }, [returnRoutes]);

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvent, () =>
            setKeyboardVisible(true),
        );
        const hideSub = Keyboard.addListener(hideEvent, () =>
            setKeyboardVisible(false),
        );

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const getNavigationState = useCallback(
        () => ({
            activeTab: activeTabRef.current,
            deepLinkTarget: deepLinkTargetRef.current,
            internalRoutes: internalRoutesRef.current,
            returnRoutes: returnRoutesRef.current,
        }),
        [],
    );

    const applyNavigationState = useCallback((nextState) => {
        setActiveTab(nextState.activeTab);
        setInternalRoutes(nextState.internalRoutes);
        setReturnRoutes(nextState.returnRoutes);
        setDeepLinkTarget(nextState.deepLinkTarget ?? null);
    }, []);

    const openReturnRoute = useCallback(
        (returnRoute) => {
            const result = openReturnRouteState(
                getNavigationState(),
                returnRoute,
            );
            applyNavigationState(result.state);
            return result.handled;
        },
        [applyNavigationState, getNavigationState],
    );

    const openTab = useCallback(
        (requestedTab, requestedParams = null) => {
            const result = openTabState(
                getNavigationState(),
                requestedTab,
                requestedParams,
            );
            applyNavigationState(result.state);
        },
        [applyNavigationState, getNavigationState],
    );

    const openInternalView = useCallback(
        (requestedTab, view, params = {}) => {
            const result = openInternalViewState(
                getNavigationState(),
                requestedTab,
                view,
                params,
            );
            applyNavigationState(result.state);
        },
        [applyNavigationState, getNavigationState],
    );

    const closeInternalView = useCallback(
        (tab = activeTab) => {
            const result = closeInternalViewState(getNavigationState(), tab);
            applyNavigationState(result.state);
        },
        [activeTab, applyNavigationState, getNavigationState],
    );

    const closeAndOpenTab = useCallback(
        (tabToClose, requestedTab, requestedParams = null) => {
            const result = closeInternalViewThenOpenTabState(
                getNavigationState(),
                tabToClose,
                requestedTab,
                requestedParams,
            );
            applyNavigationState(result.state);
        },
        [applyNavigationState, getNavigationState],
    );

    const resetInternalViews = useCallback(() => {
        setInternalRoutes({});
        setReturnRoutes({});
    }, []);

    const handleDeepLink = useCallback((url) => {
        const rawTarget = parseDeepLink(url);
        if (!rawTarget) return;

        const normalized = normalizeTabRequest(rawTarget.tab, rawTarget.params);
        const target = { ...rawTarget, ...normalized };
        if (!target) return;

        setActiveTab(target.tab);
        if (target.params?.view) {
            setInternalRoutes((current) => ({
                ...current,
                [target.tab]: {
                    id: `${Date.now()}:${target.tab}:${target.params.view}`,
                    params: target.params,
                    view: target.params.view,
                },
            }));
        }
        setDeepLinkTarget({
            ...target,
            id: `${Date.now()}:${url}`,
            url,
        });
    }, []);

    // Registered ONCE — reads from refs to avoid stale closures.
    // Priority: screen sub-nav → internal cross-tab route → go to Home → OS handle (minimize).
    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            if (screenBackRef.current?.()) return true;
            const result = hardwareBackState(getNavigationState());
            applyNavigationState(result.state);
            return result.handled;
        });
        return () => sub.remove();
    }, [applyNavigationState, getNavigationState]);

    useEffect(() => {
        let mounted = true;
        Linking.getInitialURL().then((url) => {
            if (mounted && url) {
                handleDeepLink(url);
            }
        });

        const subscription = Linking.addEventListener("url", (event) => {
            handleDeepLink(event.url);
        });

        return () => {
            mounted = false;
            subscription.remove();
        };
    }, [handleDeepLink]);

    useEffect(() => {
        if (Platform.OS !== "web" || typeof window === "undefined")
            return undefined;

        const handleHashChange = () => {
            handleDeepLink(window.location.href);
        };

        handleHashChange();
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [handleDeepLink]);

    const currentTarget = useMemo(
        () => (deepLinkTarget?.tab === activeTab ? deepLinkTarget : null),
        [activeTab, deepLinkTarget],
    );
    const shellActiveTab =
        internalRoutes.home?.view === "global-search" ? "search" : activeTab;
    const setBack = useCallback((fn) => {
        screenBackRef.current = fn;
    }, []);
    const clearBack = useCallback(() => {
        screenBackRef.current = null;
    }, []);

    const navigation = useMemo(
        () => ({
            clearBack,
            close: closeInternalView,
            closeAndOpen: closeAndOpenTab,
            current: internalRoutes[activeTab] ?? null,
            open: openInternalView,
            reset: resetInternalViews,
            routes: internalRoutes,
            setBack,
        }),
        [
            activeTab,
            clearBack,
            closeAndOpenTab,
            closeInternalView,
            internalRoutes,
            openInternalView,
            resetInternalViews,
            setBack,
        ],
    );

    if (!quranFontsLoaded && !quranFontsError) {
        return (
            <SafeAreaProvider>
                <SafeAreaView
                    edges={["top", "left", "right"]}
                    style={[styles.safeArea, styles.fontLoading]}
                >
                    <ActivityIndicator
                        color={colors.primaryDark}
                        size='small'
                    />
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <GestureHandlerRootView style={styles.gestureRoot}>
            <SafeAreaProvider>
                <SessionProvider>
                    <MobileLocaleProvider>
                        <FeedbackProvider>
                            <LayoutModeProvider>
                                <TabActivityProvider>
                                    <AnalyticsTracker
                                        activeTab={activeTab}
                                        internalRoutes={internalRoutes}
                                    />
                                    <MobileAppShell
                                        activeTab={shellActiveTab}
                                        keyboardVisible={keyboardVisible}
                                        onOpenProfile={() => openTab("profile")}
                                        onTabChange={openTab}
                                    >
                                        {[
                                            "home",
                                            "quran",
                                            "hadith",
                                            "ibadah",
                                            "belajar",
                                            "profile",
                                        ].map((tab) => {
                                            const isActive = activeTab === tab;
                                            const hasInternalView =
                                                !!internalRoutes[tab];
                                            let screen = null;
                                            if (tab === "home")
                                                screen = (
                                                    <HomeScreen
                                                        isActive={isActive}
                                                        navigation={navigation}
                                                        onOpenTab={openTab}
                                                    />
                                                );
                                            if (tab === "quran")
                                                screen = (
                                                    <QuranScreen
                                                        deepLinkTarget={
                                                            isActive
                                                                ? currentTarget
                                                                : null
                                                        }
                                                        isActive={isActive}
                                                        navigation={navigation}
                                                    />
                                                );
                                            if (tab === "hadith")
                                                screen = (
                                                    <HadithScreen
                                                        deepLinkTarget={
                                                            isActive
                                                                ? currentTarget
                                                                : null
                                                        }
                                                        isActive={isActive}
                                                        navigation={navigation}
                                                    />
                                                );
                                            if (tab === "ibadah")
                                                screen = (
                                                    <IbadahScreen
                                                        isActive={isActive}
                                                        navigation={navigation}
                                                        onOpenTab={openTab}
                                                    />
                                                );
                                            if (tab === "belajar")
                                                screen = (
                                                    <ExploreScreen
                                                        deepLinkTarget={
                                                            isActive
                                                                ? currentTarget
                                                                : null
                                                        }
                                                        isActive={isActive}
                                                        navigation={navigation}
                                                        onOpenTab={openTab}
                                                    />
                                                );
                                            if (tab === "profile")
                                                screen = (
                                                    <ProfileScreen
                                                        isActive={isActive}
                                                        navigation={navigation}
                                                        onOpenTab={openTab}
                                                    />
                                                );

                                            return (
                                                <View
                                                    key={tab}
                                                    style={[
                                                        styles.screenPane,
                                                        isActive
                                                            ? styles.screenPaneVisible
                                                            : styles.screenPaneHidden,
                                                    ]}
                                                >
                                                    <SwipeBackView
                                                        enabled={
                                                            isActive &&
                                                            hasInternalView
                                                        }
                                                        onSwipeBack={() =>
                                                            closeInternalView(
                                                                tab,
                                                            )
                                                        }
                                                    >
                                                        {screen}
                                                    </SwipeBackView>
                                                </View>
                                            );
                                        })}
                                    </MobileAppShell>
                                </TabActivityProvider>
                            </LayoutModeProvider>
                        </FeedbackProvider>
                    </MobileLocaleProvider>
                </SessionProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    gestureRoot: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    screenPane: {
        ...StyleSheet.absoluteFillObject,
    },
    screenPaneVisible: {
        display: "flex",
    },
    screenPaneHidden: {
        display: "none",
    },
    fontLoading: {
        alignItems: "center",
        justifyContent: "center",
    },
});
