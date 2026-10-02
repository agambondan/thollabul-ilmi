import * as Linking from "expo-linking";
import { useFonts } from "expo-font";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AppState,
    BackHandler,
    Keyboard,
    Platform,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnalyticsTracker from "./src/components/AnalyticsTracker";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { SwipeBackView } from "./src/components/SwipeBackView";
import { FeedbackProvider } from "./src/context/FeedbackContext";
import { SessionProvider } from "./src/context/SessionContext";
import { TabActivityProvider } from "./src/context/TabActivityContext";
import { useReminderBootstrap } from "./src/hooks/useReminderBootstrap";
import { usePrayerTimeMonitor } from "./src/hooks/usePrayerTimeMonitor";
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
import { initCrashReporting } from "./src/utils/crashReporting";
import { flushMutationQueue } from "./src/storage/mutationQueue";
import { requestJson } from "./src/api/client";
import {
    closeInternalViewState,
    closeInternalViewThenOpenTabState,
    getShellActiveTab,
    hardwareBackState,
    normalizeTabRequest,
    openInternalViewState,
    openReturnRouteState,
    openTabState,
} from "./src/navigation/appNavigation";
import { createScopedNavigation } from "./src/navigation/scopedNavigation";

const TAB_KEYS = ["home", "quran", "hadith", "ibadah", "belajar", "profile"];
const RESET_KEYBOARD_GRACE_MS = 500;

