import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';

export const layoutModes = {
  classic: 'classic',
  webApp: 'web_app',
};

export const defaultLayoutMode = layoutModes.webApp;
const validLayoutModes = new Set(Object.values(layoutModes));

export const normalizeLayoutMode = (value) => (
  validLayoutModes.has(value) ? value : layoutModes.classic
);

export const readStoredLayoutMode = async () => normalizeLayoutMode(
  await readPreference(preferenceKeys.appLayoutMode, defaultLayoutMode),
);

export const writeStoredLayoutMode = async (nextMode) => {
  const normalized = normalizeLayoutMode(nextMode);
  await writePreference(preferenceKeys.appLayoutMode, normalized);
  return normalized;
};

const defaultContext = {
  isLoading: false,
  isWebAppLayout: true,
  layoutMode: defaultLayoutMode,
  refreshLayoutMode: readStoredLayoutMode,
  setLayoutMode: writeStoredLayoutMode,
};

const LayoutModeContext = createContext(defaultContext);

export function LayoutModeProvider({ children }) {
  const [layoutMode, setLayoutModeState] = useState(defaultLayoutMode);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLayoutMode = useCallback(async () => {
    const nextMode = await readStoredLayoutMode();
    setLayoutModeState(nextMode);
    setIsLoading(false);
    return nextMode;
  }, []);

  useEffect(() => {
    let mounted = true;

    readStoredLayoutMode()
      .then((nextMode) => {
        if (!mounted) return;
        setLayoutModeState(nextMode);
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

  const value = useMemo(() => ({
    isLoading,
    isWebAppLayout: layoutMode === layoutModes.webApp,
    layoutMode,
    refreshLayoutMode,
    setLayoutMode,
  }), [isLoading, layoutMode, refreshLayoutMode, setLayoutMode]);

  return (
    <LayoutModeContext.Provider value={value}>
      {children}
    </LayoutModeContext.Provider>
  );
}

export const useLayoutMode = () => useContext(LayoutModeContext);
