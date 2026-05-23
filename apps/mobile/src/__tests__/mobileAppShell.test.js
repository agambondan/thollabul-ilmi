import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
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

function renderShell() {
  return render(
    <TabActivityProvider>
      <LayoutModeProvider>
        <MobileAppShell activeTab="home" keyboardVisible={false} onTabChange={jest.fn()}>
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

  test('uses web app shell path when stored mode is web_app', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByText, getByTestId } = renderShell();

    await waitFor(() => expect(getByTestId('web-app-shell')).toBeTruthy());
    expect(getByText('Shell content')).toBeTruthy();
    expect(getByText('Beranda')).toBeTruthy();
  });
});
