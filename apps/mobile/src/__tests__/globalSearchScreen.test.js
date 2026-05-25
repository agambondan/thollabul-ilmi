jest.mock('../api/client', () => ({
  searchGlobal: jest.fn(),
  getSurahs: jest.fn().mockResolvedValue([]),
}));

jest.mock('../storage/recentSearches', () => ({
  readRecentSearches: jest.fn().mockResolvedValue([]),
  rememberRecentSearch: jest.fn().mockResolvedValue([]),
}));

jest.mock('../data/mobileFeatures', () => ({
  allFeatures: [
    { key: 'doa', title: 'Doa', subtitle: 'Kumpulan doa', group: 'Ibadah', type: 'internal' },
    { key: 'kiblat', title: 'Kiblat', subtitle: 'Arah kiblat', group: 'Ibadah', type: 'internal' },
  ],
}));

jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'ArrowLeft', 'Book', 'BookOpen', 'Languages', 'Layers', 'Search', 'UserRound',
    'CheckCircle2', 'MoreVertical', 'Info', 'X', 'XCircle', 'AlertCircle',
  ];
  names.forEach((n) => { icons[n] = n; });
  return icons;
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../components/Screen', () => ({
  Screen: ({ children, searchSlot, headerExtra, title, contentStyle }) => {
    const { View, Text } = require('react-native');
    return (
      <View style={contentStyle}>
        <Text testID="screen-title">{title}</Text>
        {searchSlot}
        {headerExtra}
        {children}
      </View>
    );
  },
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

