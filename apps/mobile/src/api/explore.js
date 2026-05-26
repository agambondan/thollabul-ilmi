import { requestJson } from './client';
import { getBookmarks } from './personal';

const pickItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (Array.isArray(payload?.events)) return payload.events;
  return payload ? [payload?.data ?? payload] : [];
};

const paginationOffset = (pagination = {}) => (Number(pagination.page ?? 0) * Number(pagination.size ?? 0)) || 0;

const pickPaginationMeta = (payload, pagination, itemCount = 0) => {
  const meta = payload?.meta ?? payload?.data?.meta;
  if (meta) {
    return {
      hasMore: Boolean(meta.has_more ?? meta.hasMore ?? meta.has_next ?? meta.hasNext),
      limit: Number(meta.limit ?? pagination?.size ?? itemCount),
      offset: Number(meta.offset ?? paginationOffset(pagination)),
      nextOffset: meta.next_offset ?? meta.nextOffset ?? null,
    };
  }

  if (typeof payload?.last === 'boolean') {
    return {
      hasMore: !payload.last,
      limit: Number(payload.size ?? pagination?.size ?? itemCount),
      offset: Number(payload.page ?? pagination?.page ?? 0) * Number(payload.size ?? pagination?.size ?? itemCount),
      nextOffset: null,
    };
  }

  return {
    hasMore: pagination ? itemCount >= (pagination.size ?? 20) : false,
    limit: pagination?.size ?? itemCount,
    offset: (pagination?.page ?? 0) * (pagination?.size ?? itemCount),
    nextOffset: null,
  };
};

const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim()) ?? '';
const joinMeta = (...values) => values.filter((value) => typeof value === 'string' && value.trim()).join(' · ');
const pickTafsirText = (translation = {}) =>
  pickText(
    translation.description_idn,
    translation.description_en,
    translation.text_idn,
    translation.text_en,
    translation.idn,
    translation.en,
  );
const TAFSIR_SOURCE_LABELS = {
  kemenag: 'Tafsir Kemenag',
  secondary: 'Tafsir Al-Mishbah',
};

const formatJarhTadilJenis = (value) => {
  if (value === 'jarh') return 'Jarh';
  if (value === 'tadil') return "Ta'dil";
  return value ?? '';
};

const withPagination = (endpoint, { page = 0, size = 20 } = {}) => {
  if (!endpoint) return endpoint;

  const [path, query = ''] = endpoint.split('?');
  const params = new URLSearchParams(query);
  params.set('page', `${page}`);
  params.set('size', `${size}`);
  params.set('limit', `${size}`);
  params.set('offset', `${page * size}`);
  params.set('meta', '1');
  return `${path}?${params.toString()}`;
};

