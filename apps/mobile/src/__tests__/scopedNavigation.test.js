const { createScopedNavigation } = require("../navigation/scopedNavigation");

const buildNavigation = () => ({
    clearBack: jest.fn(),
    close: jest.fn(),
    current: { view: "settings" },
    setBack: jest.fn(),
    setHeader: jest.fn(),
});

describe("createScopedNavigation", () => {
    test("forwards header and back changes from the active tab", () => {
        const navigation = buildNavigation();
        const scoped = createScopedNavigation(
            navigation,
            "belajar",
            () => "belajar",
        );
        const handler = jest.fn();

        scoped.setHeader({ title: "Kajian" });
        scoped.setBack(handler);
        scoped.clearBack();

        expect(navigation.setHeader).toHaveBeenCalledWith({ title: "Kajian" });
        expect(navigation.setBack).toHaveBeenCalledWith(handler);
        expect(navigation.clearBack).toHaveBeenCalledTimes(1);
    });

    test("ignores header and back changes from a tab that is not active", () => {
        const navigation = buildNavigation();
        const scoped = createScopedNavigation(
            navigation,
            "belajar",
            () => "quran",
        );

        scoped.setHeader({ title: "Kajian" });
        scoped.setBack(jest.fn());
        scoped.clearBack();

        expect(navigation.setHeader).not.toHaveBeenCalled();
        expect(navigation.setBack).not.toHaveBeenCalled();
        expect(navigation.clearBack).not.toHaveBeenCalled();
    });

    test("reads the active tab at call time, not at creation time", () => {
        const navigation = buildNavigation();
        let active = "belajar";
        const scoped = createScopedNavigation(
            navigation,
            "belajar",
            () => active,
        );

        scoped.setHeader({ title: "first" });
        active = "quran";
        scoped.setHeader({ title: "second" });

        expect(navigation.setHeader).toHaveBeenCalledTimes(1);
        expect(navigation.setHeader).toHaveBeenCalledWith({ title: "first" });
    });

    test("keeps every other navigation member untouched", () => {
        const navigation = buildNavigation();
        const scoped = createScopedNavigation(navigation, "home", () => "home");

        expect(scoped.close).toBe(navigation.close);
        expect(scoped.current).toBe(navigation.current);
    });
});