jest.mock('../components/Paper', () => {
  const { TextInput, Pressable, Text, View } = require('react-native');
  return {
    PaperSearchInput: ({ value, onChangeText, placeholder }) => (
      <TextInput
        testID="search-input"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    ),
    IconActionButton: ({ label, onPress }) => (
      <Pressable onPress={onPress} testID={`action-${label}`}>
        <Text>{label}</Text>
      </Pressable>
    ),
    EmptyState: ({ title, description }) => (
      <View testID="empty-state">
        <Text testID="empty-title">{title}</Text>
        {description ? <Text>{description}</Text> : null}
      </View>
    ),
    ActionPill: ({ label, onPress }) => (
      <Pressable onPress={onPress} testID={`pill-${label}`}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

jest.mock('../components/ContentCard', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ContentCard: ({ title, subtitle, onPress, meta }) => (
      <Pressable onPress={onPress} testID="content-card">
        <Text testID="card-title">{title}</Text>
        {subtitle ? <Text testID="card-subtitle">{subtitle}</Text> : null}
        {meta ? <Text testID="card-meta">{meta}</Text> : null}
      </Pressable>
    ),
  };
});

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { GlobalSearchScreen } from '../screens/GlobalSearchScreen';
import { flushAsyncWork } from '../test-utils/async';

const client = require('../api/client');
const recentSearches = require('../storage/recentSearches');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');

const mockAyah = (id, overrides = {}) => ({
  id, number: id, surahNumber: 1, surahName: 'Al-Fatihah',
  translation: 'In the name of Allah', arabic: 'بِسْمِ اللَّهِ',
  juzNumber: 1, pageNumber: 1,
  ...overrides,
});

const mockHadith = (id, overrides = {}) => ({
  id, book: 'Bukhari', title: `Hadith ${id}`, translation: 'Narrated...',
  ...overrides,
});

const mockDoa = (id, overrides = {}) => ({
  id, title: `Doa ${id}`, body: 'Doa text', meta: 'Pagi',
  ...overrides,
});

const renderGlobalSearchScreen = async (props = {}) => {
  const view = render(
    <GlobalSearchScreen onBack={jest.fn()} onOpenTab={jest.fn()} {...props} />,
  );
  await flushAsyncWork();
  return view;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  client.searchGlobal.mockResolvedValue({});
  client.getSurahs.mockResolvedValue([]);
  recentSearches.readRecentSearches.mockResolvedValue([]);
  recentSearches.rememberRecentSearch.mockResolvedValue([]);
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('GlobalSearchScreen', () => {
  it('renders search input and filter chips', async () => {
    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByTestId('global-search-classic-surface')).toBeTruthy();
    expect(getByText('Semua')).toBeTruthy();
    expect(getByText('Quran')).toBeTruthy();
    expect(getByText('Hadis')).toBeTruthy();
    expect(getByText('Doa')).toBeTruthy();
    expect(getByText('Kajian')).toBeTruthy();
    expect(getByText('Kamus')).toBeTruthy();
    expect(getByText('Perawi')).toBeTruthy();
    expect(getByText('Fitur')).toBeTruthy();
  });

  it('uses web app Global Search surface when web app layout is active', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByPlaceholderText, getByTestId, getByText, queryByTestId, queryByText } =
      await renderGlobalSearchScreen();

    expect(getByText('Pencarian')).toBeTruthy();
    expect(getByPlaceholderText('Cari ayah, hadith, atau terjemahan...')).toBeTruthy();
    expect(getByText('Al-Quran')).toBeTruthy();
    expect(getByText('Hadith')).toBeTruthy();
    expect(getByText('Doa')).toBeTruthy();
    expect(getByText('Kamus')).toBeTruthy();
    expect(getByText('Kajian')).toBeTruthy();
    expect(getByText('Perawi')).toBeTruthy();
    expect(getByTestId('global-search-web-app-surface')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
    expect(queryByText('Mulai dari dua huruf')).toBeNull();
    expect(queryByText('Fitur')).toBeNull();
    expect(queryByTestId('global-search-classic-surface')).toBeNull();
  });

  it('shows quick suggestions when no query', async () => {
    const { getByText } = await renderGlobalSearchScreen();

    expect(getByText('Cari cepat')).toBeTruthy();
    expect(getByText('shalat')).toBeTruthy();
    expect(getByText('sabar')).toBeTruthy();
    expect(getByText('zakat')).toBeTruthy();
    expect(getByText('tafsir')).toBeTruthy();
  });

  it('shows recent searches when available', async () => {
    recentSearches.readRecentSearches.mockResolvedValue(['zakat', 'ikhlas']);

    const { getByText, queryByText } = await renderGlobalSearchScreen();

    await waitFor(() => {
      expect(getByText('Terakhir dicari')).toBeTruthy();
    });
    expect(getByText('zakat')).toBeTruthy();
    expect(getByText('ikhlas')).toBeTruthy();
    expect(queryByText('Cari cepat')).toBeNull();
  });

  it('calls searchGlobal when query changes', async () => {
    client.searchGlobal.mockResolvedValue({ ayahs: [mockAyah(1)], total: 1, ayahTotal: 1 });

    const { getByTestId } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'fatihah');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(client.searchGlobal).toHaveBeenCalledWith('fatihah', expect.any(Object));
    });
  });

  it('displays results for each category', async () => {
    client.searchGlobal.mockImplementation((query, { type } = {}) => {
      if (type === 'ayah') return { ayahs: [mockAyah(1)], ayahTotal: 1, total: 1 };
      if (type === 'hadith') return { hadiths: [mockHadith(1)], hadithTotal: 1, total: 1 };
      if (type === 'doa') return { doas: [mockDoa(1)], doaTotal: 1, total: 1 };
      return {};
    });

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'islam');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(client.searchGlobal).toHaveBeenCalled();
      expect(getByText('Al-Quran')).toBeTruthy();
      expect(getByText('Hadis')).toBeTruthy();
      expect(getByText('Doa')).toBeTruthy();
    });
  });

  it('shows "Lihat Semua" button in "Semua" tab when there are more results', async () => {
    const ayahs = Array.from({ length: 3 }, (_, i) => mockAyah(i + 1));
    client.searchGlobal.mockImplementation((query, { type } = {}) => {
      if (type === 'ayah') return { ayahs, ayahTotal: 10, total: 10 };
      return {};
    });

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'islam');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(getByText(/Lihat semua/i)).toBeTruthy();
    });
  });

  it('shows "Muat Lainnya" when in a specific tab with more results', async () => {
    const ayahs = Array.from({ length: 3 }, (_, i) => mockAyah(i + 1));
    client.searchGlobal.mockImplementation((query, { type } = {}) => {
      if (type === 'ayah') return { ayahs, ayahTotal: 25, total: 25 };
      return {};
    });

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'islam');
    act(() => { jest.advanceTimersByTime(350); });

    // Switch to Quran tab
    await waitFor(() => {
      fireEvent.press(getByText(/^Quran/));
    });

    // Flush pending promises from Effect B auto-load
    await act(() => Promise.resolve());
    await act(() => Promise.resolve());

    await expect(getByText('Muat Lainnya')).toBeTruthy();
  });

  it('shows loading state', async () => {
    client.searchGlobal.mockImplementation(() => new Promise(() => {}));

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'islam');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(getByText(/Mencari/)).toBeTruthy();
    });
  });

  it('shows empty results state', async () => {
    client.searchGlobal.mockResolvedValue({});

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'zzzzz');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(getByText('Belum ada hasil')).toBeTruthy();
    });
  });

  it('handles error during search with message', async () => {
    client.searchGlobal.mockRejectedValue(new Error('Network error'));

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'islam');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(getByText(/Sebagian hasil/i)).toBeTruthy();
    });
  });

  it('pressing a quick suggestion sets the query', async () => {
    const { getByText, getByTestId } = await renderGlobalSearchScreen();

    fireEvent.press(getByText('shalat'));

    expect(getByTestId('search-input').props.value).toBe('shalat');
  });

  it('shows feature results when matching', async () => {
    client.searchGlobal.mockResolvedValue({});

    const { getByTestId, getByText } = await renderGlobalSearchScreen();

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'kiblat');

    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      expect(getByText('Fitur')).toBeTruthy();
      expect(getByText('Kiblat')).toBeTruthy();
    });
  });

  it('calls onOpenTab with correct params when pressing a result', async () => {
    const onOpenTab = jest.fn();
    client.searchGlobal.mockImplementation((query, { type } = {}) => {
      if (type === 'ayah') return { ayahs: [mockAyah(1)], ayahTotal: 1, total: 1 };
      return {};
    });

    const { getByTestId, getAllByTestId } = await renderGlobalSearchScreen({ onOpenTab });

    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'fatihah');
    act(() => { jest.advanceTimersByTime(350); });

    await waitFor(() => {
      const cards = getAllByTestId('content-card');
      expect(cards.length).toBeGreaterThan(0);
      fireEvent.press(cards[0]);
    });

    expect(onOpenTab).toHaveBeenCalledWith('quran', {
      ayahId: 1,
      ayahNumber: 1,
      surahNumber: 1,
    });
  });
});
