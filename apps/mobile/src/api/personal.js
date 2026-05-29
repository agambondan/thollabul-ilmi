import { deleteJson, postJson, putJson, requestJson } from './client';

const pickItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.achievements)) return payload.achievements;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.achievements)) return payload.data.achievements;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getBookmarks = async () => {
  const payload = await requestJson('/api/v1/bookmarks', { auth: true });
  return pickItems(payload);
};

export const addBookmark = async ({ refType, refId }) =>
  postJson(
    '/api/v1/bookmarks',
    {
      ref_type: refType,
      ref_id: refId,
    },
    { auth: true },
  );

export const deleteBookmark = async (id) => deleteJson(`/api/v1/bookmarks/${id}`, { auth: true });

export const getQuranProgress = async () => requestJson('/api/v1/progress/quran', { auth: true });

export const saveQuranProgress = async ({ surahNumber, ayahNumber, ayahId }) =>
  putJson(
    '/api/v1/progress/quran',
    {
      surah_number: surahNumber,
      ayah_number: ayahNumber,
      ayah_id: ayahId,
    },
    { auth: true },
  );

export const getLibraryProgress = async (bookId) =>
  requestJson(`/api/v1/library/progress/${bookId}`, { auth: true });

export const getLibraryProgressList = async () => {
  const payload = await requestJson('/api/v1/library/progress', { auth: true });
  return pickItems(payload);
};

export const saveLibraryProgress = async ({ bookId, currentPage = 0, note = '', status = 'reading' }) =>
  putJson(
    `/api/v1/library/progress/${bookId}`,
    {
      current_page: Number(currentPage) || 0,
      note,
      status,
    },
    { auth: true },
  );

export const getTodayPrayerLog = async () => requestJson('/api/v1/sholat/today', { auth: true });

export const savePrayerLog = async ({ date, prayer, status }) =>
  putJson(
    '/api/v1/sholat/today',
    {
      date,
      prayer,
      status,
    },
    { auth: true },
  );

export const getPrayerStats = async () => requestJson('/api/v1/sholat/stats', { auth: true });

export const getNotes = async ({ refType, refId }) => {
  const payload = await requestJson(`/api/v1/notes?ref_type=${refType}&ref_id=${refId}`, { auth: true });
  return pickItems(payload);
};

export const getNotesByType = async (refType) => {
  const payload = await requestJson(`/api/v1/notes?ref_type=${refType}`, { auth: true });
  return pickItems(payload);
};

export const createNote = async ({ refType, refId, content }) =>
  postJson(
    '/api/v1/notes',
    {
      ref_type: refType,
      ref_id: refId,
      content,
    },
    { auth: true },
  );

export const updateNote = async ({ id, content }) =>
  putJson(
    `/api/v1/notes/${id}`,
    {
      content,
    },
    { auth: true },
  );

export const deleteNote = async (id) => deleteJson(`/api/v1/notes/${id}`, { auth: true });

export const getNotificationSettings = async () => {
  const payload = await requestJson('/api/v1/notifications/settings', { auth: true });
  return pickItems(payload);
};

export const saveNotificationSettings = async (settings) =>
  putJson(
    '/api/v1/notifications/settings',
    {
      settings: settings.map((item) => ({
        is_active: Boolean(item.is_active),
        time: item.time,
        type: item.type,
      })),
    },
    { auth: true },
  );

export const registerPushToken = async ({ deviceId = '', platform, provider = 'expo', token }) =>
  putJson(
    '/api/v1/notifications/push-token',
    {
      device_id: deviceId,
      platform,
      provider,
      token,
    },
    { auth: true },
  );

export const getPushTokenStatus = async () => {
  const payload = await requestJson('/api/v1/notifications/push-tokens', { auth: true });
  const data = payload?.data ?? payload;
  return {
    activeCount: Number(data?.active_count ?? data?.activeCount ?? 0),
    hasActive: Boolean(data?.has_active ?? data?.hasActive),
    items: pickItems(data),
  };
};

