import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
    Keyboard,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Screen } from "../components/Screen";
import { TabActivityProvider } from "../context/TabActivityContext";
import { MobileLocaleProvider } from "../i18n/MobileLocaleProvider";
import { LayoutModeProvider, layoutModes, useLayoutMode } from "../layout/LayoutModeProvider";
import { MobileAppShell } from "../layout/MobileAppShell";
import { getWebAppAccountLabel } from "../layout/WebAppShell";
import { useSession } from "../context/SessionContext";

jest.mock("react-native-safe-area-context", () => {
    const { createContext } = require("react");
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
        SafeAreaInsetsContext: createContext(null),
        SafeAreaView: ({ children, testID }) => {
            const { View } = require("react-native");
            return <View testID={testID}>{children}</View>;
        },
        useSafeAreaInsets: () => inset,
    };
});

jest.mock("../context/SessionContext", () => ({
    useSession: jest.fn(),
}));

const setBarStyleSpy = jest
    .spyOn(StatusBar, "setBarStyle")
    .mockImplementation(() => {});

function renderShell(props = {}) {
    const onOpenProfile = props.onOpenProfile ?? jest.fn();
    const onTabChange = props.onTabChange ?? jest.fn();

    return render(
        <TabActivityProvider>
            <LayoutModeProvider>
                <MobileAppShell
                    activeTab={props.activeTab ?? "home"}
                    currentFeatureKey={props.currentFeatureKey ?? null}
                    keyboardVisible={props.keyboardVisible ?? false}
                    onOpenProfile={onOpenProfile}
                    onTabChange={onTabChange}
                >
                    <Text>Shell content</Text>
                </MobileAppShell>
            </LayoutModeProvider>
        </TabActivityProvider>,
    );
}

function renderShellWithLocale(props = {}) {
    const onOpenProfile = props.onOpenProfile ?? jest.fn();
    const onTabChange = props.onTabChange ?? jest.fn();

    return render(
        <TabActivityProvider>
            <MobileLocaleProvider>
                <LayoutModeProvider>
                    <MobileAppShell
                        activeTab={props.activeTab ?? "home"}
                        keyboardVisible={props.keyboardVisible ?? false}
                        onOpenProfile={onOpenProfile}
                        onTabChange={onTabChange}
                    >
                        <Text>Shell content</Text>
                    </MobileAppShell>
                </LayoutModeProvider>
            </MobileLocaleProvider>
        </TabActivityProvider>,
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));
    AsyncStorage.setItem.mockImplementation(() => Promise.resolve());
    useSession.mockReturnValue({
        loading: false,
        signOut: jest.fn(),
        user: null,
    });
});

