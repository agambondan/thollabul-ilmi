import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { BackHandler, Keyboard, Platform, TextInput } from "react-native";
import App from "../../App";
import { __exploreOnBackSpy } from "../screens/ExploreScreen";

jest.mock("react-native-gesture-handler", () => {
    const RealComponent = require("react-native");
    return {
        Directions: {},
        GestureHandlerRootView: RealComponent.View,
        PanGestureHandler: RealComponent.View,
        State: {},
        Swipeable: RealComponent.View,
    };
});

jest.mock("expo-font", () => ({
    useFonts: () => [true],
}));

jest.mock("expo-linking", () => ({
    addEventListener: jest.fn(),
    getInitialURL: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
    addNotificationResponseReceivedListener: jest.fn(() => ({
        remove: jest.fn(),
    })),
    getLastNotificationResponse: jest.fn(() => null),
}));

jest.mock("react-native-safe-area-context", () => {
    const React = require("react");
    const { View } = require("react-native");
    const inset = { bottom: 0, left: 0, right: 0, top: 0 };
    return {
        SafeAreaInsetsContext: React.createContext(inset),
        SafeAreaProvider: ({ children }) => children,
        SafeAreaView: ({ children, style, testID }) =>
            React.createElement(View, { style, testID }, children),
        useSafeAreaInsets: () => inset,
    };
});

jest.mock("../context/SessionContext", () => ({
    SessionProvider: ({ children }) => children,
    useSession: jest.fn(() => ({
        loading: false,
        session: null,
        signOut: jest.fn(),
        updateCurrentUser: jest.fn(),
        user: null,
    })),
}));

jest.mock("../hooks/useReminderBootstrap", () => ({
    useReminderBootstrap: () => {},
}));

jest.mock("../hooks/usePrayerTimeMonitor", () => ({
    usePrayerTimeMonitor: () => {},
}));

jest.mock("../api/client", () => ({
    requestJson: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../storage/mutationQueue", () => ({
    flushMutationQueue: jest.fn(() => Promise.resolve()),
}));