export const sendPushTest = async () => {
  const payload = await postJson('/api/v1/notifications/push-test', {}, { auth: true });
  return payload?.data ?? payload;
};

export const getNotificationInbox = async () => {
  const payload = await requestJson('/api/v1/notifications/inbox', { auth: true });
  return {
    items: pickItems(payload),
    unreadCount: Number(payload?.unread_count ?? payload?.data?.unread_count ?? 0),
  };
};

export const markNotificationRead = async (id) =>
  putJson(`/api/v1/notifications/inbox/${id}/read`, {}, { auth: true });

export const markAllNotificationsRead = async () =>
  putJson('/api/v1/notifications/inbox/read-all', {}, { auth: true });

export const deleteNotificationInboxItem = async (id) =>
  deleteJson(`/api/v1/notifications/inbox/${id}`, { auth: true });

export const getAchievements = async () => {
  const payload = await requestJson('/api/v1/achievements');
  return pickItems(payload);
};

export const getMyAchievements = async () => {
  const payload = await requestJson('/api/v1/achievements/mine', { auth: true });
  return pickItems(payload);
};

export const getMyPoints = () => requestJson('/api/v1/achievements/points', { auth: true });

export const getMyStreak = () => requestJson('/api/v1/streak', { auth: true });

export const logActivity = (type) => postJson('/api/v1/activity', { type }, { auth: true });

export const checkAmalan = (id) => putJson(`/api/v1/amalan/${id}/check`, {}, { auth: true });

export const getTilawahSummary = () => requestJson('/api/v1/tilawah/summary', { auth: true });

export const getHafalanList = async () => {
  const payload = await requestJson('/api/v1/hafalan', { auth: true });
  return pickItems(payload);
};

export const getHafalanSummary = async () => requestJson('/api/v1/hafalan/summary', { auth: true });

export const updateHafalanStatus = async (surahId, status) =>
  putJson(`/api/v1/hafalan/surah/${surahId}`, { status }, { auth: true });

export const getMurojaahSession = async () => {
  const payload = await requestJson('/api/v1/murojaah/session', { auth: true });
  return pickItems(payload);
};

export const saveMurojaahResult = async ({ surahId, fromAyah, toAyah, score, durationSeconds, note }) =>
  postJson(
    '/api/v1/murojaah/result',
    {
      surah_id: surahId,
      from_ayah: fromAyah,
      to_ayah: toAyah,
      score,
      duration_seconds: durationSeconds,
      note: note ?? '',
    },
    { auth: true },
  );

export const getUserWirds = async () => {
  const payload = await requestJson('/api/v1/user-wird', { auth: true });
  return pickItems(payload);
};

export const createUserWird = async (payload) => postJson('/api/v1/user-wird', payload, { auth: true });

export const updateUserWird = async (id, payload) => putJson(`/api/v1/user-wird/${id}`, payload, { auth: true });

export const deleteUserWird = async (id) => deleteJson(`/api/v1/user-wird/${id}`, { auth: true });

export const saveFaraidh = async (data) =>
  postJson('/api/v1/faraidh/simpan', data, { auth: true });

export const getFaraidhHistory = async () => {
  const payload = await requestJson('/api/v1/faraidh/simpan', { auth: true });
  return pickItems(payload);
};

export const deleteFaraidh = async (id) => deleteJson(`/api/v1/faraidh/simpan/${id}`, { auth: true });

export const saveKalkulasiZakat = async (data) =>
  postJson('/api/v1/zakat/kalkulasi', data, { auth: true });

export const getKalkulasiZakat = async () => {
  const payload = await requestJson('/api/v1/zakat/kalkulasi', { auth: true });
  return pickItems(payload);
};

export const deleteKalkulasiZakat = async (id) => deleteJson(`/api/v1/zakat/kalkulasi/${id}`, { auth: true });
