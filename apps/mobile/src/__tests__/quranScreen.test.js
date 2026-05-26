jest.setTimeout(15000);

jest.mock('../constants/quranFonts', () => ({
  QURAN_FONT_FAMILIES: { kitab: 'KitabFont', indopak: 'IndopakFont', naskh: 'NaskhFont' },
}));

jest.mock('../api/client', () => ({
  getSurahs: jest.fn().mockResolvedValue([]),
  getAyahsForSurahPage: jest.fn().mockResolvedValue({ items: [], hasMore: false, page: 0 }),
  getAyahById: jest.fn().mockResolvedValue(null),
  getAyahAudio: jest.fn().mockResolvedValue([
    {
      audio_url: 'https://example.com/audio.mp3',
      qari_name: 'Mishary Rashid Al-Afasy',
      qari_slug: 'mishary-rashid-alafasy',
    },
    {
      audio_url: 'https://example.com/sudais.mp3',
      qari_name: 'Abdul Rahman Al-Sudais',
      qari_slug: 'abdul-rahman-al-sudais',
    },
  ]),
  getAyahsForHizb: jest.fn().mockResolvedValue([]),
  getAyahsForPage: jest.fn().mockResolvedValue([]),
  getFirstAyahForSurah: jest.fn().mockResolvedValue(null),
  getHadithsForAyah: jest.fn().mockResolvedValue([]),
  getMunasabahForAyah: jest.fn().mockResolvedValue([]),
  getMufrodatByPage: jest.fn().mockResolvedValue([]),
  getTafsirForAyah: jest.fn().mockResolvedValue([]),
  getAsbabForAyah: jest.fn().mockResolvedValue([]),
  normalizeSurah: jest.fn((x) => x),
  normalizeAyah: jest.fn((x) => x),
  requestJson: jest.fn(),
}));

jest.mock('../api/personal', () => ({
  addBookmark: jest.fn().mockResolvedValue({ id: 'bm-1' }),
  deleteBookmark: jest.fn().mockResolvedValue({}),
  getBookmarks: jest.fn().mockResolvedValue([]),
  getHafalanList: jest.fn().mockResolvedValue([]),
  getHafalanSummary: jest.fn().mockResolvedValue(null),
  getMurojaahSession: jest.fn().mockResolvedValue([]),
  getQuranProgress: jest.fn().mockResolvedValue(null),
  saveMurojaahResult: jest.fn().mockResolvedValue({}),
  saveQuranProgress: jest.fn().mockResolvedValue({}),
  updateHafalanStatus: jest.fn().mockResolvedValue({}),
}));

jest.mock('../hooks/useQuranReaderPreferences', () => ({
  useQuranReaderPreferences: () => ({
    fontSize: 20,
    arabicFont: 'kitab',
    displayMode: 'line',
    memorizationMode: 'off',
    showTranslation: true,
    translationFontSize: 16,
    updateFontSize: jest.fn(),
    updateArabicFont: jest.fn(),
    updateDisplayMode: jest.fn(),
    updateMemorizationMode: jest.fn(),
    updateTranslationFontSize: jest.fn(),
  }),
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: jest.fn(),
}));

jest.mock('../context/TabActivityContext', () => ({
  useTabActivity: jest.fn(),
}));

jest.mock('../utils/audioPlayer', () => ({
  playAudioUrl: jest.fn(),
  stopAudio: jest.fn(),
}));

jest.mock('../storage/preferences', () => ({
  preferenceKeys: {
    quranAudioQari: 'quranAudioQari',
    quranAudioRange: 'quranAudioRange',
    quranAudioRepeat: 'quranAudioRepeat',
    quranAudioSpeed: 'quranAudioSpeed',
    quranTranslationFontSize: 'quranTranslationFontSize',
  },
  readPreference: jest.fn((key, defaultValue) => Promise.resolve(defaultValue)),
  writePreference: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'ArrowLeft', 'ArrowRight', 'BookOpen', 'Bookmark', 'BookmarkCheck',
    'ChevronDown', 'ChevronUp', 'CheckCircle2', 'Info', 'Minus', 'MoreVertical',
    'Pause', 'Plus', 'Save', 'Search', 'SkipBack', 'SkipForward',
    'SlidersHorizontal', 'StickyNote', 'Volume2',
    'X', 'XCircle', 'AlertCircle',
  ];
  names.forEach((n) => { icons[n] = n; });
  return icons;
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../components/Screen', () => ({
  Screen: ({ children, searchSlot, headerExtra, title, actions, subtitle }) => {
    const { View, Text } = require('react-native');
    return (
      <View>
        <Text testID="screen-title">{title}</Text>
        {actions}
        {searchSlot}
        {headerExtra}
        <Text testID="screen-subtitle">{subtitle}</Text>
        {children}
      </View>
    );
  },
}));

