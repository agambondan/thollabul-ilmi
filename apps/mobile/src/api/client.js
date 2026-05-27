import { readSession } from '../storage/session';
import { NativeModules, Platform } from 'react-native';

const resolveApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:29900';

  const scriptUrl = NativeModules.SourceCode?.scriptURL ?? '';
  const host = /^[a-z][a-z0-9+.-]*:\/\/([^/:]+)/i.exec(scriptUrl)?.[1];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:9900`;
  }

  return 'http://localhost:9900';
};

export const API_URL = resolveApiUrl();

export const requestJson = async (path, options = {}) => {
  const { auth, body: rawBody, headers, ...fetchOptions } = options;
  const session = auth ? await readSession() : null;
  const body = rawBody && typeof rawBody !== 'string' ? JSON.stringify(rawBody) : rawBody;
  const url = `${API_URL}${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...headers,
      },
      ...fetchOptions,
      body,
    });
  } catch (error) {
    throw new Error(`Network request failed ke ${url}. Pastikan HP bisa membuka ${API_URL}/api/v1/surah?size=1`);
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const error = await response.json();
      message = error?.message ?? error?.error_description ?? message;
    } catch {
      // Keep the status-based message when the response body is not JSON.
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

export const postJson = async (path, body, options = {}) =>
  requestJson(path, {
    method: 'POST',
    body,
    ...options,
  });

export const putJson = async (path, body, options = {}) =>
  requestJson(path, {
    method: 'PUT',
    body,
    ...options,
  });

export const deleteJson = async (path, options = {}) =>
  requestJson(path, {
    method: 'DELETE',
    ...options,
  });

export const pickItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const normalizeAyah = (item) => ({
  id: item.id ?? item.number,
  number: item.number ?? item.ayah_number ?? item.id,
  surahNumber: item.surah?.number ?? item.surah_number ?? item.surah_id,
  pageNumber: item.page ?? item.page_number ?? item.pageNumber,
  juzNumber: item.juz_number ?? item.juzNumber,
  hizbQuarter: item.hizb_quarter ?? item.hizbQuarter,
  surahName:
    item.surah?.translation?.latin_en ??
    item.surah?.translation?.latin_idn ??
    item.surah?.name ??
    item.surah_name ??
    '',
  arabic: item.translation?.arab ?? item.translation?.ar ?? item.arabic ?? '',
  arabicHtml:
    item.translation?.ar_html ??
    item.translation?.ar_format ??
    item.translation?.ar_tajweed ??
    item.ar_html ??
    item.ar_format ??
    item.ar_tajweed ??
    '',
  latin: item.translation?.latin_en ?? item.translation?.latin_idn ?? item.latin ?? '',
  translation:
    item.translation?.text_en ??
    item.translation?.en ??
    item.translation?.idn ??
    item.translation?.text ??
    item.translation ??
    '',
});

const dedupeAyahs = (items, fallbackSurahNumber = null) => {
  const seen = new Set();
  return items.filter((ayah) => {
    const surahKey = ayah.surahNumber ?? fallbackSurahNumber ?? ayah.surahName ?? 'surah';
    const ayahKey = ayah.number ?? ayah.id;
    const key = `${surahKey}:${ayahKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeSurah = (item) => ({
  id: item.id ?? item.number,
  number: item.number ?? item.nomor_surah ?? item.id,
  name:
    item.translation?.latin_en ??
    item.translation?.latin_idn ??
    item.nama_latin ??
    item.name ??
    `Surah ${item.number ?? item.id}`,
  arabic: item.translation?.arab ?? item.translation?.ar ?? item.nama_arab ?? item.arabic ?? '',
  meaning: item.translation?.name_en ?? item.translation?.en ?? item.translation?.name_idn ?? item.translation?.idn ?? item.arti ?? '',
  ayahs: item.count_ayah ?? item.number_of_ayahs ?? item.jumlah_ayat ?? item.ayah_count ?? '-',
});

const normalizeAudio = (item, index = 0) => ({
  id: item?.id ?? item?.qari_slug ?? `audio-${index}`,
  qari_name: item?.qari_name ?? item?.qariName ?? item?.name ?? 'Reciter',
  qari_slug: item?.qari_slug ?? item?.qariSlug ?? item?.slug ?? `qari-${index}`,
  audio_url: item?.audio_url ?? item?.audioUrl ?? item?.url ?? '',
  provider: item?.provider ?? '',
});

export const getAyahsForSurah = async (surahNumber) => {
  const payload = await requestJson(`/api/v1/ayah/surah/number/${surahNumber}?size=300&page=0`);
  return dedupeAyahs(pickItems(payload).map(normalizeAyah), surahNumber);
};

export const getAyahsForSurahPage = async (surahNumber, { page = 0, size = 20 } = {}) => {
  const payload = await requestJson(`/api/v1/ayah/surah/number/${surahNumber}?size=${size}&page=${page}`);
  const items = dedupeAyahs(pickItems(payload).map(normalizeAyah), surahNumber);
  const total = Number(payload?.total ?? payload?.data?.total ?? 0);
  const totalPages = Number(payload?.total_pages ?? payload?.totalPages ?? payload?.data?.total_pages ?? 0);

  return {
    hasMore: totalPages ? page + 1 < totalPages : items.length >= size,
    items,
    page,
    size,
    total,
    totalPages,
  };
};

export const getAyahsForPage = async (page) => {
  const payload = await requestJson(`/api/v1/ayah/page/${page}`);
  return dedupeAyahs(pickItems(payload).map(normalizeAyah));
};

export const getAyahsForHizb = async (hizb) => {
  const payload = await requestJson(`/api/v1/ayah/hizb/${hizb}`);
  return dedupeAyahs(pickItems(payload).map(normalizeAyah));
};

export const normalizeMufrodat = (item) => ({
  id: item.id,
  ayahId: item.ayah_id ?? item.ayahId,
  wordIndex: item.word_index ?? item.wordIndex,
  arabic: item.arabic ?? '',
  transliteration: item.transliteration ?? '',
  indonesian: item.indonesian ?? '',
  rootWord: item.root_word ?? item.rootWord ?? '',
  partOfSpeech: item.part_of_speech ?? item.partOfSpeech ?? '',
  surahNumber:
    item.ayah?.surah?.number ??
    item.ayah?.surah_id ??
    item.surah_number ??
    null,
  ayahNumber: item.ayah?.number ?? item.ayah_number ?? null,
});

const groupMufrodatByAyah = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const key = `${item.surahNumber ?? ''}:${item.ayahNumber ?? ''}:${item.ayahId ?? ''}`;
    if (!map.has(key)) {
      map.set(key, {
        ayahId: item.ayahId,
        surahNumber: item.surahNumber,
        ayahNumber: item.ayahNumber,
        words: [],
      });
    }
    map.get(key).words.push(item);
  });
  map.forEach((group) => group.words.sort((a, b) => (a.wordIndex ?? 0) - (b.wordIndex ?? 0)));
  return Array.from(map.values());
};

export const getMufrodatBySurah = async (surahNumber) => {
  const payload = await requestJson(`/api/v1/mufrodat/surah/${surahNumber}`);
  return pickItems(payload).map(normalizeMufrodat);
};

export const getMufrodatByPage = async (page) => {
  const payload = await requestJson(`/api/v1/mufrodat/page/${page}`);
  return pickItems(payload).map(normalizeMufrodat);
};

export const getMufrodatByAyahNumber = async (surahNumber, ayahNumber) => {
  const payload = await requestJson(
    `/api/v1/mufrodat/surah/${surahNumber}/ayah/${ayahNumber}`,
  );
  return pickItems(payload).map(normalizeMufrodat);
};

export const getMufrodatGroupedByPage = async (page) => {
  const items = await getMufrodatByPage(page);
  return groupMufrodatByAyah(items);
};

export const getAyahAudio = async ({ ayahId }) => {
  const payload = await requestJson(`/api/v1/audio/ayah/${ayahId}`);
  return pickItems(payload).map(normalizeAudio).filter((item) => item.audio_url);
};

export const getAyahById = async (ayahId) => {
  const payload = await requestJson(`/api/v1/ayah/${ayahId}`);
  return normalizeAyah(payload?.data ?? payload);
};

export const getDailyAyah = async () => {
  const payload = await requestJson('/api/v1/ayah/daily');
  return normalizeAyah(payload?.data ?? payload?.item ?? payload);
};

export const getHijriToday = async () => {
  const payload = await requestJson('/api/v1/hijri/today');
  const data = payload?.data ?? payload;
  return {
    dateStr: data?.date_str ?? data?.dateStr ?? '',
    day: data?.day,
    month: data?.month,
    monthName: data?.month_name ?? data?.monthName ?? '',
    year: data?.year,
    yearStr: data?.year_str ?? data?.yearStr ?? '',
  };
};

export const searchGlobal = async (query, { limit = 12, page = 0, type = 'all' } = {}) => {
  const normalizedQuery = `${query ?? ''}`.trim();
  if (!normalizedQuery) {
    return { ayahs: [], hadiths: [], total: 0 };
  }

  const params = new URLSearchParams({
    limit: `${limit}`,
    page: `${page}`,
    q: normalizedQuery,
    type,
  });
  const payload = await requestJson(`/api/v1/search?${params.toString()}`);
  const data = payload?.data ?? payload;
  const total = Number(data?.total ?? 0);

  return {
    ayahs: pickItems(data?.ayahs ?? []).map(normalizeAyah),
    ayahTotal: Number(data?.ayah_total ?? (type === 'ayah' ? total : 0)),
    hadiths: pickItems(data?.hadiths ?? []).map(normalizeHadith),
    hadithTotal: Number(data?.hadith_total ?? (type === 'hadith' ? total : 0)),
    dictionaries: pickItems(data?.dictionaries ?? []).map(normalizeDictionary),
    dictionaryTotal: Number(data?.dictionary_total ?? (type === 'dictionary' || type === 'kamus' ? total : 0)),
    doas: pickItems(data?.doas ?? []).map(normalizeDoa),
    doaTotal: Number(data?.doa_total ?? (type === 'doa' || type === 'dua' || type === 'prayer' ? total : 0)),
    kajians: pickItems(data?.kajians ?? []).map(normalizeKajian),
    kajianTotal: Number(data?.kajian_total ?? (type === 'kajian' || type === 'study' || type === 'lesson' ? total : 0)),
    perawis: pickItems(data?.perawis ?? []).map(normalizePerawi),
    perawiTotal: Number(data?.perawi_total ?? (type === 'perawi' || type === 'rawi' || type === 'rijal' ? total : 0)),
    total,
  };
};

const normalizeSearchText = (value = '') => `${value}`.trim().toLowerCase();
const includesQuery = (value = '', query = '') => normalizeSearchText(value).includes(normalizeSearchText(query));

const filterQueryItems = (items, query, pickSearchText) => {
  if (!query) return items;
  return items.filter((item) => includesQuery(pickSearchText(item), query));
};

export const appendQuery = (path, key, value) => {
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${base}?${params.toString()}`;
};

const searchCollection = async ({
  endpoint,
  limit = 12,
  normalizeItem,
  query,
  queryParam = 'q',
  fallbackSize = 40,
  pickSearchText,
}) => {
  try {
    const payload = await requestJson(appendQuery(endpoint, queryParam, query));
    const items = pickItems(payload).map(normalizeItem);
    const filtered = filterQueryItems(items, query, pickSearchText);
    return filtered.slice(0, limit);
  } catch {
    const payload = await requestJson(endpoint);
    const items = pickItems(payload).map(normalizeItem);
    const filtered = filterQueryItems(items, query, pickSearchText);
    return filtered.slice(0, Math.min(limit, fallbackSize));
  }
};

export const getFirstAyahForSurah = async (surahNumber) => {
  const page = await getAyahsForSurahPage(surahNumber, { page: 0, size: 1 });
  return page.items[0] ?? null;
};

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim()) ?? '';

const normalizeReference = (item, index = 0, defaultTitle = 'Rujukan') => ({
  id: item?.id ?? `${defaultTitle}-${index}`,
  title:
    pickText(
      item?.title,
      item?.source,
      item?.book,
      item?.translation?.title_en,
      item?.translation?.title_idn,
    ) || `${defaultTitle} ${index + 1}`,
  body: pickText(
    item?.description_idn,
    item?.description_en,
    item?.content,
    item?.description,
    item?.text,
    item?.narration,
    item?.translation?.text_en,
    item?.translation?.text_idn,
    item?.translation?.idn,
    item?.translation?.en,
  ),
  meta: pickText(item?.source, item?.reference, item?.riwayat, item?.category),
});

export const getTafsirForAyah = async (ayahId) => {
  try {
    const payload = await requestJson(`/api/v1/tafsir/ayah/${ayahId}`);
    const data = payload?.data ?? payload;
    const items = [];
    if (data?.kemenag) {
      items.push(normalizeReference({ ...data.kemenag, title: 'Kemenag' }, 0, 'Tafsir'));
    }
    if (data?.ibnu_katsir) {
      items.push(normalizeReference({ ...data.ibnu_katsir, title: 'Ibnu Katsir' }, 1, 'Tafsir'));
    }
    if (!items.length && data) {
      items.push(normalizeReference(data, 0, 'Tafsir'));
    }
    return items.filter((item) => item.body);
  } catch {
    return [];
  }
};

export const getAsbabForAyah = async (ayahId) => {
  try {
    const payload = await requestJson(`/api/v1/asbabun-nuzul/ayah/${ayahId}`);
    return pickItems(payload)
      .map((item, index) => normalizeReference(item, index, 'Asbabun Nuzul'))
      .filter((item) => item.body);
  } catch {
    return [];
  }
};

export const getMunasabahForAyah = async (ayahId) => {
  try {
    const payload = await requestJson(`/api/v1/munasabah/ayah/${ayahId}`);
    return pickItems(payload).map((item) => ({
      id: item.id,
      ayahFrom: item.ayah_from ? normalizeAyah(item.ayah_from) : null,
      ayahTo: item.ayah_to ? normalizeAyah(item.ayah_to) : null,
      description: item.description,
    }));
  } catch {
    return [];
  }
};

export const getAyahsForHadith = async (hadithId) => {
  try {
    const payload = await requestJson(`/api/v1/hadiths/${hadithId}/ayahs`);
    return pickItems(payload).map((item) => ({
      id: item.id,
      catatan: item.catatan,
      ayah: item.ayah ? normalizeAyah(item.ayah) : null,
    }));
  } catch {
    return [];
  }
};

export const getHadithsForAyah = async (ayahId) => {
  try {
    const payload = await requestJson(`/api/v1/ayahs/${ayahId}/hadiths`);
    return pickItems(payload).map((item) => ({
      id: item.id,
      catatan: item.catatan,
      hadith: item.hadith ? normalizeHadith(item.hadith) : null,
    }));
  } catch {
    return [];
  }
};

export const getSurahs = async () => {
  const payload = await requestJson('/api/v1/surah?size=114&sort=number');
  const items = pickItems(payload);
  return items.map(normalizeSurah);
};

const pagedResult = (payload, page, size) => {
  const items = pickItems(payload).map(normalizeHadith);
  const currentPage = Number(payload?.page ?? payload?.data?.page ?? page) || 0;
  const total = Number(payload?.total ?? payload?.data?.total ?? items.length) || items.length;
  const totalPages = Number(
    payload?.total_pages ??
    payload?.totalPages ??
    payload?.max_page ??
    payload?.data?.total_pages ??
    payload?.data?.totalPages ??
    payload?.data?.max_page ??
    0
  );
  const isLast = payload?.last === true || (totalPages ? currentPage + 1 >= totalPages : items.length < size);

  return {
    hasMore: !isLast && items.length > 0,
    items,
    page: currentPage,
    total,
    totalPages,
  };
};

export const getHadithPage = async ({ bookSlug = null, page = 0, size = 20, updatedAfter = null } = {}) => {
  const encodedBook = bookSlug ? encodeURIComponent(bookSlug) : null;
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (updatedAfter) params.set('updated_after', updatedAfter);
  const path = encodedBook
    ? `/api/v1/hadiths/book/${encodedBook}?${params.toString()}`
    : `/api/v1/hadiths?${params.toString()}`;
  const payload = await requestJson(path);
  return pagedResult(payload, page, size);
};

export const getHadiths = async (options = {}) => {
  const result = await getHadithPage(options);
  return result.items;
};

export const normalizeHadith = (item) => ({
  id: item.id ?? item.number,
  book:
    item.book?.name ??
    item.bookName ??
    item.book_name ??
    item.book?.translation?.latin_en ??
    item.book?.translation?.idn ??
    'Hadith',
  bookSlug: item.book?.slug ?? item.bookSlug ?? item.book_slug ?? '',
  title:
    item.title ??
    item.chapter?.name ??
    item.chapter?.translation?.en ??
    item.chapter?.translation?.idn ??
    item.theme?.name ??
    item.theme?.translation?.en ??
    item.theme?.translation?.idn ??
    `Hadith ${item.number ?? item.id}`,
  arabic: pickText(item.translation?.arab, item.translation?.ar, item.arabic, item.matan_arab),
  translation: pickText(
    item.translation?.text_en,
    item.translation?.idn,
    item.translation?.text,
    typeof item.translation === 'string' ? item.translation : '',
    item.matan_terjemahan,
  ),
  grade: item.grade ?? item.kualitas_hadis ?? '',
  gradeNotes: item.grade_notes ?? '',
  themeId: item.theme_id ?? item.theme?.id,
  themeName: item.theme?.translation?.en ?? item.theme?.translation?.idn ?? item.theme?.name ?? '',
  chapterId: item.chapter_id ?? item.chapter?.id,
  chapterName: item.chapter?.translation?.en ?? item.chapter?.translation?.idn ?? item.chapter?.name ?? '',
  number: item.number ?? item.nomor_hadis,
  sanad: item.sanad ?? '',
});

export const normalizeDictionary = (item) => ({
  id: item.id ?? item.term,
  title: item.term ?? item.title ?? 'Istilah',
  body: pickText(
    item.definition,
    item.translation?.text_en,
    item.translation?.text_idn,
    item.translation?.idn,
    item.translation?.en,
  ),
  category: item.category ?? '',
  meta: [item.category, item.origin].filter(Boolean).join(' · '),
});

export const normalizePerawi = (item) => ({
  id: item.id ?? item.nama_latin ?? item.nama_arab,
  title: pickText(item.nama_latin, item.nama_arab, item.nama_lengkap, 'Perawi'),
  body: pickText(item.nama_lengkap, item.biografis, item.kunyah, item.laqab),
  meta: [item.status, item.tabaqah].filter(Boolean).join(' · '),
  status: item.status ?? '',
  tabaqah: item.tabaqah ?? '',
});

export const normalizeDoa = (item) => ({
  id: item.id ?? item.slug ?? item.title,
  title: pickText(item.title, item.nama, item.label, 'Doa'),
  arabic: pickText(item.arabic, item.arab, item.translation?.arab, item.translation?.ar),
  body: pickText(
    item.translation?.idn,
    item.translation?.text_idn,
    item.translation?.text,
    item.translation,
    item.content,
    item.description,
  ),
  meta: [item.category, item.occasion, item.source].filter(Boolean).join(' · '),
});

export const normalizeKajian = (item) => ({
  id: item.id ?? item.slug ?? item.title,
  title: pickText(item.title, item.topic, item.translation?.title_idn, item.translation?.title_en, 'Kajian'),
  body: pickText(
    item.summary,
    item.description,
    item.content,
    item.translation?.text_idn,
    item.translation?.text_en,
  ),
  meta: [item.speaker, item.ustadz, item.category, item.date].filter(Boolean).join(' · '),
});

export const searchDoa = async (query, { limit = 8 } = {}) =>
  searchCollection({
    endpoint: '/api/v1/doa?page=0&size=40',
    limit,
    normalizeItem: normalizeDoa,
    pickSearchText: (item) => [item.title, item.body, item.meta, item.arabic].filter(Boolean).join(' '),
    query,
  });

export const searchKajian = async (query, { limit = 8 } = {}) =>
  searchCollection({
    endpoint: '/api/v1/kajian?page=0&size=40',
    limit,
    normalizeItem: normalizeKajian,
    pickSearchText: (item) => [item.title, item.body, item.meta].filter(Boolean).join(' '),
    query,
  });

const normalizeDailyReminder = (item) => {
  const text = pickText(
    item?.text,
    item?.body,
    item?.content,
    item?.translation?.text_idn,
    item?.translation?.text_en,
  );
  if (!text) return null;

  const source = [item?.author, item?.source].filter(Boolean).join(' · ');
  return {
    id: item?.id ?? item?.slug ?? text,
    source: source || 'Pengingat harian',
    text,
    title: item?.type === 'ulama'
      ? pickText(item?.title, item?.translation?.title_idn, item?.translation?.title_en, 'Nasihat Ulama')
      : pickText(item?.title, item?.translation?.title_idn, item?.translation?.title_en, 'Pengingat Harian'),
    type: item?.type ?? 'reminder',
  };
};

export const getDailyReminders = async ({ limit = 20, lang = 'idn' } = {}) => {
  const params = new URLSearchParams({
    active: 'true',
    lang,
    limit: `${limit}`,
  });
  const payload = await requestJson(`/api/v1/reminders?${params.toString()}`);
  return pickItems(payload).map(normalizeDailyReminder).filter(Boolean);
};

export const getDailyHadith = async () => {
  const payload = await requestJson('/api/v1/hadiths/daily');
  return normalizeHadith(payload?.data ?? payload?.item ?? payload);
};

export const getHadithBooks = async () => {
  const payload = await requestJson('/api/v1/books?size=50');
  const items = pickItems(payload);
  return items
    .map((item) => ({
      id: item.id,
      name:
        item.name ??
        item.translation?.idn ??
        item.translation?.en ??
        `Book ${item.id}`,
      slug: item.slug ?? '',
      count: Number(item.count ?? item.hadith_count ?? item.total_hadith ?? 0) || 0,
    }))
    .filter((book) => book.slug);
};

export const getHadithsByBook = async (bookSlug, options = {}) => {
  const result = await getHadithPage({ ...options, bookSlug });
  return result.items;
};

export const getHadithDetail = async (id) => {
  const payload = await requestJson(`/api/v1/hadiths/${id}`);
  return normalizeHadith(payload?.data ?? payload);
};

export const getHadithSanad = async (id) => {
  try {
    const payload = await requestJson(`/api/v1/hadiths/${id}/sanad`);
    return pickItems(payload);
  } catch {
    return [];
  }
};

export const getHadithTakhrij = async (id) => {
  try {
    const payload = await requestJson(`/api/v1/hadiths/${id}/takhrij`);
    return pickItems(payload);
  } catch {
    return [];
  }
};

export const getRelatedHadiths = async (hadith) => {
  const candidates = [
    hadith?.themeId ? `/api/v1/hadiths/theme/${hadith.themeId}?size=8` : null,
    hadith?.chapterId ? `/api/v1/hadiths/chapter/${hadith.chapterId}?size=8` : null,
    hadith?.bookSlug ? `/api/v1/hadiths/book/${hadith.bookSlug}?size=8` : null,
  ].filter(Boolean);

  for (const path of candidates) {
    try {
      const payload = await requestJson(path);
      const items = pickItems(payload)
        .map(normalizeHadith)
        .filter((item) => item.id && item.id !== hadith?.id)
        .slice(0, 5);
      if (items.length) return items;
    } catch {
      // Try the next broader related source.
    }
  }

  return [];
};

export const getPerawiDetail = async (id) => {
  try {
    const payload = await requestJson(`/api/v1/perawi/${id}`);
    return payload?.data ?? payload;
  } catch {
    return null;
  }
};

export const getPerawiJarhTadil = async (id) => {
  try {
    const payload = await requestJson(`/api/v1/perawi/${id}/jarh-tadil`);
    return pickItems(payload);
  } catch {
    return [];
  }
};

export const getPerawiGuru = async (id) => {
  try {
    const payload = await requestJson(`/api/v1/perawi/${id}/guru`);
    return pickItems(payload);
  } catch {
    return [];
  }
};

export const getPerawiMurid = async (id) => {
  try {
    const payload = await requestJson(`/api/v1/perawi/${id}/murid`);
    return pickItems(payload);
  } catch {
    return [];
  }
};

export const getPrayerTimes = async ({ lat, lng, method = 'kemenag', madhab = 'shafi' }) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Location is required to load prayer times.');
  }

  const payload = await requestJson(
    `/api/v1/sholat-times?lat=${lat}&lng=${lng}&method=${method}&madhab=${madhab}`,
  );
  const prayers = payload?.prayers ?? payload?.data?.prayers;
  if (!prayers) throw new Error('Prayer schedule is not available yet.');
  return prayers;
};
