import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  BookOpenCheck: 'BookOpenCheck',
  RefreshCw: 'RefreshCw',
}));

jest.mock('../components/Screen', () => {
  const { View, Text, ActivityIndicator } = require('react-native');
  return {
    Screen: ({ actions, children, refreshing, subtitle, title, contentStyle }) => (
      <View style={contentStyle}>
        <Text testID="screen-title">{title}</Text>
        {subtitle ? <Text testID="screen-subtitle">{subtitle}</Text> : null}
        <View testID="screen-actions">{actions}</View>
        {refreshing ? <ActivityIndicator testID="screen-loader" /> : null}
        {children}
      </View>
    ),
  };
});

jest.mock('../components/Card', () => {
  const { View, Text } = require('react-native');
  return {
    Card: ({ children }) => <View testID="card">{children}</View>,
    CardTitle: ({ children, meta }) => (
      <View>
        <Text testID="card-title">{children}</Text>
        {meta ? <Text testID="card-meta">{meta}</Text> : null}
      </View>
    ),
  };
});

jest.mock('../components/Paper', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    EmptyState: ({ action, description, title }) => (
      <View testID="empty-state">
        <Text>{title}</Text>
        {description ? <Text>{description}</Text> : null}
        {action}
      </View>
    ),
    IconActionButton: ({ label, onPress, disabled }) => (
      <Pressable disabled={disabled} onPress={onPress} testID={`action-${label}`}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

jest.mock('../api/personal', () => ({
  getQuranProgress: jest.fn(),
}));

jest.mock('../storage/preferences', () => ({
  preferenceKeys: {
    khatamTargetDays: 'khatam-target-days',
  },
  readPreference: jest.fn(),
  writePreference: jest.fn(),
}));

import { KhatamScreen } from '../screens/KhatamScreen';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { getQuranProgress } from '../api/personal';
import { readPreference, writePreference } from '../storage/preferences';

const navigation = {
  clearBack: jest.fn(),
  close: jest.fn(),
  closeAndOpen: jest.fn(),
  setBack: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: false });
  readPreference.mockResolvedValue(30);
  writePreference.mockResolvedValue(60);
});

describe('KhatamScreen', () => {
  test('shows login state for guest', async () => {
    useSession.mockReturnValue({ user: null });

    const { getByText } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByText('Masuk untuk melacak Khatam')).toBeTruthy();
    });
    expect(getByText('Khatam')).toBeTruthy();
    expect(getQuranProgress).not.toHaveBeenCalled();
  });

  test('uses web app Khatam surface when web app layout is active', async () => {
    useSession.mockReturnValue({ user: null });
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });

    const { getByTestId, queryByTestId } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByTestId('khatam-web-app-surface')).toBeTruthy();
    });
    expect(queryByTestId('khatam-classic-surface')).toBeNull();
  });

  test('uses light web app Khatam palette when theme is light', async () => {
    useSession.mockReturnValue({ user: null });
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });

    const { getByTestId } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByTestId('khatam-web-app-guest-card')).toBeTruthy();
    });

    expect(StyleSheet.flatten(getByTestId('khatam-web-app-surface').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#f8fafc' }),
    );
    expect(StyleSheet.flatten(getByTestId('khatam-web-app-guest-card').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }),
    );
  });

  test('uses dark web app Khatam palette when theme is dark', async () => {
    useSession.mockReturnValue({ user: null });
    useLayoutModePreference.mockReturnValue({ isDarkTheme: true, isWebAppLayout: true });

    const { getByTestId } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByTestId('khatam-web-app-guest-card')).toBeTruthy();
    });

    expect(StyleSheet.flatten(getByTestId('khatam-web-app-surface').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#020617' }),
    );
    expect(StyleSheet.flatten(getByTestId('khatam-web-app-guest-card').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#111827', borderColor: '#334155' }),
    );
  });

  test('uses dashboard Khatam route surface in web app layout', async () => {
    useSession.mockReturnValue({ user: { id: '1' } });
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    getQuranProgress.mockResolvedValue({
      data: {
        ayah_number: 75,
        last_read_at: '2026-05-17T00:00:00Z',
        surah_number: 18,
      },
    });

    const { getByText, getByTestId, queryByTestId } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByTestId('khatam-web-app-surface')).toBeTruthy();
      expect(getByText('Khatam Tracker')).toBeTruthy();
    });

    expect(getByText('Target Khatam')).toBeTruthy();
    expect(getByText('Progress per Juz')).toBeTruthy();
    expect(getByText('30d')).toBeTruthy();
    expect(getByText('Menit/hari')).toBeTruthy();
    expect(queryByTestId('action-Kembali ke Ibadah')).toBeNull();
  });

  test('persists web app Khatam target duration', async () => {
    useSession.mockReturnValue({ user: { id: '1' } });
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    getQuranProgress.mockResolvedValue({
      data: {
        ayah_number: 75,
        surah_number: 18,
      },
    });

    const { getByText } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByText('60d')).toBeTruthy();
    });

    fireEvent.press(getByText('60d'));

    await waitFor(() => {
      expect(writePreference).toHaveBeenCalledWith('khatam-target-days', 60);
    });
  });

  test('renders khatam progress for signed in user', async () => {
    useSession.mockReturnValue({ user: { id: '1' } });
    getQuranProgress.mockResolvedValue({
      data: {
        ayah_number: 75,
        last_read_at: '2026-05-17T00:00:00Z',
        surah_number: 18,
      },
    });

    const { getByText } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByText('Progress saat ini')).toBeTruthy();
    });
    expect(getByText(/QS\. 18:75/)).toBeTruthy();
    expect(getByText('Lanjutkan baca')).toBeTruthy();
  });

  test('continue reading opens Quran at saved position', async () => {
    useSession.mockReturnValue({ user: { id: '1' } });
    getQuranProgress.mockResolvedValue({
      surah_number: 2,
      ayah_number: 20,
    });

    const { getByText } = render(
      <KhatamScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByText('Lanjutkan baca')).toBeTruthy();
    });

    fireEvent.press(getByText('Lanjutkan baca'));
    expect(navigation.closeAndOpen).toHaveBeenCalledWith('ibadah', 'quran', {
      ayahNumber: 20,
      surahNumber: 2,
      surahSlug: '2',
    });
  });
});
