jest.mock('../api/client', () => ({
  requestJson: jest.fn(),
}));

jest.mock('../hooks/useLayoutModePreference', () => ({
  useLayoutModePreference: jest.fn(),
}));

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TokohTarikhContent } from '../screens/TokohTarikhContent';

const client = require('../api/client');
const { useLayoutModePreference } = require('../hooks/useLayoutModePreference');

const tokohItems = [
  {
    id: 'imam-syafii',
    nama: "Imam Syafi'i",
    era: 'Ulama Klasik',
    tahun_lahir: '150 H',
    tahun_wafat: '204 H',
    biografi: 'Pendiri mazhab Syafii.',
    kontribusi: 'Kitab Ar-Risalah.',
  },
  {
    id: 'ibnu-sina',
    nama: 'Ibnu Sina',
    era: 'Ilmuwan',
    tahun_lahir: '370 H',
    tahun_wafat: '428 H',
    translation: {
      description_idn: 'Ulama dan tabib besar.',
    },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  client.requestJson.mockResolvedValue({ items: tokohItems });
  useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
});

describe('TokohTarikhContent', () => {
  test('keeps the classic tokoh list available', async () => {
    const { getByText, queryByTestId } = render(<TokohTarikhContent />);

    await waitFor(() => {
      expect(getByText("Imam Syafi'i")).toBeTruthy();
    });

    expect(queryByTestId('tokoh-web-app-surface')).toBeNull();
    expect(getByText('2 tokoh')).toBeTruthy();
    expect(client.requestJson).toHaveBeenCalledWith('/api/v1/tokoh-tarikh?page=1&size=100');
  });

  test('uses dashboard-aligned web app tokoh surface', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getAllByText, getByPlaceholderText, getByTestId, getByText } = render(<TokohTarikhContent />);

    await waitFor(() => {
      expect(getByTestId('tokoh-web-app-surface')).toBeTruthy();
      expect(getByText("Imam Syafi'i")).toBeTruthy();
    });

    expect(getByText('Tokoh Tarikh')).toBeTruthy();
    expect(getByText('Biografi ulama, ilmuwan, dan tokoh Islam')).toBeTruthy();
    expect(getByPlaceholderText('Cari tokoh...')).toBeTruthy();
    expect(getAllByText('Ulama Klasik').length).toBeGreaterThanOrEqual(1);
    expect(getByText('150 H - 204 H')).toBeTruthy();
  });

  test('web app filters and modal detail reuse endpoint and biography fields', async () => {
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: true });
    const { getByPlaceholderText, getByText } = render(<TokohTarikhContent />);

    await waitFor(() => {
      expect(getByText("Imam Syafi'i")).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Cari tokoh...'), 'sina');

    await waitFor(() => {
      expect(client.requestJson).toHaveBeenLastCalledWith('/api/v1/tokoh-tarikh?page=1&size=100&q=sina');
    });

    fireEvent.press(getByText('Ibnu Sina'));

    await waitFor(() => {
      expect(getByText('Biografi')).toBeTruthy();
      expect(getByText('Ulama dan tabib besar.')).toBeTruthy();
    });
  });
});