describe("MobileAppShell", () => {
    test("uses web app shell by default", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        const { getByText, getByTestId, queryByTestId } = renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(getByText("Shell content")).toBeTruthy();
        expect(getByText("Beranda")).toBeTruthy();
        expect(queryByTestId("classic-app-shell")).toBeNull();
    });

    test("uses classic shell when stored mode is classic", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"classic"');
        const { getByText, getByTestId, queryByTestId } = renderShell();

        await waitFor(() =>
            expect(getByTestId("classic-app-shell")).toBeTruthy(),
        );
        expect(getByText("Shell content")).toBeTruthy();
        expect(getByText("Beranda")).toBeTruthy();
        expect(queryByTestId("web-app-shell")).toBeNull();
    });

    test("falls back to classic shell when stored layout mode is invalid", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"unexpected"');
        const { getByText, getByTestId, queryByTestId } = renderShell();

        await waitFor(() =>
            expect(getByTestId("classic-app-shell")).toBeTruthy(),
        );
        expect(getByText("Shell content")).toBeTruthy();
        expect(queryByTestId("web-app-shell")).toBeNull();
    });

    test("uses web app shell chrome when stored mode is web_app", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const { getByText, getByTestId, queryByTestId } = renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(getByText("Shell content")).toBeTruthy();
        expect(getByTestId("mobile-top-header")).toBeTruthy();
        expect(getByTestId("mobile-bottom-nav")).toBeTruthy();
        expect(queryByTestId("classic-app-shell")).toBeNull();
        expect(getByText("Thullaabul Ilmi")).toBeTruthy();
        expect(getByText("T")).toBeTruthy();
        expect(getByText("Beranda")).toBeTruthy();
        expect(getByText("Al-Quran")).toBeTruthy();
        expect(getByText("Hadis")).toBeTruthy();
        expect(getByText("Ibadah")).toBeTruthy();
        expect(getByText("Belajar")).toBeTruthy();
        expect(setBarStyleSpy).toHaveBeenCalledWith("dark-content");
        expect(getByTestId("mobile-top-header").props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ backgroundColor: "#f8fafc" }),
            ]),
        );
        expect(getByTestId("mobile-bottom-nav").props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ backgroundColor: "#f8fafc" }),
            ]),
        );
    });

    test("applies stored dark theme to web app shell chrome and status bar", async () => {
        AsyncStorage.getItem.mockImplementation(async (key) => {
            if (key === "tholabul:pref:app-layout-mode") return '"web_app"';
            if (key === "tholabul:pref:app-theme") return '"dark"';
            return null;
        });
        const { getByTestId } = renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        await waitFor(() =>
            expect(setBarStyleSpy).toHaveBeenCalledWith("light-content"),
        );
        expect(getByTestId("mobile-top-header").props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ backgroundColor: "#020617" }),
            ]),
        );
        expect(getByTestId("mobile-bottom-nav").props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ backgroundColor: "#020617" }),
            ]),
        );
    });

    test("uses logged-in user initial in web app shell header", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        useSession.mockReturnValue({
            user: { name: "Budi", email: "budi@example.com" },
        });
        const { getByText, getByTestId } = renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(getByText("B")).toBeTruthy();
    });

    test("switches live to classic shell when layout mode changes via context", async () => {
        function SwitchProbe() {
            const { setLayoutMode } = useLayoutMode();
            return (
                <Pressable onPress={() => setLayoutMode(layoutModes.classic)}>
                    <Text>Switch Classic</Text>
                </Pressable>
            );
        }

        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const { getByText, getByTestId, queryByTestId } = render(
            <TabActivityProvider>
                <LayoutModeProvider>
                    <MobileAppShell
                        activeTab="home"
                        keyboardVisible={false}
                        onOpenProfile={jest.fn()}
                        onTabChange={jest.fn()}
                    >
                        <SwitchProbe />
                    </MobileAppShell>
                </LayoutModeProvider>
            </TabActivityProvider>,
        );

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(queryByTestId("classic-app-shell")).toBeNull();

        await act(async () => {
            fireEvent.press(getByText("Switch Classic"));
        });

        await waitFor(() => expect(getByTestId("classic-app-shell")).toBeTruthy());
        expect(queryByTestId("web-app-shell")).toBeNull();
    });

    test("opens and closes account menu from web app header account control", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        useSession.mockReturnValue({
            loading: false,
            session: { token: "token" },
            signOut: jest.fn(),
            user: { name: "Admin", email: "admin@tholabul-ilmi.com" },
        });
        const { getByText, getByTestId, queryByTestId } = renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(queryByTestId("mobile-account-menu")).toBeNull();

        fireEvent.press(getByTestId("mobile-top-header-profile"));

        expect(getByTestId("mobile-account-menu")).toBeTruthy();
        expect(getByTestId("mobile-account-menu-card").props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ alignSelf: "flex-end" }),
                { marginTop: 56 },
            ]),
        );
        expect(getByText("Profil")).toBeTruthy();
        expect(getByText("Bookmark")).toBeTruthy();
        expect(getByText("Gelap")).toBeTruthy();
        expect(getByTestId("mobile-account-menu-sign-out")).toBeTruthy();

        fireEvent.press(getByTestId("mobile-account-menu-close"));
        expect(queryByTestId("mobile-account-menu")).toBeNull();
    });

    test("hides account menu sign out action for guest users", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        useSession.mockReturnValue({
            loading: false,
            session: null,
            signOut: jest.fn(),
            user: null,
        });
        const { getByTestId, getByText, queryByTestId, queryByText } =
            renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByTestId("mobile-top-header-profile"));

        expect(getByText("Tamu")).toBeTruthy();
        expect(getByText("Belum masuk")).toBeTruthy();
        expect(queryByTestId("mobile-account-menu-sign-out")).toBeNull();
        expect(queryByText("Keluar")).toBeNull();
    });

    test("toggles web app dark theme from account menu", async () => {
        AsyncStorage.getItem.mockImplementation(async (key) => {
            if (key === "tholabul:pref:app-layout-mode") return '"web_app"';
            if (key === "tholabul:pref:app-theme") return '"dark"';
            return null;
        });
        const { getByTestId } = renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByTestId("mobile-top-header-profile"));

        expect(
            getByTestId("mobile-account-menu-theme-toggle").props
                .accessibilityState,
        ).toEqual({ checked: true });
        fireEvent.press(getByTestId("mobile-account-menu-theme-toggle"));

        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                "tholabul:pref:app-theme",
                '"light"',
            );
        });
        await waitFor(() =>
            expect(setBarStyleSpy).toHaveBeenCalledWith("dark-content"),
        );
    });

    test("routes account menu profile and sign out actions", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const onOpenProfile = jest.fn();
        const signOut = jest.fn();
        useSession.mockReturnValue({
            loading: false,
            session: { token: "token" },
            signOut,
            user: { name: "Admin", email: "admin@tholabul-ilmi.com" },
        });
        const { getByTestId } = renderShell({ onOpenProfile });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByTestId("mobile-top-header-profile"));
        fireEvent.press(getByTestId("mobile-account-menu-item-profile"));
        expect(onOpenProfile).toHaveBeenCalledTimes(1);

        fireEvent.press(getByTestId("mobile-top-header-profile"));
        fireEvent.press(getByTestId("mobile-account-menu-sign-out"));
        expect(signOut).toHaveBeenCalledTimes(1);
    });

    test("routes account menu shortcuts to their matching web app feature routes", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const onOpenProfile = jest.fn();
        const onTabChange = jest.fn();
        useSession.mockReturnValue({
            loading: false,
            session: { token: "token" },
            signOut: jest.fn(),
            user: { name: "Admin", email: "admin@tholabul-ilmi.com" },
        });
        const { getByTestId, queryByTestId } = renderShell({
            onOpenProfile,
            onTabChange,
        });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());

        fireEvent.press(getByTestId("mobile-top-header-profile"));
        fireEvent.press(getByTestId("mobile-account-menu-item-bookmarks"));
        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "bookmarks",
        });
        expect(queryByTestId("mobile-account-menu")).toBeNull();

        fireEvent.press(getByTestId("mobile-top-header-profile"));
        fireEvent.press(getByTestId("mobile-account-menu-item-notes"));
        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "notes",
        });

        fireEvent.press(getByTestId("mobile-top-header-profile"));
        fireEvent.press(getByTestId("mobile-account-menu-item-stats"));
        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "stats",
        });

        fireEvent.press(getByTestId("mobile-top-header-profile"));
        fireEvent.press(getByTestId("mobile-account-menu-item-notifications"));
        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "notifications",
        });
        expect(onOpenProfile).not.toHaveBeenCalled();
    });

    test("opens and closes web app secondary menu sheet", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const { getByLabelText, getByText, getByTestId, queryByTestId } =
            renderShell();

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(queryByTestId("mobile-menu-sheet")).toBeNull();

        fireEvent.press(getByLabelText("Menu"));
        expect(getByTestId("mobile-menu-sheet")).toBeTruthy();
        expect(getByText("AKSES CEPAT")).toBeTruthy();
        expect(getByText("LAINNYA")).toBeTruthy();
        expect(getByTestId("mobile-menu-item-pengaturan")).toBeTruthy();

        fireEvent.press(getByTestId("mobile-menu-sheet-close"));
        expect(queryByTestId("mobile-menu-sheet")).toBeNull();
    });

    test("routes web app menu sheet tab shortcuts through existing tab handler", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const onTabChange = jest.fn();
        const { getByLabelText, getByTestId, queryByTestId } = renderShell({
            onTabChange,
        });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByLabelText("Menu"));
        fireEvent.press(getByTestId("mobile-menu-item-tokoh"));

        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "tokoh",
        });
        expect(queryByTestId("mobile-menu-sheet")).toBeNull();

        fireEvent.press(getByLabelText("Menu"));
        fireEvent.press(getByTestId("mobile-menu-item-peta"));
        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "historical-map",
        });

        fireEvent.press(getByLabelText("Menu"));
        fireEvent.press(getByTestId("mobile-menu-item-perawi"));
        expect(onTabChange).toHaveBeenCalledWith("belajar", {
            featureKey: "perawi",
        });
    });

    test("routes web app menu profile shortcut through existing profile handler", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const onOpenProfile = jest.fn();
        const { getByLabelText, getByTestId } = renderShell({ onOpenProfile });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByLabelText("Menu"));
        fireEvent.press(getByTestId("mobile-menu-item-pengaturan"));

        expect(onOpenProfile).toHaveBeenCalledTimes(1);
        expect(onOpenProfile).toHaveBeenCalledWith({
            featureKey: "settings",
            view: "settings",
        });
    });

    test("routes web app bottom nav taps through existing tab handler", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const onTabChange = jest.fn();
        const { getByLabelText, getByTestId } = renderShell({ onTabChange });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByLabelText("Al-Quran"));

        expect(onTabChange).toHaveBeenCalledWith("quran");
    });

    test("opens global search and menu from web app header actions", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const onTabChange = jest.fn();
        const { getByLabelText, getByTestId } = renderShell({ onTabChange });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        fireEvent.press(getByLabelText("Cari"));
        expect(onTabChange).toHaveBeenCalledWith("home", {
            view: "global-search",
        });

        fireEvent.press(getByLabelText("Menu"));
        expect(getByTestId("mobile-menu-sheet")).toBeTruthy();
    });

    test("uses active tab state for web app bottom nav and menu selection", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const { getByLabelText, getByTestId } = renderShell({
            activeTab: "belajar",
            currentFeatureKey: "tokoh",
        });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(getByLabelText("Belajar").props.accessibilityState).toEqual({
            selected: true,
        });
        expect(getByLabelText("Beranda").props.accessibilityState).toEqual({
            selected: false,
        });

        fireEvent.press(getByLabelText("Menu"));

        expect(
            getByTestId("mobile-menu-item-tokoh").props.accessibilityState,
        ).toEqual({ selected: true });
        expect(
            getByTestId("mobile-menu-item-pengaturan").props.accessibilityState,
        ).toEqual({ selected: false });
    });

    test("marks the active web app tab in the five-tab contract", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const { getByLabelText, getByTestId } = renderShell({
            activeTab: "ibadah",
        });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(getByLabelText("Ibadah").props.accessibilityState).toEqual({
            selected: true,
        });
        expect(getByLabelText("Beranda").props.accessibilityState).toEqual({
            selected: false,
        });
    });

    test("hides web app bottom nav while keyboard is visible", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
        const { getByTestId, queryByTestId } = renderShell({
            keyboardVisible: true,
        });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        expect(queryByTestId("mobile-bottom-nav")).toBeNull();
    });

    test("localizes web app shell chrome from stored mobile language", async () => {
        AsyncStorage.getItem.mockImplementation(async (key) => {
            if (key === "tholabul:pref:app-layout-mode") return '"web_app"';
            if (key === "tholabul:pref:app-language") return '"en"';
            return null;
        });

        const { getByLabelText, getByTestId, getByText, queryByText } =
            renderShellWithLocale({ activeTab: "search" });

        await waitFor(() => expect(getByTestId("web-app-shell")).toBeTruthy());
        await waitFor(() => expect(getByLabelText("Search")).toBeTruthy());
        expect(queryByText("Cari")).toBeNull();

        fireEvent.press(getByTestId("mobile-top-header-profile"));
        expect(getByText("Guest")).toBeTruthy();
        expect(getByText("Not signed in")).toBeTruthy();
        expect(getByText("Dark")).toBeTruthy();
        expect(
            getByTestId("mobile-account-menu-language-en").props
                .accessibilityState,
        ).toEqual({ selected: true });

        fireEvent.press(getByTestId("mobile-account-menu-language-idn"));
        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                "tholabul:pref:app-language",
                '"idn"',
            );
            expect(getByLabelText("Cari")).toBeTruthy();
        });
    });
});

