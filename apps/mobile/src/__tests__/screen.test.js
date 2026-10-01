import React, { useEffect, useState } from "react";
import {
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";
import {
    act,
    fireEvent,
    render,
    renderHook,
} from "@testing-library/react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { Screen } from "../components/Screen";
import { TabActivityProvider } from "../context/TabActivityContext";
import {
    KeyboardInsetAppliedContext,
    useKeyboardInset,
} from "../hooks/useKeyboardInset";

const mounts = { probe: 0 };

function Probe() {
    useEffect(() => {
        mounts.probe += 1;
    }, []);
    return <TextInput placeholder='Total harta' testID='probe-input' />;
}

function ListHarness() {
    const [tick, setTick] = useState(0);
    return (
        <TabActivityProvider>
            <Screen
                listData={[{ id: "a" }]}
                listKeyExtractor={(item) => item.id}
                renderListItem={({ item }) => <Text>{item.id}</Text>}
                title='Zakat'
            >
                <Probe />
                <Pressable onPress={() => setTick((v) => v + 1)} testID='bump'>
                    <Text>{`tick-${tick}`}</Text>
                </Pressable>
            </Screen>
        </TabActivityProvider>
    );
}

function ScrollHarness() {
    const [tick, setTick] = useState(0);
    return (
        <TabActivityProvider>
            <Screen title='Zakat'>
                <Probe />
                <Pressable onPress={() => setTick((v) => v + 1)} testID='bump'>
                    <Text>{`tick-${tick}`}</Text>
                </Pressable>
            </Screen>
        </TabActivityProvider>
    );
}

beforeEach(() => {
    mounts.probe = 0;
});

describe("Screen header stability (B6)", () => {
    test("keeps header inputs mounted across re-renders in list mode", () => {
        const { getByTestId, getByText } = render(<ListHarness />);
        expect(mounts.probe).toBe(1);
        const input = getByTestId("probe-input");

        fireEvent.press(getByTestId("bump"));
        fireEvent.press(getByTestId("bump"));
        fireEvent.press(getByTestId("bump"));

        expect(getByText("tick-3")).toBeTruthy();
        expect(mounts.probe).toBe(1);
        expect(getByTestId("probe-input")).toBe(input);
    });

    test("keeps header inputs mounted across re-renders in scroll mode", () => {
        const { getByTestId } = render(<ScrollHarness />);
        fireEvent.press(getByTestId("bump"));
        fireEvent.press(getByTestId("bump"));
        expect(mounts.probe).toBe(1);
    });

    test("still renders list rows and footer next to the stable header", () => {
        const { getByText } = render(
            <TabActivityProvider>
                <Screen
                    listData={[{ id: "row-1" }, { id: "row-2" }]}
                    listFooter={<Text>footer</Text>}
                    listKeyExtractor={(item) => item.id}
                    renderListItem={({ item }) => <Text>{item.id}</Text>}
                    subtitle='Hitung zakat'
                    title='Zakat'
                >
                    <Text>body</Text>
                </Screen>
            </TabActivityProvider>,
        );
        expect(getByText("Zakat")).toBeTruthy();
        expect(getByText("Hitung zakat")).toBeTruthy();
        expect(getByText("body")).toBeTruthy();
        expect(getByText("row-1")).toBeTruthy();
        expect(getByText("row-2")).toBeTruthy();
        expect(getByText("footer")).toBeTruthy();
    });
});

describe("Screen keyboard avoidance (B20)", () => {
    let handlers;
    let subscriptions;
    let addListenerSpy;

    const renderWithInsets = (ui, bottom = 0) =>
        render(
            <SafeAreaInsetsContext.Provider
                value={{ bottom, left: 0, right: 0, top: 0 }}
            >
                <TabActivityProvider>{ui}</TabActivityProvider>
            </SafeAreaInsetsContext.Provider>,
        );

    const rootPaddingBottom = (view) =>
        StyleSheet.flatten(view.getByTestId("screen-root").props.style)
            .paddingBottom;

    const emitKeyboard = async (event, payload) => {
        await act(async () => {
            (handlers[event] ?? []).forEach((handler) => handler(payload));
        });
    };

    beforeEach(() => {
        handlers = {};
        subscriptions = [];
        addListenerSpy = jest
            .spyOn(Keyboard, "addListener")
            .mockImplementation((event, handler) => {
                handlers[event] = [...(handlers[event] ?? []), handler];
                const subscription = { remove: jest.fn() };
                subscriptions.push(subscription);
                return subscription;
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("pads the content by keyboard height plus the bottom inset on Android", async () => {
        jest.replaceProperty(Platform, "OS", "android");
        const view = renderWithInsets(
            <Screen title='Lokasi'>
                <TextInput placeholder='Lintang' />
            </Screen>,
            24,
        );
        expect(rootPaddingBottom(view)).toBeUndefined();

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 300, screenY: 900 },
        });
        expect(rootPaddingBottom(view)).toBe(324);

        await emitKeyboard("keyboardDidHide", {
            endCoordinates: { height: 0 },
        });
        expect(rootPaddingBottom(view)).toBeUndefined();
    });

    test("applies the same padding in list mode", async () => {
        jest.replaceProperty(Platform, "OS", "android");
        const view = renderWithInsets(
            <Screen
                listData={[{ id: "a" }]}
                listKeyExtractor={(item) => item.id}
                renderListItem={({ item }) => <Text>{item.id}</Text>}
                title='Lokasi'
            >
                <TextInput placeholder='Lintang' />
            </Screen>,
            0,
        );

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 280, screenY: 900 },
        });
        expect(rootPaddingBottom(view)).toBe(280);
    });

    test("ignores malformed keyboard events", async () => {
        jest.replaceProperty(Platform, "OS", "android");
        const view = renderWithInsets(<Screen title='Lokasi' />, 16);

        await emitKeyboard("keyboardDidShow", {});
        expect(rootPaddingBottom(view)).toBeUndefined();
    });

    test("keeps the focused header input mounted while the keyboard opens", async () => {
        jest.replaceProperty(Platform, "OS", "android");
        const view = renderWithInsets(
            <Screen
                listData={[{ id: "a" }]}
                listKeyExtractor={(item) => item.id}
                renderListItem={({ item }) => <Text>{item.id}</Text>}
                title='Zakat'
            >
                <Probe />
            </Screen>,
            24,
        );
        const input = view.getByTestId("probe-input");

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 300 },
        });

        expect(rootPaddingBottom(view)).toBe(324);
        expect(mounts.probe).toBe(1);
        expect(view.getByTestId("probe-input")).toBe(input);
    });

    test("leaves keyboard handling to KeyboardAvoidingView on iOS", () => {
        const view = renderWithInsets(<Screen title='Lokasi' />, 34);

        expect(handlers.keyboardDidShow).toBeUndefined();
        expect(rootPaddingBottom(view) ?? 0).toBe(0);
    });

    test("removes every keyboard listener on unmount", () => {
        jest.replaceProperty(Platform, "OS", "android");
        const view = renderWithInsets(<Screen title='Lokasi' />);

        expect(subscriptions.length).toBeGreaterThanOrEqual(2);
        view.unmount();
        subscriptions.forEach((subscription) => {
            expect(subscription.remove).toHaveBeenCalled();
        });
    });

    test.each([
        ["scroll", <Screen key='scroll' title='Lokasi' />],
        [
            "list",
            <Screen
                key='list'
                listData={[{ id: "a" }]}
                listKeyExtractor={(item) => item.id}
                renderListItem={({ item }) => <Text>{item.id}</Text>}
                title='Lokasi'
            />,
        ],
    ])(
        "skips its own padding in %s mode when an ancestor applied the inset",
        async (_mode, screen) => {
            jest.replaceProperty(Platform, "OS", "android");
            const view = renderWithInsets(
                <KeyboardInsetAppliedContext.Provider value>
                    {screen}
                </KeyboardInsetAppliedContext.Provider>,
                24,
            );

            await emitKeyboard("keyboardDidShow", {
                endCoordinates: { height: 300 },
            });

            expect(rootPaddingBottom(view)).toBeUndefined();
        },
    );

    test("still pads itself when the ancestor context says nothing was applied", async () => {
        jest.replaceProperty(Platform, "OS", "android");
        const view = renderWithInsets(
            <KeyboardInsetAppliedContext.Provider value={false}>
                <Screen title='Lokasi' />
            </KeyboardInsetAppliedContext.Provider>,
            24,
        );

        await emitKeyboard("keyboardDidShow", {
            endCoordinates: { height: 300 },
        });

        expect(rootPaddingBottom(view)).toBe(324);
    });
});

