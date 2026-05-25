jest.mock('lucide-react-native', () => {
  const icons = {};
  const names = [
    'BookOpenCheck', 'Calculator', 'CalendarDays', 'CheckSquare',
    'Clock3', 'Compass', 'HandHeart', 'ListChecks', 'Map',
    'ScrollText', 'Sparkles',
  ];
  names.forEach((n) => { icons[n] = n; });
  return icons;
});

jest.mock('../components/Card', () => {
  const { View } = require('react-native');
  return { Card: ({ children, style }) => <View style={style}>{children}</View> };
});

jest.mock('../components/Paper', () => {
  const { Pressable, Text } = require('react-native');
  return {
    CompactRow: ({ title, subtitle, onPress }) => (
      <Pressable onPress={onPress} testID="compact-row">
        <Text testID="row-title">{title}</Text>
        {subtitle ? <Text testID="row-subtitle">{subtitle}</Text> : null}
      </Pressable>
    ),
    SectionHeader: ({ title, meta }) => {
      const { View, Text } = require('react-native');
      return (
        <View>
          <Text testID="section-title">{title}</Text>
          {meta ? <Text testID="section-meta">{meta}</Text> : null}
        </View>
      );
    },
  };
});

jest.mock('../components/Screen', () => {
  const { View, Text } = require('react-native');
  return {
    Screen: ({ children, title, subtitle, contentStyle }) => (
      <View style={contentStyle}>
        <Text testID="screen-title">{title}</Text>
        {subtitle ? <Text testID="screen-subtitle">{subtitle}</Text> : null}
        {children}
      </View>
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../screens/PrayerScreen', () => ({
  PrayerScreen: () => {
    const { View, Text } = require('react-native');
    return <View><Text testID="prayer-screen">PrayerScreen</Text></View>;
  },
}));

jest.mock('../screens/QiblaScreen', () => ({
  QiblaScreen: () => {
    const { View, Text } = require('react-native');
    return <View><Text testID="qibla-screen">QiblaScreen</Text></View>;
  },
}));

jest.mock('../screens/KhatamScreen', () => ({
  KhatamScreen: () => {
    const { View, Text } = require('react-native');
    return <View><Text testID="khatam-screen">KhatamScreen</Text></View>;
  },
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { IbadahScreen } from '../screens/IbadahScreen';

const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');

const defaultNavigation = {
  current: { view: undefined, params: {} },
  open: jest.fn(),
  close: jest.fn(),
  setBack: jest.fn(),
  clearBack: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
});

describe('IbadahScreen', () => {
  test('renders screen title and subtitle', () => {
    const { getByTestId } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getByTestId('screen-title')).toBeTruthy();
    expect(getByTestId('screen-subtitle')).toBeTruthy();
    expect(getByTestId('ibadah-classic-hub')).toBeTruthy();
  });

  test('uses web app Ibadah hub surface when web app layout is active', () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByText, getByTestId, queryByTestId } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );

    expect(getByTestId('ibadah-web-app-hub')).toBeTruthy();
    expect(queryByTestId('ibadah-classic-hub')).toBeNull();
    expect(queryByTestId('screen-title')).toBeNull();
    expect(getByText('IBADAH & TRACKER')).toBeTruthy();
    expect(getByText('HARIAN')).toBeTruthy();
    expect(getByText('ALAT')).toBeTruthy();
    expect(getByText('Jadwal Sholat')).toBeTruthy();
    expect(getByText('Qibla')).toBeTruthy();
  });

  test('renders all section headers', () => {
    const { getAllByTestId } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    const titles = getAllByTestId('section-title');
    expect(titles.length).toBe(5);
    expect(titles[0].props.children).toBe('Harian');
  });

  test('renders Harian section items', () => {
    const { getByText } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getByText('Jadwal Sholat')).toBeTruthy();
    expect(getByText('Doa')).toBeTruthy();
    expect(getByText('Dzikir')).toBeTruthy();
  });

  test('renders Arah & Waktu section items', () => {
    const { getByText } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getByText('Qibla')).toBeTruthy();
    expect(getByText('Kalender Hijriah')).toBeTruthy();
    expect(getByText('Imsakiyah')).toBeTruthy();
  });

  test('renders Dzikir & Bacaan section items', () => {
    const { getByText } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getByText('Wirid')).toBeTruthy();
    expect(getByText('Wirid Saya')).toBeTruthy();
    expect(getByText('Tahlil')).toBeTruthy();
    expect(getByText('Asmaul Husna')).toBeTruthy();
  });

  test('renders Alat section items', () => {
    const { getByText } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getByText('Tasbih')).toBeTruthy();
    expect(getByText('Zakat')).toBeTruthy();
    expect(getByText('Faraidh')).toBeTruthy();
  });

  test('renders Rencana section items', () => {
    const { getByText } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getByText('Log Sholat')).toBeTruthy();
    expect(getByText('Manasik')).toBeTruthy();
    expect(getByText('Khatam')).toBeTruthy();
  });

  test('section items call onOpenTab with featureKey', () => {
    const onOpenTab = jest.fn();
    const { getByText } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={onOpenTab} />,
    );

    fireEvent.press(getByText('Doa'));
    expect(onOpenTab).toHaveBeenCalledWith('belajar', { featureKey: 'doa' });
  });

  test('section items with view property call navigation.open', () => {
    const navigation = {
      ...defaultNavigation,
      open: jest.fn(),
    };
    const { getByText } = render(
      <IbadahScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    fireEvent.press(getByText('Jadwal Sholat'));
    expect(navigation.open).toHaveBeenCalledWith('ibadah', 'prayer');

    fireEvent.press(getByText('Qibla'));
    expect(navigation.open).toHaveBeenCalledWith('ibadah', 'qibla');
  });

  test('khatam item opens dedicated ibadah sub-view', () => {
    const navigation = {
      ...defaultNavigation,
      open: jest.fn(),
    };
    const { getByText } = render(
      <IbadahScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );

    fireEvent.press(getByText('Khatam'));
    expect(navigation.open).toHaveBeenCalledWith('ibadah', 'khatam');
  });

  test('renders all 5 section cards', () => {
    const { getAllByTestId } = render(
      <IbadahScreen isActive navigation={defaultNavigation} onOpenTab={jest.fn()} />,
    );
    expect(getAllByTestId('compact-row').length).toBe(16);
  });

  test('renders QiblaScreen sub-view when view is qibla', () => {
    const navigation = {
      ...defaultNavigation,
      current: { view: 'qibla', params: {} },
      close: jest.fn(),
    };
    const { getByTestId } = render(
      <IbadahScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );
    expect(getByTestId('qibla-screen')).toBeTruthy();
  });

  test('renders PrayerScreen sub-view when view is prayer', () => {
    const navigation = {
      ...defaultNavigation,
      current: { view: 'prayer', params: {} },
      close: jest.fn(),
    };
    const { getByTestId } = render(
      <IbadahScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );
    expect(getByTestId('prayer-screen')).toBeTruthy();
  });

  test('renders KhatamScreen sub-view when view is khatam', () => {
    const navigation = {
      ...defaultNavigation,
      current: { view: 'khatam', params: {} },
      close: jest.fn(),
    };
    const { getByTestId } = render(
      <IbadahScreen isActive navigation={navigation} onOpenTab={jest.fn()} />,
    );
    expect(getByTestId('khatam-screen')).toBeTruthy();
  });
});
