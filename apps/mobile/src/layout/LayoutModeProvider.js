import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useColorScheme } from "react-native";
import {
    preferenceKeys,
    readPreference,
    writePreference,
} from "../storage/preferences";

export const layoutModes = {
    classic: "classic",
    webApp: "web_app",
};

export const defaultLayoutMode = layoutModes.webApp;
const validLayoutModes = new Set(Object.values(layoutModes));

export const appThemes = {
    system: "system",
    light: "light",
    dark: "dark",
};

export const defaultThemePreference = appThemes.system;
const validAppThemes = new Set(Object.values(appThemes));

export const normalizeLayoutMode = (value) =>
    validLayoutModes.has(value) ? value : layoutModes.classic;

export const normalizeThemePreference = (value) =>
    validAppThemes.has(value) ? value : defaultThemePreference;

export const readStoredLayoutMode = async () =>
    normalizeLayoutMode(
        await readPreference(preferenceKeys.appLayoutMode, defaultLayoutMode),
    );

export const readStoredThemePreference = async () =>
    normalizeThemePreference(
        await readPreference(preferenceKeys.appTheme, defaultThemePreference),
    );

export const writeStoredLayoutMode = async (nextMode) => {
    const normalized = normalizeLayoutMode(nextMode);
    await writePreference(preferenceKeys.appLayoutMode, normalized);
    return normalized;
};

export const writeStoredThemePreference = async (nextTheme) => {
    const normalized = normalizeThemePreference(nextTheme);
    await writePreference(preferenceKeys.appTheme, normalized);
    return normalized;
};

const defaultContext = {
    isLoading: false,
    isDarkTheme: false,
    isWebAppLayout: true,
    layoutMode: defaultLayoutMode,
    resolvedTheme: appThemes.light,
    refreshLayoutMode: readStoredLayoutMode,
    refreshThemePreference: readStoredThemePreference,
    setLayoutMode: writeStoredLayoutMode,
    setThemePreference: writeStoredThemePreference,
    themePreference: defaultThemePreference,
};

const LayoutModeContext = createContext(defaultContext);

export function LayoutModeProvider({ children }) {
    const [layoutMode, setLayoutModeState] = useState(defaultLayoutMode);
    const [themePreference, setThemePreferenceState] = useState(
        defaultThemePreference,
    );
    const [isLoading, setIsLoading] = useState(true);
    const systemColorScheme = useColorScheme();

    const refreshLayoutMode = useCallback(async () => {
        const nextMode = await readStoredLayoutMode();
        setLayoutModeState(nextMode);
        setIsLoading(false);
        return nextMode;
    }, []);

    const refreshThemePreference = useCallback(async () => {
        const nextTheme = await readStoredThemePreference();
        setThemePreferenceState(nextTheme);
        setIsLoading(false);
        return nextTheme;
    }, []);

    useEffect(() => {
        let mounted = true;

        Promise.all([readStoredLayoutMode(), readStoredThemePreference()])
            .then(([nextMode, nextTheme]) => {
                if (!mounted) return;
                setLayoutModeState(nextMode);
                setThemePreferenceState(nextTheme);
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const setLayoutMode = useCallback(async (nextMode) => {
        const normalized = await writeStoredLayoutMode(nextMode);
        setLayoutModeState(normalized);
        return normalized;
    }, []);

    const setThemePreference = useCallback(async (nextTheme) => {
        const normalized = await writeStoredThemePreference(nextTheme);
        setThemePreferenceState(normalized);
        return normalized;
    }, []);

    const resolvedTheme =
        themePreference === appThemes.system
            ? systemColorScheme === appThemes.dark
                ? appThemes.dark
                : appThemes.light
            : themePreference;
    const isDarkTheme = resolvedTheme === appThemes.dark;

    const value = useMemo(
        () => ({
            isDarkTheme,
            isLoading,
            isWebAppLayout: layoutMode === layoutModes.webApp,
            layoutMode,
            refreshThemePreference,
            refreshLayoutMode,
            resolvedTheme,
            setLayoutMode,
            setThemePreference,
            themePreference,
        }),
        [
            isDarkTheme,
            isLoading,
            layoutMode,
            refreshLayoutMode,
            refreshThemePreference,
            resolvedTheme,
            setLayoutMode,
            setThemePreference,
            themePreference,
        ],
    );

    return (
        <LayoutModeContext.Provider value={value}>
            {children}
        </LayoutModeContext.Provider>
    );
}

export const useLayoutMode = () => useContext(LayoutModeContext);
