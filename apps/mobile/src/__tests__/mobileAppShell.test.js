import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TabActivityProvider } from '../context/TabActivityContext';
import { LayoutModeProvider } from '../layout/LayoutModeProvider';
import { MobileAppShell } from '../layout/MobileAppShell';

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
});

describe('MobileAppShell', () => {
  test('uses classic shell by default', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const { getByText, getByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('classic-app-shell')).toBeTruthy());
    expect(getByText('Shell content')).toBeTruthy();
    expect(getByText('Beranda')).toBeTruthy();
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
    expect(getByText('Beranda')).toBeTruthy();
  });

  test('opens profile from web app header account control', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const onOpenProfile = jest.fn();
    const { getByTestId } = renderShell({ onOpenProfile });

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    fireEvent.press(getByTestId('mobile-top-header-profile'));

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
