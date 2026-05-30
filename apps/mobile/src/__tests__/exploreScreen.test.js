jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'ArrowLeft', 'BookOpen', 'Bookmark', 'BookmarkCheck', 'Calculator', 'CheckCircle2', 'ChevronDown',
    'Circle', 'ExternalLink', 'FileText', 'Flag', 'Globe', 'Heart', 'HelpCircle',
    'History', 'ListChecks', 'MessageCircle', 'Pencil', 'Plus', 'Save', 'Scale', 'Star',
    'Search', 'StickyNote', 'ThumbsDown', 'ThumbsUp', 'Trash2', 'Trophy', 'UserCircle', 'Users', 'Video',
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
  getBlogCategoryItems: jest.fn(),
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
  hideFeedPost: jest.fn(),
  likeFeedPost: jest.fn(),
  reportFeedPost: jest.fn(),
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
  deleteFaraidh: jest.fn(),
  deleteKalkulasiZakat: jest.fn(),
  deleteUserWird: jest.fn(),
  getBookmarks: jest.fn(),
  getFaraidhHistory: jest.fn(),
  getKalkulasiZakat: jest.fn(),
  getLibraryProgress: jest.fn(),
  getLibraryProgressList: jest.fn(),
  getTodayPrayerLog: jest.fn(),
  getUserWirds: jest.fn(),
  saveFaraidh: jest.fn(),
  saveKalkulasiZakat: jest.fn(),
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
    { key: 'asbabun-nuzul', title: 'Asbabun Nuzul', subtitle: 'Sebab turun ayat', group: 'Ilmu', type: 'surah-content', contentType: 'asbabun-nuzul' },
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
    { key: 'hafalan', title: 'Hafalan', subtitle: 'Ringkasan hafalan Quran', group: 'Personal', type: 'protected-list', endpoint: '/api/v1/hafalan/summary' },
    { key: 'murojaah', title: 'Murojaah', subtitle: 'Jadwal ulang hafalan', group: 'Personal', type: 'protected-list', endpoint: '/api/v1/murojaah/session' },
    { key: 'tilawah', title: 'Tilawah', subtitle: 'Log dan ringkasan tilawah', group: 'Personal', type: 'protected-list', endpoint: '/api/v1/tilawah/summary' },
    { key: 'stats', title: 'Statistik', subtitle: 'Ringkasan aktivitas', group: 'Personal', type: 'protected-list', endpoint: '/api/v1/stats' },
    { key: 'leaderboard', title: 'Leaderboard', subtitle: 'Streak komunitas', group: 'Personal', type: 'list', endpoint: '/api/v1/leaderboard/streak' },
    { key: 'community-feed', title: 'Komunitas', subtitle: 'Refleksi', group: 'Ilmu', type: 'feed' },
    { key: 'kajian', title: 'Kajian', subtitle: 'Sesi belajar', group: 'Ilmu', type: 'list', endpoint: '/api/v1/kajian' },
    { key: 'blog', title: 'Artikel', subtitle: 'Tulisan dan pembaruan', group: 'Ilmu', type: 'list', endpoint: '/api/v1/blog/posts?page=0&size=20' },
    { key: 'perawi', title: 'Perawi Hadis', subtitle: 'Basis data perawi', group: 'Ilmu', type: 'list', endpoint: '/api/v1/perawi' },
    { key: 'forum', title: 'Forum Tanya Jawab', subtitle: 'Diskusi seputar Islam', group: 'Ilmu', type: 'forum' },
    { key: 'library', title: 'Perpustakaan', subtitle: 'Kitab dan bahan belajar', group: 'Ilmu', type: 'list', endpoint: '/api/v1/library/books?page=0&size=20' },
    { key: 'fiqh', title: 'Fiqh Ringkas', subtitle: 'Pelajaran fiqh ringkas', group: 'Ilmu', type: 'list', endpoint: '/api/v1/fiqh' },
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
      features: allFeatures.filter((f) => ['community-feed', 'kajian', 'blog', 'forum'].includes(f.key)),
    },
    {
      key: 'referensi',
      label: 'Referensi',
      meta: 'Kamus dan katalog',
      features: allFeatures.filter((f) => ['kamus', 'tafsir', 'asbabun-nuzul', 'asmaul-flashcard', 'asmaul-wirid', 'library', 'perawi', 'fiqh', 'siroh'].includes(f.key)),
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
      features: allFeatures.filter((f) => ['bookmarks', 'notes', 'notifications', 'goals', 'muhasabah', 'hafalan', 'murojaah', 'tilawah', 'stats', 'leaderboard'].includes(f.key)),
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
const socialApi = require('../api/social');
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
  useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: false });
  readPinnedFeatures.mockResolvedValue([]);
  readRecentFeatures.mockResolvedValue([]);
  rememberFeatureOpen.mockResolvedValue([]);
  togglePinnedFeature.mockResolvedValue({ items: [], pinned: false });
  exploreApi.getBlogCategoryItems.mockResolvedValue([]);
});