jest.mock("../components/AnalyticsTracker", () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock("../screens/HomeScreen", () => ({ HomeScreen: () => null }));
jest.mock("../screens/QuranScreen", () => ({ QuranScreen: () => null }));
jest.mock("../screens/HadithScreen", () => ({ HadithScreen: () => null }));
jest.mock("../screens/IbadahScreen", () => ({ IbadahScreen: () => null }));
jest.mock("../screens/ProfileScreen", () => ({ ProfileScreen: () => null }));

jest.mock("../screens/ExploreScreen", () => {
    const { Pressable, Text } = require("react-native");
    const onBackSpy = jest.fn();
    return {
        __exploreOnBackSpy: onBackSpy,
        ExploreScreen: ({ navigation }) => {
            const openFeature = () => {
                const onBack = () => {
                    onBackSpy();
                    navigation.setHeader(null);
                    navigation.clearBack();
                    return true;
                };
                navigation.setBack(onBack);
                navigation.setHeader({
                    onBack,
                    showBack: true,
                    title: "Panduan Sholat",
                });
            };
            const closeFeatureWithoutBackEvent = () => {
                navigation.setHeader(null);
                navigation.clearBack();
            };
            return (
                <>
                    <Pressable
                        onPress={openFeature}
                        testID='mock-explore-open-feature'
                    >
                        <Text>Open feature</Text>
                    </Pressable>
                    <Pressable
                        onPress={closeFeatureWithoutBackEvent}
                        testID='mock-explore-close-feature'
                    >
                        <Text>Close feature</Text>
                    </Pressable>
                </>
            );
        },
    };
});

describe("App keyboardVisible defensive reset (B20)", () => {
    let keyboardHandlers;
    let keyboardAddListenerSpy;
    let backPressHandlers;
    let backHandlerSpy;
    let dismissSpy;
    let linkingHandlers;
    let platformOs;

    const emitKeyboard = async (event, payload) => {
        await act(async () => {
            (keyboardHandlers[event] ?? []).forEach((handler) =>
                handler(payload),
            );
        });
    };

    const pressHardwareBack = async () => {
        await act(async () => {
            backPressHandlers.forEach((handler) => handler());
        });
    };

    const emitDeepLink = async (url) => {
        await act(async () => {
            linkingHandlers.forEach((handler) => handler({ url }));
        });
    };

    const renderApp = async () => {
        const view = render(<App />);
        await waitFor(() =>
            expect(view.getByTestId("classic-app-shell")).toBeTruthy(),
        );
        return view;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.getItem.mockImplementation((key) =>
            Promise.resolve(
                key === "tholabul:pref:app-layout-mode" ? '"classic"' : null,
            ),
        );
        AsyncStorage.setItem.mockImplementation(() => Promise.resolve());

        Linking.getInitialURL.mockResolvedValue(null);
        linkingHandlers = [];
        Linking.addEventListener.mockImplementation((event, handler) => {
            if (event === "url") linkingHandlers.push(handler);
            return { remove: jest.fn() };
        });

        keyboardHandlers = {};
        keyboardAddListenerSpy = jest
            .spyOn(Keyboard, "addListener")
            .mockImplementation((event, handler) => {
                keyboardHandlers[event] = [
                    ...(keyboardHandlers[event] ?? []),
                    handler,
                ];
                return {
                    remove: jest.fn(() => {
                        keyboardHandlers[event] = (
                            keyboardHandlers[event] ?? []
                        ).filter((item) => item !== handler);
                    }),
                };
            });
        dismissSpy = jest
            .spyOn(Keyboard, "dismiss")
            .mockImplementation(() => {});

        backPressHandlers = [];
        backHandlerSpy = jest
            .spyOn(BackHandler, "addEventListener")
            .mockImplementation((_event, handler) => {
                backPressHandlers.push(handler);
                return {
                    remove: jest.fn(() => {
                        backPressHandlers = backPressHandlers.filter(
                            (item) => item !== handler,
                        );
                    }),
                };
            });

        platformOs = jest.replaceProperty(Platform, "OS", "android");
    });

    afterEach(() => {
        keyboardAddListenerSpy.mockRestore();
        backHandlerSpy.mockRestore();
        dismissSpy.mockRestore();
        platformOs.restore();
    });

    test("recovers the Classic TabBar when a screen-local sub-view closes without a keyboardDidHide event", async () => {
        const view = await renderApp();

        fireEvent.press(view.getByLabelText("Belajar"));
        fireEvent.press(view.getByTestId("mock-explore-open-feature"));

        await emitKeyboard("keyboardDidShow", {});
        expect(view.queryByLabelText("Belajar")).toBeNull();

        await act(async () => {
            fireEvent.press(view.getByTestId("mock-explore-close-feature"));
        });

        await waitFor(() =>
            expect(view.getByLabelText("Belajar")).toBeTruthy(),
        );
    });

    test("recovers the Classic TabBar on hardware back even without a keyboardDidHide event", async () => {
        const view = await renderApp();

        await emitKeyboard("keyboardDidShow", {});
        expect(view.queryByLabelText("Beranda")).toBeNull();

        await pressHardwareBack();

        await waitFor(() =>
            expect(view.getByLabelText("Beranda")).toBeTruthy(),
        );
    });

    test("recovers the Classic TabBar when a same-tab deep link arrives without a keyboardDidHide event", async () => {
        const view = await renderApp();

        fireEvent.press(view.getByLabelText("Belajar"));
        await emitKeyboard("keyboardDidShow", {});
        expect(view.queryByLabelText("Belajar")).toBeNull();

        await emitDeepLink("thullaabulilmi://belajar");

        await waitFor(() =>
            expect(view.getByLabelText("Belajar")).toBeTruthy(),
        );
    });

    test("dismisses the keyboard as the first step of hardware back, before the screen-local back handler runs", async () => {
        const view = await renderApp();
        fireEvent.press(view.getByLabelText("Belajar"));
        fireEvent.press(view.getByTestId("mock-explore-open-feature"));

        await pressHardwareBack();

        expect(dismissSpy).toHaveBeenCalled();
        expect(__exploreOnBackSpy).toHaveBeenCalled();
        expect(dismissSpy.mock.invocationCallOrder[0]).toBeLessThan(
            __exploreOnBackSpy.mock.invocationCallOrder[0],
        );
    });

    test("recovers the Classic TabBar when hardware back is handled by a screen-local back handler", async () => {
        const view = await renderApp();
        fireEvent.press(view.getByLabelText("Belajar"));
        fireEvent.press(view.getByTestId("mock-explore-open-feature"));

        await emitKeyboard("keyboardDidShow", {});
        expect(view.queryByLabelText("Belajar")).toBeNull();

        await pressHardwareBack();

        await waitFor(() =>
            expect(view.getByLabelText("Belajar")).toBeTruthy(),
        );
    });

    test("grace-window timer re-asserts keyboardVisible(false) when a late/stale keyboardDidShow arrives after a reset with nothing genuinely focused", async () => {
        const view = await renderApp();
        const focusedInputSpy = jest
            .spyOn(TextInput.State, "currentlyFocusedInput")
            .mockReturnValue(null);
        jest.useFakeTimers();

        try {
            fireEvent.press(view.getByLabelText("Belajar"));
            fireEvent.press(view.getByTestId("mock-explore-open-feature"));
            await emitKeyboard("keyboardDidShow", {});
            expect(view.queryByLabelText("Belajar")).toBeNull();

            await act(async () => {
                fireEvent.press(view.getByTestId("mock-explore-close-feature"));
            });
            expect(view.getByLabelText("Belajar")).toBeTruthy();

            await emitKeyboard("keyboardDidShow", {});
            expect(view.queryByLabelText("Belajar")).toBeNull();

            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(view.getByLabelText("Belajar")).toBeTruthy();
        } finally {
            jest.useRealTimers();
            focusedInputSpy.mockRestore();
        }
    });

    test("grace-window timer does not stomp keyboardVisible when a TextInput is genuinely focused when it fires", async () => {
        const view = await renderApp();
        const focusedInputSpy = jest
            .spyOn(TextInput.State, "currentlyFocusedInput")
            .mockReturnValue({});
        jest.useFakeTimers();

        try {
            fireEvent.press(view.getByLabelText("Belajar"));
            fireEvent.press(view.getByTestId("mock-explore-open-feature"));
            await emitKeyboard("keyboardDidShow", {});
            expect(view.queryByLabelText("Belajar")).toBeNull();

            await act(async () => {
                fireEvent.press(view.getByTestId("mock-explore-close-feature"));
            });
            expect(view.getByLabelText("Belajar")).toBeTruthy();

            await emitKeyboard("keyboardDidShow", {});
            expect(view.queryByLabelText("Belajar")).toBeNull();

            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(view.queryByLabelText("Belajar")).toBeNull();
        } finally {
            jest.useRealTimers();
            focusedInputSpy.mockRestore();
        }
    });

    test("the 800ms watchdog self-heals a stuck keyboardVisible with zero navigation signal at all (residual-gap safety net)", async () => {
        const view = await renderApp();
        const focusedInputSpy = jest
            .spyOn(TextInput.State, "currentlyFocusedInput")
            .mockReturnValue(null);
        jest.useFakeTimers();

        try {
            await emitKeyboard("keyboardDidShow", {});
            expect(view.queryByLabelText("Beranda")).toBeNull();

            act(() => {
                jest.advanceTimersByTime(800);
            });

            expect(view.getByLabelText("Beranda")).toBeTruthy();
        } finally {
            jest.useRealTimers();
            focusedInputSpy.mockRestore();
        }
    });

    test("the 800ms watchdog leaves keyboardVisible alone while a TextInput is genuinely focused", async () => {
        const view = await renderApp();
        const focusedInputSpy = jest
            .spyOn(TextInput.State, "currentlyFocusedInput")
            .mockReturnValue({});
        jest.useFakeTimers();

        try {
            await emitKeyboard("keyboardDidShow", {});
            expect(view.queryByLabelText("Beranda")).toBeNull();

            act(() => {
                jest.advanceTimersByTime(1600);
            });

            expect(view.queryByLabelText("Beranda")).toBeNull();
        } finally {
            jest.useRealTimers();
            focusedInputSpy.mockRestore();
        }
    });
});