jest.mock('../components/Card', () => {
  const { View, Text } = require('react-native');
  return {
    Card: ({ children, style }) => <View style={style}>{children}</View>,
    CardTitle: ({ children }) => <Text testID="card-title">{children}</Text>,
  };
});

jest.mock('../components/Paper', () => {
  const { Pressable, Text, View, TextInput } = require('react-native');
  return {
    IconActionButton: ({ label, onPress, disabled }) => (
      <Pressable onPress={onPress} disabled={disabled} testID={`action-${label}`}>
        <Text>{label}</Text>
      </Pressable>
    ),
    ActionPill: ({ label, onPress }) => (
      <Pressable onPress={onPress} testID={`pill-${label}`}>
        <Text>{label}</Text>
      </Pressable>
    ),
    EmptyState: ({ title, description }) => (
      <View testID="empty-state">
        <Text testID="empty-title">{title}</Text>
        {description ? <Text>{description}</Text> : null}
      </View>
    ),
    PaperSearchInput: ({ value, onChangeText, placeholder }) => (
      <TextInput
        testID="search-input"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    ),
  };
});

jest.mock('../components/AppActionSheet', () => ({
  AppActionSheet: ({ visible, children, title }) => {
    const { View, Text } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="action-sheet">
        <Text testID="action-sheet-title">{title}</Text>
        {children}
      </View>
    );
  },
  ActionSheetRow: ({ title, onPress, disabled, subtitle }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress} disabled={disabled} testID={`sheet-row-${title}`}>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
      </Pressable>
    );
  },
}));

jest.mock('../components/AppModalSheet', () => ({
  AppModalSheet: ({ visible, children, title }) => {
    const { View, Text } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="modal-sheet">
        <Text testID="modal-title">{title}</Text>
        {children}
      </View>
    );
  },
}));

