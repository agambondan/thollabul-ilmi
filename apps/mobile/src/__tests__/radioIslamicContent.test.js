jest.mock("../api/client", () => ({
    getRadioIslamicStations: jest.fn(),
}));

jest.mock("../utils/audioPlayer", () => ({
    playAudioUrl: jest.fn().mockResolvedValue(true),
    stopAudio: jest.fn(),
}));

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { RadioIslamicContent } from "../screens/RadioIslamicContent";

const client = require("../api/client");
const audioPlayer = require("../utils/audioPlayer");

const radioItems = [
    {
        id: 1,
        name: "Radio Rodja",
        frequency: "756 AM",
        city: "Bogor",
        stream_url: "https://live.radiorodja.com/",
    },
    {
        id: 2,
        name: "Radio Tanpa Stream",
        frequency: "88.0 FM",
        city: "Bandung",
        stream_url: "",
    },
];

beforeEach(() => {
    jest.clearAllMocks();
    client.getRadioIslamicStations.mockResolvedValue(radioItems);
    audioPlayer.playAudioUrl.mockResolvedValue(true);
});

describe("RadioIslamicContent", () => {
    test("loads and renders the radio list", async () => {
        const { getByText } = render(<RadioIslamicContent />);

        await waitFor(() => {
            expect(getByText("Radio Rodja")).toBeTruthy();
            expect(getByText("Radio Tanpa Stream")).toBeTruthy();
        });
        expect(client.getRadioIslamicStations).toHaveBeenCalledWith({
            page: "1",
            size: "50",
        });
    });

    test("filters by search text", async () => {
        const { getByPlaceholderText, getByText } = render(
            <RadioIslamicContent />,
        );

        await waitFor(() => expect(getByText("Radio Rodja")).toBeTruthy());

        fireEvent.changeText(
            getByPlaceholderText("Cari nama radio, frekuensi, atau kota..."),
            "rodja",
        );

        await waitFor(() => {
            expect(client.getRadioIslamicStations).toHaveBeenLastCalledWith({
                page: "1",
                size: "50",
                q: "rodja",
            });
        });
    });

    test("plays a station stream when tapped, then pauses on second tap", async () => {
        const { getByLabelText, getByText } = render(<RadioIslamicContent />);

        await waitFor(() => expect(getByText("Radio Rodja")).toBeTruthy());

        fireEvent.press(getByLabelText("Putar Radio Rodja"));

        await waitFor(() => {
            expect(audioPlayer.playAudioUrl).toHaveBeenCalledWith(
                "https://live.radiorodja.com/",
                expect.objectContaining({ onEnded: expect.any(Function) }),
            );
        });

        await waitFor(() =>
            expect(getByLabelText("Jeda Radio Rodja")).toBeTruthy(),
        );
        fireEvent.press(getByLabelText("Jeda Radio Rodja"));

        expect(audioPlayer.stopAudio).toHaveBeenCalled();
        await waitFor(() =>
            expect(getByLabelText("Putar Radio Rodja")).toBeTruthy(),
        );
    });

    test("stops audio on unmount", async () => {
        const { getByText, unmount } = render(<RadioIslamicContent />);
        await waitFor(() => expect(getByText("Radio Rodja")).toBeTruthy());

        unmount();

        expect(audioPlayer.stopAudio).toHaveBeenCalled();
    });

    test("shows a notice when no station in the list has a live stream", async () => {
        client.getRadioIslamicStations.mockResolvedValue([radioItems[1]]);
        const { getByText } = render(<RadioIslamicContent />);

        await waitFor(() => {
            expect(
                getByText("Belum ada siaran online untuk daftar ini."),
            ).toBeTruthy();
        });
    });
});