describe("getWebAppAccountLabel", () => {
    test("prefers name, falls back to email, then guest label", () => {
        expect(
            getWebAppAccountLabel({ name: "Ahmad", email: "a@example.com" }),
        ).toBe("Ahmad");
        expect(getWebAppAccountLabel({ email: "mail@example.com" })).toBe(
            "mail@example.com",
        );
        expect(getWebAppAccountLabel({ name: "   " })).toBe("Tamu");
        expect(getWebAppAccountLabel(null)).toBe("Tamu");
    });
});

describe("Shell keyboard inset (R1)", () => {
    let handlers;
    let addListenerSpy;
    let platformOs;

    const spacerHeight = (view) =>
        StyleSheet.flatten(
            view.getByTestId("web-app-keyboard-inset").props.style,
        ).height;

    const screenPadding = (view) =>
        StyleSheet.flatten(view.getByTestId("screen-root").props.style)
            .paddingBottom;

    const emitKeyboard = async (event, payload) => {
        await act(async () => {
            (handlers[event] ?? []).forEach((handler) => handler(payload));
        });
    };

    const renderLayout = async (layout, children, bottomInset = 24) => {
        AsyncStorage.getItem.mockImplementation(async (key) =>
            key === "tholabul:pref:app-layout-mode"
                ? JSON.stringify(layout)
                : null,
        );
        const view = render(
            <SafeAreaInsetsContext.Provider
                value={{ bottom: bottomInset, left: 0, right: 0, top: 0 }}
            >
                <TabActivityProvider>
                    <LayoutModeProvider>
                        <MobileAppShell
                            activeTab='home'
                            keyboardVisible={false}
                            onOpenProfile={jest.fn()}
                            onTabChange={jest.fn()}
                        >
                            {children}
                        </MobileAppShell>
                    </LayoutModeProvider>
                </TabActivityProvider>
            </SafeAreaInsetsContext.Provider>,
        );
        await waitFor(() =>
            expect(
                view.getByTestId(
                    layout === "classic"
                        ? "classic-app-shell"
                        : "web-app-shell",
                ),
            ).toBeTruthy(),
        );
        return view;
    };

    beforeEach(() => {
        handlers = {};
        addListenerSpy = jest
            .spyOn(Keyboard, "addListener")
            .mockImplementation((event, handler) => {
                handlers[event] = [...(handlers[event] ?? []), handler];
                return {
                    remove: jest.fn(() => {
                        handlers[event] = (handlers[event] ?? []).filter(
                            (item) => item !== handler,
                        );
                    }),
                };
            });
        platformOs = jest.replaceProperty(Platform, "OS", "android");
    });

    afterEach(() => {
        addListenerSpy.mockRestore();
        platformOs.restore();
    });

    test("reserves the keyboard height plus the bottom inset under the Modern content and clears on hide", async () => {
        const view = await renderLayout(
            "web_app",
            <TextInput placeholder='Utang jatuh tempo' />,
        );
        const input = view.getByPlaceholderText("Utang jatuh tempo");
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 300, screenY: 900 },
        });
        expect(spacerHeight(view)).toBe(324);
        expect(view.getByPlaceholderText("Utang jatuh tempo")).toBe(input);

        await emitKeyboard("keyboardDidHide", {
            endCoordinates: { height: 0 },
        });
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();
        expect(view.getByPlaceholderText("Utang jatuh tempo")).toBe(input);
    });

    test("clears when a zero-height or malformed show event replaces the keyboard", async () => {
        const view = await renderLayout("web_app", <Text>Isi</Text>);

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 280 },
        });
        expect(spacerHeight(view)).toBe(304);

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 0 },
        });
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 280 },
        });
        await emitKeyboard("keyboardDidShow", {});
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();
    });

    test("a Screen inside the Modern shell does not add a second padding", async () => {
        const view = await renderLayout(
            "web_app",
            <Screen title='Zakat'>
                <TextInput placeholder='Utang jatuh tempo' />
            </Screen>,
        );

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 300 },
        });

        expect(spacerHeight(view)).toBe(324);
        expect(screenPadding(view)).toBeUndefined();

        await emitKeyboard("keyboardDidHide", {
            endCoordinates: { height: 0 },
        });
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();
        expect(screenPadding(view)).toBeUndefined();
    });

    test("a Screen inside the Classic shell keeps padding itself", async () => {
        const view = await renderLayout(
            "classic",
            <Screen title='Zakat'>
                <TextInput placeholder='Utang jatuh tempo' />
            </Screen>,
        );

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 300 },
        });
        expect(screenPadding(view)).toBe(324);
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();

        await emitKeyboard("keyboardDidHide", {
            endCoordinates: { height: 0 },
        });
        expect(screenPadding(view)).toBeUndefined();
    });

    test("leaves iOS to KeyboardAvoidingView", async () => {
        platformOs.replaceValue("ios");
        const view = await renderLayout("web_app", <Text>Isi</Text>);

        expect(handlers.keyboardDidShow).toBeUndefined();
        expect(view.queryByTestId("web-app-keyboard-inset")).toBeNull();
    });

    test("removes every shell keyboard listener on unmount", async () => {
        const view = await renderLayout("web_app", <Text>Isi</Text>);
        expect(handlers.keyboardDidShow.length).toBeGreaterThan(0);
        expect(handlers.keyboardDidHide.length).toBeGreaterThan(0);

        view.unmount();

        expect(handlers.keyboardDidShow).toHaveLength(0);
        expect(handlers.keyboardDidHide).toHaveLength(0);
    });
});