jest.mock('../components/NotesPanel', () => ({
  NotesPanel: () => {
    const { Text } = require('react-native');
    return <Text testID="notes-panel">NotesPanel</Text>;
  },
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QuranScreen } from '../screens/QuranScreen';
import { flushAsyncWork } from '../test-utils/async';

const { useSession } = require('../context/SessionContext');
const { useFeedback } = require('../context/FeedbackContext');
const { useTabActivity } = require('../context/TabActivityContext');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');
const client = require('../api/client');
const personal = require('../api/personal');
const audioPlayer = require('../utils/audioPlayer');
const preferences = require('../storage/preferences');

const mockSurah = (number, overrides = {}) => ({
  number,
  name: `Surah ${number}`,
  arabic: `\u0633\u0648\u0631\u0629 ${number}`,
  meaning: `The ${number}`,
  ayahs: 7,
  key: `surah:${number}`,
  ...overrides,
});

const mockAyah = (id, surahNumber = 1, overrides = {}) => ({
  id,
  number: id,
  surahNumber,
  surahName: 'Al-Fatihah',
  arabic: `\u0622\u064a\u0629 ${id}`,
  translation: `Ayah ${id} translation`,
  juzNumber: 1,
  pageNumber: 1,
  hizbNumber: 1,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useSession.mockReturnValue({ user: null, loading: false });
  useFeedback.mockReturnValue({
    showError: jest.fn(), showInfo: jest.fn(), showSuccess: jest.fn(),
  });
  useTabActivity.mockReturnValue({ notifyTabActivity: jest.fn() });
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
  client.getSurahs.mockResolvedValue([mockSurah(1), mockSurah(2)]);
  client.getAyahsForSurahPage.mockResolvedValue({
    items: [mockAyah(1, 1), mockAyah(2, 1), mockAyah(3, 1)],
    hasMore: false,
    page: 0,
  });
  preferences.readPreference.mockImplementation((key, defaultValue) => Promise.resolve(defaultValue));
});

const mockNavigation = { setBack: jest.fn(), clearBack: jest.fn(), closeAndOpen: jest.fn() };

const renderQuranScreen = async (props = {}) => {
  const view = render(
    <QuranScreen isActive navigation={mockNavigation} {...props} />,
  );
  await flushAsyncWork();
  return view;
};

afterEach(() => {
  jest.useRealTimers();
});

describe('QuranScreen', () => {
  it('renders surah list on mount', async () => {
    const { getByTestId, getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Al-Qur\'an')).toBeTruthy();
      expect(getByTestId('quran-classic-list')).toBeTruthy();
    });

    await waitFor(() => {
      expect(client.getSurahs).toHaveBeenCalled();
      expect(getByText('Surah 1')).toBeTruthy();
      expect(getByText('Surah 2')).toBeTruthy();
    });
  });

  it('uses web app Quran list surface when web app layout is active', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByPlaceholderText, getByTestId, getByText, queryByTestId, queryByText } =
      await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('القُرآنُ الكَرِيم')).toBeTruthy();
      expect(getByText('Al-Quran')).toBeTruthy();
      expect(getByText(/114 Surah/)).toBeTruthy();
      expect(getByPlaceholderText('Cari surah...')).toBeTruthy();
      expect(getByText('Navigasi Mushaf')).toBeTruthy();
      expect(getByTestId('quran-web-app-list')).toBeTruthy();
    });
    expect(queryByText('Hafalan')).toBeNull();
    expect(queryByText('Murojaah')).toBeNull();
    expect(queryByTestId('quran-classic-list')).toBeNull();
  });

  it('opens mushaf navigation from the web app Quran CTA', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    client.getAyahsForPage.mockResolvedValue([mockAyah(1, 1)]);

    const { getByTestId } = await renderQuranScreen();

    fireEvent.press(await waitFor(() => getByTestId('quran-web-app-mushaf-cta')));

    await waitFor(() => {
      expect(client.getAyahsForPage).toHaveBeenCalledWith(1);
      expect(getByTestId('quran-web-app-reader')).toBeTruthy();
    });
  });

  it('uses web app Quran reader surface without changing ayah loading', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByTestId, getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(client.getAyahsForSurahPage).toHaveBeenCalledWith(1, expect.any(Object));
      expect(getByTestId('quran-web-app-reader')).toBeTruthy();
      expect(getByText('The 1 · 7 ayah')).toBeTruthy();
      expect(getByText('2. Surah 2')).toBeTruthy();
    });
  });

  it('uses web app Quran detail surface without changing ayah detail flow', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getAllByText, getByTestId, getByText, queryByTestId } = await renderQuranScreen();

    fireEvent.press(await waitFor(() => getByText('Surah 1')));
    fireEvent.press((await waitFor(() => getAllByText('Ketuk untuk membaca lengkap')))[0]);

    await waitFor(() => {
      expect(getByText('Detail Ayat')).toBeTruthy();
      expect(getByTestId('quran-web-app-detail')).toBeTruthy();
    });
    expect(queryByTestId('quran-classic-detail')).toBeNull();
  });

  it('shows loading state when surahs not yet loaded', async () => {
    client.getSurahs.mockImplementation(() => new Promise(() => {}));

    await renderQuranScreen();

    expect(client.getSurahs).toHaveBeenCalled();
  });

  it('filters surahs by search query', async () => {
    const { getByPlaceholderText, getByText, queryByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Cari...');
    fireEvent.changeText(searchInput, 'Surah 2');

    await waitFor(() => {
      expect(queryByText('Surah 1')).toBeNull();
      expect(getByText('Surah 2')).toBeTruthy();
    });
  });

  it('opens ayah view when surah is pressed', async () => {
    const { getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(client.getAyahsForSurahPage).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  it('loads only a small page window when opened from a far target ayah', async () => {
    client.getSurahs.mockResolvedValue([mockSurah(1, { ayahs: 120 })]);
    client.getAyahsForSurahPage.mockImplementation((surahNumber, { page, size }) => {
      const firstAyah = page * size + 1;
      const items = Array.from({ length: size }, (_, index) =>
        mockAyah(firstAyah + index, surahNumber, { pageNumber: page + 1 }),
      );
      return Promise.resolve({ items, hasMore: page < 5, page });
    });

    await renderQuranScreen({
      deepLinkTarget: { id: 'quran-target-65', params: { surahNumber: 1, ayahNumber: 65 } },
    });

    await waitFor(() => {
      expect(client.getAyahsForSurahPage).toHaveBeenCalledTimes(3);
    });

    const loadedPages = client.getAyahsForSurahPage.mock.calls.map(([, options]) => options.page);
    expect(loadedPages).toEqual([2, 3, 4]);
    expect(loadedPages).not.toContain(0);
    expect(loadedPages).not.toContain(1);
  });

  it('shows "Hafalan" tab with content', async () => {
    const { getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Hafalan')).toBeTruthy();
    });

    fireEvent.press(getByText('Hafalan'));

    await waitFor(() => {
      expect(getByText(/Buka Profil untuk masuk/i)).toBeTruthy();
    });
  });

  it('shows memorization mode selector in settings', async () => {
    const { getByText, getByTestId } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(getByTestId('action-Menu baca')).toBeTruthy();
    });

    fireEvent.press(getByTestId('action-Menu baca'));

    await waitFor(() => {
      expect(getByText('Pengaturan tampilan')).toBeTruthy();
    });

    fireEvent.press(getByText('Pengaturan tampilan'));

    await waitFor(() => {
      expect(getByTestId('modal-sheet')).toBeTruthy();
      expect(getByText('Mode Hafalan')).toBeTruthy();
      expect(getByText('Ukuran Teks Terjemahan')).toBeTruthy();
      expect(getByText('16px')).toBeTruthy();
      expect(getByText('Normal')).toBeTruthy();
      expect(getByText('Sembunyikan Arab')).toBeTruthy();
      expect(getByText('Sembunyikan Terjemah')).toBeTruthy();
      expect(getByText('Latihan Penuh')).toBeTruthy();
    });
  });

  it('renders bookmark and note buttons in ayah action sheet', async () => {
    useSession.mockReturnValue({ user: { id: 'user-1' }, loading: false });
    const { getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(client.getAyahsForSurahPage).toHaveBeenCalled();
    });
  });

  it('toggles quran tabs (Surah / Hafalan / Murojaah)', async () => {
    const { getByText, queryByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah')).toBeTruthy();
      expect(getByText('Hafalan')).toBeTruthy();
      expect(getByText('Murojaah')).toBeTruthy();
    });

    fireEvent.press(getByText('Murojaah'));

    await waitFor(() => {
      expect(getByText(/Buka Profil untuk masuk/i)).toBeTruthy();
    });
  });

  it('shows murojaah tab when user is logged in', async () => {
    useSession.mockReturnValue({ user: { id: 'user-1' }, loading: false });
    const { getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Murojaah')).toBeTruthy();
    });

    fireEvent.press(getByText('Murojaah'));

    await waitFor(() => {
      expect(getByText(/Pilih surah yang sudah hafal/i)).toBeTruthy();
    });
  });

  it('shows reader header when surah is opened', async () => {
    const { getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
      expect(getByText(/7 ayah/)).toBeTruthy();
    });
  });

  it('plays configured quran audio range with qari, repeat, and speed', async () => {
    const { getByTestId, getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(getByText('Audio Surat')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('audio-start-surah'), '1');
    fireEvent.changeText(getByTestId('audio-end-surah'), '1');
    fireEvent.changeText(getByTestId('audio-end-ayah'), '2');
    fireEvent.press(getByText('Abdul Rahman Al-Sudais'));
    fireEvent.press(getByText('1.25x'));
    fireEvent.press(getByTestId('audio-repeat-toggle'));
    fireEvent.press(getByTestId('audio-range-toggle'));

    await waitFor(() => {
      expect(client.getAyahAudio).toHaveBeenCalled();
      expect(audioPlayer.playAudioUrl).toHaveBeenCalledWith(
        'https://example.com/sudais.mp3',
        expect.objectContaining({ rate: 1.25, onEnded: expect.any(Function) }),
      );
    });
    expect(preferences.writePreference).toHaveBeenCalledWith(
      'quranAudioQari',
      'abdul-rahman-al-sudais',
    );
    expect(preferences.writePreference).toHaveBeenCalledWith('quranAudioSpeed', 1.25);
    expect(preferences.writePreference).toHaveBeenCalledWith('quranAudioRepeat', true);
  });

  it('minimizes range audio player and skips queue items', async () => {
    const { getByTestId, getByText } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(getByText('Audio Surat')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('audio-start-surah'), '1');
    fireEvent.changeText(getByTestId('audio-end-surah'), '1');
    fireEvent.changeText(getByTestId('audio-end-ayah'), '3');
    fireEvent.press(getByTestId('audio-range-toggle'));

    await waitFor(() => {
      expect(getByText('1/3')).toBeTruthy();
    });

    fireEvent.press(getByTestId('audio-range-next'));

    await waitFor(() => {
      expect(getByText('2/3')).toBeTruthy();
    });

    fireEvent.press(getByTestId('audio-range-minimize'));

    await waitFor(() => {
      expect(getByTestId('audio-range-mini')).toBeTruthy();
    });

    fireEvent.press(getByTestId('audio-range-expand'));

    await waitFor(() => {
      expect(getByText('Audio Surat')).toBeTruthy();
    });
  });

  it('shows reader menu button when surah is opened', async () => {
    const { getByText, getByTestId } = await renderQuranScreen();

    await waitFor(() => {
      expect(getByText('Surah 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Surah 1'));

    await waitFor(() => {
      expect(getByTestId('action-Menu baca')).toBeTruthy();
      expect(getByTestId('action-Kembali ke daftar surah')).toBeTruthy();
    });
  });

  it('renders munasabah results from ayah detail bottom sheet', async () => {
    client.getMunasabahForAyah.mockResolvedValue([
      {
        id: 'm-1',
        ayahFrom: mockAyah(1, 1),
        ayahTo: mockAyah(1, 2, { surahName: 'Al-Baqarah' }),
        description: 'Keterkaitan tema hidayah antar ayat.',
      },
    ]);

    const { findByText, getAllByText, getByText } = await renderQuranScreen();

    fireEvent.press(await findByText('Surah 1'));
    fireEvent.press((await waitFor(() => getAllByText('Ketuk untuk membaca lengkap')))[0]);
    fireEvent.press(await findByText('Ayat Terkait'));

    await waitFor(() => {
      expect(client.getMunasabahForAyah).toHaveBeenCalledWith(1);
      expect(getByText('Keterkaitan tema hidayah antar ayat.')).toBeTruthy();
    });

    fireEvent.press(getByText('Al-Fatihah · Ayat 1 → Al-Baqarah · Ayat 1'));

    expect(mockNavigation.closeAndOpen).toHaveBeenCalledWith('quran', 'quran', {
      ayahId: 1,
      ayahNumber: 1,
      surahNumber: 2,
    });
  });

  it('renders hadith cross references from ayah detail bottom sheet', async () => {
    client.getHadithsForAyah.mockResolvedValue([
      {
        id: 'ha-1',
        catatan: 'Rujukan niat.',
        hadith: { id: 10, book: 'Shahih Bukhari', number: 1, translation: 'Setiap amal tergantung niat.' },
      },
    ]);

    const { findByText, getAllByText, getByText } = await renderQuranScreen();

    fireEvent.press(await findByText('Surah 1'));
    fireEvent.press((await waitFor(() => getAllByText('Ketuk untuk membaca lengkap')))[0]);
    fireEvent.press(await findByText('Hadis Terkait'));

    await waitFor(() => {
      expect(client.getHadithsForAyah).toHaveBeenCalledWith(1);
      expect(getByText('Setiap amal tergantung niat.')).toBeTruthy();
    });

    fireEvent.press(getByText('Shahih Bukhari · 1'));

    expect(mockNavigation.closeAndOpen).toHaveBeenCalledWith('quran', 'hadith', {
      hadithId: 10,
    });
  });
});
