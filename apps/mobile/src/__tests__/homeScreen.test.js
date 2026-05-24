jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'Bell', 'Book', 'Bookmark', 'BookOpen', 'BookOpenCheck', 'ChevronRight',
    'Clock3', 'Compass', 'FileText', 'Globe', 'Grid', 'HelpCircle',
    'ListChecks', 'MessageCircle', 'Moon', 'Scale', 'Search', 'Smile', 'Star',
    'Sun', 'Sunset', 'Users', 'Video',
  ];
  names.forEach((n) => { icons[n] = n; });
  return icons;
});

jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../context/TabActivityContext', () => ({
  useTabActivity: () => ({ notifyTabActivity: jest.fn() }),
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('../api/client', () => ({
  getDailyAyah: jest.fn(),
  getDailyHadith: jest.fn(),
  getHijriToday: jest.fn(),
  getPrayerTimes: jest.fn(),
}));

jest.mock('../storage/recentFeatures', () => ({
  readPinnedFeatures: jest.fn(),
  readRecentFeatures: jest.fn(),
}));

jest.mock('../storage/recentSearches', () => ({
  readRecentSearches: jest.fn().mockResolvedValue([]),
  rememberRecentSearch: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../components/ContentCard', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ContentCard: ({ title, subtitle, onPress, Icon, iconStyle, iconSize, iconStrokeWidth, style, subtitleStyle, titleStyle, trailing, meta, onMenuPress, children }) => (
      <Pressable onPress={onPress} onLongPress={onMenuPress} testID="content-card">
        <Text testID="card-title">{title}</Text>
        {subtitle ? <Text testID="card-subtitle">{subtitle}</Text> : null}
        {children}
      </Pressable>
    ),
  };
});

jest.mock('../components/DetailHeader', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    DetailHeader: ({ title, subtitle, onBack }) => (
      <View>
        <Pressable onPress={onBack} testID="back-button"><Text>Kembali</Text></Pressable>
        <Text testID="detail-title">{title}</Text>
        {subtitle ? <Text testID="detail-subtitle">{subtitle}</Text> : null}
      </View>
    ),
  };
});

jest.mock('../data/mobileFeatures', () => ({
  featureGroups: [
    {
      key: 'bacaan',
      label: 'Bacaan',
      features: [
        { key: 'doa', title: 'Doa', subtitle: 'Doa harian', type: 'list', endpoint: '/api/v1/doa' },
        { key: 'dzikir', title: 'Dzikir', subtitle: 'Kumpulan dzikir', type: 'list', endpoint: '/api/v1/dzikir' },
      ],
    },
  ],
}));

import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { flushAsyncWork } from '../test-utils/async';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { useSession } = require('../context/SessionContext');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');
const clientApi = require('../api/client');
const Location = require('expo-location');
const { readPinnedFeatures, readRecentFeatures } = require('../storage/recentFeatures');

const mockAyah = {
  id: 1,
  arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  surahName: 'Al-Fatihah',
  number: 1,
  translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
};

const mockHadith = {
  id: 1,
  arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',
  translation: 'Actions are judged by intentions',
  book: 'Shahih Bukhari',
};

const mockPrayerTimes = {
  fajr: '04:30',
  sunrise: '05:45',
  dhuhr: '12:00',
  asr: '15:30',
  maghrib: '17:50',
  isha: '19:10',
};

const formatTestDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultNavigation = {
  current: { view: undefined, params: {} },
  open: jest.fn(),
  close: jest.fn(),
  closeAndOpen: jest.fn(),
  setBack: jest.fn(),
  clearBack: jest.fn(),
};

const renderHomeScreen = async (props = {}) => {
  const view = render(
    <HomeScreen
      isActive
      navigation={defaultNavigation}
      onOpenTab={jest.fn()}
      {...props}
    />,
  );
  await flushAsyncWork();
  return view;
};

