import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Text } from 'react-native';
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

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

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
  useSession.mockReturnValue({ user: null });
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
    expect(getByText('Beranda')).toBeTruthy();
  });

  test('uses logged-in user initial in web app shell header', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    useSession.mockReturnValue({ user: { name: 'Budi', email: 'budi@example.com' } });
    const { getByText, getByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(getByText('B')).toBeTruthy();
  });

  test('opens profile from web app header account control', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onOpenProfile = jest.fn();
    const { getByTestId } = renderShell({ onOpenProfile });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByTestId('mobile-top-header-profile'));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  test('opens and closes web app secondary menu sheet', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByTestId, queryByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(queryByTestId('mobile-menu-sheet')).toBeNull();

    fireEvent.press(getByTestId('mobile-top-header-menu'));
    expect(getByTestId('mobile-menu-sheet')).toBeTruthy();
    expect(getByTestId('mobile-menu-item-profile')).toBeTruthy();

    fireEvent.press(getByTestId('mobile-menu-sheet-close'));
    expect(queryByTestId('mobile-menu-sheet')).toBeNull();
  });

  test('routes web app menu sheet tab shortcuts through existing tab handler', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onTabChange = jest.fn();
    const { getByTestId, queryByTestId } = renderShell({ onTabChange });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByTestId('mobile-top-header-menu'));
    fireEvent.press(getByTestId('mobile-menu-item-ibadah'));

    expect(onTabChange).toHaveBeenCalledWith('ibadah');
    expect(queryByTestId('mobile-menu-sheet')).toBeNull();
  });

  test('routes web app menu profile shortcut through existing profile handler', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onOpenProfile = jest.fn();
    const { getByTestId } = renderShell({ onOpenProfile });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByTestId('mobile-top-header-menu'));
    fireEvent.press(getByTestId('mobile-menu-item-profile'));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  test('routes web app bottom nav taps through existing tab handler', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onTabChange = jest.fn();
    const { getByLabelText, getByTestId } = renderShell({ onTabChange });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByLabelText("Al-Qur'an"));

    expect(onTabChange).toHaveBeenCalledWith('quran');
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