export const normalizeExploreItem = (item, index = 0) => {
  if (item?.raw && (item?.title || item?.body || item?.arabic)) {
    return item;
  }

  if (item?.source_url || item?.format || item?.license) {
    const fileSize = Number(item?.file_size_bytes ?? 0);
    const sizeLabel = fileSize > 0 ? `${Math.round(fileSize / 1024)} KB` : '';
    return {
      id: item?.id ?? item?.slug ?? `library-book-${index}`,
      title: pickText(item?.title, item?.name, `Buku ${index + 1}`),
      arabic: '',
      body: pickText(item?.description, item?.summary),
      meta: joinMeta(
        item?.author,
        item?.category,
        item?.level,
        item?.format ? String(item.format).toUpperCase() : '',
        item?.file_name,
        sizeLabel,
      ),
      raw: item,
    };
  }

  if (item?.kemenag || item?.ibnu_katsir || item?.ayah_id) {
    const ayah = item?.ayah ?? {};
    const ayahTranslation = ayah?.translation ?? {};
    const ayahNumber = ayah?.number ?? item?.ayah_number ?? index + 1;
    const surahName = pickText(
      ayah?.surah?.translation?.latin_en,
      ayah?.surah?.identifier,
      ayah?.surah?.latin,
    );
    const primaryTafsir = pickTafsirText(item?.kemenag);
    const secondaryTafsir = pickTafsirText(item?.ibnu_katsir);

    return {
      id: item?.id ?? item?.ayah_id ?? `tafsir-${index}`,
      title: `Ayat ${ayahNumber}`,
      arabic: pickText(ayahTranslation.ar, ayahTranslation.arab, ayah?.arabic, item?.arabic),
      body: pickText(ayahTranslation.idn, ayahTranslation.en, item?.translation),
      meta: joinMeta(
        surahName,
        primaryTafsir ? TAFSIR_SOURCE_LABELS.kemenag : '',
        secondaryTafsir ? TAFSIR_SOURCE_LABELS.secondary : '',
      ),
      raw: item,
      secondaryTafsir,
      tafsir: primaryTafsir,
    };
  }

  if (item?.nama_latin || item?.nama_arab || item?.nama_lengkap) {
    const deathYear = item?.tahun_wafat ? `${item.tahun_wafat} H` : '';
    return {
      id: item?.id ?? item?.slug ?? `perawi-${index}`,
      title: pickText(item?.nama_latin, item?.nama_lengkap, item?.nama_arab, `Perawi ${index + 1}`),
      arabic: pickText(item?.nama_arab),
      body: pickText(item?.biografi, item?.bio, item?.keterangan, item?.catatan),
      meta: joinMeta(item?.tabaqah, deathYear, item?.status),
      raw: item,
    };
  }

  if (item?.jenis_nilai || item?.teks_nilai || item?.perawi_id || item?.penilai_id) {
    const perawiName = pickText(item?.perawi?.nama_latin, item?.perawi?.nama_arab, item?.perawi?.nama_lengkap);
    const penilaiName = pickText(item?.penilai?.nama_latin, item?.penilai?.nama_arab, item?.penilai?.nama_lengkap);
    const jenis = formatJarhTadilJenis(item?.jenis_nilai);
    const title = pickText(item?.teks_nilai, perawiName, `Penilaian ${index + 1}`);
    const body = [
      perawiName ? `Perawi: ${perawiName}` : '',
      penilaiName ? `Penilai: ${penilaiName}` : '',
      pickText(item?.catatan),
    ]
      .filter(Boolean)
      .join('\n');

    return {
      id: item?.id ?? `${title}-${index}`,
      title,
      arabic: '',
      body,
      meta: joinMeta(jenis, item?.tingkat ? `Tingkat ${item.tingkat}` : '', item?.sumber),
      raw: item,
    };
  }

  const translation = item?.translation ?? {};
  const title = pickText(
    translation.title_en,
    translation.title_idn,
    translation.en,
    translation.idn,
    translation.latin_en,
    translation.latin_idn,
    translation.name_en,
    translation.name_idn,
    item?.title,
    item?.name,
    item?.latin,
    item?.ref_type && item?.ref_id ? `${item.ref_type} ${item.ref_id}` : '',
    item?.slug,
    item?.category,
    item?.question,
    `Item ${index + 1}`,
  );
  const arabic = pickText(translation.arab, translation.ar, item?.arabic, item?.arab, item?.text_arab);
  const body = pickText(
    translation.description_en,
    translation.description_idn,
    translation.text_en,
    translation.text_idn,
    translation.text,
    item?.content,
    item?.description,
    item?.meaning,
    item?.answer,
    item?.text,
    item?.body,
  );
  const meta = pickText(
    item?.type,
    item?.category,
    item?.occasion,
    item?.source,
    item?.author,
    item?.label,
    item?.ref_type,
    item?.status,
    item?.date,
  );

  return {
    id: item?.id ?? item?.number ?? item?.slug ?? `${title}-${index}`,
    title,
    arabic,
    body,
    meta,
    raw: item,
  };
};

export const getFeatureItems = async (feature, pagination) => {
  const page = await getFeatureItemPage(feature, pagination);
  return page.items;
};

export const getBlogCategoryItems = async () => {
  const payload = await requestJson('/api/v1/blog/categories');
  return pickItems(payload);
};

export const getZakatGoldPrice = async () => {
  const payload = await requestJson('/api/v1/zakat/gold-price');
  const data = payload?.data ?? payload;
  const price = Number(data?.price_per_gram ?? data?.pricePerGram ?? 0);
  return Number.isFinite(price) && price > 0 ? Math.round(price) : null;
};

export const getFeatureItemPage = async (feature, pagination) => {
  const endpoint = pagination ? withPagination(feature.endpoint, pagination) : feature.endpoint;
  const payload = await requestJson(endpoint, { auth: feature.type === 'protected-list' });
  const items = pickItems(payload).map(normalizeExploreItem);
  return {
    items,
    meta: pickPaginationMeta(payload, pagination, items.length),
  };
};

export const getAllNotes = async () => {
  const payload = await requestJson('/api/v1/notes', { auth: true });
  return pickItems(payload).map(normalizeExploreItem);
};

export const getBookmarkItems = async () => {
  const items = await getBookmarks();
  return items.map(normalizeExploreItem);
};

export const searchDictionary = async (query) => {
  if (!query.trim()) return [];
  const payload = await requestJson(`/api/v1/dictionary?q=${encodeURIComponent(query.trim())}`);
  return pickItems(payload).map(normalizeExploreItem);
};

export const getQuizQuestions = async () => {
  const payload = await requestJson('/api/v1/quiz/session?count=5');
  return pickItems(payload).map(normalizeExploreItem);
};

export const getAsmaulNames = async () => {
  const payload = await requestJson('/api/v1/asmaul-husna');
  return pickItems(payload);
};

export const getHijriOverview = async () => {
  const [today, events] = await Promise.allSettled([
    requestJson('/api/v1/hijri/today'),
    requestJson('/api/v1/hijri/events'),
  ]);

  const items = [];
  if (today.status === 'fulfilled') {
    items.push(
      normalizeExploreItem({
        title: 'Today',
        description:
          today.value?.date_hijri ??
          today.value?.hijri ??
          today.value?.data?.hijri ??
          today.value?.date ??
          JSON.stringify(today.value),
      }),
    );
  }
  if (events.status === 'fulfilled') {
    items.push(...pickItems(events.value).map(normalizeExploreItem));
  }
  return items;
};