export default function App() {
    useEffect(() => {
        initCrashReporting({ enableInDev: false });
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                flushMutationQueue(requestJson).catch(() => {});
            }
        });
        return () => sub?.remove?.();
    }, []);
    useReminderBootstrap();
    usePrayerTimeMonitor();
    const [quranFontsLoaded] = useFonts(quranFontAssets);
    const [activeTab, setActiveTab] = useState("home");
    const [deepLinkTarget, setDeepLinkTarget] = useState(null);
    const [internalRoutes, setInternalRoutes] = useState({});
    const [returnRoutes, setReturnRoutes] = useState({});
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [headerConfig, setHeaderConfigState] = useState(null);
    const [mountedTabs, setMountedTabs] = useState(() => new Set(["home"]));
    const [belajarContentResetKey, setBelajarContentResetKey] = useState(0);


    // Refs so the single BackHandler registration never goes stale
    const activeTabRef = useRef("home");
    const deepLinkTargetRef = useRef(null);
    const internalRoutesRef = useRef({});
    const returnRoutesRef = useRef({});
    const screenBackRef = useRef(null); // set by active screen when it has sub-navigation

    useLayoutEffect(() => {
        activeTabRef.current = activeTab;
        screenBackRef.current = null;
        setHeaderConfigState(null);
    }, [activeTab]);
    useEffect(() => {
        setMountedTabs((prev) => {
            if (prev.has(activeTab)) return prev;
            const next = new Set(prev);
            next.add(activeTab);
            return next;
        });
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

    useEffect(() => {
        if (!keyboardVisible) return undefined;

        const intervalId = setInterval(() => {
            if (
                TextInput.State?.currentlyFocusedInput &&
                !TextInput.State.currentlyFocusedInput()
            ) {
                setKeyboardVisible(false);
            }
        }, 800);

        return () => clearInterval(intervalId);
    }, [keyboardVisible]);

    const resetGraceTimerRef = useRef(null);
    const resetKeyboardVisibleWithGrace = useCallback(() => {
        setKeyboardVisible(false);
        if (resetGraceTimerRef.current) {
            clearTimeout(resetGraceTimerRef.current);
        }
        resetGraceTimerRef.current = setTimeout(() => {
            resetGraceTimerRef.current = null;
            if (!TextInput.State.currentlyFocusedInput()) {
                setKeyboardVisible(false);
            }
        }, RESET_KEYBOARD_GRACE_MS);
    }, []);

    useEffect(() => {
        resetKeyboardVisibleWithGrace();
        return () => {
            if (resetGraceTimerRef.current) {
                clearTimeout(resetGraceTimerRef.current);
                resetGraceTimerRef.current = null;
            }
        };
    }, [
        activeTab,
        internalRoutes,
        headerConfig,
        resetKeyboardVisibleWithGrace,
    ]);

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
            Keyboard.dismiss();
            resetKeyboardVisibleWithGrace();
            const result = openTabState(
                getNavigationState(),
                requestedTab,
                requestedParams,
            );
            applyNavigationState(result.state);
            if (result.resetContent) {
                setBelajarContentResetKey((key) => key + 1);
            }
        },
        [
            applyNavigationState,
            getNavigationState,
            resetKeyboardVisibleWithGrace,
        ],
    );

    const openInternalView = useCallback(
        (requestedTab, view, params = {}) => {
            Keyboard.dismiss();
            resetKeyboardVisibleWithGrace();
            const result = openInternalViewState(
                getNavigationState(),
                requestedTab,
                view,
                params,
            );
            applyNavigationState(result.state);
        },
        [
            applyNavigationState,
            getNavigationState,
            resetKeyboardVisibleWithGrace,
        ],
    );

    const closeInternalView = useCallback(
        (tab = activeTab) => {
            Keyboard.dismiss();
            resetKeyboardVisibleWithGrace();
            const result = closeInternalViewState(getNavigationState(), tab);
            applyNavigationState(result.state);
        },
        [
            activeTab,
            applyNavigationState,
            getNavigationState,
            resetKeyboardVisibleWithGrace,
        ],
    );

    const closeAndOpenTab = useCallback(
        (tabToClose, requestedTab, requestedParams = null) => {
            Keyboard.dismiss();
            resetKeyboardVisibleWithGrace();
            const result = closeInternalViewThenOpenTabState(
                getNavigationState(),
                tabToClose,
                requestedTab,
                requestedParams,
            );
            applyNavigationState(result.state);
        },
        [
            applyNavigationState,
            getNavigationState,
            resetKeyboardVisibleWithGrace,
        ],
    );

    const resetInternalViews = useCallback(() => {
        Keyboard.dismiss();
        resetKeyboardVisibleWithGrace();
        setInternalRoutes({});
        setReturnRoutes({});
    }, [resetKeyboardVisibleWithGrace]);

    const handleDeepLink = useCallback(
        (url) => {
            const rawTarget = parseDeepLink(url);
            if (!rawTarget) return;

            const normalized = normalizeTabRequest(
                rawTarget.tab,
                rawTarget.params,
            );
            const target = { ...rawTarget, ...normalized };
            if (!target) return;

            resetKeyboardVisibleWithGrace();
            setReturnRoutes((current) => {
                const next = { ...current };
                delete next[target.tab];
                delete next[activeTabRef.current];
                return next;
            });
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
        },
        [resetKeyboardVisibleWithGrace],
    );

    // Registered ONCE — reads from refs to avoid stale closures.
    // Priority: screen sub-nav → internal cross-tab route → go to Home → OS handle (minimize).
    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            Keyboard.dismiss();
            const screenHandled = screenBackRef.current?.();
            resetKeyboardVisibleWithGrace();
            if (screenHandled) return true;
            const result = hardwareBackState(getNavigationState());
            applyNavigationState(result.state);
            return result.handled;
        });
        return () => sub.remove();
    }, [
        applyNavigationState,
        getNavigationState,
        resetKeyboardVisibleWithGrace,
    ]);

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

    useEffect(() => {
        let Notifications;
        try {
            Notifications = require("expo-notifications");
        } catch {
            return undefined;
        }

        const dataToUrl = (data) => {
            if (!data || typeof data !== "object") return null;
            if (typeof data.url === "string" && data.url.length > 0) {
                return data.url;
            }
            if (typeof data.deep_link === "string" && data.deep_link.length > 0) {
                return data.deep_link;
            }
            return null;
        };

        try {
            const last = Notifications.getLastNotificationResponse();
            const url = dataToUrl(last?.notification?.request?.content?.data);
            if (url) handleDeepLink(url);
        } catch {
            // ignore
        }

        const subscription =
            Notifications.addNotificationResponseReceivedListener((response) => {
                const url = dataToUrl(response?.notification?.request?.content?.data);
                if (url) handleDeepLink(url);
            });

        return () => subscription?.remove?.();
    }, [handleDeepLink]);

    const currentTarget = useMemo(
        () => (deepLinkTarget?.tab === activeTab ? deepLinkTarget : null),
        [activeTab, deepLinkTarget],
    );
    const shellActiveTab = getShellActiveTab({
        activeTab,
        internalRoutes,
        returnRoutes,
    });
    const setBack = useCallback((fn) => {
        screenBackRef.current = fn;
    }, []);
    const clearBack = useCallback(() => {
        screenBackRef.current = null;
        resetKeyboardVisibleWithGrace();
    }, [resetKeyboardVisibleWithGrace]);

    const setHeaderConfig = useCallback(
        (config) => {
            setHeaderConfigState(config);
            resetKeyboardVisibleWithGrace();
        },
        [resetKeyboardVisibleWithGrace],
    );

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
            setHeader: setHeaderConfig,
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
            setHeaderConfig,
        ],
    );

    const tabNavigation = useMemo(
        () =>
            Object.fromEntries(
                TAB_KEYS.map((tab) => [
                    tab,
                    createScopedNavigation(
                        navigation,
                        tab,
                        () => activeTabRef.current,
                    ),
                ]),
            ),
        [navigation],
    );

    return (
        <GestureHandlerRootView style={styles.gestureRoot}>
            <ErrorBoundary>
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
                                        currentFeatureKey={
                                            headerConfig?.featureKey ?? null
                                        }
                                        internalRoutes={internalRoutes}
                                        returnRoutes={returnRoutes}
                                        headerConfig={headerConfig}
                                        keyboardVisible={keyboardVisible}
                                        onOpenProfile={(params) =>
                                            openTab("profile", params ?? null)
                                        }
                                        onTabChange={openTab}
                                    >
                                        {TAB_KEYS.map((tab) => {
                                             const isActive = activeTab === tab;
                                             if (!isActive && !mountedTabs.has(tab)) return null;
                                            const hasInternalView =
                                                !!internalRoutes[tab];
                                            let screen = null;
                                            if (tab === "home")
                                                screen = (
                                                    <HomeScreen
                                                        isActive={isActive}
                                                        navigation={tabNavigation[tab]}
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
                                                        fontsLoaded={quranFontsLoaded}
                                                        isActive={isActive}
                                                        navigation={tabNavigation[tab]}
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
                                                        navigation={tabNavigation[tab]}
                                                    />
                                                );
                                            if (tab === "ibadah")
                                                screen = (
                                                    <IbadahScreen
                                                        isActive={isActive}
                                                        navigation={tabNavigation[tab]}
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
                                                        navigation={tabNavigation[tab]}
                                                        onOpenTab={openTab}
                                                    />
                                                );
                                             if (tab === "profile")
                                                screen = (
                                                    <ProfileScreen
                                                        deepLinkTarget={
                                                            isActive
                                                                ? deepLinkTarget
                                                                : null
                                                        }
                                                        isActive={isActive}
                                                        navigation={tabNavigation[tab]}
                                                        onOpenTab={openTab}
                                                    />
                                                );

                                            const paneKey =
                                                tab === "belajar"
                                                    ? `belajar:${belajarContentResetKey}`
                                                    : tab;

                                            return (
                                                <View
                                                    key={paneKey}
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
        </ErrorBoundary>
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
});
