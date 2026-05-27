import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  appThemes,
  defaultLayoutMode,
  defaultThemePreference,
  LayoutModeProvider,
  layoutModes,
  normalizeLayoutMode,
  normalizeThemePreference,
  readStoredLayoutMode,
  readStoredThemePreference,
  useLayoutMode,
  writeStoredLayoutMode,
  writeStoredThemePreference,
} from '../layout/LayoutModeProvider';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';

function LayoutModeProbe() {
  const {
    isDarkTheme,
    isLoading,
    isWebAppLayout,
    layoutMode,
    setLayoutMode,
    setThemePreference,
    themePreference,
  } = useLayoutMode();
  return (
    <>
      <Text>{isLoading ? 'loading' : 'ready'}</Text>
      <Text>{layoutMode}</Text>
      <Text>{themePreference}</Text>
      <Text>{isDarkTheme ? 'dark-theme' : 'light-theme'}</Text>
      <Text>{isWebAppLayout ? 'web-app' : 'classic-shell'}</Text>
      <Pressable onPress={() => setLayoutMode(layoutModes.webApp)}>
        <Text>Switch Web App</Text>
      </Pressable>
      <Pressable onPress={() => setThemePreference(appThemes.dark)}>
        <Text>Switch Dark Theme</Text>
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

  test('accepts only supported app theme preferences', () => {
    expect(defaultThemePreference).toBe(appThemes.system);
    expect(normalizeThemePreference(appThemes.system)).toBe(appThemes.system);
    expect(normalizeThemePreference(appThemes.light)).toBe(appThemes.light);
    expect(normalizeThemePreference(appThemes.dark)).toBe(appThemes.dark);
    expect(normalizeThemePreference('broken')).toBe(appThemes.system);
    expect(normalizeThemePreference(null)).toBe(appThemes.system);
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

  test('reads and writes stored app theme preference', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('"dark"');
    await expect(readStoredThemePreference()).resolves.toBe(appThemes.dark);

    AsyncStorage.getItem.mockResolvedValueOnce('"unexpected"');
    await expect(readStoredThemePreference()).resolves.toBe(appThemes.system);

    await expect(writeStoredThemePreference('unexpected')).resolves.toBe(appThemes.system);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tholabul:pref:app-theme',
      '"system"',
    );
  });
});

describe('LayoutModeProvider', () => {
  test('loads stored mode and exposes derived state', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('"web_app"')
      .mockResolvedValueOnce('"dark"');
    const { getByText } = render(
      <LayoutModeProvider>
        <LayoutModeProbe />
      </LayoutModeProvider>,
    );

    await waitFor(() => expect(getByText(layoutModes.webApp)).toBeTruthy());
    expect(getByText('ready')).toBeTruthy();
    expect(getByText('web-app')).toBeTruthy();
    expect(getByText(appThemes.dark)).toBeTruthy();
    expect(getByText('dark-theme')).toBeTruthy();
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

  test('updates theme through context setter', async () => {
    AsyncStorage.getItem
      .mockResolvedValueOnce('"web_app"')
      .mockResolvedValueOnce('"light"');
    const { getByText } = render(
      <LayoutModeProvider>
        <LayoutModeProbe />
      </LayoutModeProvider>,
    );

    await waitFor(() => expect(getByText(appThemes.light)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText('Switch Dark Theme'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tholabul:pref:app-theme',
      '"dark"',
    );
    await waitFor(() => expect(getByText(appThemes.dark)).toBeTruthy());
    expect(getByText('dark-theme')).toBeTruthy();
  });
});
