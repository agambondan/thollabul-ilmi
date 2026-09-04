import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PwaInstallNotice from "@/components/PwaInstallNotice";

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("next/image", () => ({
    __esModule: true,
    default: (props) => <span aria-label={props.alt} data-src={props.src} />,
}));

const setIosUserAgent = (ua) => {
    Object.defineProperty(window.navigator, "userAgent", {
        value: ua,
        configurable: true,
    });
};

const setStandalone = (value) => {
    Object.defineProperty(window.navigator, "standalone", {
        value,
        configurable: true,
    });
};

describe("PwaInstallNotice", () => {
    beforeEach(() => {
        localStorage.clear();
        setIosUserAgent(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        );
        setStandalone(false);
    });

    test("renders iOS guide prompt on iPhone Safari", async () => {
        render(<PwaInstallNotice />);
        await waitFor(() =>
            expect(screen.getByText("pwa.install_title")).toBeInTheDocument(),
        );
        expect(screen.getByText("pwa.install_desc")).toBeInTheDocument();
        expect(screen.getByText("pwa.install_guide")).toBeInTheDocument();
    });

    test("clicking guide toggles iOS instructions on iOS", async () => {
        render(<PwaInstallNotice />);
        await waitFor(() =>
            expect(screen.getByText("pwa.install_guide")).toBeInTheDocument(),
        );
        expect(screen.queryByText("pwa.install_ios")).not.toBeInTheDocument();
        fireEvent.click(screen.getByText("pwa.install_guide"));
        expect(screen.getByText("pwa.install_ios")).toBeInTheDocument();
        fireEvent.click(screen.getByText("pwa.install_guide"));
        expect(screen.queryByText("pwa.install_ios")).not.toBeInTheDocument();
    });

    test("does not render when previously dismissed within TTL", () => {
        localStorage.setItem(
            "tholabul_pwa_prompt_dismissed",
            String(Date.now() - 1000),
        );
        render(<PwaInstallNotice />);
        expect(screen.queryByText("pwa.install_title")).not.toBeInTheDocument();
    });

    test("dismiss button hides the notice and persists timestamp", () => {
        render(<PwaInstallNotice />);
        return waitFor(() =>
            expect(screen.getByText("pwa.install_title")).toBeInTheDocument(),
        ).then(() => {
            fireEvent.click(screen.getByLabelText("Tutup"));
            expect(
                screen.queryByText("pwa.install_title"),
            ).not.toBeInTheDocument();
            const stored = localStorage.getItem(
                "tholabul_pwa_prompt_dismissed",
            );
            expect(stored).not.toBeNull();
            expect(Date.now() - Number(stored)).toBeLessThan(5000);
        });
    });
});
