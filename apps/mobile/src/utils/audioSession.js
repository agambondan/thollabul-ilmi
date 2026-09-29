import { stopAudio } from "./audioPlayer";

let activeSource = null;
let activeStopFn = null;

export const AudioSource = {
    QURAN: "quran",
    ADZAN: "adzan",
    RADIO: "radio",
    KAJIAN: "kajian",
    LESSON: "lesson",
};

export function registerAudioSource(source, stopFn) {
    if (activeSource && activeSource !== source && activeStopFn) {
        activeStopFn();
    }
    activeSource = source;
    activeStopFn = stopFn;
}

export function unregisterAudioSource(source) {
    if (activeSource === source) {
        activeSource = null;
        activeStopFn = null;
    }
}

export function stopAllAudio() {
    stopAudio();
    activeSource = null;
    activeStopFn = null;
}

export function getActiveSource() {
    return activeSource;
}