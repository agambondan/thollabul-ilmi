import React from "react";
import { render, act } from "@testing-library/react-native";
import { Text } from "react-native";

import {
    TabActivityProvider,
    useTabActivity,
} from "../context/TabActivityContext";

function TestConsumer({ onReady }) {
    const ctx = useTabActivity();
    React.useEffect(() => {
        onReady?.(ctx);
    }, [ctx, onReady]);
    return <Text>{ctx.activityTick}</Text>;
}

describe("TabActivityProvider", () => {
    test("wraps children", () => {
        const { getByText } = render(
            <TabActivityProvider>
                <Text>hello</Text>
            </TabActivityProvider>,
        );
        expect(getByText("hello")).toBeTruthy();
    });

    test("initial activityTick is 0", () => {
        let tick;
        render(
            <TabActivityProvider>
                <TestConsumer
                    onReady={(ctx) => {
                        tick = ctx.activityTick;
                    }}
                />
            </TabActivityProvider>,
        );
        expect(tick).toBe(0);
    });

    test("notifyTabActivity updates activityTick", () => {
        let ctx;
        render(
            <TabActivityProvider>
                <TestConsumer
                    onReady={(c) => {
                        ctx = c;
                    }}
                />
            </TabActivityProvider>,
        );

        act(() => {
            ctx.notifyTabActivity();
        });

        expect(ctx.activityTick).toBeGreaterThan(0);
    });

    test("notifyTabActivity throttles calls within 250ms", () => {
        let ctx;
        render(
            <TabActivityProvider>
                <TestConsumer
                    onReady={(c) => {
                        ctx = c;
                    }}
                />
            </TabActivityProvider>,
        );

        act(() => {
            ctx.notifyTabActivity();
        });
        const firstTick = ctx.activityTick;

        act(() => {
            ctx.notifyTabActivity();
        });

        expect(ctx.activityTick).toBe(firstTick);
    });

    test("notifyTabActivity allows update after 250ms with mocked Date.now", () => {
        const origNow = Date.now;
        let now = 1000;
        Date.now = jest.fn(() => now);

        let ctx;
        render(
            <TabActivityProvider>
                <TestConsumer
                    onReady={(c) => {
                        ctx = c;
                    }}
                />
            </TabActivityProvider>,
        );

        act(() => {
            ctx.notifyTabActivity();
        });
        const first = ctx.activityTick;

        now = 1500;
        act(() => {
            ctx.notifyTabActivity();
        });
        const second = ctx.activityTick;

        expect(second).toBeGreaterThan(first);
        expect(second).toBe(1500);

        Date.now = origNow;
    });

    test("useTabActivity works outside TabActivityProvider with defaults", () => {
        let ctx;
        function Capture() {
            ctx = useTabActivity();
            return null;
        }

        render(<Capture />);

        expect(ctx.activityTick).toBe(0);
        expect(typeof ctx.notifyTabActivity).toBe("function");
    });
});
