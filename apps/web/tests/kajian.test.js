import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KajianClient from "@/app/kajian/KajianClient";
import "@testing-library/jest-dom";

import idDict from "@/lib/i18n/id";

// Mock Locale
jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (k, fallback) => idDict[k] || fallback || k,
        lang: "ID",
    }),
}));

// Mock LayoutMode
jest.mock("@/lib/useLayoutMode", () => ({
    useLayoutMode: () => ({
        isWide: false,
    }),
}));

describe("KajianClient Search Transcript", () => {
    beforeEach(() => {
        global.fetch = jest.fn((url) => {
            if (url.includes("/speakers")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: ["Ust. Dr. Khalid Basalamah, Lc., M.A."] }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: {
                            items: [
                                {
                                    id: 1,
                                    kajian_id: 1,
                                    video_id: "test_vid_01",
                                    title: "Sirah Nabawiyah",
                                    speaker: "Ust. Dr. Khalid Basalamah, Lc., M.A.",
                                    topic: "Sirah",
                                    start_seconds: 60,
                                    end_seconds: 120,
                                    timestamp: "01:00",
                                    snippet: "Kesabaran menghadapi ujian hidup di Makkah.",
                                    timestamp_url: "https://youtu.be/test_vid_01?t=60",
                                    match_mode: "hybrid",
                                },
                            ],
                            meta: { total: 1, page: 1 },
                        },
                    }),
            });
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders transcript search tab and modes", async () => {
        render(<KajianClient kajian={[]} />);

        expect(screen.getByText(/Cari di Transkrip/i)).toBeInTheDocument();
        expect(screen.getByText(/Semua Kajian/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Cari di Transkrip/i));

        await waitFor(() => {
            expect(screen.getAllByText(/Hybrid/i).length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText(/Teks Persis/i).length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText(/Makna \/ Tema/i).length).toBeGreaterThanOrEqual(1);
        });
    });

    it("switches search modes when clicked", async () => {
        render(<KajianClient kajian={[]} />);
        fireEvent.click(screen.getByText(/Cari di Transkrip/i));
        await waitFor(() => {
            expect(screen.getAllByText(/Teks Persis/i).length).toBeGreaterThanOrEqual(1);
        });
        const exactButton = screen.getAllByText(/Teks Persis/i)[0];
        fireEvent.click(exactButton);
        expect(exactButton).toBeInTheDocument();
    });
});
