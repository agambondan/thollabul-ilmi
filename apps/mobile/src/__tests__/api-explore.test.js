jest.mock('../api/client', () => ({
  requestJson: jest.fn(),
}));

jest.mock('../api/personal', () => ({
  getBookmarks: jest.fn(),
}));

const { requestJson } = require('../api/client');
const { getBookmarks } = require('../api/personal');
const {
  normalizeExploreItem,
  getAllNotes,
  getBookmarkItems,
  searchDictionary,
  getQuizQuestions,
  getHijriOverview,
  getFeatureItemPage,
  getFeatureItems,
} = require('../api/explore');

describe('explore api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeExploreItem', () => {
    test('normalizes item with translation fields', () => {
      const result = normalizeExploreItem({
        name: 'Al-Fatihah',
        translation: {
          arab: 'الفاتحة',
        },
        type: 'surah',
      });
      expect(result.title).toBe('Al-Fatihah');
      expect(result.arabic).toBe('الفاتحة');
      expect(result.body).toBe('');
      expect(result.meta).toBe('surah');
    });

    test('normalizes ayah/tafsir item', () => {
      const result = normalizeExploreItem({
        ayah_id: 1,
        ayah: {
          number: 1,
          surah: { translation: { latin_en: 'Al-Fatihah' } },
          translation: { ar: 'نص', idn: 'Makna' },
        },
        kemenag: { text_idn: 'Tafsir Kemenag' },
        ibnu_katsir: { text_idn: 'Tafsir Al-Mishbah' },
      });
      expect(result.title).toBe('Ayat 1');
      expect(result.arabic).toBe('نص');
      expect(result.body).toBe('Makna');
      expect(result.meta).toContain('Al-Fatihah');
      expect(result.meta).toContain('Tafsir Kemenag');
      expect(result.meta).toContain('Tafsir Al-Mishbah');
      expect(result.tafsir).toBe('Tafsir Kemenag');
      expect(result.secondaryTafsir).toBe('Tafsir Al-Mishbah');
    });

    test('normalizes jarh/tadil item', () => {
      const result = normalizeExploreItem({
        jenis_nilai: 'jarh',
        teks_nilai: 'Tidak tsiqah',
        perawi: { nama_latin: 'Abu Hurairah' },
        tingkat: 3,
        sumber: 'Adz-Dzahabi',
      });
      expect(result.title).toBe('Tidak tsiqah');
      expect(result.body).toContain('Abu Hurairah');
      expect(result.meta).toContain('Jarh');
      expect(result.meta).toContain('Tingkat 3');
      expect(result.meta).toContain('Adz-Dzahabi');
    });

    test('normalizes perawi item', () => {
      const result = normalizeExploreItem({
        id: 7,
        nama_arab: 'أبو هريرة',
        nama_latin: 'Abu Hurairah',
        status: 'tsiqah',
        tabaqah: 'sahabat',
        tahun_wafat: 59,
      });
      expect(result.id).toBe(7);
      expect(result.title).toBe('Abu Hurairah');
      expect(result.arabic).toBe('أبو هريرة');
      expect(result.meta).toContain('sahabat');
      expect(result.meta).toContain('59 H');
      expect(result.meta).toContain('tsiqah');
    });

    test('uses fallback title and id', () => {
      const result = normalizeExploreItem({}, 5);
      expect(result.title).toBe('Item 6');
      expect(result.id).toBe('Item 6-5');
    });

    test('passes through raw items', () => {
      const result = normalizeExploreItem({ raw: true, title: 'x', body: 'y', arabic: 'z' });
      expect(result.raw).toBe(true);
      expect(result.title).toBe('x');
    });
  });

  describe('getAllNotes', () => {
    test('calls correct endpoint and normalizes', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ name: 'Catatan' }],
      });
      const result = await getAllNotes();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/notes', {
        auth: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Catatan');
    });
  });

  describe('getBookmarkItems', () => {
    test('calls getBookmarks and normalizes', async () => {
      getBookmarks.mockResolvedValueOnce([
        { name: 'Bookmark 1' },
      ]);
      const result = await getBookmarkItems();
      expect(getBookmarks).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bookmark 1');
    });
  });

  describe('searchDictionary', () => {
    test('calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ name: 'Iman', definition: 'Percaya' }],
      });
      const result = await searchDictionary('iman');
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/dictionary?q=iman&size=20',
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Iman');
    });

    test('encodes query', async () => {
      requestJson.mockResolvedValueOnce({ items: [] });
      await searchDictionary('al kitab');
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/dictionary?q=al%20kitab&size=20',
      );
    });

    test('returns empty for blank query', async () => {
      const result = await searchDictionary('   ');
      expect(requestJson).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getQuizQuestions', () => {
    test('calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ question: 'Apa itu iman?' }],
      });
      const result = await getQuizQuestions();
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/quiz/session?count=5',
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Apa itu iman?');
    });
  });

  describe('getHijriOverview', () => {
    test('returns today and events when both succeed', async () => {
      requestJson
        .mockResolvedValueOnce({ date_hijri: '1 Ramadhan 1446' })
        .mockResolvedValueOnce({
          items: [
            { name: 'Nuzulul Quran' },
          ],
        });
      const result = await getHijriOverview();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Today');
      expect(result[0].body).toBe('1 Ramadhan 1446');
    });

    test('handles today failure gracefully', async () => {
      requestJson
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ items: [] });
      const result = await getHijriOverview();
      expect(result).toHaveLength(0);
    });
  });

  describe('getFeatureItemPage', () => {
    test('calls feature endpoint without pagination', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ title: 'Item 1', translation: { idn: 'desk' } }],
      });
      const result = await getFeatureItemPage({
        endpoint: '/api/v1/some-feature',
        type: 'public',
      });
      expect(requestJson).toHaveBeenCalledWith('/api/v1/some-feature', {
        auth: false,
      });
      expect(result.items).toHaveLength(1);
      expect(result.meta).toBeDefined();
    });

    test('adds pagination params when pagination given', async () => {
      requestJson.mockResolvedValueOnce({ items: [] });
      await getFeatureItemPage(
        { endpoint: '/api/v1/some-feature', type: 'public' },
        { page: 1, size: 10 },
      );
      expect(requestJson).toHaveBeenCalled();
      const url = requestJson.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('size=10');
    });
  });

  describe('getFeatureItems', () => {
    test('returns items from getFeatureItemPage', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ title: 'A', translation: { idn: 'a' } }],
      });
      const result = await getFeatureItems(
        { endpoint: '/api/v1/features', type: 'public' },
        { page: 0, size: 20 },
      );
      expect(result).toHaveLength(1);
    });
  });
});
