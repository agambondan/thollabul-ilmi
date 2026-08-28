jest.mock("../context/SessionContext", () => ({
    useSession: jest.fn(),
}));

jest.mock("../context/FeedbackContext", () => ({
    useFeedback: jest.fn(),
}));

jest.mock("../api/personal", () => ({
    getNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
}));

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NotesPanel } from "../components/NotesPanel";
import { flushAsyncWork } from "../test-utils/async";

const { useSession } = require("../context/SessionContext");
const { useFeedback } = require("../context/FeedbackContext");
const {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
} = require("../api/personal");

const mockFeedback = {
    showError: jest.fn(),
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
};

const renderNotesPanel = async (props = {}) => {
    const view = render(<NotesPanel refType='quran' refId='1' {...props} />);
    await flushAsyncWork();
    return view;
};

beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({ user: { id: 1, name: "Test" } });
    useFeedback.mockReturnValue(mockFeedback);
    getNotes.mockResolvedValue([]);
});

describe("NotesPanel", () => {
    test("shows login prompt when no user", () => {
        useSession.mockReturnValue({ user: null });
        const { getByText } = render(<NotesPanel refType='quran' refId='1' />);
        expect(
            getByText("Masuk dari tab Profil untuk menulis catatan personal."),
        ).toBeTruthy();
    });

    test("renders input and submit button after load", async () => {
        const { findByPlaceholderText, findByText } = await renderNotesPanel();
        expect(
            await findByPlaceholderText("Tulis catatan personal..."),
        ).toBeTruthy();
        expect(await findByText("Simpan catatan")).toBeTruthy();
    });

    test("loads and displays notes", async () => {
        const mockNotes = [
            { id: "1", content: "Catatan pertama" },
            { id: "2", content: "Catatan kedua" },
        ];
        getNotes.mockResolvedValue(mockNotes);
        const { findByText } = await renderNotesPanel();
        expect(await findByText("Catatan pertama")).toBeTruthy();
        expect(await findByText("Catatan kedua")).toBeTruthy();
    });

    test("creates a note on submit", async () => {
        const createdNote = { id: "3", content: "Catatan baru" };
        createNote.mockResolvedValue(createdNote);
        const { findByPlaceholderText, findByText } = await renderNotesPanel();
        const input = await findByPlaceholderText("Tulis catatan personal...");
        fireEvent.changeText(input, "Catatan baru");
        const saveButton = await findByText("Simpan catatan");
        fireEvent.press(saveButton);
        await waitFor(() => {
            expect(createNote).toHaveBeenCalledWith({
                refType: "quran",
                refId: "1",
                content: "Catatan baru",
            });
        });
    });

    test("shows show-all button when more than 5 notes", async () => {
        const manyNotes = Array.from({ length: 7 }, (_, i) => ({
            id: String(i + 1),
            content: `Note ${i + 1}`,
        }));
        getNotes.mockResolvedValue(manyNotes);
        const { findByText } = await renderNotesPanel();
        expect(await findByText(/Lihat semua/)).toBeTruthy();
    });

    test("shows edit and delete buttons for each note", async () => {
        getNotes.mockResolvedValue([{ id: "1", content: "Test note" }]);
        const { findByText } = await renderNotesPanel();
        expect(await findByText("Ubah")).toBeTruthy();
        expect(await findByText("Hapus")).toBeTruthy();
    });

    test("calls getNotes with correct params", async () => {
        await renderNotesPanel({ refType: "hadith", refId: "42" });
        expect(getNotes).toHaveBeenCalledWith({
            refType: "hadith",
            refId: "42",
        });
    });
});
