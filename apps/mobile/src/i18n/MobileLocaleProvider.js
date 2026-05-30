import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import {
  defaultMobileLanguage,
  normalizeMobileLanguage,
  translateMobile,
} from './translations';

const defaultContext = {
  isLoading: false,
  language: defaultMobileLanguage,
  refreshLanguage: async () => defaultMobileLanguage,
  setLanguage: async (nextLanguage) => normalizeMobileLanguage(nextLanguage),
  t: (key, values) => translateMobile(defaultMobileLanguage, key, values),
};

const MobileLocaleContext = createContext(defaultContext);

export const readStoredMobileLanguage = async (fallback = defaultMobileLanguage) => normalizeMobileLanguage(
  await readPreference(preferenceKeys.appLanguage, normalizeMobileLanguage(fallback)),
);

export const writeStoredMobileLanguage = async (nextLanguage) => {
  const normalized = normalizeMobileLanguage(nextLanguage);
  await writePreference(preferenceKeys.appLanguage, normalized);
  return normalized;
};

export function MobileLocaleProvider({ children }) {
  const { user } = useSession();
  const userLanguage = normalizeMobileLanguage(user?.preferred_lang);
  const [language, setLanguageState] = useState(userLanguage);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLanguage = useCallback(async () => {
    const storedLanguage = await readStoredMobileLanguage(userLanguage);
    const nextLanguage = normalizeMobileLanguage(user?.preferred_lang ?? storedLanguage);
    setLanguageState(nextLanguage);
    setIsLoading(false);
    return nextLanguage;
  }, [user?.preferred_lang, userLanguage]);

  useEffect(() => {
    let mounted = true;

    readStoredMobileLanguage(userLanguage)
      .then((storedLanguage) => {
        if (!mounted) return;
        setLanguageState(normalizeMobileLanguage(user?.preferred_lang ?? storedLanguage));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.preferred_lang, userLanguage]);

  const setLanguage = useCallback(async (nextLanguage) => {
    const normalized = await writeStoredMobileLanguage(nextLanguage);
    setLanguageState(normalized);
    return normalized;
  }, []);

  const t = useCallback(
    (key, values) => translateMobile(language, key, values),
    [language],
  );

  const value = useMemo(() => ({
    isLoading,
    language,
    refreshLanguage,
    setLanguage,
    t,
  }), [isLoading, language, refreshLanguage, setLanguage, t]);

  return (
    <MobileLocaleContext.Provider value={value}>
      {children}
    </MobileLocaleContext.Provider>
  );
}

export const useMobileLocale = () => useContext(MobileLocaleContext);
