import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockBySurah = jest.fn();
const mockByAyah = jest.fn();
const mockBySurahPage = jest.fn();

jest.mock('@/lib/api', () => ({
  audioApi: {
    byAyah: (...args) => mockByAyah(...args),
    bySurah: (...args) => mockBySurah(...args),
  },
  quranApi: {
    bySurahPage: (...args) => mockBySurahPage(...args),
  },
}));

jest.mock('@/context/Locale', () => ({
  useLocale: () => ({ t: () => undefined }),
}));

const SurahAudioPlayer = require('@/components/SurahAudioPlayer').default;

const mockResponse = (payload) => ({
  ok: true,
  json: async () => payload,
});

describe('SurahAudioPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockBySurah.mockResolvedValue(
      mockResponse({
        items: [
          {
            audio_url: 'https://example.com/alafasy-surah.mp3',
            qari_name: 'Mishary Rashid Al-Afasy',
            qari_slug: 'mishary-rashid-alafasy',
          },
          {
            audio_url: 'https://example.com/sudais-surah.mp3',
            qari_name: 'Abdul Rahman Al-Sudais',
            qari_slug: 'abdul-rahman-al-sudais',
          },
        ],
      }),
    );
    mockBySurahPage.mockResolvedValue(
      mockResponse({
        items: [
          { id: 11, number: 1, surah_number: 1 },
          { id: 12, number: 2, surah_number: 1 },
        ],
      }),
    );
    mockByAyah.mockImplementation((ayahId) =>
      Promise.resolve(
        mockResponse({
          items: [
            {
              audio_url: `https://example.com/alafasy-${ayahId}.mp3`,
              qari_name: 'Mishary Rashid Al-Afasy',
              qari_slug: 'mishary-rashid-alafasy',
            },
            {
              audio_url: `https://example.com/sudais-${ayahId}.mp3`,
              qari_name: 'Abdul Rahman Al-Sudais',
              qari_slug: 'abdul-rahman-al-sudais',
            },
          ],
        }),
      ),
    );
    global.Audio = jest.fn(function Audio(url) {
      this.src = url;
      this.currentTime = 0;
      this.paused = true;
      this.playbackRate = 1;
      this.pause = jest.fn(() => {
        this.paused = true;
        this.onpause?.();
      });
      this.play = jest.fn(() => {
        this.paused = false;
        this.onplay?.();
        return Promise.resolve();
      });
    });
  });

  test('plays Quran audio range with selected qari, repeat, and speed', async () => {
    render(<SurahAudioPlayer surahNumber={1} surahName="Al-Fatihah" totalAyahs={7} />);

    fireEvent.click(screen.getByText('Dengar Surah'));
    await screen.findByText('Abdul Rahman Al-Sudais');
    await waitFor(() => {
      expect(screen.queryByText('Memuat...')).not.toBeInTheDocument();
    });

    fireEvent.change(await screen.findByLabelText('Sampai ayat'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByText('Abdul Rahman Al-Sudais'));
    fireEvent.click(screen.getByText('1.25x'));
    fireEvent.click(screen.getByLabelText('Repeat'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Putar range/i })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: /Putar range/i }));

    await waitFor(() => {
      expect(mockBySurahPage).toHaveBeenCalledWith(1, 0, 1);
      expect(mockBySurah).not.toHaveBeenCalled();
      expect(mockBySurahPage).toHaveBeenCalledWith(1, 0, 300);
      expect(mockByAyah).toHaveBeenCalledWith(11);
      expect(global.Audio).toHaveBeenCalledWith('https://example.com/sudais-11.mp3');
    });
    expect(global.Audio.mock.instances[0].playbackRate).toBe(1.25);
    expect(screen.getByText('Surah 1 · Ayat 1')).toBeInTheDocument();
  });
});