describe("Profile header back arrow (R4)", () => {
    const khatamRoute = {
        params: { returnTab: null, view: "khatam" },
        tab: "ibadah",
    };

    const renderProfile = async (returnRoutes) => {
        AsyncStorage.getItem.mockImplementation(async (key) =>
            key === "tholabul:pref:app-layout-mode" ? '"web_app"' : null,
        );
        const onTabChange = jest.fn();
        const view = render(
            <TabActivityProvider>
                <LayoutModeProvider>
                    <MobileAppShell
                        activeTab='profile'
                        keyboardVisible={false}
                        onOpenProfile={jest.fn()}
                        onTabChange={onTabChange}
                        returnRoutes={returnRoutes}
                    >
                        <Text>Shell content</Text>
                    </MobileAppShell>
                </LayoutModeProvider>
            </TabActivityProvider>,
        );
        await waitFor(() =>
            expect(view.getByTestId("web-app-shell")).toBeTruthy(),
        );
        return { onTabChange, view };
    };

    test("shows a back arrow that reopens the Khatam return route", async () => {
        const { onTabChange, view } = await renderProfile({
            profile: khatamRoute,
        });

        expect(view.getByText("Profil")).toBeTruthy();
        fireEvent.press(view.getByLabelText("Kembali"));

        expect(onTabChange).toHaveBeenCalledWith("ibadah", {
            returnTab: null,
            view: "khatam",
        });
    });

    test("has no back arrow on Profile without a return route", async () => {
        const { view } = await renderProfile({});

        expect(view.queryByLabelText("Kembali")).toBeNull();
    });
});
