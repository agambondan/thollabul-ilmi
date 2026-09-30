import { createContext, useContext, useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

const MissingInsetsContext = createContext(null);

export const getKeyboardInset = (event, bottomInset = 0) => {
    const height = Number(event?.endCoordinates?.height);
    if (!Number.isFinite(height) || height <= 0) return 0;
    const inset = Number(bottomInset);
    return height + (Number.isFinite(inset) && inset > 0 ? inset : 0);
};

export function useKeyboardInset() {
    const insets = useContext(SafeAreaInsetsContext ?? MissingInsetsContext);
    const bottomInset = insets?.bottom ?? 0;
    const [keyboardEvent, setKeyboardEvent] = useState(null);

    useEffect(() => {
        if (Platform.OS !== "android") return undefined;

        const showSubscription = Keyboard.addListener(
            "keyboardDidShow",
            (event) => setKeyboardEvent(event ?? null),
        );
        const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
            setKeyboardEvent(null),
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return getKeyboardInset(keyboardEvent, bottomInset);
}
