import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { StatusBar, Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TabActivityProvider } from '../context/TabActivityContext';
import { LayoutModeProvider } from '../layout/LayoutModeProvider';
import { MobileAppShell } from '../layout/MobileAppShell';
import { getWebAppAccountLabel } from '../layout/WebAppShell';
import { useSession } from '../context/SessionContext';

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaView: ({ children, testID }) => {
      const { View } = require('react-native');
      return <View testID={testID}>{children}</View>;
    },
    useSafeAreaInsets: () => inset,
  };
});

jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

const setBarStyleSpy = jest.spyOn(StatusBar, 'setBarStyle').mockImplementation(() => {});

function renderShell(props = {}) {
  const onOpenProfile = props.onOpenProfile ?? jest.fn();
  const onTabChange = props.onTabChange ?? jest.fn();

  return render(
    <TabActivityProvider>
      <LayoutModeProvider>
        <MobileAppShell
          activeTab={props.activeTab ?? 'home'}
          keyboardVisible={props.keyboardVisible ?? false}
          onOpenProfile={onOpenProfile}
          onTabChange={onTabChange}
        >
          <Text>Shell content</Text>
        </MobileAppShell>
      </LayoutModeProvider>
    </TabActivityProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useSession.mockReturnValue({ loading: false, signOut: jest.fn(), user: null });
});

