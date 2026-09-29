import {
    AudioSource,
    getActiveSource,
    registerAudioSource,
    stopAllAudio,
    unregisterAudioSource,
} from "../utils/audioSession";
import { stopAudio } from "../utils/audioPlayer";

jest.mock("../utils/audioPlayer", () => ({
    stopAudio: jest.fn(),
}));

describe("audioSession", () => {
    beforeEach(() => {
        stopAllAudio();
        jest.clearAllMocks();
    });

    test("registers an audio source and cleans up previous source", () => {
        const stopQuran = jest.fn();
        const stopAdzan = jest.fn();

        registerAudioSource(AudioSource.QURAN, stopQuran);
        expect(getActiveSource()).toBe(AudioSource.QURAN);

        registerAudioSource(AudioSource.ADZAN, stopAdzan);
        expect(stopQuran).toHaveBeenCalledTimes(1);
        expect(getActiveSource()).toBe(AudioSource.ADZAN);
    });

    test("unregisters active audio source", () => {
        registerAudioSource(AudioSource.RADIO, () => {});
        expect(getActiveSource()).toBe(AudioSource.RADIO);

        unregisterAudioSource(AudioSource.RADIO);
        expect(getActiveSource()).toBeNull();
    });

    test("stopAllAudio triggers player stop and clears active source", () => {
        registerAudioSource(AudioSource.KAJIAN, () => {});
        expect(getActiveSource()).toBe(AudioSource.KAJIAN);

        stopAllAudio();
        expect(stopAudio).toHaveBeenCalled();
        expect(getActiveSource()).toBeNull();
    });
});