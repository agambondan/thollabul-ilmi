import { getLocalizedTranslation } from '@/lib/translation';

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const adminMutationFallback = (method) =>
    method === 'DELETE'
        ? 'Gagal menghapus data. Periksa koneksi atau coba lagi.'
        : 'Gagal menyimpan perubahan. Periksa input atau coba lagi.';

const parseErrorMessage = async (res, method) => {
    try {
        const data = await res.clone().json();
        return data?.message ?? data?.error ?? adminMutationFallback(method);
    } catch {
        return adminMutationFallback(method);
    }
};

const notifyAdminMutationError = (message) => {
    if (typeof window === 'undefined') return;
    if (!window.location.pathname.startsWith('/admin')) return;

    window.dispatchEvent(
        new CustomEvent('admin:mutation-error', {
            detail: { message },
        }),
    );
};

const ensureMutationOk = async (res, method) => {
    if (res.ok || !mutationMethods.has(method)) return res;
    if (
        typeof window === 'undefined' ||
        !window.location.pathname.startsWith('/admin')
    ) {
        return res;
    }

    const message = await parseErrorMessage(res, method);
    notifyAdminMutationError(message);
    const error = new Error(message);
    error.adminMutationNotified = true;
    throw error;
};

const refreshAccessToken = async () => {
    try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data.token ?? data.access_token;
        if (newToken) localStorage.setItem('auth_token', newToken);
        return newToken ?? null;
    } catch {
        return null;
    }
};

export const authFetch = async (path, options = {}) => {
    const token = getToken();
    const method = (options.method ?? 'GET').toUpperCase();
    const isFormData =
        typeof FormData !== 'undefined' && options.body instanceof FormData;
    const baseHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
    try {
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            credentials: 'include',
            headers: {
                ...baseHeaders,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                const retry = await fetch(`${API_URL}${path}`, {
                    ...options,
                    credentials: 'include',
                    headers: {
                        ...baseHeaders,
                        Authorization: `Bearer ${newToken}`,
                        ...options.headers,
                    },
                });
                return ensureMutationOk(retry, method);
            }
        }

        return ensureMutationOk(res, method);
    } catch (error) {
        if (
            !error.adminMutationNotified &&
            mutationMethods.has(method) &&
            typeof window !== 'undefined' &&
            window.location.pathname.startsWith('/admin')
        ) {
            notifyAdminMutationError(error.message || adminMutationFallback(method));
        }
        throw error;
    }
};

export const userApi = {
    updateMe: (id, data) =>
        authFetch(`/api/v1/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    changePassword: (oldPassword, newPassword) =>
        authFetch('/api/v1/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        }),
};

export const adminUserApi = {
    list: () => authFetch('/api/v1/users'),
    update: (id, data) =>
        authFetch(`/api/v1/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id) => authFetch(`/api/v1/users/${id}`, { method: 'DELETE' }),
};

