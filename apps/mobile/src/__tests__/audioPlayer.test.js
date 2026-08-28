import { Platform } from "react-native";
import { playAudioUrl, stopAudio } from "../utils/audioPlayer";

let statusCallback;

const mockPlayer = {
    play: jest.fn(async () => {}),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
    setPlaybackRate: jest.fn(),
    addListener: jest.fn((event, cb) => {
        statusCallback = cb;
        return { remove: jest.fn() };
    }),
};

const mockExpoAudio = {
    createAudioPlayer: jest.fn(() => mockPlayer),
};

jest.mock("expo-audio", () => mockExpoAudio, { virtual: false });

beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
});

describe("playAudioUrl", () => {
    test("returns false for null URL", async () => {
        expect(await playAudioUrl(null)).toBe(false);
    });

    test("returns false for undefined URL", async () => {
        expect(await playAudioUrl(undefined)).toBe(false);
    });

    test("returns false for empty string URL", async () => {
        expect(await playAudioUrl("")).toBe(false);
    });

    test("creates audio player and plays on native", async () => {
        const result = await playAudioUrl("https://example.com/audio.mp3");
        expect(result).toBe(true);
        expect(mockExpoAudio.createAudioPlayer).toHaveBeenCalledWith(
            "https://example.com/audio.mp3",
        );
        expect(mockPlayer.addListener).toHaveBeenCalled();
        expect(mockPlayer.play).toHaveBeenCalled();
    });

    test("applies playback rate on native", async () => {
        const result = await playAudioUrl("https://example.com/audio.mp3", {
            rate: 1.5,
        });
        expect(result).toBe(true);
        expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(1.5);
    });

    test("calls onEnded when audio finishes on native", async () => {
        const onEnded = jest.fn();

        await playAudioUrl("https://example.com/audio.mp3", { onEnded });
        expect(onEnded).not.toHaveBeenCalled();

        statusCallback({ didJustFinish: true });
        expect(onEnded).toHaveBeenCalled();
    });

    test("uses Web Audio API on web", async () => {
        Platform.OS = "web";
        delete global.Audio;
        const mockWebAudio = {
            play: jest.fn(async () => {}),
            onended: null,
            playbackRate: 1,
        };
        global.Audio = jest.fn(() => mockWebAudio);

        const result = await playAudioUrl("https://example.com/audio.mp3", {
            rate: 1.25,
        });
        expect(result).toBe(true);
        expect(mockWebAudio.playbackRate).toBe(1.25);

        const onEnded = jest.fn();
        mockWebAudio.onended();
        expect(mockWebAudio.onended).toBeDefined();
    });
});

describe("stopAudio", () => {
    test("does not throw when no player exists", () => {
        expect(() => stopAudio()).not.toThrow();
    });

    test("calls pause, seekTo, and remove on player", async () => {
        Platform.OS = "web";
        delete global.Audio;
        global.Audio = jest.fn(() => ({
            play: jest.fn(async () => {}),
            pause: jest.fn(),
            seekTo: jest.fn(),
            remove: jest.fn(),
        }));

        await playAudioUrl("https://example.com/audio.mp3");
        const player = global.Audio.mock.results[0].value;

        stopAudio();
    });
});
