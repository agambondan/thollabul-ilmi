import { Platform } from "react-native";

let nativeAudio;
let player;
let statusSubscription;

const normalizePlaybackRate = (rate) => {
    const numeric = Number(rate);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(0.5, Math.min(2, numeric));
};

const cleanupStatusSubscription = () => {
    statusSubscription?.remove?.();
    statusSubscription = null;
};

const getNativeAudio = () => {
    if (Platform.OS === "web") return null;
    if (!nativeAudio) {
        nativeAudio = require("expo-audio");
    }
    return nativeAudio;
};

export const stopAudio = () => {
    cleanupStatusSubscription();
    if (!player) return;

    try {
        player.pause?.();
        player.seekTo?.(0);
        player.remove?.();
    } catch {
        // Playback cleanup should never block reader UI.
    }

    player = null;
};

export const playAudioUrl = async (url, { onEnded, rate = 1 } = {}) => {
    if (!url) return false;
    stopAudio();
    const playbackRate = normalizePlaybackRate(rate);

    if (Platform.OS === "web") {
        player = new Audio(url);
        player.playbackRate = playbackRate;
        player.onended = () => {
            player = null;
            onEnded?.();
        };
        await player.play();
        return true;
    }

    const nativeAudioModule = getNativeAudio();
    player = nativeAudioModule.createAudioPlayer(url);
    if (typeof player.setPlaybackRate === "function") {
        player.setPlaybackRate(playbackRate);
    } else if ("playbackRate" in player) {
        player.playbackRate = playbackRate;
    }
    statusSubscription = player.addListener?.(
        "playbackStatusUpdate",
        (status) => {
            if (status?.didJustFinish) {
                stopAudio();
                onEnded?.();
            }
        },
    );
    player.play();
    return true;
};