export const analyticsApi = {
    trackPageView: (data) =>
        fetch(`${API_URL}/api/v1/analytics/page-view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true,
        }),
};

export const adminAnalyticsApi = {
    summary: (days = 14) => authFetch(`/api/v1/analytics/admin/summary?days=${days}`),
};

export const bookmarkApi = {
    list: () => authFetch('/api/v1/bookmarks'),
    add: (refType, refId, extra = {}) =>
        authFetch('/api/v1/bookmarks', {
            method: 'POST',
            body: JSON.stringify({ ref_type: refType, ref_id: refId, ...extra }),
        }),
    update: (id, data) =>
        authFetch(`/api/v1/bookmarks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    remove: (id) => authFetch(`/api/v1/bookmarks/${id}`, { method: 'DELETE' }),
};

export const progressApi = {
    getQuran: () => authFetch('/api/v1/progress/quran'),
    saveQuran: (surahNumber, ayahNumber) =>
        authFetch('/api/v1/progress/quran', {
            method: 'PUT',
            body: JSON.stringify({ surah_number: surahNumber, ayah_number: ayahNumber }),
        }),
    getHadith: () => authFetch('/api/v1/progress/hadith'),
    saveHadith: (bookSlug, hadithId) =>
        authFetch('/api/v1/progress/hadith', {
            method: 'PUT',
            body: JSON.stringify({ book_slug: bookSlug, hadith_id: hadithId }),
        }),
};

export const hafalanApi = {
    list: () => authFetch('/api/v1/hafalan'),
    summary: () => authFetch('/api/v1/hafalan/summary'),
    update: (surahId, status) =>
        authFetch(`/api/v1/hafalan/surah/${surahId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),
};

export const streakApi = {
    get: () => authFetch('/api/v1/streak'),
    logActivity: (type) =>
        authFetch('/api/v1/activity', {
            method: 'POST',
            body: JSON.stringify({ type }),
        }),
};

export const searchApi = {
    search: (q, type = 'all', lang = 'id', page = 0, limit = 20) =>
        fetch(`${API_URL}/api/v1/search?q=${encodeURIComponent(q)}&type=${type}&lang=${lang}&page=${page}&limit=${limit}`),
};

export const doaApi = {
    list: (page = 0, size = 20) => fetch(`${API_URL}/api/v1/doa?page=${page}&size=${size}`),
    byCategory: (category, page = 0, size = 20) =>
        fetch(`${API_URL}/api/v1/doa/category/${encodeURIComponent(category)}?page=${page}&size=${size}`),
    detail: (id) => fetch(`${API_URL}/api/v1/doa/${id}`),
};

export const asmaulHusnaApi = {
    list: () => fetch(`${API_URL}/api/v1/asmaul-husna`),
    detail: (number) => fetch(`${API_URL}/api/v1/asmaul-husna/${number}`),
};

export const tafsirApi = {
    byAyah: (ayahId) => fetch(`${API_URL}/api/v1/tafsir/ayah/${ayahId}`),
    bySurah: (number) => fetch(`${API_URL}/api/v1/tafsir/surah/${number}`),
    search: (q) => fetch(`${API_URL}/api/v1/tafsir/search?q=${encodeURIComponent(q)}`),
};

export const munasabahApi = {
    byAyah: (ayahId) => fetch(`${API_URL}/api/v1/munasabah/ayah/${ayahId}`),
};

export const tokohTarikhApi = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetch(`${API_URL}/api/v1/tokoh-tarikh${qs ? '?' + qs : ''}`);
    },
    detail: (id) => fetch(`${API_URL}/api/v1/tokoh-tarikh/${id}`),
};

export const mufrodatApi = {
    byAyah: (ayahId) => fetch(`${API_URL}/api/v1/mufrodat/ayah/${ayahId}`),
    byRoot: (word) => fetch(`${API_URL}/api/v1/mufrodat/root/${encodeURIComponent(word)}`),
};

export const audioApi = {
    bySurah: (surahNumber) => fetch(`${API_URL}/api/v1/audio/surah/${surahNumber}`),
    byAyah: (ayahId) => fetch(`${API_URL}/api/v1/audio/ayah/${ayahId}`),
};

export const sirohApi = {
    listCategories: () => fetch(`${API_URL}/api/v1/siroh/categories`),
    list: (page = 0, size = 20) =>
        fetch(`${API_URL}/api/v1/siroh/contents?page=${page}&size=${size}`),
    detail: (slug) => fetch(`${API_URL}/api/v1/siroh/contents/${slug}`),
};

export const blogApi = {
    list: (page = 0, size = 10) =>
        fetch(`${API_URL}/api/v1/blog/posts?page=${page}&size=${size}`),
    detail: (slug) => fetch(`${API_URL}/api/v1/blog/posts/${slug}`),
    listCategories: () => fetch(`${API_URL}/api/v1/blog/categories`),
    listTags: () => fetch(`${API_URL}/api/v1/blog/tags`),
};

export const libraryApi = {
    list: ({ page = 0, size = 20, category = '', level = '', search = '' } = {}) => {
        const params = new URLSearchParams({
            page: String(page),
            size: String(size),
        });
        if (category) params.set('category', category);
        if (level) params.set('level', level);
        if (search) params.set('search', search);
        return fetch(`${API_URL}/api/v1/library/books?${params.toString()}`);
    },
    detail: (slug) => fetch(`${API_URL}/api/v1/library/books/${encodeURIComponent(slug)}`),
};

export const libraryProgressApi = {
    list: () => authFetch('/api/v1/library/progress'),
    detail: (bookId) => authFetch(`/api/v1/library/progress/${bookId}`),
    save: (bookId, data) =>
        authFetch(`/api/v1/library/progress/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

export const adminBlogApi = {
    listAll: (status = '') =>
        authFetch(`/api/v1/blog/posts${status ? `?status=${status}` : '?status=all'}`),
    create: (data) =>
        authFetch('/api/v1/blog/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
        authFetch(`/api/v1/blog/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) =>
        authFetch(`/api/v1/blog/posts/${id}`, { method: 'DELETE' }),
    createCategory: (data) =>
        authFetch('/api/v1/blog/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) =>
        authFetch(`/api/v1/blog/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) =>
        authFetch(`/api/v1/blog/categories/${id}`, { method: 'DELETE' }),
    createTag: (data) =>
        authFetch('/api/v1/blog/tags', { method: 'POST', body: JSON.stringify(data) }),
    deleteTag: (id) =>
        authFetch(`/api/v1/blog/tags/${id}`, { method: 'DELETE' }),
};

export const adminSirohApi = {
    listCategories: () => authFetch('/api/v1/siroh/categories'),
    createCategory: (data) =>
        authFetch('/api/v1/siroh/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) =>
        authFetch(`/api/v1/siroh/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) =>
        authFetch(`/api/v1/siroh/categories/${id}`, { method: 'DELETE' }),
    listContents: () => authFetch('/api/v1/siroh/contents'),
    createContent: (data) =>
        authFetch('/api/v1/siroh/contents', { method: 'POST', body: JSON.stringify(data) }),
    updateContent: (id, data) =>
        authFetch(`/api/v1/siroh/contents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteContent: (id) =>
        authFetch(`/api/v1/siroh/contents/${id}`, { method: 'DELETE' }),
};

export const statsApi = {
    summary: () => authFetch('/api/v1/stats'),
    weekly: () => authFetch('/api/v1/stats/weekly'),
    monthly: (month) => authFetch(`/api/v1/stats/monthly?month=${month}`),
    yearly: (year) => authFetch(`/api/v1/stats/yearly?year=${year}`),
};

export const tilawahApi = {
    add: (pagesRead, juzRead, note = '', date = new Date().toISOString().slice(0, 10)) =>
        authFetch('/api/v1/tilawah', {
            method: 'POST',
            body: JSON.stringify({ date, pages_read: pagesRead, juz_read: juzRead, note }),
        }),
    list: (start, end) => {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        const qs = params.toString();
        return authFetch(`/api/v1/tilawah${qs ? `?${qs}` : ''}`);
    },
    summary: () => authFetch('/api/v1/tilawah/summary'),
};

export const amalanApi = {
    list: () => fetch(`${API_URL}/api/v1/amalan`),
    check: (id) => authFetch(`/api/v1/amalan/${id}/check`, { method: 'PUT' }),
    today: () => authFetch('/api/v1/amalan/today'),
    history: () => authFetch('/api/v1/amalan/history'),
};

export const hijriApi = {
    today: () => fetch(`${API_URL}/api/v1/hijri/today`),
    convert: (date) => {
        const [year, month, day] = String(date).split('-');
        const params = new URLSearchParams({ year, month, day });
        return fetch(`${API_URL}/api/v1/hijri/convert?${params.toString()}`);
    },
    events: () => fetch(`${API_URL}/api/v1/hijri/events`),
    eventsByMonth: (month) => fetch(`${API_URL}/api/v1/hijri/events/${month}`),
};

export const asbabunNuzulApi = {
    byAyah: (ayahId) => fetch(`${API_URL}/api/v1/asbabun-nuzul/ayah/${ayahId}`),
    bySurah: (number) => fetch(`${API_URL}/api/v1/asbabun-nuzul/surah/${number}`),
};

export const dzikirApi = {
    list: (page = 0, size = 20) => fetch(`${API_URL}/api/v1/dzikir?page=${page}&size=${size}`),
    detail: (id) => fetch(`${API_URL}/api/v1/dzikir/${id}`),
    byCategory: (category, page = 0, size = 20) =>
        fetch(`${API_URL}/api/v1/dzikir/category/${encodeURIComponent(category)}?page=${page}&size=${size}`),
};

export const leaderboardApi = {
    streak: () => fetch(`${API_URL}/api/v1/leaderboard/streak`),
    hafalan: () => fetch(`${API_URL}/api/v1/leaderboard/hafalan`),
    me: () => authFetch('/api/v1/leaderboard/me'),
};

export const shareApi = {
    ayah: (id) => fetch(`${API_URL}/api/v1/share/ayah/${id}`),
    hadith: (id) => fetch(`${API_URL}/api/v1/share/hadith/${id}`),
};

export const developerApi = {
    listKeys: () => authFetch('/api/v1/developer/keys'),
    createKey: (name) =>
        authFetch('/api/v1/developer/keys', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),
    revokeKey: (id) => authFetch(`/api/v1/developer/keys/${id}`, { method: 'DELETE' }),
};

export const notificationApi = {
    getSettings: () => authFetch('/api/v1/notifications/settings'),
    updateSettings: (settings) =>
        authFetch('/api/v1/notifications/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        }),
};

export const notesApi = {
    list: ({ refId, refType } = {}) => {
        const params = new URLSearchParams();
        if (refType) params.set('ref_type', refType);
        if (refId !== undefined && refId !== null) params.set('ref_id', String(refId));
        const qs = params.toString();
        return authFetch(`/api/v1/notes${qs ? `?${qs}` : ''}`);
    },
    create: (data) =>
        authFetch('/api/v1/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
        authFetch(`/api/v1/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/notes/${id}`, { method: 'DELETE' }),
};

export const kamusApi = {
    search: (q) =>
        fetch(`${API_URL}/api/v1/dictionary?q=${encodeURIComponent(q)}`),
    detail: (term) => fetch(`${API_URL}/api/v1/dictionary/${encodeURIComponent(term)}`),
};

export const manasikApi = {
    byType: (type) => fetch(`${API_URL}/api/v1/manasik/${type}`),
};

export const quizApi = {
    session: ({ count = 10, type = '' } = {}) => {
        const params = new URLSearchParams();
        if (count) params.set('count', count);
        if (type) params.set('type', type);
        const qs = params.toString();
        return fetch(`${API_URL}/api/v1/quiz/session${qs ? `?${qs}` : ''}`);
    },
    submit: (results) =>
        authFetch('/api/v1/quiz/submit', { method: 'POST', body: JSON.stringify({ results }) }),
    stats: () => authFetch('/api/v1/quiz/stats'),
};

export const prayerApi = {
    timings: (lat, lng) =>
        fetch(
            `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${lat}&longitude=${lng}&method=11`,
        ),
    timingsByCity: (city, country = 'Indonesia') => {
        const d = new Date();
        const date = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        return fetch(
            `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=11`,
        );
    },
};

export const sholatTrackerApi = {
    today: () => authFetch('/api/v1/sholat/today'),
    update: (data) => {
        if (data?.prayer && data?.status) {
            return authFetch('/api/v1/sholat/today', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        }

        const date = data?.date ?? new Date().toISOString().slice(0, 10);
        const updates = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']
            .filter((prayer) => typeof data?.[prayer] === 'boolean')
            .map((prayer) =>
                authFetch('/api/v1/sholat/today', {
                    method: 'PUT',
                    body: JSON.stringify({
                        date,
                        prayer,
                        status: data[prayer] ? 'munfarid' : 'missed',
                    }),
                }),
            );

        return Promise.all(updates);
    },
    history: () => authFetch('/api/v1/sholat/history'),
};

export const muhasabahApi = {
    list: () => authFetch('/api/v1/muhasabah'),
    create: (data) =>
        authFetch('/api/v1/muhasabah', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
        authFetch(`/api/v1/muhasabah/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/muhasabah/${id}`, { method: 'DELETE' }),
};

export const goalsApi = {
    list: () => authFetch('/api/v1/goals'),
    create: (data) =>
        authFetch('/api/v1/goals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
        authFetch(`/api/v1/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/goals/${id}`, { method: 'DELETE' }),
};

export const kajianApi = {
    list: (params = '') =>
        fetch(`${API_URL}/api/v1/kajian${params ? `?${params}` : ''}`),
    detail: (id) => fetch(`${API_URL}/api/v1/kajian/${id}`),
};

export const wiridApi = {
    list: () => fetch(`${API_URL}/api/v1/wirid`),
    byOccasion: (occasion) =>
        fetch(`${API_URL}/api/v1/wirid/occasion/${encodeURIComponent(occasion)}`),
};

export const fiqhApi = {
    listCategories: () => fetch(`${API_URL}/api/v1/fiqh`),
    categoryBySlug: (slug) =>
        fetch(`${API_URL}/api/v1/fiqh/${encodeURIComponent(slug)}`),
    itemBySlug: (slug) =>
        fetch(`${API_URL}/api/v1/fiqh/item/${encodeURIComponent(slug)}`),
};

export const historyApi = {
    list: (params = {}) => {
        const q = new URLSearchParams();
        if (params.category) q.set('category', params.category);
        if (params.yearFrom) q.set('year_from', String(params.yearFrom));
        if (params.yearTo) q.set('year_to', String(params.yearTo));
        const qs = q.toString();
        return fetch(`${API_URL}/api/v1/history${qs ? `?${qs}` : ''}`);
    },
    bySlug: (slug) =>
        fetch(`${API_URL}/api/v1/history/${encodeURIComponent(slug)}`),
};

export const imsakiyahApi = {
    monthly: (lat, lng, year, month) =>
        fetch(
            `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=11`,
        ),
    monthlyByCity: (city, year, month, country = 'Indonesia') =>
        fetch(
            `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=11`,
        ),
};

// ─── Admin APIs ───────────────────────────────────────────────────────────────

export const adminDoaApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/doa?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/doa', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/doa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/doa/${id}`, { method: 'DELETE' }),
};

export const adminDzikirApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/dzikir?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/dzikir', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/dzikir/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/dzikir/${id}`, { method: 'DELETE' }),
};

export const adminAsmaulHusnaApi = {
    list: () => authFetch('/api/v1/asmaul-husna'),
    create: (data) => authFetch('/api/v1/asmaul-husna', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/asmaul-husna/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/asmaul-husna/${id}`, { method: 'DELETE' }),
};

export const adminKajianApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/kajian?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/kajian', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/kajian/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/kajian/${id}`, { method: 'DELETE' }),
};

export const adminLibraryApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/library/admin/books?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/library/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/library/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadResource: (id, file) => {
        const data = new FormData();
        data.append('file', file);
        return authFetch(`/api/v1/library/books/${id}/resource`, { method: 'POST', body: data });
    },
    clearResource: (id) => authFetch(`/api/v1/library/books/${id}/resource`, { method: 'DELETE' }),
    delete: (id) => authFetch(`/api/v1/library/books/${id}`, { method: 'DELETE' }),
};

export const adminKamusApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/dictionary?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/dictionary', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/dictionary/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/dictionary/${id}`, { method: 'DELETE' }),
};

export const adminQuizApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/quiz/questions/all?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/quiz/questions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/quiz/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/quiz/questions/${id}`, { method: 'DELETE' }),
};

export const adminSejarahApi = {
    list: () => authFetch('/api/v1/history'),
    create: (data) => authFetch('/api/v1/history', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/history/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/history/${id}`, { method: 'DELETE' }),
};

export const adminAsbabunNuzulApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/asbabun-nuzul?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/asbabun-nuzul', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/asbabun-nuzul/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/asbabun-nuzul/${id}`, { method: 'DELETE' }),
};

export const adminWiridApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/wirid?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/wirid', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/wirid/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/wirid/${id}`, { method: 'DELETE' }),
};

export const adminTahlilApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/tahlil/items?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/tahlil/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/tahlil/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/tahlil/items/${id}`, { method: 'DELETE' }),
};

export const adminManasikApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/manasik/items?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/manasik', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/manasik/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/manasik/${id}`, { method: 'DELETE' }),
};

export const adminFiqhApi = {
    list: (page = 0, size = 100) => authFetch(`/api/v1/fiqh/items?page=${page}&size=${size}`),
    create: (data) => authFetch('/api/v1/fiqh/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => authFetch(`/api/v1/fiqh/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => authFetch(`/api/v1/fiqh/items/${id}`, { method: 'DELETE' }),
};

export const booksApi = {
    list: () => fetch(`${API_URL}/api/v1/books?size=20`),
};

export const getBooks = async () => {
    try {
        const res = await fetch(`${API_URL}/api/v1/books?size=20`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.items ?? [];
    } catch {
        return [];
    }
};

export const bookLabel = (book, lang = 'ID') =>
    getLocalizedTranslation(book?.translation, lang) || book?.slug || '';

export const bookImageSrc = (slug) => `/assets/images/kitab/hadith/${slug}.png`;

export const bookHref = (slug) => `/hadith/${slug}`;

export const hadithApi = {
    daily: () => fetch(`${API_URL}/api/v1/hadiths/daily`),
    detail: (id) => fetch(`${API_URL}/api/v1/hadiths/${id}`),
    detailByBookNumber: (bookSlug, number) =>
        fetch(`${API_URL}/api/v1/hadiths/book/${bookSlug}/number/${number}`),
};

export const achievementApi = {
    list: () => fetch(`${API_URL}/api/v1/achievements`),
    mine: () => authFetch('/api/v1/achievements/mine'),
    points: () => authFetch('/api/v1/achievements/points'),
};

export const quranApi = {
    bySurahPage: (surahNumber, page = 0, size = 300) =>
        fetch(`${API_URL}/api/v1/ayah/surah/number/${surahNumber}?page=${page}&size=${size}`),
    byPage: (page) => fetch(`${API_URL}/api/v1/ayah/page/${page}`),
    byHizb: (hizb) => fetch(`${API_URL}/api/v1/ayah/hizb/${hizb}`),
};

export const kalkulasiZakatApi = {
    save: (data) => authFetch('/api/v1/zakat/kalkulasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
    list: () => authFetch('/api/v1/zakat/kalkulasi'),
    delete: (id) => authFetch(`/api/v1/zakat/kalkulasi/${id}`, { method: 'DELETE' }),
};

export const faraidhSimpanApi = {
    save: (data) => authFetch('/api/v1/faraidh/simpan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
    list: () => authFetch('/api/v1/faraidh/simpan'),
    delete: (id) => authFetch(`/api/v1/faraidh/simpan/${id}`, { method: 'DELETE' }),
};

export const forumApi = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetch(`${API_URL}/api/v1/forum/questions${qs ? '?' + qs : ''}`);
    },
    get: (slug) => fetch(`${API_URL}/api/v1/forum/questions/${slug}`),
    create: (data) => authFetch('/api/v1/forum/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
    delete: (id) => authFetch(`/api/v1/forum/questions/${id}`, { method: 'DELETE' }),
    answer: (questionId, data) => authFetch(`/api/v1/forum/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
    acceptAnswer: (questionId, answerId) => authFetch(`/api/v1/forum/questions/${questionId}/answers/${answerId}/accept`, { method: 'PUT' }),
    deleteAnswer: (id) => authFetch(`/api/v1/forum/answers/${id}`, { method: 'DELETE' }),
    vote: (data) => authFetch('/api/v1/forum/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
};

export const notificationInboxApi = {
    list: () => authFetch('/api/v1/notifications/inbox'),
    markRead: (id) => authFetch(`/api/v1/notifications/inbox/${id}/read`, { method: 'PUT' }),
    markAllRead: () => authFetch('/api/v1/notifications/inbox/read-all', { method: 'PUT' }),
};

export const dzikirLogApi = {
    today: () => authFetch('/api/v1/dzikir/log/today'),
    log: (dzikirId, category) =>
        authFetch('/api/v1/dzikir/log', {
            method: 'POST',
            body: JSON.stringify({ dzikir_id: dzikirId, category }),
        }),
    delete: (id) => authFetch(`/api/v1/dzikir/log/${id}`, { method: 'DELETE' }),
};

export const userWirdApi = {
    list: () => authFetch('/api/v1/user-wird'),
    create: (data) =>
        authFetch('/api/v1/user-wird', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id, data) =>
        authFetch(`/api/v1/user-wird/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id) =>
        authFetch(`/api/v1/user-wird/${id}`, { method: 'DELETE' }),
};
