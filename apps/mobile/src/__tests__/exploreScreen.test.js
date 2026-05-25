jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'ArrowLeft', 'BookOpen', 'Bookmark', 'BookmarkCheck', 'CheckCircle2',
    'Circle', 'ExternalLink', 'Flag', 'Globe', 'Heart', 'HelpCircle',
    'ListChecks', 'MessageCircle', 'Pencil', 'Scale', 'Star',
    'StickyNote', 'Trash2', 'UserCircle', 'Users', 'Video',
  ];
  names.forEach((n) => { icons[n] = n; });
  return icons;
});

jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: jest.fn(),
}));

jest.mock('../api/explore', () => ({
  getAllNotes: jest.fn(),
  getAsmaulNames: jest.fn(),
  getBookmarkItems: jest.fn(),
  getFeatureItemPage: jest.fn(),
  getHijriOverview: jest.fn(),
  getQuizQuestions: jest.fn(),
  getZakatGoldPrice: jest.fn(),
  searchDictionary: jest.fn(),
}));

jest.mock('../api/social', () => ({
  createComment: jest.fn(),
  getCommentsByRef: jest.fn(),
  getFeedPostPage: jest.fn(),
  likeFeedPost: jest.fn(),
}));

jest.mock('../api/forum', () => ({
  acceptForumAnswer: jest.fn(),
  createForumAnswer: jest.fn(),
  createForumQuestion: jest.fn(),
  getForumQuestion: jest.fn(),
  getForumQuestions: jest.fn(),
  voteForum: jest.fn(),
}));

jest.mock('../utils/haptics', () => ({
  hapticMedium: jest.fn(),
  hapticTap: jest.fn(),
}));

jest.mock('../api/personal', () => ({
  addBookmark: jest.fn(),
  createUserWird: jest.fn(),
  deleteBookmark: jest.fn(),
  deleteUserWird: jest.fn(),
  getBookmarks: jest.fn(),
  getLibraryProgress: jest.fn(),
  getLibraryProgressList: jest.fn(),
  getTodayPrayerLog: jest.fn(),
  getUserWirds: jest.fn(),
  saveLibraryProgress: jest.fn(),
  savePrayerLog: jest.fn(),
  updateUserWird: jest.fn(),
}));

jest.mock('../api/client', () => ({
  getAyahById: jest.fn(),
  getSurahs: jest.fn(),
}));

jest.mock('../storage/recentFeatures', () => ({
  readPinnedFeatures: jest.fn(),
  readRecentFeatures: jest.fn(),
  rememberFeatureOpen: jest.fn(),
  togglePinnedFeature: jest.fn(),
}));

jest.mock('../components/Screen', () => {
  const { View, Text } = require('react-native');
  return {
    Screen: ({
      children, title, subtitle, actions, searchSlot, listData,
      renderListItem, listKeyExtractor, listFooter, contentStyle,
    }) => (
      <View style={contentStyle}>
        <View>
          <Text testID="screen-title">{title}</Text>
          {subtitle ? <Text testID="screen-subtitle">{subtitle}</Text> : null}
          {actions}
        </View>
        {searchSlot}
        {children}
        {Array.isArray(listData) && renderListItem ? (
          <View testID="screen-list">
            {listData.map((item, index) => (
              <View key={listKeyExtractor?.(item, index) ?? String(index)}>
                {renderListItem({ item, index })}
              </View>
            ))}
            {listFooter}
          </View>
        ) : null}
      </View>
    ),
  };
});

jest.mock('../components/Card', () => {
  const { View, Text } = require('react-native');
  return {
    Card: ({ children, style }) => <View style={style}>{children}</View>,
    CardTitle: ({ children, meta }) => (
      <View>
        <Text>{children}</Text>
        {meta ? <Text>{meta}</Text> : null}
      </View>
    ),
  };
});