describe('ExploreScreen', () => {
  test('renders screen title and subtitle', async () => {
    const { getByTestId } = await renderExploreScreen();
    expect(getByTestId('screen-title')).toBeTruthy();
    expect(getByTestId('screen-subtitle')).toBeTruthy();
    expect(getByTestId('explore-classic-surface')).toBeTruthy();
  });

  test('uses web app Explore surface when web app layout is active', async () => {
    useLayoutModePreference.mockReturnValue({ isDarkTheme: false, isWebAppLayout: true });
    exploreApi.getQuizQuestions.mockResolvedValueOnce([
      { id: 'q1', title: 'Quiz 1', raw: { question: 'Apa?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_answer: 'A' } },
    ]);
    const { getByTestId, getByText, queryByTestId } = await renderExploreScreen();

    expect(getByTestId('explore-web-app-surface')).toBeTruthy();
    expect(queryByTestId('explore-classic-surface')).toBeNull();
    expect(queryByTestId('screen-title')).toBeNull();
    expect(getByText('KONTEN ISLAM')).toBeTruthy();
    expect(getByText('Belajar')).toBeTruthy();
    expect(getByText('KAJIAN & ARTIKEL')).toBeTruthy();
    expect(getByText('REFERENSI')).toBeTruthy();

    fireEvent.press(getByText('Quiz Islami'));

    await waitFor(() => {
      expect(getByTestId('explore-web-app-quiz-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
    });
  });

  test('uses dashboard Zakat history child surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({ ...mockUseSession(), session: { token: 'abc' }, user: { email: 'test@test.com', id: '1', name: 'Test' } });
    exploreApi.getZakatGoldPrice.mockResolvedValueOnce(1400000);
    personalApi.getKalkulasiZakat.mockResolvedValueOnce([{
      id: 'zakat-1',
      jenis: 'maal',
      nama_jenis: 'Zakat Maal',
      jumlah_zakat: 2500000,
      nilai_harta: 100000000,
      nisab: 85000000,
      sudah_dibayar: false,
      created_at: '2026-05-20T00:00:00Z',
    }]);

    const { getByTestId, getByText, queryByTestId } = await renderExploreScreen();
    fireEvent.press(getByText('Kalkulator Zakat'));
    await waitFor(() => expect(getByTestId('explore-web-app-zakat-surface')).toBeTruthy());
    fireEvent.press(getByTestId('pill-Riwayat'));
    await waitFor(() => {
      expect(getByTestId('explore-web-app-zakat-history-surface')).toBeTruthy();
      expect(getByTestId('web-app-zakat-history-card')).toBeTruthy();
      expect(getByText('Riwayat Zakat')).toBeTruthy();
      expect(getByText('Zakat Maal')).toBeTruthy();
      expect(getByText('Total Harta: Rp 100.000.000')).toBeTruthy();
      expect(getByText('Nisab: Rp 85.000.000')).toBeTruthy();
      expect(getByText('Belum Dibayar')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
    });
    fireEvent.press(getByTestId('web-app-zakat-history-back'));
    await waitFor(() => expect(queryByTestId('explore-web-app-zakat-history-surface')).toBeNull());
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

    const { getAllByTestId, getAllByText, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
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

  test('uses dashboard Hafalan route surface in web app layout', async () => {
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
          id: 'hafalan-1',
          title: 'Al-Mulk',
          body: 'Sudah lancar dan siap murajaah.',
          meta: 'memorized',
          raw: {
            last_reviewed_at: '2026-05-25',
            progress: 100,
            status: 'memorized',
            surah_name: 'Al-Mulk',
            surah_number: 67,
          },
        },
        {
          id: 'hafalan-2',
          title: 'Yasin',
          body: 'Sedang menguatkan ayat awal.',
          meta: 'in_progress',
          raw: {
            progress: 45,
            status: 'in_progress',
            surah_name: 'Yasin',
            surah_number: 36,
          },
        },
        {
          id: 'hafalan-3',
          title: 'Ar-Rahman',
          body: 'Belum dimulai.',
          meta: 'not_started',
          raw: {
            status: 'not_started',
            surah_name: 'Ar-Rahman',
            surah_number: 55,
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByText, getByTestId, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'hafalan-route', params: { featureKey: 'hafalan' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-hafalan-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PROGRESS SAYA')).toBeTruthy();
      expect(getByText('Hafalan')).toBeTruthy();
      expect(getByText('1/3 surah')).toBeTruthy();
      expect(getByText('1 hafal')).toBeTruthy();
      expect(getByText('1 proses')).toBeTruthy();
      expect(getByText('1 belum')).toBeTruthy();
      expect(getByText('Al-Mulk')).toBeTruthy();
      expect(getByText('Yasin')).toBeTruthy();
      expect(getByText('Ar-Rahman')).toBeTruthy();
      expect(getAllByTestId('web-app-hafalan-card')).toHaveLength(3);
      expect(getAllByTestId('web-app-hafalan-progress-fill')).toHaveLength(3);
    });

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'hafalan', endpoint: '/api/v1/hafalan/summary' }),
      { page: 0, size: 20 },
    );
  });

  test('uses dashboard Murojaah route surface in web app layout', async () => {
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
          id: 'murojaah-1',
          title: 'Al-Mulk',
          body: 'Review pekan ini sudah lancar.',
          meta: 'recent',
          raw: {
            days_since_review: 3,
            last_reviewed_at: '2026-05-23',
            surah_name: 'Al-Mulk',
            surah_number: 67,
          },
        },
        {
          id: 'murojaah-2',
          title: 'Yasin',
          body: 'Butuh review segera.',
          meta: 'urgent',
          raw: {
            days_since_review: 16,
            surah_name: 'Yasin',
            surah_number: 36,
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByText, getByTestId, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'murojaah-route', params: { featureKey: 'murojaah' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-murojaah-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PROGRESS SAYA')).toBeTruthy();
      expect(getByText('Murojaah')).toBeTruthy();
      expect(getByText('2 surah')).toBeTruthy();
      expect(getByText('2 total')).toBeTruthy();
      expect(getByText('1 reviewed')).toBeTruthy();
      expect(getByText('1 urgent')).toBeTruthy();
      expect(getByText('Al-Mulk')).toBeTruthy();
      expect(getByText('Yasin')).toBeTruthy();
      expect(getAllByTestId('web-app-murojaah-card')).toHaveLength(2);
    });

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'murojaah', endpoint: '/api/v1/murojaah/session' }),
      { page: 0, size: 20 },
    );
  });

  test('uses dashboard Tilawah route surface in web app layout', async () => {
    const today = (() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })();
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
          id: 'tilawah-1',
          title: 'Al-Kahfi',
          body: 'Tilawah pagi',
          meta: today,
          raw: {
            ayahFrom: 1,
            ayahTo: 20,
            date: today,
            notes: 'Tilawah pagi',
            pages: 4,
            surah: 'Al-Kahfi',
          },
        },
        {
          id: 'tilawah-2',
          title: 'Yasin',
          body: 'Bacaan malam',
          meta: '2026-05-24',
          raw: {
            ayah_from: 1,
            ayah_to: 83,
            date: '2026-05-24',
            notes: 'Bacaan malam',
            pages_read: 6,
            surah: 'Yasin',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByText, getByTestId, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'tilawah-route', params: { featureKey: 'tilawah' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-tilawah-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PROGRESS SAYA')).toBeTruthy();
      expect(getByText('Tilawah')).toBeTruthy();
      expect(getAllByText('10 halaman').length).toBeGreaterThan(0);
      expect(getByText('Hari ini sudah tercatat')).toBeTruthy();
      expect(getByText('Al-Kahfi')).toBeTruthy();
      expect(getByText('Yasin')).toBeTruthy();
      expect(getByText('2 log')).toBeTruthy();
      expect(getAllByTestId('web-app-tilawah-card')).toHaveLength(2);
    });

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'tilawah', endpoint: '/api/v1/tilawah/summary' }),
      { page: 0, size: 20 },
    );
  });

  test('uses dashboard Stats route surface in web app layout', async () => {
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
          id: 'stats-summary',
          title: 'Statistik',
          raw: {
            active_goals: 3,
            hafalan: 14,
            points: 1200,
            streak: 7,
            tilawah_month: 120,
            tilawah_week: 40,
            today_prayers: 4,
            total_bookmarks: 9,
            total_muhasabah: 12,
            weekly_activity: [
              { count: 5, date: '2026-05-20' },
              { count: 4, date: '2026-05-21' },
              { count: 5, date: '2026-05-22' },
              { count: 3, date: '2026-05-23' },
              { count: 5, date: '2026-05-24' },
              { count: 4, date: '2026-05-25' },
              { count: 4, date: '2026-05-26' },
            ],
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByText, getByTestId, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'stats-route', params: { featureKey: 'stats' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-stats-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('PROGRESS SAYA')).toBeTruthy();
      expect(getByText('Statistik')).toBeTruthy();
      expect(getByText('1.200 poin')).toBeTruthy();
      expect(getByText('Sholat hari ini')).toBeTruthy();
      expect(getByText('4/5 tercatat · 7 hari streak')).toBeTruthy();
      expect(getByText('Total Muhasabah')).toBeTruthy();
      expect(getByText('Target Aktif')).toBeTruthy();
      expect(getByText('Total Bookmark')).toBeTruthy();
      expect(getByText('14 surah')).toBeTruthy();
      expect(getByText('40 halaman')).toBeTruthy();
      expect(getByText('120 halaman')).toBeTruthy();
      expect(getAllByTestId('web-app-stats-tile')).toHaveLength(4);
      expect(getAllByTestId('web-app-stats-bar')).toHaveLength(7);
    });

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'stats', endpoint: '/api/v1/stats' }),
      { page: 0, size: 20 },
    );
  });

  test('uses dashboard Leaderboard route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
          { id: 'streak-1', title: 'Ahmad', raw: { name: 'Ahmad', rank: 1, score: 21 } },
          { id: 'streak-2', title: 'Fatimah', raw: { name: 'Fatimah', rank: 2, score: 18 } },
        ],
        meta: { hasMore: false },
      })
      .mockResolvedValueOnce({
        items: [
          { id: 'hafalan-1', title: 'Zaid', raw: { name: 'Zaid', rank: 1, score: 30 } },
          { id: 'hafalan-2', title: 'Maryam', raw: { name: 'Maryam', rank: 2, score: 24 } },
          { id: 'hafalan-3', title: 'Umar', raw: { name: 'Umar', rank: 3, score: 20 } },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'leaderboard-route', params: { featureKey: 'leaderboard' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-leaderboard-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(queryByTestId('web-app-leaderboard-back')).toBeNull();
      expect(getByText('Leaderboard')).toBeTruthy();
      expect(getAllByText('Ahmad').length).toBeGreaterThan(0);
      expect(getByText('Fatimah')).toBeTruthy();
      expect(getAllByTestId('web-app-leaderboard-row')).toHaveLength(2);
    });

    fireEvent.press(getByTestId('web-app-leaderboard-tab-hafalan'));

    expect(getAllByText('Zaid').length).toBeGreaterThan(0);
    expect(getByText('Maryam')).toBeTruthy();
    expect(queryByText('Fatimah')).toBeNull();
    expect(getAllByTestId('web-app-leaderboard-row')).toHaveLength(3);

    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'leaderboard', endpoint: '/api/v1/leaderboard/streak' }),
      { page: 0, size: 20 },
    );
    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'leaderboard', endpoint: '/api/v1/leaderboard/hafalan' }),
      { page: 0, size: 20 },
    );
  });

  test('renders dashboard Leaderboard empty state when leaderboard APIs fail in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage
      .mockRejectedValueOnce(new Error('streak failed'))
      .mockRejectedValueOnce(new Error('hafalan failed'));

    const { getByText, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'leaderboard-empty-route', params: { featureKey: 'leaderboard' } },
    });

    await waitFor(() => {
      expect(getByText('Data leaderboard belum tersedia.')).toBeTruthy();
      expect(queryByText('Leaderboard belum bisa dimuat.')).toBeNull();
    });
  });

  test('uses dashboard Doa route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage
      .mockResolvedValueOnce({
        items: [
          {
            id: 'doa-1', title: 'Doa Bangun Tidur', arabic: 'الْحَمْدُ لِلَّهِ', body: 'Segala puji bagi Allah.',
            meta: 'bangun · Hisnul Muslim',
            raw: { audio_url: 'https://example.test/doa.mp3', category: 'bangun', source: 'Hisnul Muslim',
              title: 'Doa Bangun Tidur', translation: { ar: 'الْحَمْدُ لِلَّهِ', idn: 'Segala puji bagi Allah.', latin_idn: 'Alhamdulillah' } },
          },
          {
            id: 'doa-2', title: 'Doa Masuk Masjid', arabic: 'اللَّهُمَّ افْتَحْ لِي',
            body: 'Ya Allah bukakan untukku pintu rahmat-Mu.', meta: 'masjid',
            raw: {
              category: 'masjid', title: 'Doa Masuk Masjid',
              translation: { ar: 'اللَّهُمَّ افْتَحْ لِي', idn: 'Ya Allah bukakan untukku pintu rahmat-Mu.' },
            },
          },
        ],
        meta: { hasMore: false },
      });

    const { getAllByTestId, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'doa-route', params: { featureKey: 'doa' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-doa-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Doa')).toBeTruthy();
      expect(getByText('2 doa tersedia')).toBeTruthy();
      expect(getAllByTestId('web-app-doa-card')).toHaveLength(2);
      expect(getByText('Alhamdulillah')).toBeTruthy();
      expect(getByText('Audio')).toBeTruthy();
    });

    fireEvent.press(getAllByTestId('web-app-doa-category')[7]);

    expect(getByText('Doa Masuk Masjid')).toBeTruthy();
    expect(queryByText('Doa Bangun Tidur')).toBeNull();
    expect(getAllByTestId('web-app-doa-card')).toHaveLength(1);

    fireEvent.changeText(getByTestId('web-app-doa-search'), 'rahmat');
    expect(getByText('Menampilkan 1 dari 2 doa')).toBeTruthy();
    expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'doa', endpoint: '/api/v1/doa' }),
      { page: 0, size: 20 },
    );
  });

  test('uses dashboard Kajian route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'kajian-1',
          title: 'Fiqh Zakat Praktis',
          body: 'Pembahasan zakat maal harian.',
          raw: {
            description: 'Pembahasan zakat maal harian.',
            duration_seconds: 1800,
            speaker: 'Ustadz Ahmad',
            title: 'Fiqh Zakat Praktis',
            topic: 'fiqh',
            type: 'video',
            url: 'https://example.test/kajian-1',
          },
        },
        {
          id: 'kajian-2',
          title: 'Tafsir Juz Amma',
          body: 'Kajian tafsir ringkas.',
          raw: {
            description: 'Kajian tafsir ringkas.',
            duration_seconds: 900,
            speaker: 'Ustadzah Fatimah',
            title: 'Tafsir Juz Amma',
            topic: 'tafsir',
            type: 'audio',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByPlaceholderText, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'kajian-route', params: { featureKey: 'kajian' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-kajian-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(queryByTestId('web-app-kajian-back')).toBeNull();
      expect(getByText('Kajian Islam')).toBeTruthy();
      expect(getByText('Rekaman kajian dari ustadz-ustadz ahlus sunnah')).toBeTruthy();
      expect(getByText('TOTAL KAJIAN')).toBeTruthy();
      expect(getByText('Ustadz Ahmad')).toBeTruthy();
      expect(getByText('Ustadzah Fatimah')).toBeTruthy();
      expect(getAllByTestId('web-app-kajian-card')).toHaveLength(2);
    });

    fireEvent.press(getByTestId('web-app-kajian-category-fiqh'));

    expect(getByText('Fiqh Zakat Praktis')).toBeTruthy();
    expect(queryByText('Tafsir Juz Amma')).toBeNull();
    expect(getAllByTestId('web-app-kajian-card')).toHaveLength(1);

    fireEvent.press(getByTestId('web-app-kajian-category-all'));
    fireEvent.changeText(getByPlaceholderText('Cari kajian atau ustadz...'), 'tafsir');

    expect(getByText('Tafsir Juz Amma')).toBeTruthy();
    expect(queryByText('Fiqh Zakat Praktis')).toBeNull();
  });

  test('uses dashboard Blog route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getBlogCategoryItems.mockResolvedValueOnce([
      { id: 1, name: 'Akhlak & Adab', slug: 'akhlak-adab' },
      { id: 2, name: 'Fiqh', slug: 'fiqh' },
    ]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'blog-1',
          title: 'Adab Menuntut Ilmu',
          body: 'Ringkasan adab bagi penuntut ilmu.',
          raw: {
            author: { name: 'Tim Thullaabul' },
            category: { name: 'Tazkiyah', slug: 'tazkiyah' },
            excerpt: 'Ringkasan adab bagi penuntut ilmu.',
            published_at: '2026-05-20',
            slug: 'adab-menuntut-ilmu',
            title: 'Adab Menuntut Ilmu',
          },
        },
        {
          id: 'blog-2',
          title: 'Fiqh Zakat Harian',
          body: 'Panduan ringkas zakat maal.',
          raw: {
            author: 'Ustadz Ahmad',
            category: { name: 'Fiqh', slug: 'fiqh' },
            excerpt: 'Panduan ringkas zakat maal.',
            published_at: '2026-05-21',
            slug: 'fiqh-zakat-harian',
            title: 'Fiqh Zakat Harian',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByPlaceholderText, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'blog-route', params: { featureKey: 'blog' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-blog-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(queryByTestId('web-app-blog-back')).toBeNull();
      expect(getByText('Artikel Islam')).toBeTruthy();
      expect(getByText('Tazkiyah, fiqh praktis, aqidah, dan ilmu Islam lainnya')).toBeTruthy();
      expect(getByText('Akhlak & Adab')).toBeTruthy();
      expect(getByText('Adab Menuntut Ilmu')).toBeTruthy();
      expect(getByText('Fiqh Zakat Harian')).toBeTruthy();
      expect(getAllByTestId('web-app-blog-card')).toHaveLength(2);
    });

    fireEvent.press(getByTestId('web-app-blog-category-fiqh'));

    expect(getByText('Fiqh Zakat Harian')).toBeTruthy();
    expect(queryByText('Adab Menuntut Ilmu')).toBeNull();
    expect(getAllByTestId('web-app-blog-card')).toHaveLength(1);

    fireEvent.press(getByTestId('web-app-blog-category-all'));
    fireEvent.changeText(getByPlaceholderText('Cari artikel, penulis, atau kategori...'), 'adab');

    expect(getByText('Adab Menuntut Ilmu')).toBeTruthy();
    expect(queryByText('Fiqh Zakat Harian')).toBeNull();
  });

  test('uses dashboard Library route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    useSession.mockReturnValue({
      ...mockUseSession(),
      session: { token: 'abc' },
      user: { id: '1', name: 'Test', email: 'test@test.com' },
    });
    personalApi.getBookmarks.mockResolvedValue([]);
    personalApi.getLibraryProgressList.mockResolvedValue([
      { id: 1, library_book_id: 10, status: 'reading', current_page: 12, note: 'Bab adab' },
      { id: 2, library_book_id: 20, status: 'completed', current_page: 80 },
    ]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 10,
          title: 'Adab Penuntut Ilmu',
          body: 'Katalog kitab adab belajar.',
          raw: {
            author: 'Ustadz Ahmad',
            category: 'Akhlak',
            description: 'Katalog kitab adab belajar.',
            format: 'pdf',
            id: 10,
            level: 'Pemula',
            source_url: 'https://example.test/adab.pdf',
            title: 'Adab Penuntut Ilmu',
          },
        },
        {
          id: 20,
          title: 'Fiqh Ibadah Ringkas',
          body: 'Bahan belajar fiqh praktis.',
          raw: {
            author: 'Ustadz Zaid',
            category: 'Fiqh',
            description: 'Bahan belajar fiqh praktis.',
            format: 'epub',
            id: 20,
            level: 'Menengah',
            title: 'Fiqh Ibadah Ringkas',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const {
      getAllByTestId,
      getAllByText,
      getByPlaceholderText,
      getByTestId,
      getByText,
      queryByTestId,
      queryByText,
    } = await renderExploreScreen({
      deepLinkTarget: { id: 'library-route', params: { featureKey: 'library' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-library-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Perpustakaan Ilmu')).toBeTruthy();
      expect(getByText('Katalog kitab dan bahan belajar yang bisa dibaca dari sumber resmi, disimpan, dan diberi catatan belajar.')).toBeTruthy();
      expect(getByText('Progress Saya')).toBeTruthy();
      expect(getByText('2 resource')).toBeTruthy();
      expect(getAllByText('Adab Penuntut Ilmu').length).toBeGreaterThan(0);
      expect(getAllByText('Fiqh Ibadah Ringkas').length).toBeGreaterThan(0);
      expect(getAllByTestId('web-app-library-card')).toHaveLength(2);
    });

    fireEvent.press(getByTestId('web-app-library-progress-completed'));

    expect(getAllByText('Fiqh Ibadah Ringkas').length).toBeGreaterThan(0);
    expect(queryByText('Katalog kitab adab belajar.')).toBeNull();
    expect(getAllByTestId('web-app-library-card')).toHaveLength(1);

    fireEvent.press(getByTestId('web-app-library-progress-all'));
    fireEvent.changeText(getByPlaceholderText('Cari judul, penulis, atau topik'), 'adab');

    expect(getAllByText('Adab Penuntut Ilmu').length).toBeGreaterThan(0);
    expect(queryByText('Bahan belajar fiqh praktis.')).toBeNull();
  });

  test('uses dashboard Perawi route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 1,
          title: 'Abu Hurairah',
          arabic: 'أبو هريرة',
          meta: 'sahabat · 59 H · tsiqah',
          raw: {
            id: 1,
            nama_arab: 'أبو هريرة',
            nama_latin: 'Abu Hurairah',
            status: 'tsiqah',
            tabaqah: 'sahabat',
            tahun_wafat: 59,
          },
        },
        {
          id: 2,
          title: 'Ibnu Sirin',
          arabic: 'محمد بن سيرين',
          meta: 'tabiin · 110 H · tsiqah',
          raw: {
            id: 2,
            nama_arab: 'محمد بن سيرين',
            nama_latin: 'Ibnu Sirin',
            status: 'tsiqah',
            tabaqah: 'tabiin',
            tahun_wafat: 110,
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByPlaceholderText, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'perawi-route', params: { featureKey: 'perawi' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-perawi-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Perawi Hadis')).toBeTruthy();
      expect(getByText('2 perawi')).toBeTruthy();
      expect(getByText('Abu Hurairah')).toBeTruthy();
      expect(getByText('Ibnu Sirin')).toBeTruthy();
      expect(getAllByText('Sahabat').length).toBeGreaterThan(0);
      expect(getAllByTestId('web-app-perawi-card')).toHaveLength(2);
    });

    fireEvent.press(getByTestId('web-app-perawi-tabaqah-tabiin'));

    expect(getByText('Ibnu Sirin')).toBeTruthy();
    expect(queryByText('Abu Hurairah')).toBeNull();
    expect(getAllByTestId('web-app-perawi-card')).toHaveLength(1);

    fireEvent.press(getByTestId('web-app-perawi-tabaqah-all'));
    fireEvent.changeText(getByPlaceholderText('Cari nama perawi...'), 'hurairah');

    expect(getByText('Abu Hurairah')).toBeTruthy();
    expect(queryByText('Ibnu Sirin')).toBeNull();
  });

  test('uses dashboard Fiqh route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 1,
          title: 'Adab Wudhu',
          body: 'Membaca basmalah dan membasuh anggota wudhu dengan tertib.',
          meta: 'thaharah',
          raw: {
            category: 'thaharah',
            content: 'Membaca basmalah dan membasuh anggota wudhu dengan tertib.',
            dalil: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
            id: 1,
            source: 'Fiqh Sunnah',
            title: 'Adab Wudhu',
          },
        },
        {
          id: 2,
          title: 'Zakat Perdagangan',
          body: 'Zakat perdagangan dihitung dari modal dan barang dagangan.',
          meta: '',
          raw: {
            content: 'Zakat perdagangan dihitung dari modal dan barang dagangan.',
            id: 2,
            slug: 'zakat',
            source: 'Al-Mulakhkhas Al-Fiqhi',
            title: 'Zakat Perdagangan',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByPlaceholderText, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'fiqh-route', params: { featureKey: 'fiqh' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-fiqh-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Fiqh Ringkas')).toBeTruthy();
      expect(getByText('2 materi fiqh')).toBeTruthy();
      expect(getByText('Adab Wudhu')).toBeTruthy();
      expect(getByText('Zakat Perdagangan')).toBeTruthy();
      expect(getAllByText('Zakat').length).toBeGreaterThan(1);
      expect(getAllByTestId('web-app-fiqh-card')).toHaveLength(2);
    });

    fireEvent.press(getByTestId('web-app-fiqh-category-zakat'));

    expect(getByText('Zakat Perdagangan')).toBeTruthy();
    expect(queryByText('Adab Wudhu')).toBeNull();
    expect(getAllByTestId('web-app-fiqh-card')).toHaveLength(1);

    fireEvent.press(getByTestId('web-app-fiqh-category-all'));
    fireEvent.changeText(getByPlaceholderText('Cari materi...'), 'wudhu');

    expect(getByText('Adab Wudhu')).toBeTruthy();
    expect(queryByText('Zakat Perdagangan')).toBeNull();
  });

  test('uses dashboard Siroh route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'siroh-1',
          title: 'Kelahiran Nabi',
          body: 'Kisah awal kehidupan Rasulullah.',
          raw: {
            category: 'Makkah',
            excerpt: 'Kisah awal kehidupan Rasulullah.',
            slug: 'kelahiran-nabi',
            title: 'Kelahiran Nabi',
          },
        },
        {
          id: 'siroh-2',
          title: 'Hijrah ke Madinah',
          body: 'Perjalanan hijrah bersama Abu Bakar.',
          raw: {
            category: 'Madinah',
            excerpt: 'Perjalanan hijrah bersama Abu Bakar.',
            slug: 'hijrah-ke-madinah',
            title: 'Hijrah ke Madinah',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'siroh-route', params: { featureKey: 'siroh' } },
    });

    await waitFor(() => {
      expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'siroh' }),
        { page: 0, size: 20 },
      );
      expect(getByTestId('explore-web-app-siroh-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Siroh Nabawiyah')).toBeTruthy();
      expect(getByText('Kisah perjalanan hidup Rasulullah Muhammad ﷺ')).toBeTruthy();
      expect(getByText('Makkah')).toBeTruthy();
      expect(getByText('Madinah')).toBeTruthy();
      expect(getAllByTestId('web-app-siroh-card')).toHaveLength(2);
    });

    fireEvent.changeText(getByTestId('web-app-siroh-search'), 'hijrah');

    expect(getByText('Hijrah ke Madinah')).toBeTruthy();
    expect(queryByText('Kelahiran Nabi')).toBeNull();
    expect(getAllByTestId('web-app-siroh-card')).toHaveLength(1);
  });

  test('uses dashboard Forum route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
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

    const { getAllByTestId, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'forum-route', params: { featureKey: 'forum' } },
    });

    await waitFor(() => {
      expect(forumApi.getForumQuestions).toHaveBeenCalledWith({ page: 0, size: 10 });
      expect(getByTestId('explore-web-app-forum-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Forum Tanya Jawab')).toBeTruthy();
      expect(getByText('Diskusi seputar Islam')).toBeTruthy();
      expect(getByText('Apa hukum zakat emas?')).toBeTruthy();
      expect(getByText('1 jawaban')).toBeTruthy();
      expect(getByText('2 suara')).toBeTruthy();
      expect(getAllByTestId('web-app-forum-question-card')).toHaveLength(1);
    });

    fireEvent.press(getByTestId('web-app-forum-ask'));
    expect(getByText('Ajukan Pertanyaan')).toBeTruthy();
  });

  test('uses dashboard Kamus route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.searchDictionary.mockResolvedValueOnce([
      {
        id: 'dict-1',
        title: 'iman',
        arabic: 'إيمان',
        body: 'Percaya dan membenarkan.',
        raw: {
          arabic: 'إيمان',
          definition: 'Percaya dan membenarkan.',
          id: 1,
          latin: 'iman',
          root: 'أمن',
        },
      },
    ]);

    const { getAllByTestId, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'kamus-route', params: { featureKey: 'kamus' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-kamus-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Kamus Arab')).toBeTruthy();
      expect(getByText('Ketik minimal 2 karakter.')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('web-app-kamus-search'), 'iman');
    fireEvent.press(getByTestId('web-app-kamus-submit'));

    await waitFor(() => {
      expect(exploreApi.searchDictionary).toHaveBeenCalledWith('iman');
      expect(getByText('إيمان')).toBeTruthy();
      expect(getByText('Percaya dan membenarkan.')).toBeTruthy();
      expect(getAllByTestId('web-app-kamus-result-card')).toHaveLength(1);
    });
  });

  test('uses dashboard Tafsir route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    clientApi.getSurahs.mockResolvedValueOnce([
      { number: 1, name: 'Al-Fatihah', meaning: 'Pembuka', ayahs: 7 },
      { number: 2, name: 'Al-Baqarah', meaning: 'Sapi Betina', ayahs: 286 },
    ]);
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'tafsir-1',
          title: 'Ayat 1',
          arabic: 'بِسْمِ اللّٰهِ',
          body: 'Dengan nama Allah',
          meta: 'Al-Fatihah · Tafsir Kemenag',
          tafsir: 'Kemenag detail',
          raw: { ayah_id: 1 },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'tafsir-route', params: { featureKey: 'tafsir' } },
    });

    await waitFor(() => {
      expect(clientApi.getSurahs).toHaveBeenCalled();
      expect(getByTestId('explore-web-app-tafsir-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Tafsir')).toBeTruthy();
      expect(getByText('Pilih surah untuk membaca penjelasan ayat.')).toBeTruthy();
      expect(getAllByTestId('web-app-tafsir-surah-card')).toHaveLength(2);
    });

    fireEvent.changeText(getByTestId('web-app-tafsir-search'), 'baqarah');
    expect(getByText('Al-Baqarah')).toBeTruthy();
    expect(queryByText('Al-Fatihah')).toBeNull();

    fireEvent.changeText(getByTestId('web-app-tafsir-search'), '');
    fireEvent.press(getByText('Al-Fatihah'));

    await waitFor(() => {
      expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: '/api/v1/tafsir/surah/1' }),
        { page: 0, size: 20 },
      );
      expect(getByText('Ayat 1')).toBeTruthy();
      expect(getByText('Kemenag detail')).toBeTruthy();
      expect(getAllByTestId('web-app-tafsir-result-card')).toHaveLength(1);
    });
  });

  test('uses dashboard Asbabun Nuzul route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'asbabun-1',
          title: 'Ayat 1',
          body: 'Sebab turun ayat pertama.',
          meta: 'Ayat 1',
          raw: {
            ayah_number: 1,
            content: 'Sebab turun ayat pertama.',
            display_ref: 'Ayat 1',
            source: 'Al-Wahidi',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getAllByText, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'asbabun-route', params: { featureKey: 'asbabun-nuzul' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-asbabun-surface')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('أَسْبَابُ النُّزُول')).toBeTruthy();
      expect(getByText('Asbabun Nuzul')).toBeTruthy();
      expect(getByText('Masukkan nomor surah atau pilih contoh cepat.')).toBeTruthy();
      expect(getAllByTestId('web-app-asbabun-quick-surah')).toHaveLength(7);
    });

    fireEvent.changeText(getByTestId('web-app-asbabun-search'), '1');
    fireEvent.press(getByTestId('web-app-asbabun-submit'));

    await waitFor(() => {
      expect(clientApi.getSurahs).not.toHaveBeenCalled();
      expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: '/api/v1/asbabun-nuzul/surah/1' }),
        { page: 0, size: 20 },
      );
      expect(getAllByText('Surah 1').length).toBeGreaterThan(0);
      expect(getByText('Al-Wahidi')).toBeTruthy();
      expect(getByText('Sebab turun ayat pertama.')).toBeTruthy();
      expect(getAllByTestId('web-app-asbabun-result-card')).toHaveLength(1);
    });
  });

  test('uses a friendly Blog rate-limit message in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const rateLimitError = new Error('Request failed: 429');
    rateLimitError.status = 429;
    exploreApi.getFeatureItemPage.mockRejectedValueOnce(rateLimitError);
    exploreApi.getBlogCategoryItems.mockResolvedValueOnce([]);

    const { getByTestId, getByText, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'blog-route', params: { featureKey: 'blog' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-blog-surface')).toBeTruthy();
      expect(getByText('Artikel sedang terlalu sering dimuat. Coba lagi sebentar.')).toBeTruthy();
    });
    expect(queryByText('Request failed: 429')).toBeNull();
  });

  test('opens Blog child detail in a web app dashboard detail surface', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    exploreApi.getFeatureItemPage.mockResolvedValueOnce({
      items: [
        {
          id: 'blog-1',
          title: 'Adab Menuntut Ilmu',
          body: 'Ringkasan adab belajar dari para ulama.',
          meta: 'Artikel',
          raw: {
            author: { name: 'Ustadz Ahmad' },
            category: 'akhlak',
            excerpt: 'Ringkasan adab belajar.',
            published_at: '2026-05-25',
            slug: 'adab-menuntut-ilmu',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByTestId, getByText, queryByTestId } = await renderExploreScreen({
      deepLinkTarget: { id: 'blog-route', params: { featureKey: 'blog' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-blog-surface')).toBeTruthy();
      expect(getByText('Adab Menuntut Ilmu')).toBeTruthy();
    });

    fireEvent.press(getAllByTestId('web-app-blog-card')[0]);

    await waitFor(() => {
      expect(getByTestId('explore-web-app-detail')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('ILMU')).toBeTruthy();
      expect(getByText('Ringkasan adab belajar dari para ulama.')).toBeTruthy();
    });

    fireEvent.press(getByTestId('web-app-detail-back'));
    await waitFor(() => expect(getByTestId('explore-web-app-blog-surface')).toBeTruthy());
  });

  test('uses dashboard Feed route surface in web app layout', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    socialApi.getFeedPostPage.mockResolvedValueOnce({
      items: [
        {
          id: 'feed-1',
          title: 'Ustadz Ahmad',
          body: 'Faedah singkat tentang adab belajar.',
          meta: '3 suka',
          raw: {
            author: { name: 'Ustadz Ahmad' },
            caption: 'Faedah singkat tentang adab belajar.',
            created_at: '2026-05-22',
            id: 10,
            likes: 3,
          },
        },
        {
          id: 'feed-2',
          title: 'Tim Thullaabul',
          body: 'Rujukan ayat untuk tadabbur.',
          meta: 'Ayat 2:255 · 5 suka',
          raw: {
            author: { name: 'Tim Thullaabul' },
            caption: 'Rujukan ayat untuk tadabbur.',
            created_at: '2026-05-23',
            id: 11,
            likes: 5,
            ref_id: 255,
            ref_type: 'ayah',
          },
        },
      ],
      meta: { hasMore: false },
    });

    const { getAllByTestId, getByTestId, getByText, queryByTestId, queryByText } = await renderExploreScreen({
      deepLinkTarget: { id: 'feed-route', params: { featureKey: 'community-feed' } },
    });

    await waitFor(() => {
      expect(getByTestId('explore-web-app-feed-route')).toBeTruthy();
      expect(queryByTestId('screen-title')).toBeNull();
      expect(getByText('Feed Komunitas')).toBeTruthy();
      expect(getByText('Bagikan dan temukan konten dari pengguna lain')).toBeTruthy();
      expect(getByText('Login untuk membuat postingan.')).toBeTruthy();
      expect(getByText('Ustadz Ahmad')).toBeTruthy();
      expect(getByText('Tim Thullaabul')).toBeTruthy();
      expect(getByText('Faedah singkat tentang adab belajar.')).toBeTruthy();
      expect(getByText('Ayat Quran')).toBeTruthy();
      expect(getByText('#255')).toBeTruthy();
      expect(getAllByTestId('web-app-feed-card')).toHaveLength(2);
    });
    expect(queryByText('Hadis')).toBeNull();
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

});
