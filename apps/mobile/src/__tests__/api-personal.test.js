jest.mock('../api/client', () => ({
  requestJson: jest.fn(),
  postJson: jest.fn(),
  putJson: jest.fn(),
  deleteJson: jest.fn(),
}));

const { requestJson, postJson, putJson, deleteJson } =
  require('../api/client');
const {
  getBookmarks,
  addBookmark,
  deleteBookmark,
  getQuranProgress,
  saveQuranProgress,
  getLibraryProgress,
  getLibraryProgressList,
  saveLibraryProgress,
  getTodayPrayerLog,
  savePrayerLog,
  getPrayerStats,
  getNotes,
  getNotesByType,
  createNote,
  updateNote,
  deleteNote,
  getNotificationSettings,
  saveNotificationSettings,
  registerPushToken,
  getPushTokenStatus,
  sendPushTest,
  getNotificationInbox,
  markNotificationRead,
  markAllNotificationsRead,
  getAchievements,
  getMyAchievements,
  getMyPoints,
  getMyStreak,
  logActivity,
  checkAmalan,
  getTilawahSummary,
  getHafalanList,
  getHafalanSummary,
  updateHafalanStatus,
  getMurojaahSession,
  saveMurojaahResult,
  getUserWirds,
  createUserWird,
  updateUserWird,
  deleteUserWird,
} = require('../api/personal');