jest.mock('../components/ContentCard', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ContentCard: ({ title, subtitle, onPress, onMenuPress, children, meta }) => (
      <Pressable onPress={onPress} onLongPress={onMenuPress} testID="content-card">
        <Text testID="card-title">{title}</Text>
        {subtitle ? <Text testID="card-subtitle">{subtitle}</Text> : null}
        {meta ? <Text testID="card-meta">{meta}</Text> : null}
        {children}
      </Pressable>
    ),
  };
});

jest.mock('../components/Paper', () => {
  const { Pressable, Text, TextInput, View } = require('react-native');
  return {
    PaperSearchInput: ({ value, onChangeText, placeholder }) => (
      <TextInput
        testID="search-input"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    ),
    CompactRow: ({ title, subtitle, onPress, Icon, right, badges, meta }) => (
      <Pressable onPress={onPress} testID="compact-row">
        <Text testID="row-title">{title}</Text>
        {subtitle ? <Text testID="row-subtitle">{subtitle}</Text> : null}
        {right}
      </Pressable>
    ),
    SectionHeader: ({ title, meta }) => (
      <View>
        <Text testID="section-title">{title}</Text>
        {meta ? <Text testID="section-meta">{meta}</Text> : null}
      </View>
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

jest.mock('../components/NotificationCenter', () => ({
  NotificationCenter: () => {
    const { Text } = require('react-native');
    return <Text testID="notification-center">NotificationCenter</Text>;
  },
}));

jest.mock('../data/mobileFeatures', () => {
  const allFeatures = [
    { key: 'tafsir', title: 'Tafsir', subtitle: 'Tafsir per surah', group: 'Ilmu', type: 'surah-content', contentType: 'tafsir' },
    { key: 'asmaul-flashcard', title: 'Flashcard Asmaul Husna', subtitle: 'Latihan hafalan', group: 'Ilmu', type: 'asmaul-flashcard' },
    { key: 'kamus', title: 'Kamus Arab', subtitle: 'Cari kosakata Arab', group: 'Alat', type: 'kamus' },
    { key: 'quiz', title: 'Quiz Islami', subtitle: 'Latihan soal', group: 'Alat', type: 'quiz' },
    { key: 'hijri', title: 'Kalender Hijri', subtitle: 'Hari ini', group: 'Alat', type: 'hijri' },
    { key: 'doa', title: 'Doa', subtitle: 'Doa harian', group: 'Bacaan', type: 'list', endpoint: '/api/v1/doa' },
    { key: 'asmaul-wirid', title: 'Wirid Asmaul Husna', subtitle: 'Dzikir 99 nama Allah', group: 'Bacaan', type: 'asmaul-wirid' },
    { key: 'bookmarks', title: 'Bookmark', subtitle: 'Tersimpan', group: 'Personal', type: 'bookmarks' },
    { key: 'notes', title: 'Catatan', subtitle: 'Catatan pribadi', group: 'Personal', type: 'notes' },
    { key: 'notifications', title: 'Notifikasi', subtitle: 'Inbox dan pengingat', group: 'Personal', type: 'notifications' },
    { key: 'goals', title: 'Target Belajar', subtitle: 'Target pembelajaran personal', group: 'Personal', type: 'protected-list', endpoint: '/api/v1/goals' },
    { key: 'muhasabah', title: 'Muhasabah', subtitle: 'Jurnal refleksi diri', group: 'Personal', type: 'protected-list', endpoint: '/api/v1/muhasabah' },
    { key: 'community-feed', title: 'Komunitas', subtitle: 'Refleksi', group: 'Ilmu', type: 'feed' },
    { key: 'kajian', title: 'Kajian', subtitle: 'Sesi belajar', group: 'Ilmu', type: 'list', endpoint: '/api/v1/kajian' },
    { key: 'forum', title: 'Forum Tanya Jawab', subtitle: 'Diskusi seputar Islam', group: 'Ilmu', type: 'forum' },
    { key: 'library', title: 'Perpustakaan', subtitle: 'Kitab dan bahan belajar', group: 'Ilmu', type: 'list', endpoint: '/api/v1/library/books?page=0&size=20' },
    { key: 'tasbih', title: 'Tasbih', subtitle: 'Penghitung', group: 'Alat', type: 'tasbih' },
    { key: 'zakat', title: 'Kalkulator Zakat', subtitle: 'Hitung zakat maal', group: 'Alat', type: 'zakat' },
    { key: 'siroh', title: 'Siroh', subtitle: 'Biografi Nabi', group: 'Ilmu', type: 'list', endpoint: '/api/v1/siroh' },
    { key: 'user-wird', title: 'Wirid Saya', subtitle: 'Wirid pribadi', group: 'Bacaan', type: 'user-wird' },
  ];

  const belajarFeatureGroups = [
    {
      key: 'kajian-artikel',
      label: 'Kajian & Artikel',
      meta: 'Belajar rutin',
      features: allFeatures.filter((f) => ['community-feed', 'kajian', 'forum'].includes(f.key)),
    },
    {
      key: 'referensi',
      label: 'Referensi',
      meta: 'Kamus dan katalog',
      features: allFeatures.filter((f) => ['kamus', 'tafsir', 'asmaul-flashcard', 'asmaul-wirid', 'library'].includes(f.key)),
    },
    {
      key: 'evaluasi',
      label: 'Evaluasi',
      meta: 'Latihan',
      features: allFeatures.filter((f) => ['quiz', 'zakat'].includes(f.key)),
    },
    {
      key: 'personal',
      label: 'Personal',
      meta: 'Akun',
      features: allFeatures.filter((f) => ['bookmarks', 'notes', 'notifications', 'goals', 'muhasabah'].includes(f.key)),
    },
  ];

  return { allFeatures, belajarFeatureGroups };
});

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { flushAsyncWork } from '../test-utils/async';

jest.setTimeout(15000);
import { ExploreScreen } from '../screens/ExploreScreen';

const { useSession } = require('../context/SessionContext');
const { useFeedback } = require('../context/FeedbackContext');
const exploreApi = require('../api/explore');
const forumApi = require('../api/forum');
const clientApi = require('../api/client');
const personalApi = require('../api/personal');
const haptics = require('../utils/haptics');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');
const { readPinnedFeatures, readRecentFeatures, rememberFeatureOpen, togglePinnedFeature } = require('../storage/recentFeatures');

const defaultNavigation = {
  current: { view: undefined, params: {} },
  open: jest.fn(),
  close: jest.fn(),
  setBack: jest.fn(),
  clearBack: jest.fn(),
};

const renderExploreScreen = async (props = {}) => {
  const view = render(
    <ExploreScreen
      isActive
      navigation={defaultNavigation}
      onOpenTab={jest.fn()}
      {...props}
    />,
  );
  await flushAsyncWork();
  return view;
};

const mockUseSession = () => ({
  error: '', loading: false, session: null, signIn: jest.fn(), signOut: jest.fn(), user: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  useSession.mockReturnValue(mockUseSession());
  useFeedback.mockReturnValue({
    showError: jest.fn(), showInfo: jest.fn(), showSuccess: jest.fn(),
  });
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
  readPinnedFeatures.mockResolvedValue([]);
  readRecentFeatures.mockResolvedValue([]);
  rememberFeatureOpen.mockResolvedValue([]);
  togglePinnedFeature.mockResolvedValue({ items: [], pinned: false });
});

describe('ExploreScreen', () => {
  test('renders screen title and subtitle', async () => {
    const { getByTestId } = await renderExploreScreen();
    expect(getByTestId('screen-title')).toBeTruthy();
    expect(getByTestId('screen-subtitle')).toBeTruthy();
    expect(getByTestId('explore-classic-surface')).toBeTruthy();
  });

  test('uses web app Explore surface when web app layout is active', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByTestId, getByText, queryByTestId } = await renderExploreScreen();

    expect(getByTestId('explore-web-app-surface')).toBeTruthy();
    expect(queryByTestId('explore-classic-surface')).toBeNull();
    expect(queryByTestId('screen-title')).toBeNull();
    expect(getByText('KONTEN ISLAM')).toBeTruthy();
    expect(getByText('Belajar')).toBeTruthy();
    expect(getByText('KAJIAN & ARTIKEL')).toBeTruthy();
    expect(getByText('REFERENSI')).toBeTruthy();

    fireEvent.press(getByText('Kamus Arab'));

    await waitFor(() => {
      expect(getByTestId('action-Kembali ke Belajar')).toBeTruthy();
      expect(getByTestId('explore-web-app-surface')).toBeTruthy();
    });
  });

  test('uses dashboard Bookmark route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);
    exploreApi.getBookmarkItems.mockResolvedValueOnce([
      {
        id: 'bm-1',
        title: 'Al-Fatihah ayat 1',
        body: 'Dengan nama Allah Yang Maha Pengasih.',
        meta: 'ayah',
        raw: { ref_type: 'ayah', ref_id: '1:1', ref_slug: 'al-fatihah' },
      },
      {
        id: 'bm-2',
        title: 'Hadith niat',
        body: 'Sesungguhnya amal itu tergantung niatnya.',
        meta: 'hadith',
        raw: { ref_type: 'hadith', ref_id: '1', ref_slug: 'bukhari' },
      },
    ]);

    const { getAllByText, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'bookmarks-route', params: { featureKey: 'bookmarks' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-bookmarks-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PERSONAL')).toBeTruthy();
      expect(getByText('Al-Fatihah ayat 1')).toBeTruthy();
      expect(getByText('Hadith niat')).toBeTruthy();
      expect(getAllByText('Al-Quran').length).toBeGreaterThan(0);
      expect(getAllByText('Hadith').length).toBeGreaterThan(0);
    });
  });

  test('uses dashboard Notes route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);
    exploreApi.getAllNotes.mockResolvedValueOnce([
      {
        id: 'note-1',
        title: 'Catatan Tadabbur',
        body: 'Refleksi dari kajian tafsir.',
        meta: 'catatan',
        raw: { date: '2026-05-25', tags: ['quran', 'tadabbur'] },
      },
      {
        id: 'note-2',
        title: 'Fiqh Muamalah',
        body: 'Ringkasan materi pekanan.',
        meta: 'catatan',
        raw: { date: '2026-05-24', tags: ['fiqh'] },
      },
    ]);

    const { getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'notes-route', params: { featureKey: 'notes' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-notes-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PERSONAL')).toBeTruthy();
      expect(getByText('Catatan')).toBeTruthy();
      expect(getByText('Catatan Tadabbur')).toBeTruthy();
      expect(getByText('Fiqh Muamalah')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('web-app-notes-search'), 'tadabbur');

    expect(getByText('Catatan Tadabbur')).toBeTruthy();
    expect(queryByText('Fiqh Muamalah')).toBeNull();
  });

  test('uses dashboard Notifications route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);

    const { getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'notifications-route', params: { featureKey: 'notifications' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-notifications-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PERSONAL')).toBeTruthy();
      expect(getByText('Notifikasi')).toBeTruthy();
      expect(getByTestId('notification-center')).toBeTruthy();
    });
  });

  test('uses dashboard Goals route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'goal-1',
          title: 'Hafalan Juz 30',
          body: 'Selesaikan murajaah pekan ini.',
          meta: 'Quran',
          raw: {
            category: 'Quran',
            current: 18,
            deadline: '2026-06-01',
            target: 30,
            unit: 'ayat',
          },
        },
        {
          id: 'goal-2',
          title: 'Kajian Fiqh',
          body: 'Tuntaskan modul dasar.',
          meta: 'Ilmu',
          raw: {
            category: 'Ilmu',
            completed: true,
            current: 4,
            target: 4,
            unit: 'pertemuan',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'goals-route', params: { featureKey: 'goals' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-goals-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PERSONAL')).toBeTruthy();
      expect(getByText('Target Belajar')).toBeTruthy();
      expect(getByText('Hafalan Juz 30')).toBeTruthy();
      expect(getByText('Kajian Fiqh')).toBeTruthy();
      expect(getByText('1 aktif')).toBeTruthy();
      expect(getByText('1 selesai')).toBeTruthy();
      expect(getAllByTestId('web-app-goal-card')).toHaveLength(2);
      expect(getAllByTestId('web-app-goal-progress-fill')).toHaveLength(2);
    });

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'goals', endpoint: '/api/v1/goals' }),
      { page: 0, size: 20 },
    );
  });

  test('uses dashboard Muhasabah route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'muhasabah-1',
          title: 'Refleksi hari ini',
          body: 'Menjaga niat belajar dan memperbaiki adab.',
          meta: 'syukur',
          raw: {
            content: 'Menjaga niat belajar dan memperbaiki adab.',
            date: new Date().toISOString().slice(0, 10),
            mood: 'syukur',
          },
        },
        {
          id: 'muhasabah-2',
          title: 'Catatan pekanan',
          body: 'Perlu lebih konsisten murajaah.',
          meta: 'biasa',
          raw: {
            content: 'Perlu lebih konsisten murajaah.',
            date: '2026-05-24',
            mood: 'biasa',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByText, getByTestId, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'muhasabah-route', params: { featureKey: 'muhasabah' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-muhasabah-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PERSONAL')).toBeTruthy();
      expect(getByText('Muhasabah')).toBeTruthy();
      expect(getByText('2 refleksi')).toBeTruthy();
      expect(getByText('Hari ini terisi')).toBeTruthy();
      expect(getByText('Menjaga niat belajar dan memperbaiki adab.')).toBeTruthy();
      expect(getByText('Perlu lebih konsisten murajaah.')).toBeTruthy();
      expect(getAllByTestId('web-app-muhasabah-card')).toHaveLength(2);
    });

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'muhasabah', endpoint: '/api/v1/muhasabah' }),
      { page: 0, size: 20 },
    );
  });

  test('renders search input for feature catalog', async () => {
    const { getByTestId } = await renderExploreScreen();
    expect(getByTestId('search-input')).toBeTruthy();
  });

  test('renders section headers in catalog', async () => {
    const { getAllByTestId } = await renderExploreScreen();
    expect(getAllByTestId('section-title').length).toBeGreaterThanOrEqual(1);
  });

  test('renders feature rows in catalog sections', async () => {
    const { getByText } = await renderExploreScreen();
    expect(getByText('Kajian & Artikel')).toBeTruthy();
    expect(getByText('Referensi')).toBeTruthy();
    expect(getByText('Evaluasi')).toBeTruthy();
  });

  test('feature items are tappable and load feature content', async () => {
    const { getByText, getByPlaceholderText } = await renderExploreScreen();

    fireEvent.press(getByText('Kamus Arab'));

    await waitFor(() => {
      expect(getByPlaceholderText('Cari kata Arab atau Indonesia')).toBeTruthy();
    });
  });

  test('search/filter narrows down feature list', async () => {
    const { getByTestId, queryByText } = await renderExploreScreen();

    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'tafsir');

    expect(queryByText('Kajian & Artikel')).toBeNull();
    expect(queryByText('Referensi')).toBeTruthy();
  });

  test('shows empty results message when search has no matches', async () => {
    const { getByTestId, getByText } = await renderExploreScreen();

    const searchInput = getByTestId('search-input');
    fireEvent.changeText(searchInput, 'zzzzznotexist');

    expect(getByText('Tidak ada hasil')).toBeTruthy();
  });

  test('loads bookmarks when logged in', async () => {
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([
      { id: '1', ref_type: 'ayah', ref_id: '1:1' },
    ]);

    await renderExploreScreen();

    await waitFor(() => {
      expect(personalApi.getBookmarks).toHaveBeenCalled();
    });
  });

  test('loads quiz feature and shows quiz options', async () => {
    exploreApi.getQuizQuestions.mockResolvedValue([
      { id: 'q1', title: 'Quiz 1', raw: { question: 'What?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_answer: 'A' } },
    ]);

    const { getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Quiz Islami'));

    await waitFor(() => {
      expect(exploreApi.getQuizQuestions).toHaveBeenCalled();
    });
  });

  test('loads forum questions from mobile forum feature', async () => {
    forumApi.getForumQuestions.mockResolvedValueOnce({
      hasMore: false,
      items: [
        {
          id: 'forum-1',
          title: 'Apa hukum zakat emas?',
          body: 'Mohon penjelasan ringkas tentang zakat emas.',
          slug: 'zakat-emas',
          tags: ['zakat'],
          answerCount: 1,
          voteCount: 2,
          user: { name: 'Ahmad' },
        },
      ],
      total: 1,
    });

    const { getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Forum Tanya Jawab'));

    await waitFor(() => {
      expect(forumApi.getForumQuestions).toHaveBeenCalledWith({ page: 0, size: 10 });
      expect(getByText('Apa hukum zakat emas?')).toBeTruthy();
    });
  });

  test('forum detail supports question vote, answer downvote, and accept answer', async () => {
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    forumApi.getForumQuestions.mockResolvedValueOnce({
      hasMore: false,
      items: [{ id: 'forum-1', title: 'Apa hukum zakat emas?', body: 'Isi pertanyaan', slug: 'zakat-emas', answerCount: 1, voteCount: 2, user: { name: 'Ahmad' } }],
      total: 1,
    });
    forumApi.getForumQuestion.mockResolvedValue({
      answers: [{ id: 'answer-1', body: 'Wajib jika mencapai nisab dan haul.', voteCount: 3, isAccepted: false, user: { name: 'Ustadz' } }],
      question: { id: 'forum-1', title: 'Apa hukum zakat emas?', body: 'Isi pertanyaan', slug: 'zakat-emas', answerCount: 1, voteCount: 2, user: { name: 'Ahmad' } },
    });
    forumApi.voteForum.mockResolvedValue({});
    forumApi.acceptForumAnswer.mockResolvedValue({});

    const { getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Forum Tanya Jawab'));
    await waitFor(() => expect(getByText('Apa hukum zakat emas?')).toBeTruthy());
    fireEvent.press(getByText('Apa hukum zakat emas?'));

    await waitFor(() => {
      expect(getByText('Wajib jika mencapai nisab dan haul.')).toBeTruthy();
    });

    fireEvent.press(getByText('▲ Pertanyaan'));
    await waitFor(() => {
      expect(forumApi.voteForum).toHaveBeenCalledWith({ targetType: 'question', targetId: 'forum-1', value: 1 });
    });

    fireEvent.press(getByText('▼'));
    await waitFor(() => {
      expect(forumApi.voteForum).toHaveBeenCalledWith({ targetType: 'answer', targetId: 'answer-1', value: -1 });
    });

    fireEvent.press(getByText('Terima'));
    await waitFor(() => {
      expect(forumApi.acceptForumAnswer).toHaveBeenCalledWith('forum-1', 'answer-1');
    });
  });

  test('forum ask form creates question and opens returned detail', async () => {
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    forumApi.getForumQuestions.mockResolvedValueOnce({ hasMore: false, items: [], total: 0 });
    forumApi.createForumQuestion.mockResolvedValueOnce({ slug: 'adab-belajar' });
    forumApi.getForumQuestion.mockResolvedValueOnce({
      answers: [],
      question: { id: 'forum-2', title: 'Bagaimana adab belajar?', body: 'Apa saja adab belajar harian?', slug: 'adab-belajar', answerCount: 0, voteCount: 0, user: { name: 'Test' } },
    });

    const { getByPlaceholderText, getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Forum Tanya Jawab'));
    await waitFor(() => expect(getByText('Ajukan Pertanyaan')).toBeTruthy());
    fireEvent.press(getByText('Ajukan Pertanyaan'));

    fireEvent.changeText(getByPlaceholderText('Judul pertanyaan (min 10 karakter)'), 'Bagaimana adab belajar?');
    fireEvent.changeText(getByPlaceholderText('Isi pertanyaan (min 20 karakter)'), 'Apa saja adab belajar harian?');
    fireEvent.changeText(getByPlaceholderText('Tag (pisahkan dengan koma, opsional)'), 'adab, ilmu');
    fireEvent.press(getByText('Kirim Pertanyaan'));

    await waitFor(() => {
      expect(forumApi.createForumQuestion).toHaveBeenCalledWith({
        title: 'Bagaimana adab belajar?',
        body: 'Apa saja adab belajar harian?',
        tags: 'adab, ilmu',
      });
      expect(getByText('Bagaimana adab belajar?')).toBeTruthy();
    });
  });

  test('loads Asmaul Husna flashcard mode and reveals meaning', async () => {
    exploreApi.getAsmaulNames.mockResolvedValue([
      {
        id: 1,
        number: 1,
        arabic: 'الرَّحْمَنُ',
        transliteration: 'Ar-Rahman',
        indonesian: 'Maha Pengasih',
      },
    ]);

    const { getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Flashcard Asmaul Husna'));

    await waitFor(() => {
      expect(exploreApi.getAsmaulNames).toHaveBeenCalled();
      expect(getByText('Ar-Rahman')).toBeTruthy();
    });

    fireEvent.press(getByText('Lihat arti'));
    expect(getByText('Maha Pengasih')).toBeTruthy();
  });

  test('asmaul wirid persists count and triggers milestone haptic', async () => {
    exploreApi.getAsmaulNames.mockResolvedValue([
      {
        id: 1,
        number: 1,
        arabic: 'الرَّحْمَنُ',
        transliteration: 'Ar-Rahman',
        indonesian: 'Maha Pengasih',
      },
    ]);

    const { getByTestId, getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Wirid Asmaul Husna'));

    await waitFor(() => {
      expect(exploreApi.getAsmaulNames).toHaveBeenCalled();
      expect(getByText('Ar-Rahman')).toBeTruthy();
    });

    const counter = getByTestId('asmaul-wirid-counter');
    for (let i = 0; i < 33; i += 1) {
      fireEvent.press(counter);
    }

    await waitFor(() => {
      expect(getByText('33')).toBeTruthy();
      expect(haptics.hapticTap).toHaveBeenCalledTimes(33);
      expect(haptics.hapticMedium).toHaveBeenCalledTimes(1);
    });
  });

  test('filters library list by saved progress status', async () => {
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);
    personalApi.getLibraryProgressList.mockResolvedValue([
      { id: 1, library_book_id: 10, status: 'reading', current_page: 12 },
      { id: 2, library_book_id: 20, status: 'completed', current_page: 80 },
    ]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        { id: 10, title: 'Buku Dibaca', body: 'Sedang belajar', raw: { id: 10 } },
        { id: 20, title: 'Buku Selesai', body: 'Sudah selesai', raw: { id: 20 } },
      ],
      meta: { hasMore: false },
    });

    const { getByText, getByTestId, queryByText } = await renderExploreScreen();

    fireEvent.press(getByText('Perpustakaan'));

    await waitFor(() => {
      expect(exploreApi.getFeatureItemPage).toHaveBeenCalled();
      expect(personalApi.getLibraryProgressList).toHaveBeenCalled();
      expect(getByText('Buku Dibaca')).toBeTruthy();
      expect(getByText('Buku Selesai')).toBeTruthy();
    });

    fireEvent.press(getByTestId('pill-Selesai'));

    await waitFor(() => {
      expect(queryByText('Buku Dibaca')).toBeNull();
      expect(getByText('Buku Selesai')).toBeTruthy();
    });
  });

  test('toggle pinned feature calls togglePinnedFeature', async () => {
    const { getByText, getAllByLabelText } = await renderExploreScreen();

    await waitFor(() => {
      expect(getByText('Tafsir')).toBeTruthy();
    });

    const pinButtons = getAllByLabelText(/Sematkan/);
    fireEvent.press(pinButtons[0]);

    await waitFor(() => {
      expect(togglePinnedFeature).toHaveBeenCalled();
    });
  });

  test('opens tafsir detail with kitab selector and stacked comparison', async () => {
    clientApi.getSurahs.mockResolvedValueOnce([
      { number: 1, name: 'Al-Fatihah', latin: 'Al-Fatihah' },
    ]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'tafsir-1',
          title: 'Ayat 1',
          arabic: 'بِسْمِ اللّٰهِ',
          body: 'Dengan nama Allah',
          meta: 'Al-Fatihah · Tafsir Kemenag · Tafsir Al-Mishbah',
          tafsir: 'Kemenag detail',
          secondaryTafsir: 'Al-Mishbah detail',
          raw: { ayah_id: 1 },
        },
      ],
      meta: { hasMore: false },
    });

    const { getByText, getAllByTestId, queryByText } = await renderExploreScreen();

    fireEvent.press(getByText('Tafsir'));

    await waitFor(() => {
      expect(clientApi.getSurahs).toHaveBeenCalled();
      expect(getByText('1. Al-Fatihah')).toBeTruthy();
    });

    fireEvent.press(getByText('1. Al-Fatihah'));

    await waitFor(() => {
      expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: '/api/v1/tafsir/surah/1' }),
        { page: 0, size: 20 },
      );
      expect(getByText('Ayat 1')).toBeTruthy();
      expect(getByText('Tafsir Kemenag')).toBeTruthy();
    });

    fireEvent.press(getAllByTestId('content-card')[0]);

    await waitFor(() => {
      expect(getByText('Semua')).toBeTruthy();
      expect(getByText('Kemenag')).toBeTruthy();
      expect(getByText('Al-Mishbah')).toBeTruthy();
      expect(getByText('Kemenag detail')).toBeTruthy();
      expect(getByText('Al-Mishbah detail')).toBeTruthy();
    });

    fireEvent.press(getByText('Al-Mishbah'));

    expect(queryByText('Kemenag detail')).toBeNull();
    expect(getByText('Al-Mishbah detail')).toBeTruthy();
  });

  test('loads backend gold price when opening zakat calculator', async () => {
    exploreApi.getZakatGoldPrice.mockResolvedValueOnce(1400000);

    const { getByText } = await renderExploreScreen();

    fireEvent.press(getByText('Kalkulator Zakat'));

    await waitFor(() => {
      expect(exploreApi.getZakatGoldPrice).toHaveBeenCalledTimes(1);
      expect(getByText('Rp 119.000.000')).toBeTruthy();
    });
  });

  test('shows profile action button when no feature is active', async () => {
    const { getByTestId } = await renderExploreScreen();
    expect(getByTestId('action-Buka Profil')).toBeTruthy();
  });

  test('shows back button when a feature is active', async () => {
    const { getByText, getByTestId } = await renderExploreScreen();

    fireEvent.press(getByText('Kamus Arab'));

    await waitFor(() => {
      expect(getByTestId('action-Kembali ke Belajar')).toBeTruthy();
    });
  });
});
