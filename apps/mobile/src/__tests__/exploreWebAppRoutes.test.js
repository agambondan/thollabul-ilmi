jest.mock('lucide-react-native', () => {
  const icon = () => null;
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === '__esModule') return false;
      if (!target[prop]) target[prop] = icon;
      return target[prop];
    },
  });
});

jest.mock('../components/NotificationCenter', () => ({
  NotificationCenter: () => null,
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { allFeatures } from '../data/mobileFeatures';
import { renderExploreWebAppRoute } from '../screens/explore/ExploreWebAppRoutes';
import { WEB_APP_REFERENCE_ROUTE_CONFIGS } from '../screens/explore/WebAppReferenceListRoute';
import { WEB_APP_TOOL_ROUTE_CONFIGS } from '../screens/explore/WebAppToolRoute';

const baseContext = (activeFeature, overrides = {}) => ({
  activeFeature,
  blogCategory: 'all',
  blogCategoryOptions: [],
  blogSearch: '',
  clearFeature: jest.fn(),
  dictionaryQuery: '',
  error: '',
  featureSearch: '',
  focusDictionaryInput: jest.fn(),
  forumAnswerDraft: '',
  forumAnswers: [],
  forumAskBody: '',
  forumAskTags: '',
  forumAskTitle: '',
  forumDetail: null,
  forumError: '',
  forumHasMore: false,
  forumLoading: false,
  forumPage: 0,
  forumQuestions: [],
  forumSaving: false,
  forumSearch: '',
  forumSlug: '',
  forumTotal: 0,
  forumView: 'list',
  forumVotingId: null,
  handleHideFeedItem: jest.fn(),
  handleLikeFeedItem: jest.fn(),
  handleReportFeedItem: jest.fn(),
  handleTogglePinnedFeature: jest.fn(),
  items: [],
  kajianCategory: 'all',
  kajianSearch: '',
  leaderboardTab: 'streak',
  libraryProgressFilter: '',
  libraryProgressMap: {},
  likingFeedId: null,
  loadFeature: jest.fn(),
  loading: false,
  notesSearch: '',
  onOpenKajianUrl: jest.fn(),
  loadMoreFeature: jest.fn(),
  openItemDetail: jest.fn(),
  pagination: { hasMore: false, loadingMore: false },
  pinnedFeatureKeys: {},
  recentFeatureKeys: {},
  renderFeatureContent: () => <Text>Tool content</Text>,
  renderItem: jest.fn(),
  renderItemActionSheet: () => null,
  runDictionarySearch: jest.fn(),
  selectedSurahNumber: null,
  session: null,
  setActiveNoteRef: jest.fn(),
  setBlogCategory: jest.fn(),
  setBlogSearch: jest.fn(),
  setDictionaryQuery: jest.fn(),
  setFeatureSearch: jest.fn(),
  setForumAnswerDraft: jest.fn(),
  setForumAnswers: jest.fn(),
  setForumAskBody: jest.fn(),
  setForumAskTags: jest.fn(),
  setForumAskTitle: jest.fn(),
  setForumDetail: jest.fn(),
  setForumError: jest.fn(),
  setForumHasMore: jest.fn(),
  setForumLoading: jest.fn(),
  setForumPage: jest.fn(),
  setForumQuestions: jest.fn(),
  setForumSaving: jest.fn(),
  setForumSearch: jest.fn(),
  setForumSlug: jest.fn(),
  setForumTotal: jest.fn(),
  setForumView: jest.fn(),
  setForumVotingId: jest.fn(),
  setItemActionSheet: jest.fn(),
  setKajianCategory: jest.fn(),
  setKajianSearch: jest.fn(),
  setLeaderboardTab: jest.fn(),
  setLibraryProgressFilter: jest.fn(),
  setNotesSearch: jest.fn(),
  setSelectedItem: jest.fn(),
  setSurahSearch: jest.fn(),
  setTasbih: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  surahSearch: '',
  surahs: [],
  tasbih: { count: 7, target: 33 },
  visibleItems: [],
  ...overrides,
});

const getExpectedSurfaceTestID = (feature) => {
  if (feature.key === 'asbabun-nuzul') return 'explore-web-app-asbabun-surface';
  if (feature.key === 'community-feed') return 'explore-web-app-community-feed-surface';
  return `explore-web-app-${feature.key}-surface`;
};

describe('Explore web app reference list routes', () => {
  test('renders every mobile Explore feature through a web app route surface', () => {
    for (const feature of allFeatures) {
      const route = renderExploreWebAppRoute(baseContext(feature));
      expect(route).toBeTruthy();

      const view = render(route);
      expect(view.getByTestId(getExpectedSurfaceTestID(feature))).toBeTruthy();
      expect(view.queryByTestId('screen-title')).toBeNull();
      view.unmount();
    }
  });

  test('renders every configured reference/list route without generic Screen fallback', () => {
    for (const key of Object.keys(WEB_APP_REFERENCE_ROUTE_CONFIGS)) {
      const route = renderExploreWebAppRoute(baseContext({ key, type: key === 'amalan' ? 'protected-list' : 'list' }));
      const view = render(route);
      expect(view.getByTestId(`explore-web-app-${key}-surface`)).toBeTruthy();
      expect(view.queryByTestId('screen-title')).toBeNull();
      view.unmount();
    }
  });

  test('renders local tool routes in dashboard shell without generic Screen fallback', () => {
    for (const type of Object.keys(WEB_APP_TOOL_ROUTE_CONFIGS)) {
      const route = renderExploreWebAppRoute(baseContext(
        { key: type, title: WEB_APP_TOOL_ROUTE_CONFIGS[type].title, type },
        { renderFeatureContent: () => <Text>Tool content</Text>, renderItem: jest.fn() },
      ));
      const view = render(route);
      expect(view.getByTestId(`explore-web-app-${type}-surface`)).toBeTruthy();
      expect(view.queryByTestId('screen-title')).toBeNull();
      expect(view.getByText('Tool content')).toBeTruthy();
      view.unmount();
    }
  });

  test('filters Dzikir route by dashboard category and search', () => {
    const openItemDetail = jest.fn();
    const route = renderExploreWebAppRoute(baseContext(
      { key: 'dzikir', type: 'list' },
      {
        items: [
          {
            id: 'dzikir-1',
            title: 'Dzikir Pagi',
            body: 'Bacaan perlindungan pagi.',
            raw: { category: 'pagi', source: 'Hisnul Muslim', translation: { ar: 'سُبْحَانَ اللهِ', latin_idn: 'Subhanallah' } },
          },
          {
            id: 'dzikir-2',
            title: 'Dzikir Petang',
            body: 'Bacaan perlindungan petang.',
            raw: { category: 'petang', source: 'Hisnul Muslim', translation: { ar: 'الْحَمْدُ لِلَّهِ', latin_idn: 'Alhamdulillah' } },
          },
        ],
        openItemDetail,
      },
    ));
    const { getAllByTestId, getByTestId, getByText, queryByText } = render(route);

    expect(getByTestId('explore-web-app-dzikir-surface')).toBeTruthy();
    expect(getByText('2 dzikir tersedia')).toBeTruthy();

    fireEvent.press(getAllByTestId('web-app-dzikir-category')[2]);
    expect(getByText('Dzikir Petang')).toBeTruthy();
    expect(queryByText('Dzikir Pagi')).toBeNull();

    fireEvent.changeText(getByTestId('web-app-dzikir-search'), 'alhamdulillah');
    expect(getByText('Menampilkan 1 dari 2 dzikir')).toBeTruthy();

    fireEvent.press(getAllByTestId('web-app-reference-card')[0]);
    expect(openItemDetail).toHaveBeenCalledWith(expect.objectContaining({ id: 'dzikir-2' }));
  });

  test('renders Amalan route as dashboard checklist and toggles an item', () => {
    const onToggleAmalan = jest.fn();
    const route = renderExploreWebAppRoute(baseContext(
      { key: 'amalan', title: 'Amalan Harian', type: 'protected-list' },
      {
        items: [
          { id: 'amalan-1', title: 'Subuh berjamaah', raw: { id: 1, name_id: 'Subuh berjamaah', is_checked: true } },
          { id: 'amalan-2', title: 'Sholat Dhuha', raw: { id: 2, name_id: 'Sholat Dhuha', is_checked: false } },
        ],
        onToggleAmalan,
        visibleItems: [
          { id: 'amalan-1', title: 'Subuh berjamaah', raw: { id: 1, name_id: 'Subuh berjamaah', is_checked: true } },
          { id: 'amalan-2', title: 'Sholat Dhuha', raw: { id: 2, name_id: 'Sholat Dhuha', is_checked: false } },
        ],
      },
    ));
    const { getAllByTestId, getByText, queryByTestId } = render(route);

    expect(queryByTestId('screen-title')).toBeNull();
    expect(getByText('Amalan Harian')).toBeTruthy();
    expect(getByText('1/2')).toBeTruthy();
    expect(getAllByTestId('web-app-amalan-row')).toHaveLength(2);

    fireEvent.press(getAllByTestId('web-app-amalan-row')[1]);
    expect(onToggleAmalan).toHaveBeenCalledWith(expect.objectContaining({ id: 'amalan-2' }));
  });

  test('renders Imsakiyah route as dashboard schedule table', () => {
    const route = renderExploreWebAppRoute(baseContext(
      { key: 'imsakiyah', title: 'Imsakiyah', type: 'list' },
      {
        items: [
          {
            id: 'imsak-1',
            raw: { city: 'Bandung (WIB)', date: '2026-05-01', prayers: { imsak: '04:20', fajr: '04:30', sunrise: '05:44', dhuhr: '11:51', asr: '15:12', maghrib: '17:49', isha: '18:59' } },
          },
          {
            id: 'imsak-2',
            raw: { day: 2, date: '2 Ramadan 1447', prayers: { imsak: '04:21', fajr: '04:31', sunrise: '05:44', dhuhr: '11:51', asr: '15:12', maghrib: '17:49', isha: '18:59' } },
          },
        ],
        visibleItems: [
          {
            id: 'imsak-1',
            raw: { city: 'Bandung (WIB)', date: '2026-05-01', prayers: { imsak: '04:20', fajr: '04:30', sunrise: '05:44', dhuhr: '11:51', asr: '15:12', maghrib: '17:49', isha: '18:59' } },
          },
          {
            id: 'imsak-2',
            raw: { day: 2, date: '2 Ramadan 1447', prayers: { imsak: '04:21', fajr: '04:31', sunrise: '05:44', dhuhr: '11:51', asr: '15:12', maghrib: '17:49', isha: '18:59' } },
          },
        ],
      },
    ));
    const { getAllByTestId, getByTestId, getByText, queryByTestId } = render(route);

    expect(getByTestId('explore-web-app-imsakiyah-surface')).toBeTruthy();
    expect(queryByTestId('screen-title')).toBeNull();
    expect(getByText('Jadwal imsak & sholat bulanan · Bandung (WIB)')).toBeTruthy();
    expect(getByText('Mei 2026')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getAllByTestId('web-app-imsakiyah-row')).toHaveLength(2);
    expect(getByText('04:20')).toBeTruthy();
  });

  test('renders Hijri route as dashboard calendar surface', () => {
    const route = renderExploreWebAppRoute(baseContext(
      { key: 'hijri', title: 'Kalender Hijri', type: 'hijri' },
      {
        items: [
          {
            id: 'hijri-today',
            title: 'Today',
            body: '12 Dzulhijjah 1447 H',
            raw: { day: 12, month: 12, month_name: 'Dzulhijjah', type: 'hijri_today', year: 1447, gregorian_year: 2026, gregorian_month: 5, gregorian_day: 29 },
          },
          {
            id: 'event-1',
            title: 'Idul Adha',
            body: 'Hari raya kurban.',
            raw: { category: 'eid', hijri_day: 10, hijri_month: 12, translation: { title_idn: 'Idul Adha', description_idn: 'Hari raya kurban.' } },
          },
        ],
        visibleItems: [
          {
            id: 'hijri-today',
            title: 'Today',
            body: '12 Dzulhijjah 1447 H',
            raw: { day: 12, month: 12, month_name: 'Dzulhijjah', type: 'hijri_today', year: 1447, gregorian_year: 2026, gregorian_month: 5, gregorian_day: 29 },
          },
          {
            id: 'event-1',
            title: 'Idul Adha',
            body: 'Hari raya kurban.',
            raw: { category: 'eid', hijri_day: 10, hijri_month: 12, translation: { title_idn: 'Idul Adha', description_idn: 'Hari raya kurban.' } },
          },
        ],
      },
    ));
    const { getAllByText, getByTestId, getByText, queryByTestId } = render(route);

    expect(getByTestId('explore-web-app-hijri-surface')).toBeTruthy();
    expect(queryByTestId('screen-title')).toBeNull();
    expect(getAllByText('12 Dzulhijjah 1447 هـ').length).toBeGreaterThan(0);
    expect(getByText('Puasa Sunnah')).toBeTruthy();
    expect(getByText('Konversi Tanggal')).toBeTruthy();
    expect(getByText('Idul Adha')).toBeTruthy();
  });

  test('renders Tasbih route as dashboard counter surface', () => {
    const setTasbih = jest.fn();
    const route = renderExploreWebAppRoute(baseContext(
      { key: 'tasbih', title: 'Tasbih', type: 'tasbih' },
      {
        renderFeatureContent: () => <Text>Tool content</Text>,
        setTasbih,
        tasbih: { count: 32, target: 33 },
      },
    ));
    const { getAllByText, getByTestId, getByText, queryByText } = render(route);

    expect(getByTestId('explore-web-app-tasbih-surface')).toBeTruthy();
    expect(queryByText('Tool content')).toBeNull();
    expect(getByText('Tasbih Digital')).toBeTruthy();
    expect(getAllByText('سُبْحَانَ اللَّهِ').length).toBeGreaterThan(0);
    expect(getByText('/ 33')).toBeTruthy();
    expect(getByText('Pilihan Dzikir')).toBeTruthy();

    fireEvent.press(getByTestId('web-app-tasbih-counter'));
    expect(setTasbih).toHaveBeenCalledWith(expect.any(Function));
  });
});