describe('personal api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bookmarks', () => {
    test('getBookmarks calls requestJson with auth and picks items', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ id: 1, ref_type: 'surah' }],
      });
      const result = await getBookmarks();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/bookmarks', {
        auth: true,
      });
      expect(result).toEqual([{ id: 1, ref_type: 'surah' }]);
    });

    test('getBookmarks handles direct array response', async () => {
      requestJson.mockResolvedValueOnce([{ id: 1 }]);
      const result = await getBookmarks();
      expect(result).toEqual([{ id: 1 }]);
    });

    test('addBookmark calls postJson', async () => {
      postJson.mockResolvedValueOnce({});
      await addBookmark({ refType: 'surah', refId: '1' });
      expect(postJson).toHaveBeenCalledWith(
        '/api/v1/bookmarks',
        { ref_type: 'surah', ref_id: '1' },
        { auth: true },
      );
    });

    test('deleteBookmark calls deleteJson', async () => {
      deleteJson.mockResolvedValueOnce({});
      await deleteBookmark(42);
      expect(deleteJson).toHaveBeenCalledWith('/api/v1/bookmarks/42', {
        auth: true,
      });
    });
  });

  describe('quran progress', () => {
    test('getQuranProgress calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({ surah: 1, ayah: 7 });
      const result = await getQuranProgress();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/progress/quran', {
        auth: true,
      });
      expect(result).toEqual({ surah: 1, ayah: 7 });
    });

    test('saveQuranProgress calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await saveQuranProgress({
        surahNumber: 1,
        ayahNumber: 7,
        ayahId: 123,
      });
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/progress/quran',
        { surah_number: 1, ayah_number: 7, ayah_id: 123 },
        { auth: true },
      );
    });
  });

  describe('library progress', () => {
    test('getLibraryProgress calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({ status: 'reading', current_page: 12 });
      const result = await getLibraryProgress(7);
      expect(requestJson).toHaveBeenCalledWith('/api/v1/library/progress/7', {
        auth: true,
      });
      expect(result).toEqual({ status: 'reading', current_page: 12 });
    });

    test('saveLibraryProgress calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await saveLibraryProgress({
        bookId: 7,
        currentPage: '12',
        note: 'Bab adab',
        status: 'paused',
      });
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/library/progress/7',
        { current_page: 12, note: 'Bab adab', status: 'paused' },
        { auth: true },
      );
    });

    test('getLibraryProgressList picks progress items', async () => {
      requestJson.mockResolvedValueOnce({
        data: [{ id: 1, library_book_id: 7, status: 'reading' }],
      });
      const result = await getLibraryProgressList();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/library/progress', {
        auth: true,
      });
      expect(result).toEqual([{ id: 1, library_book_id: 7, status: 'reading' }]);
    });
  });

  describe('prayer', () => {
    test('getTodayPrayerLog calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({});
      await getTodayPrayerLog();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/sholat/today', {
        auth: true,
      });
    });

    test('savePrayerLog calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await savePrayerLog({
        date: '2025-01-01',
        prayer: 'subuh',
        status: 'on_time',
      });
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/sholat/today',
        { date: '2025-01-01', prayer: 'subuh', status: 'on_time' },
        { auth: true },
      );
    });

    test('getPrayerStats calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({});
      await getPrayerStats();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/sholat/stats', {
        auth: true,
      });
    });
  });

  describe('notes', () => {
    test('getNotes calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ id: 1, content: 'note' }],
      });
      const result = await getNotes({ refType: 'surah', refId: '1' });
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/notes?ref_type=surah&ref_id=1',
        { auth: true },
      );
      expect(result).toEqual([{ id: 1, content: 'note' }]);
    });

    test('getNotesByType calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce([]);
      await getNotesByType('surah');
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/notes?ref_type=surah',
        { auth: true },
      );
    });

    test('createNote calls postJson', async () => {
      postJson.mockResolvedValueOnce({});
      await createNote({
        refType: 'surah',
        refId: '1',
        content: 'My note',
      });
      expect(postJson).toHaveBeenCalledWith(
        '/api/v1/notes',
        { ref_type: 'surah', ref_id: '1', content: 'My note' },
        { auth: true },
      );
    });

    test('updateNote calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await updateNote({ id: 5, content: 'Updated' });
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/notes/5',
        { content: 'Updated' },
        { auth: true },
      );
    });

    test('deleteNote calls deleteJson', async () => {
      deleteJson.mockResolvedValueOnce({});
      await deleteNote(5);
      expect(deleteJson).toHaveBeenCalledWith('/api/v1/notes/5', {
        auth: true,
      });
    });
  });

  describe('notifications', () => {
    test('getNotificationSettings calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ type: 'prayer', is_active: true }],
      });
      const result = await getNotificationSettings();
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/notifications/settings',
        { auth: true },
      );
      expect(result).toEqual([
        { type: 'prayer', is_active: true },
      ]);
    });

    test('saveNotificationSettings calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await saveNotificationSettings([
        { is_active: true, time: '05:00', type: 'prayer' },
      ]);
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/notifications/settings',
        {
          settings: [
            { is_active: true, time: '05:00', type: 'prayer' },
          ],
        },
        { auth: true },
      );
    });

    test('registerPushToken calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await registerPushToken({
        deviceId: 'dev-1',
        platform: 'ios',
        token: 'expo-token',
      });
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/notifications/push-token',
        { device_id: 'dev-1', platform: 'ios', provider: 'expo', token: 'expo-token' },
        { auth: true },
      );
    });

    test('getPushTokenStatus returns parsed status', async () => {
      requestJson.mockResolvedValueOnce({
        data: { active_count: 2, has_active: true, items: [{ token: 't1' }] },
      });
      const result = await getPushTokenStatus();
      expect(result).toEqual({
        activeCount: 2,
        hasActive: true,
        items: [{ token: 't1' }],
      });
    });

    test('sendPushTest calls postJson', async () => {
      postJson.mockResolvedValueOnce({ data: 'sent' });
      const result = await sendPushTest();
      expect(postJson).toHaveBeenCalledWith(
        '/api/v1/notifications/push-test',
        {},
        { auth: true },
      );
      expect(result).toBe('sent');
    });

    test('getNotificationInbox returns inbox items and unread count', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ id: 1 }],
        unread_count: 3,
      });
      const result = await getNotificationInbox();
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/notifications/inbox',
        { auth: true },
      );
      expect(result).toEqual({ items: [{ id: 1 }], unreadCount: 3 });
    });

    test('markNotificationRead calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await markNotificationRead(10);
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/notifications/inbox/10/read',
        {},
        { auth: true },
      );
    });

    test('markAllNotificationsRead calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await markAllNotificationsRead();
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/notifications/inbox/read-all',
        {},
        { auth: true },
      );
    });
  });

  describe('achievements', () => {
    test('getAchievements calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        achievements: [{ id: 1, name: 'A' }],
      });
      const result = await getAchievements();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/achievements');
      expect(result).toEqual([{ id: 1, name: 'A' }]);
    });

    test('getMyAchievements calls with auth', async () => {
      requestJson.mockResolvedValueOnce([]);
      await getMyAchievements();
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/achievements/mine',
        { auth: true },
      );
    });

    test('getMyPoints calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({ points: 100 });
      const result = await getMyPoints();
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/achievements/points',
        { auth: true },
      );
      expect(result).toEqual({ points: 100 });
    });
  });

  describe('streaks & tilawah', () => {
    test('getMyStreak calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({ days: 5 });
      const result = await getMyStreak();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/streak', {
        auth: true,
      });
      expect(result).toEqual({ days: 5 });
    });

    test('logActivity calls correct endpoint', async () => {
      postJson.mockResolvedValueOnce({});
      await logActivity('amalan');
      expect(postJson).toHaveBeenCalledWith(
        '/api/v1/activity',
        { type: 'amalan' },
        { auth: true },
      );
    });

    test('checkAmalan calls correct endpoint', async () => {
      putJson.mockResolvedValueOnce({});
      await checkAmalan(7);
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/amalan/7/check',
        {},
        { auth: true },
      );
    });

    test('getTilawahSummary calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({ total: 10 });
      const result = await getTilawahSummary();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/tilawah/summary', {
        auth: true,
      });
      expect(result).toEqual({ total: 10 });
    });
  });

  describe('hafalan', () => {
    test('getHafalanList calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ surah_id: 1, status: 'completed' }],
      });
      const result = await getHafalanList();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/hafalan', {
        auth: true,
      });
      expect(result).toEqual([
        { surah_id: 1, status: 'completed' },
      ]);
    });

    test('getHafalanSummary calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({ completed: 5 });
      const result = await getHafalanSummary();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/hafalan/summary', {
        auth: true,
      });
      expect(result).toEqual({ completed: 5 });
    });

    test('updateHafalanStatus calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await updateHafalanStatus(1, 'completed');
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/hafalan/surah/1',
        { status: 'completed' },
        { auth: true },
      );
    });
  });

  describe('murojaah', () => {
    test('getMurojaahSession calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ surah_id: 1 }],
      });
      const result = await getMurojaahSession();
      expect(requestJson).toHaveBeenCalledWith(
        '/api/v1/murojaah/session',
        { auth: true },
      );
      expect(result).toEqual([{ surah_id: 1 }]);
    });

    test('saveMurojaahResult calls postJson', async () => {
      postJson.mockResolvedValueOnce({});
      await saveMurojaahResult({
        surahId: 1,
        fromAyah: 1,
        toAyah: 7,
        score: 85,
        durationSeconds: 120,
        note: 'Good',
      });
      expect(postJson).toHaveBeenCalledWith(
        '/api/v1/murojaah/result',
        {
          surah_id: 1,
          from_ayah: 1,
          to_ayah: 7,
          score: 85,
          duration_seconds: 120,
          note: 'Good',
        },
        { auth: true },
      );
    });
  });

  describe('user wird', () => {
    test('getUserWirds calls correct endpoint', async () => {
      requestJson.mockResolvedValueOnce({
        items: [{ id: 1, title: 'Wird' }],
      });
      const result = await getUserWirds();
      expect(requestJson).toHaveBeenCalledWith('/api/v1/user-wird', {
        auth: true,
      });
      expect(result).toEqual([{ id: 1, title: 'Wird' }]);
    });

    test('createUserWird calls postJson', async () => {
      postJson.mockResolvedValueOnce({});
      await createUserWird({ title: 'New Wird' });
      expect(postJson).toHaveBeenCalledWith(
        '/api/v1/user-wird',
        { title: 'New Wird' },
        { auth: true },
      );
    });

    test('updateUserWird calls putJson', async () => {
      putJson.mockResolvedValueOnce({});
      await updateUserWird(1, { title: 'Updated' });
      expect(putJson).toHaveBeenCalledWith(
        '/api/v1/user-wird/1',
        { title: 'Updated' },
        { auth: true },
      );
    });

    test('deleteUserWird calls deleteJson', async () => {
      deleteJson.mockResolvedValueOnce({});
      await deleteUserWird(1);
      expect(deleteJson).toHaveBeenCalledWith('/api/v1/user-wird/1', {
        auth: true,
      });
    });
  });
});