beforeEach(() => {
  jest.clearAllMocks();
  useSession.mockReturnValue({
    error: '',
    loading: false,
    session: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    user: null,
  });
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });

  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
  Location.getLastKnownPositionAsync.mockResolvedValue(null);
  AsyncStorage.getItem.mockResolvedValue(null);
  AsyncStorage.setItem.mockResolvedValue();
  clientApi.getDailyAyah.mockResolvedValue(mockAyah);
  clientApi.getDailyHadith.mockResolvedValue(mockHadith);
  clientApi.getHijriToday.mockResolvedValue({ dateStr: '1 Ramadan 1445 H' });
  clientApi.getPrayerTimes.mockResolvedValue(mockPrayerTimes);
  readPinnedFeatures.mockResolvedValue([]);
  readRecentFeatures.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('HomeScreen', () => {
  test('renders header with guest name', async () => {
    const { getByTestId, getByText } = await renderHomeScreen();
    await waitFor(() => {
      expect(getByText('Tamu')).toBeTruthy();
      expect(getByTestId('home-classic-header')).toBeTruthy();
    });
  });

  test('renders web app greeting instead of duplicate profile header when web app layout is active', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });

    const { getByTestId, queryByTestId } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByTestId('home-web-app-greeting')).toBeTruthy();
    });
    expect(queryByTestId('home-classic-header')).toBeNull();
  });

  test('renders user name when logged in', async () => {
    useSession.mockReturnValue({
      user: { id: '1', name: 'Ahmad', email: 'ahmad@test.com' },
      session: { token: 'abc' },
    });

    const { getByText } = await renderHomeScreen();
    await waitFor(() => {
      expect(getByText('Ahmad')).toBeTruthy();
    });
  });

  test('loads and displays daily ayah', async () => {
    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Ayat Hari Ini')).toBeTruthy();
      expect(getByText(mockAyah.translation)).toBeTruthy();
    });
  });

  test('shows hijri and gregorian dates on home', async () => {
    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('1 Ramadan 1445 H')).toBeTruthy();
    });
  });

  test('shows detailed prayer schedule when location prayer times are available', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -6.2, longitude: 106.8 },
    });
    Location.reverseGeocodeAsync.mockResolvedValue([{ city: 'Jakarta' }]);

    const { getAllByText, getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Subuh')).toBeTruthy();
      expect(getByText('Terbit')).toBeTruthy();
      expect(getByText('Dzuhur')).toBeTruthy();
      expect(getByText('Ashar')).toBeTruthy();
      expect(getByText('Maghrib')).toBeTruthy();
      expect(getByText('Isya')).toBeTruthy();
      expect(getByText('05:45')).toBeTruthy();
      expect(getAllByText('JAKARTA').length).toBeGreaterThanOrEqual(1);
    });
    expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({
      latitude: -6.2,
      longitude: 106.8,
    });
  });

  test('retries prayer schedule when the first call fails', async () => {
    jest.useFakeTimers();
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -6.2, longitude: 106.8 },
    });
    Location.reverseGeocodeAsync.mockResolvedValue([{ city: 'Jakarta' }]);
    clientApi.getPrayerTimes
      .mockRejectedValueOnce(new Error('temporary prayer error'))
      .mockResolvedValueOnce(mockPrayerTimes);

    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Jadwal sholat belum tersedia. Mencoba ulang 1/4...')).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(2500);
    });
    await flushAsyncWork();

    await waitFor(() => {
      expect(clientApi.getPrayerTimes).toHaveBeenCalledTimes(2);
      expect(getByText('05:45')).toBeTruthy();
    });
  });

  test('uses cached home location while current GPS resolves in background', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -6.2, longitude: 106.8 },
    });
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'tholabul:pref:home-last-location') {
        return Promise.resolve(JSON.stringify({
          lat: -6.2,
          lng: 106.8,
          label: 'JAKARTA',
          updatedAt: Date.now(),
        }));
      }
      return Promise.resolve(null);
    });

    const { getAllByText, getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getAllByText('JAKARTA').length).toBeGreaterThanOrEqual(1);
      expect(getByText('05:45')).toBeTruthy();
    });
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    expect(clientApi.getPrayerTimes).toHaveBeenCalledWith({
      lat: -6.2,
      lng: 106.8,
      madhab: 'shafi',
      method: 'kemenag',
    });
  });

  test('renders cached prayer schedule before network refresh completes', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -6.2, longitude: 106.8 },
    });
    clientApi.getPrayerTimes.mockImplementation(() => new Promise(() => {}));
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'tholabul:pref:home-last-location') {
        return Promise.resolve(JSON.stringify({
          lat: -6.2,
          lng: 106.8,
          label: 'JAKARTA',
          updatedAt: Date.now(),
        }));
      }
      if (key === 'tholabul:pref:home-prayer-times') {
        return Promise.resolve(JSON.stringify({
          coords: { lat: -6.2, lng: 106.8 },
          date: formatTestDateKey(),
          madhab: 'shafi',
          method: 'kemenag',
          prayers: {
            ...mockPrayerTimes,
            sunrise: '05:44',
          },
          updatedAt: Date.now(),
        }));
      }
      return Promise.resolve(null);
    });

    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('05:44')).toBeTruthy();
    });
    expect(clientApi.getPrayerTimes).toHaveBeenCalledWith({
      lat: -6.2,
      lng: 106.8,
      madhab: 'shafi',
      method: 'kemenag',
    });
  });

  test('retries current GPS lookup and loads prayer schedule automatically', async () => {
    jest.useFakeTimers();
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync
      .mockRejectedValueOnce(new Error('gps warming up'))
      .mockResolvedValueOnce({
        coords: { latitude: -6.2, longitude: 106.8 },
      });
    Location.reverseGeocodeAsync.mockResolvedValue([{ city: 'Jakarta' }]);

    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('GPS masih mencari lokasi. Mencoba lagi 1/5...')).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await flushAsyncWork();

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
      expect(clientApi.getPrayerTimes).toHaveBeenCalledWith({
        lat: -6.2,
        lng: 106.8,
        madhab: 'shafi',
        method: 'kemenag',
      });
      expect(getByText('05:45')).toBeTruthy();
    });
  });

  test('loads and displays daily hadith', async () => {
    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Hadis Hari Ini')).toBeTruthy();
      expect(getByText(mockHadith.translation)).toBeTruthy();
    });
  });

  test('shows feature grid with menu items', async () => {
    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Kiblat')).toBeTruthy();
      expect(getByText('Hafalan')).toBeTruthy();
      expect(getByText('Kuis')).toBeTruthy();
      expect(getByText('Hadis')).toBeTruthy();
    });
  });

  test('quick action buttons navigate to correct tabs', async () => {
    const onOpenTab = jest.fn();
    const { getByText } = await renderHomeScreen({ onOpenTab });

    await waitFor(() => {
      expect(getByText('Kiblat')).toBeTruthy();
    });

    fireEvent.press(getByText('Kiblat'));
    expect(onOpenTab).toHaveBeenCalledWith('ibadah', { view: 'qibla' });

    fireEvent.press(getByText('Hadis'));
    expect(onOpenTab).toHaveBeenCalledWith('hadith', null);
  });

  test('does not show sholat tracker inside the home prayer card', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -6.2, longitude: 106.8 },
    });
    Location.reverseGeocodeAsync.mockResolvedValue([{ city: 'Jakarta' }]);

    const { getByText, queryByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Subuh')).toBeTruthy();
      expect(queryByText('Tracker hari ini')).toBeNull();
    });
  });

  test('daily message shown when ayah fails', async () => {
    clientApi.getDailyAyah.mockRejectedValue(new Error('fail'));

    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Bacaan harian belum tersedia dari server.')).toBeTruthy();
    });
  });

  test('profile button navigates to profile tab', async () => {
    const onOpenTab = jest.fn();
    const { getByText } = await renderHomeScreen({ onOpenTab });

    await waitFor(() => {
      expect(getByText('Tamu')).toBeTruthy();
    });

    fireEvent.press(getByText('Tamu'));
    expect(onOpenTab).toHaveBeenCalledWith('profile');
  });

  test('displays muhasabah journal card', async () => {
    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Jurnal Muhasabah')).toBeTruthy();
    });
  });

  test('shows pinned features when available', async () => {
    readPinnedFeatures.mockResolvedValue([
      { key: 'tafsir', title: 'Tafsir', subtitle: 'Baca tafsir', group: 'Ilmu' },
    ]);
    readRecentFeatures.mockResolvedValue([]);

    const { getByText, getAllByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Disematkan')).toBeTruthy();
    });
    const tafsirElements = getAllByText('Tafsir');
    expect(tafsirElements.length).toBeGreaterThanOrEqual(1);
  });

  test('shows recent features when available', async () => {
    readPinnedFeatures.mockResolvedValue([]);
    readRecentFeatures.mockResolvedValue([
      { key: 'kamus', title: 'Kamus Arab', subtitle: 'Cari kata', group: 'Alat' },
    ]);

    const { getByText } = await renderHomeScreen();

    await waitFor(() => {
      expect(getByText('Terakhir Dibuka')).toBeTruthy();
      expect(getByText('Kamus Arab')).toBeTruthy();
    });
  });
});