describe("useKeyboardInset enabled option (R1)", () => {
    let handlers;

    const emit = async (event, payload) => {
        await act(async () => {
            (handlers[event] ?? []).forEach((handler) => handler(payload));
        });
    };

    beforeEach(() => {
        handlers = {};
        jest.spyOn(Keyboard, "addListener").mockImplementation(
            (event, handler) => {
                handlers[event] = [...(handlers[event] ?? []), handler];
                return {
                    remove: jest.fn(() => {
                        handlers[event] = handlers[event].filter(
                            (item) => item !== handler,
                        );
                    }),
                };
            },
        );
        jest.replaceProperty(Platform, "OS", "android");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("returns 0 and never subscribes while disabled", async () => {
        const { result } = renderHook(() =>
            useKeyboardInset({ enabled: false }),
        );

        expect(handlers.keyboardDidShow).toBeUndefined();
        await emit("keyboardDidShow", { endCoordinates: { height: 300 } });
        expect(result.current).toBe(0);
    });

    test("subscribes once it is enabled and drops the subscription when disabled again", async () => {
        const { rerender, result } = renderHook(
            ({ enabled }) => useKeyboardInset({ enabled }),
            { initialProps: { enabled: true } },
        );
        expect(handlers.keyboardDidShow).toHaveLength(1);

        await emit("keyboardDidShow", { endCoordinates: { height: 300 } });
        expect(result.current).toBe(300);

        rerender({ enabled: false });
        expect(handlers.keyboardDidShow).toHaveLength(0);
        expect(result.current).toBe(0);

        rerender({ enabled: true });
        expect(handlers.keyboardDidShow).toHaveLength(1);
        expect(result.current).toBe(0);
    });
});
