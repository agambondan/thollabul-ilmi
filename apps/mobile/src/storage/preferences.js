import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_PREFIX = 'tholabul:pref:';

const keyFor = (key) => `${PREF_PREFIX}${key}`;

export const preferenceKeys = {
  prayerAdjustments: 'prayer-adjustments',
  prayerAdzanAudioEnabled: 'prayer-adzan-audio-enabled',
  homeLastLocation: 'home-last-location',
  homePrayerTimes: 'home-prayer-times',
  prayerMadhab: 'prayer-madhab',
  prayerMethod: 'prayer-method',
  prayerReminderEnabled: 'prayer-reminder-enabled',
  prayerReminderIds: 'prayer-reminder-ids',
  prayerReminderLeadMinutes: 'prayer-reminder-lead-minutes',
  prayerReminderPrayers: 'prayer-reminder-prayers',
  appLanguage: 'app-language',
  appLayoutMode: 'app-layout-mode',
  appTheme: 'app-theme',
  smartNotifLocalIds: 'smart-notif-local-ids',
  smartNotifPendingSync: 'smart-notif-pending-sync',
  smartNotifQuietHours: 'smart-notif-quiet-hours',
  smartNotifSettings: 'smart-notif-settings',
  quranArabicFont: 'quran-arabic-font',
  quranAudioQari: 'quran-audio-qari',
  quranAudioRange: 'quran-audio-range',
  quranAudioRepeat: 'quran-audio-repeat',
  quranAudioSpeed: 'quran-audio-speed',
  quranDisplayMode: 'quran-display-mode',
  quranFontSize: 'quran-font-size',
  quranMemorizationMode: 'quran-memorization-mode',
};

export const readPreference = async (key, defaultValue) => {
  try {
    const raw = await AsyncStorage.getItem(keyFor(key));
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

export const writePreference = async (key, value) => {
  await AsyncStorage.setItem(keyFor(key), JSON.stringify(value));
  return value;
};
