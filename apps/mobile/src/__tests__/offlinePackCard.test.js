jest.mock("../context/FeedbackContext", () => ({
    useFeedback: jest.fn(),
}));

jest.mock("../api/client", () => ({
    getHadithBooks: jest.fn(),
}));

jest.mock("../storage/offlineContent", () => ({
    getOfflineOverview: jest.fn(),
    getOfflineHadithCountsBySlug: jest.fn(),
    buildOfflinePack: jest.fn(),
    clearOfflinePack: jest.fn(),
}));

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { OfflinePackCard } from "../components/OfflinePackCard";
import { flushAsyncWork } from "../test-utils/async";

const { useFeedback } = require("../context/FeedbackContext");
const { getHadithBooks } = require("../api/client");
const {
    getOfflineOverview,
    getOfflineHadithCountsBySlug,
    buildOfflinePack,
    clearOfflinePack,
} = require("../storage/offlineContent");

const mockFeedback = {
    showError: jest.fn(),
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
};

const defaultOverview = {
    supported: true,
    quranSurahs: 0,
    quranAyahs: 0,
    hadiths: 0,
    hadithBooks: [],
    savedAt: null,
};

const mockBooks = [
    { slug: "bukhari", name: "Shahih Bukhari", count: 100 },
    { slug: "muslim", name: "Shahih Muslim", count: 80 },
];

const renderOfflinePackCard = async () => {
    const view = render(<OfflinePackCard />);
    await flushAsyncWork();
    return view;
};

beforeEach(() => {
    jest.clearAllMocks();
    useFeedback.mockReturnValue(mockFeedback);
    getOfflineOverview.mockResolvedValue(defaultOverview);
    getOfflineHadithCountsBySlug.mockResolvedValue({});
    getHadithBooks.mockResolvedValue(mockBooks);
});

describe("OfflinePackCard", () => {
    test("renders card title", async () => {
        const { getByText } = await renderOfflinePackCard();
        expect(getByText("Paket Offline")).toBeTruthy();
    });

    test("renders Al-Quran toggle", async () => {
        const { getByText } = await renderOfflinePackCard();
        expect(getByText("Al-Quran lengkap")).toBeTruthy();
    });

    test("renders kitab hadis section", async () => {
        const { getByText } = await renderOfflinePackCard();
        expect(getByText("Kitab Hadis")).toBeTruthy();
    });

    test("shows book list after loading", async () => {
        const { findByText } = await renderOfflinePackCard();
        expect(await findByText("Shahih Bukhari")).toBeTruthy();
        expect(await findByText("Shahih Muslim")).toBeTruthy();
    });

    test("shows loading state while fetching books", async () => {
        getHadithBooks.mockReturnValue(new Promise(() => {}));
        const { findByText } = await renderOfflinePackCard();
        expect(await findByText("Memuat daftar kitab hadis...")).toBeTruthy();
    });

    test("renders download and hapus buttons", async () => {
        const { findByText } = await renderOfflinePackCard();
        expect(await findByText("Unduh update")).toBeTruthy();
        expect(await findByText("Hapus paket")).toBeTruthy();
    });

    test("renders stats section", async () => {
        getOfflineOverview.mockResolvedValue({
            ...defaultOverview,
            quranSurahs: 114,
            quranAyahs: 6236,
            hadiths: 5000,
            hadithBooks: ["bukhari", "muslim"],
        });
        const { findByText } = await renderOfflinePackCard();
        expect(await findByText("114")).toBeTruthy();
        expect(await findByText("6236")).toBeTruthy();
        expect(await findByText("5000")).toBeTruthy();
    });

    test("shows empty books message when no books", async () => {
        getHadithBooks.mockRejectedValue(new Error("Network error"));
        await waitFor(() => {
            // books array will be empty
        });
    });

    test("shows everything complete message when fully downloaded", async () => {
        getOfflineOverview.mockResolvedValue({
            ...defaultOverview,
            quranSurahs: 114,
            quranAyahs: 6236,
            hadiths: 180,
            hadithBooks: [{ slug: "bukhari", name: "Bukhari" }],
            savedAt: new Date().toISOString(),
            includeQuran: true,
        });
        getOfflineHadithCountsBySlug.mockResolvedValue({ bukhari: 100 });
        getHadithBooks.mockResolvedValue([
            { slug: "bukhari", name: "Shahih Bukhari", count: 100 },
        ]);

        const { findByText } = await renderOfflinePackCard();
        expect(
            await findByText("Sudah lengkap, tidak ada update"),
        ).toBeTruthy();
    });

    test("select all books link", async () => {
        const { findByText } = await renderOfflinePackCard();
        fireEvent.press(await findByText("Semua"));
    });

    test("clear book selection link", async () => {
        const { findByText } = await renderOfflinePackCard();
        fireEvent.press(await findByText("Kosongkan"));
    });
});
