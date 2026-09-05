export const OPEN_SURAH_AUDIO_EVENT = "tholabul:open-surah-audio";

export const openSurahAudio = ({ surahNumber, ayahNumber } = {}) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent(OPEN_SURAH_AUDIO_EVENT, {
            detail: { surahNumber, ayahNumber },
        }),
    );
};
