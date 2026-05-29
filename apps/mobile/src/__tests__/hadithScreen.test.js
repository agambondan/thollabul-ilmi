jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: jest.fn(),
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

jest.mock('../api/client', () => ({
  getAyahsForHadith: jest.fn(),
  getHadithBooks: jest.fn(),
  getHadithPage: jest.fn(),
  getHadithDetail: jest.fn(),
  getHadithSanad: jest.fn(),
  getHadithTakhrij: jest.fn(),
  getRelatedHadiths: jest.fn(),
  getPerawiDetail: jest.fn(),
  getPerawiJarhTadil: jest.fn(),
  getPerawiGuru: jest.fn(),
  getPerawiMurid: jest.fn(),
  normalizeHadith: jest.fn((x) => x),
  pickItems: jest.fn((x) => x?.items ?? x ?? []),
}));

jest.mock('../api/personal', () => ({
  addBookmark: jest.fn(),
  deleteBookmark: jest.fn(),
  getBookmarks: jest.fn(),
  getNotesByType: jest.fn(),
}));

jest.mock('../storage/offlineContent', () => ({
  getOfflineItems: jest.fn(),
  getOfflineOverview: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'ArrowLeft', 'BookOpen', 'Bookmark', 'BookmarkCheck', 'MoreVertical',
    'Search', 'AlertCircle', 'CheckCircle2', 'Info', 'X', 'XCircle',
  ];
  names.forEach((n) => { icons[n] = n; });
  return icons;
});

jest.mock('../components/Screen', () => ({
  Screen: ({ children, searchSlot, title }) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text testID="screen-title">{title}</Text>
        {searchSlot}
        {children}
      </View>
    );
  },
}));

jest.mock('../components/Card', () => {
  const { View, Text } = require('react-native');
  return {
    Card: ({ children }) => <View>{children}</View>,
    CardTitle: ({ children, meta }) => (
      <View>
        <Text>{children}</Text>
        {meta && <Text>{meta}</Text>}
      </View>
    ),
  };
});

jest.mock('../components/ContentCard', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ContentCard: ({ title, subtitle, onPress }) => (
      <Pressable onPress={onPress} testID="content-card">
        <Text testID="card-title">{title}</Text>
        {subtitle && <Text testID="card-subtitle">{subtitle}</Text>}
      </Pressable>
    ),
  };
});

