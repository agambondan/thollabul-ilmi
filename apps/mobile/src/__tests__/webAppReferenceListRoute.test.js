jest.mock("lucide-react-native", () => {
    const icon = () => null;
    return new Proxy(
        {},
        {
            get: (target, prop) => {
                if (prop === "__esModule") return false;
                if (!target[prop]) target[prop] = icon;
                return target[prop];
            },
        },
    );
});

import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { WebAppReferenceListRoute } from "../screens/explore/WebAppReferenceListRoute";

const SETTLE_MS = 350;
const waitForDebounce = async () => {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    });
};

const buildSejarahItems = () => [
    {
        id: 1,
        title: "Khulafaur Rasyidin",
        body: "Masa empat khalifah pertama.",
        raw: { category: "khulafa" },
    },
    {
        id: 2,
        title: "Dinasti Umayyah",
        body: "Masa kekhalifahan Umayyah.",
        raw: { category: "dinasti" },
    },
];

describe("WebAppReferenceListRoute search debounce (B8)", () => {
    test("does not call onLoadMore once per keystroke while the user is still typing", () => {
        const onLoadMore = jest.fn();
        const view = render(
            <WebAppReferenceListRoute
                error=''
                items={buildSejarahItems()}
                loading={false}
                onLoadMore={onLoadMore}
                onOpenItem={jest.fn()}
                pagination={{ hasMore: true, loadingMore: false }}
                routeKey='sejarah'
            />,
        );

        const keystrokes = ["k", "kh", "khu", "khul", "khula", "khulaf"];
        for (const partial of keystrokes) {
            fireEvent.changeText(
                view.getByTestId("web-app-sejarah-search"),
                partial,
            );
        }

        expect(onLoadMore).not.toHaveBeenCalled();
    });

    test("calls onLoadMore once after the user stops typing and the debounce settles", async () => {
        const onLoadMore = jest.fn();
        const view = render(
            <WebAppReferenceListRoute
                error=''
                items={buildSejarahItems()}
                loading={false}
                onLoadMore={onLoadMore}
                onOpenItem={jest.fn()}
                pagination={{ hasMore: true, loadingMore: false }}
                routeKey='sejarah'
            />,
        );

        const keystrokes = ["k", "kh", "khu", "khul", "khula", "khulaf"];
        for (const partial of keystrokes) {
            fireEvent.changeText(
                view.getByTestId("web-app-sejarah-search"),
                partial,
            );
        }
        expect(onLoadMore).not.toHaveBeenCalled();

        await waitForDebounce();

        expect(onLoadMore.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(onLoadMore.mock.calls.length).toBeLessThan(keystrokes.length);
    });

    test("does not call onLoadMore at all once typing settles when hasMore is false", async () => {
        const onLoadMore = jest.fn();
        const view = render(
            <WebAppReferenceListRoute
                error=''
                items={buildSejarahItems()}
                loading={false}
                onLoadMore={onLoadMore}
                onOpenItem={jest.fn()}
                pagination={{ hasMore: false, loadingMore: false }}
                routeKey='sejarah'
            />,
        );

        fireEvent.changeText(
            view.getByTestId("web-app-sejarah-search"),
            "khulafa",
        );
        await waitForDebounce();

        expect(onLoadMore).not.toHaveBeenCalled();
    });

    test("filters correctly once the debounce settles, matching only the searched item", async () => {
        const view = render(
            <WebAppReferenceListRoute
                error=''
                items={buildSejarahItems()}
                loading={false}
                onLoadMore={jest.fn()}
                onOpenItem={jest.fn()}
                pagination={{ hasMore: false, loadingMore: false }}
                routeKey='sejarah'
            />,
        );

        expect(view.getByText("Khulafaur Rasyidin")).toBeTruthy();
        expect(view.getByText("Dinasti Umayyah")).toBeTruthy();

        fireEvent.changeText(
            view.getByTestId("web-app-sejarah-search"),
            "umayyah",
        );

        expect(view.getByText("Khulafaur Rasyidin")).toBeTruthy();
        expect(view.getByText("Dinasti Umayyah")).toBeTruthy();

        await waitForDebounce();

        expect(view.queryByText("Khulafaur Rasyidin")).toBeNull();
        expect(view.getByText("Dinasti Umayyah")).toBeTruthy();
    });

    test("TextInput echoes every keystroke immediately regardless of the debounce", () => {
        const view = render(
            <WebAppReferenceListRoute
                error=''
                items={buildSejarahItems()}
                loading={false}
                onLoadMore={jest.fn()}
                onOpenItem={jest.fn()}
                pagination={{ hasMore: false, loadingMore: false }}
                routeKey='sejarah'
            />,
        );

        fireEvent.changeText(
            view.getByTestId("web-app-sejarah-search"),
            "umayyah",
        );

        expect(view.getByTestId("web-app-sejarah-search").props.value).toBe(
            "umayyah",
        );
    });

    test("tapping reset clears the search without waiting for the debounce", async () => {
        const view = render(
            <WebAppReferenceListRoute
                error=''
                items={buildSejarahItems()}
                loading={false}
                onLoadMore={jest.fn()}
                onOpenItem={jest.fn()}
                pagination={{ hasMore: false, loadingMore: false }}
                routeKey='sejarah'
            />,
        );

        fireEvent.changeText(
            view.getByTestId("web-app-sejarah-search"),
            "umayyah",
        );
        await waitForDebounce();
        expect(view.queryByText("Khulafaur Rasyidin")).toBeNull();

        fireEvent.press(view.getByTestId("web-app-sejarah-reset-search"));

        expect(view.getByTestId("web-app-sejarah-search").props.value).toBe("");
        await waitForDebounce();
        expect(view.getByText("Khulafaur Rasyidin")).toBeTruthy();
        expect(view.getByText("Dinasti Umayyah")).toBeTruthy();
    });
});
