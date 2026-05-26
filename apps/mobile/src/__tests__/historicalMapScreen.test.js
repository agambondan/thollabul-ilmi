jest.mock('../api/client', () => ({
  requestJson: jest.fn(),
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HistoricalMapContent } from '../screens/HistoricalMapScreen';

const client = require('../api/client');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');

const locations = [
  {
    id: 'makkah',
    name: 'Makkah',
    description: 'Kota kelahiran Rasulullah',
    category: 'kota',
    era: 'pra-islam',
    latitude: 21.3891,
    longitude: 39.8579,
  },
  {
    id: 'qarawiyyin',
    name: 'Universitas Al-Qarawiyyin',
    description: 'Pusat ilmu klasik',
    category: 'universitas',
    era: 'fatimiyah',
    latitude: 34.0648,
    longitude: -4.973,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  client.requestJson.mockResolvedValue({ items: locations });
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
});

describe('HistoricalMapContent', () => {
  test('keeps the classic map surface intact', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<HistoricalMapContent />);

    await waitFor(() => {
      expect(getByTestId('historical-map-native')).toBeTruthy();
    });

    expect(queryByTestId('historical-map-web-app-surface')).toBeNull();
    expect(getByText('Makkah')).toBeTruthy();
    expect(client.requestJson).toHaveBeenCalledWith('/api/v1/locations?size=100');
  });

  test('uses dashboard-aligned web app peta controls', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByPlaceholderText, getByTestId, getByText } = render(<HistoricalMapContent />);

    await waitFor(() => {
      expect(getByTestId('historical-map-web-app-surface')).toBeTruthy();
      expect(getByText('2 lokasi')).toBeTruthy();
    });

    expect(getByText('Peta Islam Interaktif')).toBeTruthy();
    expect(getByText('Lokasi bersejarah dalam peradaban Islam')).toBeTruthy();
    expect(getByText('Universitas')).toBeTruthy();
    expect(getByText('Fatimiyah')).toBeTruthy();
    expect(getByPlaceholderText('Cari lokasi...')).toBeTruthy();
  });

  test('web app search and list mode reuse the locations endpoint and filtered list', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByPlaceholderText, getByText, queryByText } = render(<HistoricalMapContent />);

    await waitFor(() => {
      expect(getByText('2 lokasi')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Cari lokasi...'), 'qarawiyyin');

    await waitFor(() => {
      expect(client.requestJson).toHaveBeenLastCalledWith('/api/v1/locations?q=qarawiyyin&size=100');
    });

    fireEvent.press(getByText('Jelajahi'));

    await waitFor(() => {
      expect(getByText('Universitas Al-Qarawiyyin')).toBeTruthy();
    });
    expect(queryByText('Makkah')).toBeNull();
  });
});
