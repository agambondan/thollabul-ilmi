import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login, logout, refreshSession } from '../api/auth';
import { clearSession, readSession, saveSession } from '../storage/session';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const persist = useCallback(async (nextSession) => {
    if (!nextSession?.token) {
      await clearSession();
      setSession(null);
      return null;
    }

    await saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    setError('');

    const stored = await readSession();
    if (!stored?.token) {
      setSession(null);
      setLoading(false);
      return null;
    }

    setSession(stored);
    try {
      const user = await getMe();
      const next = { ...stored, user };
      await persist(next);
      return next;
    } catch {
      if (!stored.refreshToken) {
        await persist(null);
        setError('Sesi kamu sudah berakhir. Masuk lagi dari tab Profil.');
        setLoading(false);
        return null;
      }

      try {
        const refreshed = await refreshSession(stored.refreshToken);
        const next = {
          ...stored,
          ...refreshed,
          refreshToken: refreshed.refreshToken || stored.refreshToken,
          user: refreshed.user || stored.user,
        };
        await persist(next);
        return next;
      } catch {
        await persist(null);
        setError('Sesi kamu sudah berakhir. Masuk lagi dari tab Profil.');
        return null;
      } finally {
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const signIn = useCallback(
    async ({ email, password }) => {
      setLoading(true);
      setError('');

      try {
        const next = await login({ email, password });
        await persist(next);
        return next;
      } catch (err) {
        setError(err?.message ?? 'Belum bisa masuk akun.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (session?.refreshToken) {
        await logout(session.refreshToken);
      }
    } catch {
      // Local session cleanup should still happen when the network request fails.
    } finally {
      await persist(null);
      setLoading(false);
    }
  }, [persist, session?.refreshToken]);

  const updateCurrentUser = useCallback(
    async (nextUser) => {
      if (!session?.token || !nextUser) return null;
      const next = { ...session, user: { ...(session.user ?? {}), ...nextUser } };
      await persist(next);
      return next;
    },
    [persist, session],
  );

  useEffect(() => {
    restore();
  }, [restore]);

  const value = useMemo(
    () => ({
      error,
      loading,
      refresh: restore,
      session,
      signIn,
      signOut,
      updateCurrentUser,
      user: session?.user ?? null,
    }),
    [error, loading, restore, session, signIn, signOut, updateCurrentUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }

  return context;
};
