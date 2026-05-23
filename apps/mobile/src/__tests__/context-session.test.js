import React from 'react';
import { render, act, renderHook, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { flushAsyncWork } from '../test-utils/async';

jest.mock('../api/auth', () => ({
  getMe: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshSession: jest.fn(),
}));

jest.mock('../storage/session', () => ({
  clearSession: jest.fn(() => Promise.resolve()),
  readSession: jest.fn(() => Promise.resolve(null)),
  saveSession: jest.fn(() => Promise.resolve()),
}));

import { SessionProvider, useSession } from '../context/SessionContext';
import * as auth from '../api/auth';
import * as session from '../storage/session';

function TestConsumer({ onReady }) {
  const ctx = useSession();
  React.useEffect(() => { onReady?.(ctx); }, [ctx, onReady]);
  return <Text>{ctx.loading ? 'loading' : ctx.user?.name ?? 'no-user'}</Text>;
}

function renderWithSession(ui) {
  return render(<SessionProvider>{ui}</SessionProvider>);
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('SessionProvider', () => {
  test('wraps children', async () => {
    const { getByText } = render(
      <SessionProvider>
        <Text>hello</Text>
      </SessionProvider>,
    );
    await flushAsyncWork();
    expect(getByText('hello')).toBeTruthy();
  });

  test('starts in loading state then resolves to no session', async () => {
    session.readSession.mockResolvedValue(null);
    const { getByText } = renderWithSession(<TestConsumer />);
    expect(getByText('loading')).toBeTruthy();
    await waitFor(() => expect(getByText('no-user')).toBeTruthy());
  });

  test('restores stored session on mount', async () => {
    session.readSession.mockResolvedValue({ token: 'tok', refreshToken: 'rt', user: { name: 'Ali' } });
    auth.getMe.mockResolvedValue({ name: 'Ali' });

    const { getByText } = renderWithSession(<TestConsumer />);

    await waitFor(() => expect(getByText('Ali')).toBeTruthy());
    expect(session.saveSession).toHaveBeenCalled();
  });

  test('restore falls back to refresh when getMe fails', async () => {
    session.readSession.mockResolvedValue({ token: 'tok', refreshToken: 'rt' });
    auth.getMe.mockRejectedValue(new Error('expired'));
    auth.refreshSession.mockResolvedValue({ token: 'new-tok', refreshToken: 'new-rt', user: { name: 'Budi' } });

    const { getByText } = renderWithSession(<TestConsumer />);

    await waitFor(() => expect(getByText('Budi')).toBeTruthy());
    expect(auth.refreshSession).toHaveBeenCalledWith('rt');
  });

  test('restore clears session when getMe and refresh both fail', async () => {
    session.readSession.mockResolvedValue({ token: 'tok', refreshToken: 'rt' });
    auth.getMe.mockRejectedValue(new Error('expired'));
    auth.refreshSession.mockRejectedValue(new Error('also expired'));

    renderWithSession(<TestConsumer />);

    await waitFor(() => expect(session.clearSession).toHaveBeenCalled());
  });
});

describe('useSession', () => {
  test('signIn calls login and updates session', async () => {
    session.readSession.mockResolvedValue(null);
    auth.login.mockResolvedValue({ token: 'login-tok', refreshToken: 'login-rt', user: { name: 'Citra' } });

    let ctx;
    function Capture() {
      ctx = useSession();
      return null;
    }

    renderWithSession(<Capture />);
    await waitFor(() => expect(ctx).toBeDefined());

    await act(async () => {
      await ctx.signIn({ email: 'a@b.com', password: 'secret' });
    });

    expect(auth.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
    expect(ctx.session).toEqual({ token: 'login-tok', refreshToken: 'login-rt', user: { name: 'Citra' } });
    expect(ctx.user).toEqual({ name: 'Citra' });
  });

  test('signIn sets error on failure', async () => {
    session.readSession.mockResolvedValue(null);
    auth.login.mockRejectedValue(new Error('Invalid credentials'));

    let ctx;
    function Capture() {
      ctx = useSession();
      return null;
    }

    renderWithSession(<Capture />);
    await waitFor(() => expect(ctx).toBeDefined());

    await act(async () => {
      try { await ctx.signIn({ email: 'a@b.com', password: 'wrong' }); } catch {}
    });

    expect(ctx.error).toBe('Invalid credentials');
  });

  test('signOut calls logout and clears session', async () => {
    session.readSession.mockResolvedValue(null);
    auth.login.mockResolvedValue({ token: 'tok', refreshToken: 'rt', user: { name: 'Dewi' } });

    let ctx;
    function Capture() {
      ctx = useSession();
      return null;
    }

    renderWithSession(<Capture />);
    await waitFor(() => expect(ctx).toBeDefined());
    await act(async () => { await ctx.signIn({ email: 'a@b.com', password: 'x' }); });
    await act(async () => { await ctx.signOut(); });

    expect(auth.logout).toHaveBeenCalledWith('rt');
    expect(ctx.session).toBeNull();
    expect(ctx.user).toBeNull();
  });

  test('updateCurrentUser persists merged user data', async () => {
    session.readSession.mockResolvedValue(null);
    auth.login.mockResolvedValue({ token: 'tok', refreshToken: 'rt', user: { name: 'Dewi', preferred_lang: 'idn' } });

    let ctx;
    function Capture() {
      ctx = useSession();
      return null;
    }

    renderWithSession(<Capture />);
    await waitFor(() => expect(ctx).toBeDefined());
    await act(async () => { await ctx.signIn({ email: 'a@b.com', password: 'x' }); });
    await act(async () => { await ctx.updateCurrentUser({ preferred_lang: 'en' }); });

    expect(session.saveSession).toHaveBeenLastCalledWith({
      token: 'tok',
      refreshToken: 'rt',
      user: { name: 'Dewi', preferred_lang: 'en' },
    });
    expect(ctx.user).toEqual({ name: 'Dewi', preferred_lang: 'en' });
  });

  test('throws when used outside SessionProvider', () => {
    expect(() => renderHook(() => useSession())).toThrow('useSession must be used inside SessionProvider');
  });
});