jest.mock('../components/Paper', () => {
  const { TextInput, Pressable, Text } = require('react-native');
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
    ActionPill: ({ label, onPress }) => (
      <Pressable onPress={onPress} testID={`pill-${label}`}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

jest.mock('../components/AppActionSheet', () => ({
  AppActionSheet: ({ visible, children }) => (visible ? children : null),
  ActionSheetRow: ({ title, onPress }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress} testID={`sheet-row-${title}`}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

jest.mock('../components/NotesPanel', () => ({
  NotesPanel: () => {
    const { Text } = require('react-native');
    return <Text testID="notes-panel">NotesPanel</Text>;
  },
}));

jest.mock('../components/SectionHeader', () => ({
  SectionHeader: ({ title, meta }) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text>{title}</Text>
        {meta && <Text>{meta}</Text>}
      </View>
    );
  },
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { HadithScreen } from '../screens/HadithScreen';

const { useSession } = require('../context/SessionContext');
const { useFeedback } = require('../context/FeedbackContext');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');
const clientApi = require('../api/client');
const personalApi = require('../api/personal');
const { getOfflineOverview } = require('../storage/offlineContent');

const mockBooks = [
  { id: 1, slug: 'bukhari', name: 'Shahih Bukhari', count: 100 },
  { id: 2, slug: 'muslim', name: 'Shahih Muslim', count: 80 },
];

const mockHadithItem = (id, overrides = {}) => ({
  id,
  book: 'Shahih Bukhari',
  bookSlug: 'bukhari',
  number: id,
  grade: 'Shahih',
  translation: `Narrated hadith ${id} text.`,
  arabic: `\u0627\u0644\u062d\u062f\u064a\u062b ${id}`,
  ...overrides,
});

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
  useFeedback.mockReturnValue({
    showError: jest.fn(),
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
  });
  useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: false });
  getOfflineOverview.mockResolvedValue({ supported: false });
  clientApi.getHadithBooks.mockResolvedValue(mockBooks);
  clientApi.getHadithPage.mockResolvedValue({
    items: [mockHadithItem(1), mockHadithItem(2)],
    page: 0,
    hasMore: false,
    total: 2,
  });
  clientApi.getAyahsForHadith.mockResolvedValue([]);
  clientApi.getHadithDetail.mockResolvedValue(mockHadithItem(1));
  clientApi.getHadithSanad.mockResolvedValue([]);
  clientApi.getHadithTakhrij.mockResolvedValue([]);
  clientApi.getRelatedHadiths.mockResolvedValue([]);
  clientApi.getPerawiDetail.mockResolvedValue(null);
  clientApi.getPerawiJarhTadil.mockResolvedValue([]);
  clientApi.getPerawiGuru.mockResolvedValue([]);
  clientApi.getPerawiMurid.mockResolvedValue([]);
  personalApi.getBookmarks.mockResolvedValue([]);
  personalApi.getNotesByType.mockResolvedValue([]);
});

describe('HadithScreen', () => {
  test('renders title and search input', async () => {
    const { getByTestId, getByText } = render(<HadithScreen isActive />);
    await waitFor(() => {
      expect(getByText('Hadis')).toBeTruthy();
      expect(getByTestId('search-input')).toBeTruthy();
      expect(getByTestId('hadith-classic-list')).toBeTruthy();
    });
  });

  test('uses web app Hadith list surface when web app layout is active', async () => {
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    const { getAllByText, getByPlaceholderText, getByTestId, getByText, queryByTestId } =
      render(<HadithScreen isActive />);

    await waitFor(() => {
      expect(getByText('Book')).toBeTruthy();
      expect(getByText('Theme')).toBeTruthy();
      expect(getByText('Chapter')).toBeTruthy();
      expect(getAllByText('Hadith').length).toBeGreaterThanOrEqual(1);
      expect(getByPlaceholderText('Cari nomor, kitab, tema, atau teks hadis')).toBeTruthy();
      expect(getAllByText('Buka Reader').length).toBeGreaterThanOrEqual(1);
      expect(getByTestId('hadith-web-app-list')).toBeTruthy();
    });
    expect(queryByTestId('hadith-classic-list')).toBeNull();
  });

  test('uses light web app Hadith palette when theme is light', async () => {
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    const { getByTestId, getByText } = render(<HadithScreen isActive />);

    await waitFor(() => expect(getByText('Book')).toBeTruthy());

    expect(StyleSheet.flatten(getByTestId('hadith-web-app-scroll').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#ffffff' }),
    );
    expect(StyleSheet.flatten(getByTestId('hadith-web-app-search').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#ffffff', borderColor: '#a7f3d0' }),
    );
  });

  test('keeps dark web app Hadith palette when theme is dark', async () => {
    useLayoutModePreference.mockReturnValue({ isDarkTheme: true, isWebAppLayout: true });
    const { getByTestId, getByText } = render(<HadithScreen isActive />);

    await waitFor(() => expect(getByText('Book')).toBeTruthy());

    expect(StyleSheet.flatten(getByTestId('hadith-web-app-scroll').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#020617' }),
    );
    expect(StyleSheet.flatten(getByTestId('hadith-web-app-search').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#1e293b', borderColor: '#475569' }),
    );
  });

  test('opens a web app Hadith book reader using the existing book filter', async () => {
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    const { getAllByText, findAllByText } = render(<HadithScreen isActive />);

    fireEvent.press((await waitFor(() => getAllByText('Buka Reader')))[0]);

    expect((await findAllByText('Shahih Bukhari')).length).toBeGreaterThanOrEqual(1);
    await waitFor(() => {
      expect(clientApi.getHadithPage).toHaveBeenCalledWith(
        expect.objectContaining({ bookSlug: 'bukhari' }),
      );
    });
  });

  test('loads books and displays them in filter row', async () => {
    const { findByText, findAllByText } = render(<HadithScreen isActive />);
    expect(await findByText('Semua')).toBeTruthy();
    const bukhariElements = await findAllByText('Shahih Bukhari');
    expect(bukhariElements.length).toBeGreaterThanOrEqual(1);
  });

  test('renders hadith list after fetch', async () => {
    const { findAllByTestId } = render(<HadithScreen isActive />);
    const cards = await findAllByTestId('content-card');
    expect(cards.length).toBe(2);
  });

  test('shows list summary with book name', async () => {
    const { findByText } = render(<HadithScreen isActive />);
    expect(await findByText('Semua kitab')).toBeTruthy();
  });

  test('shows notice when user is not logged in', async () => {
    const { findByText } = render(<HadithScreen isActive />);
    expect(await findByText(/Buka Profil untuk masuk/)).toBeTruthy();
  });

  test('handles API error gracefully', async () => {
    clientApi.getHadithPage.mockRejectedValue(new Error('Network error'));

    const { findByText } = render(<HadithScreen isActive />);
    expect(await findByText('Network error')).toBeTruthy();
  });

  test('search input filters hadith list', async () => {
    clientApi.getHadithPage.mockResolvedValue({
      items: [
        mockHadithItem(1, { translation: 'First hadith text' }),
        mockHadithItem(2, { translation: 'Second different text' }),
      ],
      page: 0,
      hasMore: false,
      total: 2,
    });

    const { getByTestId, findAllByTestId, queryAllByTestId } = render(<HadithScreen isActive />);
    expect(await findAllByTestId('content-card')).toHaveLength(2);

    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'First');

    await waitFor(() => {
      expect(queryAllByTestId('content-card')).toHaveLength(1);
    });
  });

  test('clear search shows all hadiths', async () => {
    const { getByTestId, findAllByTestId, queryAllByTestId } = render(<HadithScreen isActive />);
    expect(await findAllByTestId('content-card')).toHaveLength(2);

    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(queryAllByTestId('content-card')).toHaveLength(0);
    });

    fireEvent.changeText(searchInput, '');

    await waitFor(() => {
      expect(queryAllByTestId('content-card')).toHaveLength(2);
    });
  });

  test('book selection renders', async () => {
    const { findByText } = render(<HadithScreen isActive />);
    expect(await findByText('Shahih Muslim')).toBeTruthy();
  });

  test('clicking hadith card opens detail view', async () => {
    clientApi.getHadithDetail.mockResolvedValue({
      id: 1, book: 'Shahih Bukhari', bookSlug: 'bukhari',
      number: 1, grade: 'Shahih', translation: 'Detail text',
    });
    clientApi.getHadithSanad.mockResolvedValue([]);
    clientApi.getHadithTakhrij.mockResolvedValue([]);
    clientApi.getRelatedHadiths.mockResolvedValue([]);

    const { findAllByTestId, findByText } = render(<HadithScreen isActive />);
    const cards = await findAllByTestId('content-card');

    fireEvent.press(cards[0]);

    expect(await findByText('Detail Hadis')).toBeTruthy();
  });

  test('uses web app Hadith detail surface without changing detail loading', async () => {
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    clientApi.getHadithDetail.mockResolvedValue({
      id: 1, book: 'Shahih Bukhari', bookSlug: 'bukhari',
      number: 1, grade: 'Shahih', translation: 'Detail text',
    });

    const { findAllByTestId, findByText, getAllByText, getByTestId } = render(<HadithScreen isActive />);
    fireEvent.press((await waitFor(() => getByTestId('hadith-web-app-book-bukhari'))));
    const cards = await findAllByTestId('content-card');

    fireEvent.press(cards[0]);

    await waitFor(() => {
      expect(getAllByText('Detail Hadith').length).toBeGreaterThanOrEqual(1);
    });
    expect(await findByText('Kembali ke daftar hadith')).toBeTruthy();
    expect(getByTestId('hadith-web-app-detail')).toBeTruthy();
  });

  test('detail view shows tab buttons', async () => {
    clientApi.getHadithDetail.mockResolvedValue({
      id: 1, book: 'Shahih Bukhari', bookSlug: 'bukhari',
      number: 1, grade: 'Shahih', translation: 'Detail text',
    });
    clientApi.getHadithSanad.mockResolvedValue([]);
    clientApi.getHadithTakhrij.mockResolvedValue([]);
    clientApi.getRelatedHadiths.mockResolvedValue([]);

    const { findAllByTestId, findByText } = render(<HadithScreen isActive />);
    const cards = await findAllByTestId('content-card');

    fireEvent.press(cards[0]);

    expect(await findByText('Teks')).toBeTruthy();
    expect(await findByText('Sanad')).toBeTruthy();
    expect(await findByText('Perawi')).toBeTruthy();
    expect(await findByText('Takhrij')).toBeTruthy();
    expect(await findByText('Catatan')).toBeTruthy();
  });

  test('detail view shows translation text', async () => {
    clientApi.getHadithDetail.mockResolvedValue({
      id: 1, book: 'Shahih Bukhari', bookSlug: 'bukhari',
      number: 1, grade: 'Shahih', translation: 'Detailed translation text here',
    });
    clientApi.getHadithSanad.mockResolvedValue([]);
    clientApi.getHadithTakhrij.mockResolvedValue([]);
    clientApi.getRelatedHadiths.mockResolvedValue([]);

    const { findAllByTestId, findByText } = render(<HadithScreen isActive />);
    const cards = await findAllByTestId('content-card');

    fireEvent.press(cards[0]);

    expect(await findByText('Detailed translation text here')).toBeTruthy();
  });

  test('opens related ayah from hadith detail in quran tab', async () => {
    const navigation = { clearBack: jest.fn(), closeAndOpen: jest.fn(), setBack: jest.fn() };
    clientApi.getHadithDetail.mockResolvedValue({
      id: 1, book: 'Shahih Bukhari', bookSlug: 'bukhari',
      number: 1, grade: 'Shahih', translation: 'Detail text',
    });
    clientApi.getAyahsForHadith.mockResolvedValue([
      {
        id: 'ha-1',
        catatan: 'Tema niat.',
        ayah: {
          id: 7,
          number: 7,
          surahName: 'Al-Fatihah',
          surahNumber: 1,
          translation: 'Jalan orang-orang yang Engkau beri nikmat.',
        },
      },
    ]);

    const { findAllByTestId, findByText, getByText } = render(
      <HadithScreen isActive navigation={navigation} />,
    );
    const cards = await findAllByTestId('content-card');

    fireEvent.press(cards[0]);
    fireEvent.press(await findByText('Ayat'));
    fireEvent.press(getByText('Al-Fatihah · Ayat 7'));

    await waitFor(() => {
      expect(navigation.closeAndOpen).toHaveBeenCalledWith('hadith', 'quran', {
        ayahId: 7,
        ayahNumber: 7,
        surahNumber: 1,
      });
    });
  });
});