describe('MobileAppShell', () => {
  test('uses classic shell by default', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const { getByText, getByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('classic-app-shell')).toBeTruthy());
    expect(getByText('Shell content')).toBeTruthy();
    expect(getByText('Beranda')).toBeTruthy();
  });

  test('falls back to classic shell when stored layout mode is invalid', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"unexpected"');
    const { getByText, getByTestId, queryByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('classic-app-shell')).toBeTruthy());
    expect(getByText('Shell content')).toBeTruthy();
    expect(queryByTestId('web-app-shell')).toBeNull();
  });

  test('uses web app shell chrome when stored mode is web_app', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByText, getByTestId, queryByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(getByText('Shell content')).toBeTruthy();
    expect(getByTestId('mobile-top-header')).toBeTruthy();
    expect(getByTestId('mobile-bottom-nav')).toBeTruthy();
    expect(queryByTestId('classic-app-shell')).toBeNull();
    expect(getByText("Thullaabul 'Ilmi")).toBeTruthy();
    expect(getByText('T')).toBeTruthy();
    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Al-Quran')).toBeTruthy();
    expect(getByText('Hadith')).toBeTruthy();
    expect(getByText('Cari')).toBeTruthy();
    expect(getByText('Menu')).toBeTruthy();
    expect(setBarStyleSpy).toHaveBeenCalledWith('light-content');
  });

  test('uses logged-in user initial in web app shell header', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    useSession.mockReturnValue({ user: { name: 'Budi', email: 'budi@example.com' } });
    const { getByText, getByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(getByText('B')).toBeTruthy();
  });

  test('opens and closes account menu from web app header account control', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    useSession.mockReturnValue({
      loading: false,
      signOut: jest.fn(),
      user: { name: 'Admin', email: 'admin@tholabul-ilmi.com' },
    });
    const { getByText, getByTestId, queryByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(queryByTestId('mobile-account-menu')).toBeNull();

    fireEvent.press(getByTestId('mobile-top-header-profile'));

    expect(getByTestId('mobile-account-menu')).toBeTruthy();
    expect(getByTestId('mobile-account-menu-card').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ alignSelf: 'flex-end' }), { marginTop: 56 }]),
    );
    expect(getByText('Profil')).toBeTruthy();
    expect(getByText('Bookmark')).toBeTruthy();
    expect(getByText('Gelap')).toBeTruthy();

    fireEvent.press(getByTestId('mobile-account-menu-close'));
    expect(queryByTestId('mobile-account-menu')).toBeNull();
  });

  test('routes account menu profile and sign out actions', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onOpenProfile = jest.fn();
    const signOut = jest.fn();
    useSession.mockReturnValue({
      loading: false,
      signOut,
      user: { name: 'Admin', email: 'admin@tholabul-ilmi.com' },
    });
    const { getByTestId } = renderShell({ onOpenProfile });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByTestId('mobile-top-header-profile'));
    fireEvent.press(getByTestId('mobile-account-menu-item-profile'));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('mobile-top-header-profile'));
    fireEvent.press(getByTestId('mobile-account-menu-sign-out'));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  test('opens and closes web app secondary menu sheet', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByLabelText, getByText, getByTestId, queryByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(queryByTestId('mobile-menu-sheet')).toBeNull();

    fireEvent.press(getByLabelText('Menu'));
    expect(getByTestId('mobile-menu-sheet')).toBeTruthy();
    expect(getByText('BACAAN UTAMA')).toBeTruthy();
    expect(getByText('IBADAH & TRACKER')).toBeTruthy();
    expect(getByTestId('mobile-menu-item-profile')).toBeTruthy();

    fireEvent.press(getByTestId('mobile-menu-sheet-close'));
    expect(queryByTestId('mobile-menu-sheet')).toBeNull();
  });

  test('routes web app menu sheet tab shortcuts through existing tab handler', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onTabChange = jest.fn();
    const { getByLabelText, getByTestId, queryByTestId } = renderShell({ onTabChange });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByLabelText('Menu'));
    fireEvent.press(getByTestId('mobile-menu-item-sholat-tracker'));

    expect(onTabChange).toHaveBeenCalledWith('ibadah', null);
    expect(queryByTestId('mobile-menu-sheet')).toBeNull();
  });

  test('routes web app menu profile shortcut through existing profile handler', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onOpenProfile = jest.fn();
    const { getByLabelText, getByTestId } = renderShell({ onOpenProfile });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByLabelText('Menu'));
    fireEvent.press(getByTestId('mobile-menu-item-profile'));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  test('routes web app bottom nav taps through existing tab handler', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onTabChange = jest.fn();
    const { getByLabelText, getByTestId } = renderShell({ onTabChange });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByLabelText('Al-Quran'));

    expect(onTabChange).toHaveBeenCalledWith('quran');
  });

  test('opens global search and menu from web app bottom nav actions', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onTabChange = jest.fn();
    const { getByLabelText, getByTestId } = renderShell({ onTabChange });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByLabelText('Cari'));
    expect(onTabChange).toHaveBeenCalledWith('home', { view: 'global-search' });

    fireEvent.press(getByLabelText('Menu'));
    expect(getByTestId('mobile-menu-sheet')).toBeTruthy();
  });

  test('uses active tab state for web app bottom nav and menu selection', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByLabelText, getByTestId } = renderShell({ activeTab: 'quran' });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(getByLabelText('Al-Quran').props.accessibilityState).toEqual({ selected: true });
    expect(getByLabelText('Dashboard').props.accessibilityState).toEqual({ selected: false });

    fireEvent.press(getByLabelText('Menu'));

    expect(getByTestId('mobile-menu-item-quran').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('mobile-menu-item-hadith').props.accessibilityState).toEqual({ selected: false });
  });

  test('hides web app bottom nav while keyboard is visible', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByTestId, queryByTestId } = renderShell({ keyboardVisible: true });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(queryByTestId('mobile-bottom-nav')).toBeNull();
  });
});

describe('getWebAppAccountLabel', () => {
  test('prefers name, falls back to email, then guest label', () => {
    expect(getWebAppAccountLabel({ name: 'Ahmad', email: 'a@example.com' })).toBe('Ahmad');
    expect(getWebAppAccountLabel({ email: 'mail@example.com' })).toBe('mail@example.com');
    expect(getWebAppAccountLabel({ name: '   ' })).toBe('Tamu');
    expect(getWebAppAccountLabel(null)).toBe('Tamu');
  });
});
