import { render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/context/Locale";

function LocaleProbe() {
    const { t } = useLocale();

    return (
        <div>
            <span data-testid='known'>{t("nav.search")}</span>
            <span data-testid='fallback'>
                {t("missing.key", "Fallback copy")}
            </span>
            <span data-testid='missing'>{String(t("missing.key"))}</span>
            <span data-testid='vars'>{t("auth.min_chars", { count: 8 })}</span>
        </div>
    );
}

describe("LocaleProvider", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("returns fallback text and undefined for missing keys without fallback", () => {
        render(
            <LocaleProvider>
                <LocaleProbe />
            </LocaleProvider>,
        );

        expect(screen.getByTestId("known")).toHaveTextContent("Cari");
        expect(screen.getByTestId("fallback")).toHaveTextContent(
            "Fallback copy",
        );
        expect(screen.getByTestId("missing")).toHaveTextContent("undefined");
    });
});
