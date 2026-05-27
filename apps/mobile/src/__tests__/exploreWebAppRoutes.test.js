jest.mock('lucide-react-native', () => {
  const icons = {};
  ['BookOpen', 'ChevronDown', 'Search'].forEach((name) => { icons[name] = name; });
  return icons;
});

jest.mock('../components/NotificationCenter', () => ({
  NotificationCenter: () => null,
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderExploreWebAppRoute } from '../screens/explore/ExploreWebAppRoutes';
import { WEB_APP_REFERENCE_ROUTE_CONFIGS } from '../screens/explore/WebAppReferenceListRoute';
import { WEB_APP_TOOL_ROUTE_CONFIGS } from '../screens/explore/WebAppToolRoute';

const baseContext = (activeFeature, overrides = {}) => ({
  activeFeature,
  error: '',
  items: [],
  loading: false,
  loadMoreFeature: jest.fn(),
  openItemDetail: jest.fn(),
  pagination: { hasMore: false, loadingMore: false },
  renderItemActionSheet: () => null,
  visibleItems: [],
  ...overrides,
});

describe('Explore web app reference list routes', () => {
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
});
