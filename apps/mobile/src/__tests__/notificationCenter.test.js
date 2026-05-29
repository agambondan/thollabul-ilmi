jest.mock('../context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('../context/FeedbackContext', () => ({
  useFeedback: jest.fn(),
}));

jest.mock('../api/personal', () => ({
  deleteNotificationInboxItem: jest.fn(),
  getNotificationSettings: jest.fn(),
  getNotificationInbox: jest.fn(),
  getPushTokenStatus: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  registerPushToken: jest.fn(),
  saveNotificationSettings: jest.fn(),
  sendPushTest: jest.fn(),
}));

jest.mock('../utils/pushNotifications', () => ({
  getPushNotificationAvailability: jest.fn(),
  getPushNotificationRegistration: jest.fn(),
  pushNotificationsSupported: jest.fn(),
}));

jest.mock('../utils/smartNotifications', () => ({
  getSmartReminderSchedule: jest.fn(),
  scheduleSmartReminders: jest.fn(),
  smartNotificationsSupported: jest.fn(),
}));

jest.mock('../storage/preferences', () => ({
  readPreference: jest.fn(),
  writePreference: jest.fn(),
  preferenceKeys: {
    smartNotifSettings: 'smart-notif-settings',
    smartNotifQuietHours: 'smart-notif-quiet-hours',
    smartNotifLocalIds: 'smart-notif-local-ids',
    smartNotifPendingSync: 'smart-notif-pending-sync',
  },
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationCenter } from '../components/NotificationCenter';
import { flushAsyncWork } from '../test-utils/async';

const { useSession } = require('../context/SessionContext');
const { useFeedback } = require('../context/FeedbackContext');
const {
  deleteNotificationInboxItem,
  getNotificationSettings,
  getNotificationInbox,
  getPushTokenStatus,
  markNotificationRead,
} = require('../api/personal');
const { getPushNotificationAvailability } = require('../utils/pushNotifications');
const { getSmartReminderSchedule, smartNotificationsSupported } = require('../utils/smartNotifications');
const { readPreference } = require('../storage/preferences');

const mockFeedback = {
  showError: jest.fn(),
  showInfo: jest.fn(),
  showSuccess: jest.fn(),
};

const defaultInbox = { items: [], unreadCount: 0 };

const renderNotificationCenter = async () => {
  const view = render(<NotificationCenter />);
  await flushAsyncWork();
  return view;
};

beforeEach(() => {
  jest.clearAllMocks();
  useSession.mockReturnValue({ session: { token: 'abc' } });
  useFeedback.mockReturnValue(mockFeedback);
  getPushNotificationAvailability.mockReturnValue({ message: '', supported: true });
  getSmartReminderSchedule.mockReturnValue([]);
  smartNotificationsSupported.mockReturnValue(true);
  readPreference.mockResolvedValue(null);
  getNotificationSettings.mockResolvedValue([]);
  getNotificationInbox.mockResolvedValue(defaultInbox);
  getPushTokenStatus.mockResolvedValue({ hasActive: false });
});

describe('NotificationCenter', () => {
  test('renders settings tab by default', async () => {
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Pengaturan')).toBeTruthy();
    expect(getByText('Pengaturan Notifikasi')).toBeTruthy();
  });

  test('renders both tabs when has session', async () => {
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Pengaturan')).toBeTruthy();
    expect(getByText('Kotak Masuk')).toBeTruthy();
  });

  test('renders inbox tab with empty state', async () => {
    const { getByText, findByText } = await renderNotificationCenter();
    fireEvent.press(getByText('Kotak Masuk'));
    expect(await findByText('Belum ada notifikasi masuk.')).toBeTruthy();
  });

  test('renders inbox items', async () => {
    getNotificationInbox.mockResolvedValue({
      items: [{ id: '1', title: 'Notif 1', body: 'Body 1', type: 'daily_quran', is_read: false }],
      unreadCount: 1,
    });
    const { findByText } = await renderNotificationCenter();
    fireEvent.press(await findByText(/Kotak Masuk/));
    expect(await findByText('Notif 1')).toBeTruthy();
    expect(await findByText('Body 1')).toBeTruthy();
  });

  test('marks inbox item read from explicit action', async () => {
    getNotificationInbox.mockResolvedValue({
      items: [{ id: '1', title: 'Notif 1', body: 'Body 1', type: 'daily_quran', is_read: false }],
      unreadCount: 1,
    });
    markNotificationRead.mockResolvedValue({});
    const { findByText } = await renderNotificationCenter();
    fireEvent.press(await findByText(/Kotak Masuk/));

    fireEvent.press(await findByText('Tandai terbaca'));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith('1');
    });
  });

  test('deletes inbox item', async () => {
    getNotificationInbox.mockResolvedValue({
      items: [{ id: '1', title: 'Notif 1', body: 'Body 1', type: 'daily_quran', is_read: false }],
      unreadCount: 1,
    });
    deleteNotificationInboxItem.mockResolvedValue({});
    const { findByText, queryByText } = await renderNotificationCenter();
    fireEvent.press(await findByText(/Kotak Masuk/));

    fireEvent.press(await findByText('Hapus'));

    await waitFor(() => {
      expect(deleteNotificationInboxItem).toHaveBeenCalledWith('1');
      expect(queryByText('Notif 1')).toBeNull();
    });
  });

  test('treats missing inbox item delete as already unavailable', async () => {
    getNotificationInbox.mockResolvedValue({
      items: [{ id: '1', title: 'Notif 1', body: 'Body 1', type: 'daily_quran', is_read: false }],
      unreadCount: 1,
    });
    const notFound = new Error('not found');
    notFound.status = 404;
    deleteNotificationInboxItem.mockRejectedValueOnce(notFound);
    const { findByText, queryByText } = await renderNotificationCenter();
    fireEvent.press(await findByText(/Kotak Masuk/));

    fireEvent.press(await findByText('Hapus'));

    await waitFor(() => {
      expect(deleteNotificationInboxItem).toHaveBeenCalledWith('1');
      expect(queryByText('Notif 1')).toBeNull();
    });
  });

  test('renders streak risk inbox item with fallback copy', async () => {
    getNotificationInbox.mockResolvedValue({
      items: [{ id: 'streak-1', type: 'streak_risk', is_read: false }],
      unreadCount: 1,
    });
    const { findByText } = await renderNotificationCenter();

    fireEvent.press(await findByText(/Kotak Masuk/));

    expect(await findByText('Streak Belajar Berisiko')).toBeTruthy();
    expect(await findByText(/Streak belajarmu berisiko putus/)).toBeTruthy();
    expect(await findByText('Streak Risk')).toBeTruthy();
  });

  test('keeps backend streak risk title and body when provided', async () => {
    getNotificationInbox.mockResolvedValue({
      items: [{
        body: 'Murojaah satu ayat sebelum tidur.',
        id: 'streak-2',
        title: 'Streak hampir putus',
        type: 'streak_risk',
        is_read: false,
      }],
      unreadCount: 1,
    });
    const { findByText } = await renderNotificationCenter();

    fireEvent.press(await findByText(/Kotak Masuk/));

    expect(await findByText('Streak hampir putus')).toBeTruthy();
    expect(await findByText('Murojaah satu ayat sebelum tidur.')).toBeTruthy();
  });

  test('shows local notice when no session', async () => {
    useSession.mockReturnValue({ session: null });
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Reminder lokal tetap aktif')).toBeTruthy();
  });

  test('toggles quiet hours', async () => {
    const { getAllByText } = await renderNotificationCenter();
    const offButtons = getAllByText('Off');
    fireEvent.press(offButtons[0]);
    expect(getAllByText('On').length).toBeGreaterThanOrEqual(1);
  });

  test('renders reminder settings list', async () => {
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Quran Harian')).toBeTruthy();
    expect(getByText('Hadis Harian')).toBeTruthy();
    expect(getByText('Doa Harian')).toBeTruthy();
  });

  test('renders save button', async () => {
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Simpan pengaturan')).toBeTruthy();
  });

  test('renders preview section with active reminders', async () => {
    getSmartReminderSchedule.mockReturnValue([
      { type: 'daily_quran', label: 'Quran Harian', scheduledTime: '06:00', serverSync: true },
    ]);
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Jadwal aktif')).toBeTruthy();
  });

  test('renders empty preview when no reminders active', async () => {
    getSmartReminderSchedule.mockReturnValue([]);
    const { getByText } = await renderNotificationCenter();
    expect(getByText('Belum ada reminder aktif')).toBeTruthy();
  });
});
