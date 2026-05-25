import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  defaultLayoutMode,
  LayoutModeProvider,
  layoutModes,
  normalizeLayoutMode,
  readStoredLayoutMode,
  useLayoutMode,
  writeStoredLayoutMode,
} from '../layout/LayoutModeProvider';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';

function LayoutModeProbe() {
  const { isLoading, isWebAppLayout, layoutMode, setLayoutMode } = useLayoutMode();
  return (
    <>
      <Text>{isLoading ? 'loading' : 'ready'}</Text>
      <Text>{layoutMode}</Text>
      <Text>{isWebAppLayout ? 'web-app' : 'classic-shell'}</Text>
      <Pressable onPress={() => setLayoutMode(layoutModes.webApp)}>
        <Text>Switch Web App</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('layout mode normalization', () => {
  test('exposes a stable hook alias for future shell components', () => {
    expect(useLayoutModePreference).toBe(useLayoutMode);
  });

  test('accepts only supported layout modes', () => {
    expect(defaultLayoutMode).toBe(layoutModes.webApp);
    expect(normalizeLayoutMode(layoutModes.classic)).toBe(layoutModes.classic);
    expect(normalizeLayoutMode(layoutModes.webApp)).toBe(layoutModes.webApp);
    expect(normalizeLayoutMode('broken')).toBe(layoutModes.classic);
    expect(normalizeLayoutMode(null)).toBe(layoutModes.classic);
  });

  test('reads stored mode with web app default and classic invalid fallback', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    await expect(readStoredLayoutMode()).resolves.toBe(layoutModes.webApp);

    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    await expect(readStoredLayoutMode()).resolves.toBe(layoutModes.webApp);

    AsyncStorage.getItem.mockResolvedValueOnce('"classic"');
    await expect(readStoredLayoutMode()).resolves.toBe(layoutModes.classic);

    AsyncStorage.getItem.mockResolvedValueOnce('"unexpected"');
    await expect(readStoredLayoutMode()).resolves.toBe(layoutModes.classic);
  });

  test('writes normalized mode to preference storage', async () => {
    await expect(writeStoredLayoutMode('unexpected')).resolves.toBe(layoutModes.classic);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tholabul:pref:app-layout-mode',
      '"classic"',
    );
  });
});

describe('LayoutModeProvider', () => {
  test('loads stored mode and exposes derived state', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"web_app"');
    const { getByText } = render(
      <LayoutModeProvider>
        <LayoutModeProbe />
      </LayoutModeProvider>,
    );

    await waitFor(() => expect(getByText(layoutModes.webApp)).toBeTruthy());
    expect(getByText('ready')).toBeTruthy();
    expect(getByText('web-app')).toBeTruthy();
  });

  test('falls back to classic state when stored mode is invalid', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"unexpected"');
    const { getByText } = render(
      <LayoutModeProvider>
        <LayoutModeProbe />
      </LayoutModeProvider>,
    );

    await waitFor(() => expect(getByText(layoutModes.classic)).toBeTruthy());
    expect(getByText('ready')).toBeTruthy();
    expect(getByText('classic-shell')).toBeTruthy();
  });

  test('updates mode through context setter', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"classic"');
    const { getByText } = render(
      <LayoutModeProvider>
        <LayoutModeProbe />
      </LayoutModeProvider>,
    );

    await waitFor(() => expect(getByText(layoutModes.classic)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText('Switch Web App'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tholabul:pref:app-layout-mode',
      '"web_app"',
    );
    await waitFor(() => expect(getByText(layoutModes.webApp)).toBeTruthy());
  });
});
