import * as Location from 'expo-location';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { ArrowLeft, Play, RefreshCw, Settings, Square } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getPrayerTimes } from '../api/client';
import { Card, CardTitle } from '../components/Card';
import { IconActionButton } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useFeedback } from '../context/FeedbackContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { useMobileLocale } from '../i18n/MobileLocaleProvider';
import {
  buildPrayerOfflinePack,
  clearPrayerOfflinePack,
  getOfflinePrayerForDate,
  getPrayerOfflineOverview,
} from '../storage/offlineContent';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors, radius, spacing } from '../theme';
import {
  cancelPrayerReminders,
  notificationsSupported,
  schedulePrayerReminders,
  showPrayerTimeNotification,
} from '../utils/prayerNotifications';

const scheduleRows = [
  ['imsak', 'Imsak'],
  ['fajr', 'Subuh'],
  ['sunrise', 'Terbit'],
  ['dhuhr', 'Dzuhur'],
  ['asr', 'Asr'],
  ['maghrib', 'Maghrib'],
  ['isha', 'Isya'],
];

const methods = [
  ['kemenag', 'Kemenag'],
  ['mwl', 'MWL'],
  ['makkah', 'Makkah'],
  ['isna', 'ISNA'],
];

const madhabs = [
  ['shafi', 'Shafi'],
  ['hanafi', 'Hanafi'],
];

const defaultAdjustments = scheduleRows.reduce(
  (acc, [key]) => ({
    ...acc,
    [key]: 0,
  }),
  {},
);

const prayerLabels = Object.fromEntries(scheduleRows);
const prayerArabicLabels = {
  imsak: 'الإمساك',
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};
const defaultReminderPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const reminderLeadOptions = [0, 5, 10, 15, 30];
const WEB_APP_PRAYER_BG = '#f8fafc';
const WEB_APP_PRAYER_SURFACE = '#ffffff';
const WEB_APP_PRAYER_BORDER = '#e5e7eb';
const WEB_APP_PRAYER_MUTED = '#64748b';
const WEB_APP_PRAYER_TEXT = '#0f172a';
const WEB_APP_PRAYER_ACCENT = '#059669';
const WEB_APP_PRAYER_ACCENT_SOFT = '#ecfdf5';
const WEB_APP_PRAYER_THEMES = {
  light: { accent: WEB_APP_PRAYER_ACCENT, accentSoft: WEB_APP_PRAYER_ACCENT_SOFT, bg: WEB_APP_PRAYER_BG, border: WEB_APP_PRAYER_BORDER, input: '#f8fafc', line: '#f1f5f9', messageBg: '#fff7ed', messageBorder: '#fed7aa', messageText: '#c2410c', muted: WEB_APP_PRAYER_MUTED, surface: WEB_APP_PRAYER_SURFACE, text: WEB_APP_PRAYER_TEXT, title: '#065f46' },
  dark: { accent: '#34d399', accentSoft: '#064e3b', bg: '#020617', border: '#334155', input: '#0f172a', line: '#1e293b', messageBg: '#431407', messageBorder: '#9a3412', messageText: '#fdba74', muted: '#94a3b8', surface: '#111827', text: '#f8fafc', title: '#d1fae5' },
};

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMinutes = (time) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
};

const formatMinutes = (value) => {
  const wrapped = ((value % 1440) + 1440) % 1440;
  const hours = `${Math.floor(wrapped / 60)}`.padStart(2, '0');
  const minutes = `${wrapped % 60}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function PrayerScreen({ isActive, navigation }) {
  const { showError, showInfo, showSuccess } = useFeedback();
  const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
  const { t } = useMobileLocale();
  const webTheme = isDarkTheme ? WEB_APP_PRAYER_THEMES.dark : WEB_APP_PRAYER_THEMES.light;
  const webSurfaceStyle = { backgroundColor: webTheme.bg };
  const webCardStyle = { backgroundColor: webTheme.surface, borderColor: webTheme.border };
  const [coords, setCoords] = useState(null);
  const [prayers, setPrayers] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('kemenag');
  const [madhab, setMadhab] = useState('shafi');
  const [adjustments, setAdjustments] = useState(defaultAdjustments);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [adzanAudioEnabled, setAdzanAudioEnabled] = useState(false);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(10);
  const [reminderPrayers, setReminderPrayers] = useState(defaultReminderPrayers);
  const [notificationIds, setNotificationIds] = useState([]);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [view, setView] = useState('main');
  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLngInput, setManualLngInput] = useState('');
  const [prayerOffline, setPrayerOffline] = useState(null);
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);
  const [offlineMessage, setOfflineMessage] = useState('Simpan jadwal 30 hari berikutnya untuk akses offline.');
  const [countdown, setCountdown] = useState(null);
  const [nextPrayerKey, setNextPrayerKey] = useState(null);
  const [adzanPlaying, setAdzanPlaying] = useState(false);
  const playerRef = useRef(null);
  const adzanTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const lastPrayerAlertRef = useRef('');
  const nextPrayerRef = useRef(null);

  useEffect(() => {
    if (navigation?.current?.view === 'settings') {
      setView('settings');
    }
  }, [navigation?.current?.id, navigation?.current?.view]);

  useEffect(() => {
    if (!isActive) return;
    if (view !== 'main') {
      navigation?.setBack(() => { setView('main'); return true; });
    } else {
      navigation?.clearBack?.();
    }
  }, [isActive, view, navigation]);

  const loadPrayerOfflineStatus = useCallback(
    async (currentCoords) => {
      if (!currentCoords) return;

      const overview = await getPrayerOfflineOverview({
        ...currentCoords,
        method,
        madhab,
      });
      setPrayerOffline(overview);
      if (!overview.supported) {
        setOfflineMessage(overview.error ?? t('prayer.offline.mobileOnly'));
      } else if (overview.savedAt) {
        setOfflineMessage(t('prayer.offline.savedOverview', { days: overview.days }));
      }
    },
    [madhab, method, t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    let currentCoords = null;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        currentCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(currentCoords);
      } else {
        setCoords(null);
        setPrayers(null);
        setMessage(t('prayer.location.permissionRequired'));
        setLoading(false);
        return;
      }
    } catch {
      setCoords(null);
      setPrayers(null);
      setMessage(t('prayer.location.unavailable'));
      setLoading(false);
      return;
    }

    try {
      const next = await getPrayerTimes({ ...currentCoords, method, madhab });
      setPrayers(next);
      await loadPrayerOfflineStatus(currentCoords);
    } catch (error) {
      setPrayers(null);
      setMessage(error?.message ?? t('prayer.scheduleUnavailable'));
    } finally {
      setLoading(false);
    }
  }, [loadPrayerOfflineStatus, madhab, method, t]);

  const applyManualLocation = useCallback(async () => {
    const lat = parseFloat(manualLatInput.replace(',', '.'));
    const lng = parseFloat(manualLngInput.replace(',', '.'));

    if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setMessage(t('prayer.location.invalidManual'));
      return;
    }

    setLoading(true);
    setMessage('');
    const currentCoords = { lat, lng };
    setCoords(currentCoords);

    try {
      const next = await getPrayerTimes({ ...currentCoords, method, madhab });
      setPrayers(next);
      await loadPrayerOfflineStatus(currentCoords);
    } catch (err) {
      setPrayers(null);
      setMessage(err?.message ?? 'Jadwal sholat belum tersedia untuk lokasi ini.');
    } finally {
      setLoading(false);
    }
  }, [loadPrayerOfflineStatus, madhab, manualLatInput, manualLngInput, method, t]);

  const refreshAll = useCallback(async () => {
    await load();
  }, [load]);

  const selectMethod = async (nextMethod) => {
    setMethod(nextMethod);
    await writePreference(preferenceKeys.prayerMethod, nextMethod);
  };

  const selectMadhab = async (nextMadhab) => {
    setMadhab(nextMadhab);
    await writePreference(preferenceKeys.prayerMadhab, nextMadhab);
  };

  const adjustPrayer = async (key, delta) => {
    const next = {
      ...adjustments,
      [key]: Math.max(-30, Math.min(30, (adjustments[key] ?? 0) + delta)),
    };
    setAdjustments(next);
    await writePreference(preferenceKeys.prayerAdjustments, next);
    if (reminderEnabled) {
      await syncPrayerReminders({ nextAdjustments: next, silent: true });
    }
  };

  const resetAdjustments = async () => {
    setAdjustments(defaultAdjustments);
    await writePreference(preferenceKeys.prayerAdjustments, defaultAdjustments);
    if (reminderEnabled) {
      await syncPrayerReminders({ nextAdjustments: defaultAdjustments, silent: true });
    }
  };

  const adjustedPrayerTime = (key) => {
    const raw = prayers?.[key];
    const minutes = toMinutes(raw);
    if (minutes === null) return raw ?? '--:--';
    return formatMinutes(minutes + (adjustments[key] ?? 0));
  };

  const adjustedPrayerTimes = (nextAdjustments = adjustments) =>
    scheduleRows.reduce((acc, [key]) => {
      const raw = prayers?.[key];
      const minutes = toMinutes(raw);
      return {
        ...acc,
        [key]: minutes === null ? raw : formatMinutes(minutes + (nextAdjustments[key] ?? 0)),
      };
    }, {});

  const toSeconds = (val) => {
    if (!val) return null;
    const parts = val.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 3600 + m * 60;
  };

  const findNextPrayer = () => {
    if (!prayers) return null;
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let next = null;
    let nextDiff = Infinity;
    for (const [key] of scheduleRows) {
      if (key === 'imsak' || key === 'sunrise') continue;
      const secs = toSeconds(adjustedPrayerTime(key));
      if (secs === null) continue;
      const diff = secs - nowSec;
      if (diff > 0 && diff < nextDiff) {
        nextDiff = diff;
        next = { key, remaining: diff };
      }
    }
    if (!next) {
      for (const [key] of scheduleRows) {
        if (key === 'imsak' || key === 'sunrise') continue;
        const secs = toSeconds(adjustedPrayerTime(key));
        if (secs === null) continue;
        const diff = 86400 - nowSec + secs;
        if (diff < nextDiff) {
          nextDiff = diff;
          next = { key, remaining: diff };
        }
      }
    }
    return next;
  };

  const updateNextPrayerCountdown = useCallback(() => {
    const next = findNextPrayer();
    if (!next) return null;
    nextPrayerRef.current = next.key;
    setNextPrayerKey(next.key);
    setCountdown(next.remaining);
    return next;
  }, [prayers, adjustments]);

  const playAdzan = useCallback(async (prayerKey) => {
    if (!adzanAudioEnabled) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      const fileName = prayerKey === 'fajr' ? 'subuh' : 'standard';
      const url = `https://raw.githubusercontent.com/syamilmj/Adzan/refs/heads/master/adzan/${fileName}.mp3`;
      if (!playerRef.current) {
        playerRef.current = createAudioPlayer(url, { downloadFirst: true });
      } else {
        playerRef.current.source = url;
      }
      playerRef.current.play();
      setAdzanPlaying(true);
      if (adzanTimerRef.current) clearTimeout(adzanTimerRef.current);
      adzanTimerRef.current = setTimeout(() => stopAdzan(), 30000);
    } catch {}
  }, [adzanAudioEnabled]);

  const stopAdzan = useCallback(() => {
    if (adzanTimerRef.current) clearTimeout(adzanTimerRef.current);
    if (playerRef.current) {
      try { playerRef.current.stop(); } catch {}
    }
    setAdzanPlaying(false);
  }, []);

  useEffect(() => {
    if (!prayers) return;
    updateNextPrayerCountdown();
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0) ? prev - 1 : prev);
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [prayers, adjustments, updateNextPrayerCountdown]);

  useEffect(() => {
    if (countdown === 0 && prayers && nextPrayerRef.current) {
      const prayerKey = nextPrayerRef.current;
      const alertKey = `${today()}:${prayerKey}`;
      if (lastPrayerAlertRef.current !== alertKey) {
        lastPrayerAlertRef.current = alertKey;
        const label = prayerLabels[prayerKey] ?? 'Sholat';
        showPrayerTimeNotification({ label, prayer: prayerKey }).catch(e => console.error(e));
        playAdzan(prayerKey);
      }
      const nextTimer = setTimeout(() => updateNextPrayerCountdown(), 1200);
      return () => clearTimeout(nextTimer);
    }
    return undefined;
  }, [countdown, playAdzan, prayers, updateNextPrayerCountdown]);

  const formatCountdown = (secs) => {
    if (secs === null) return '--:--:--';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const syncPrayerReminders = async ({
    enabled = reminderEnabled,
    leadMinutes = reminderLeadMinutes,
    nextAdjustments = adjustments,
    previous = notificationIds,
    selectedPrayers = reminderPrayers,
    silent = false,
  } = {}) => {
    if (!enabled) {
      await cancelPrayerReminders(previous);
      setNotificationIds([]);
      await writePreference(preferenceKeys.prayerReminderIds, []);
      if (!silent) setMessage(t('prayer.reminder.disabled'));
      return;
    }

    if (!notificationsSupported()) {
      if (!silent) setMessage(t('prayer.reminder.mobileOnly'));
      return;
    }

    if (!prayers) {
      if (!silent) setMessage(t('prayer.reminder.scheduleRequired'));
      return;
    }

    const result = await schedulePrayerReminders({
      leadMinutes,
      labels: prayerLabels,
      previous,
      selectedPrayers,
      times: adjustedPrayerTimes(nextAdjustments),
    });

    if (result.status !== 'scheduled') {
      if (!silent) setMessage(t('prayer.reminder.permissionRequired'));
      return;
    }

    setNotificationIds(result.scheduled);
    await writePreference(preferenceKeys.prayerReminderIds, result.scheduled);
    if (!silent) setMessage(t('prayer.reminder.scheduled', { count: result.scheduled.length }));
  };

  const toggleReminder = async () => {
    if (!reminderEnabled && !notificationsSupported()) {
      setMessage(t('prayer.reminder.mobileOnly'));
      return;
    }

    const next = !reminderEnabled;
    setReminderEnabled(next);
    await writePreference(preferenceKeys.prayerReminderEnabled, next);
    await syncPrayerReminders({ enabled: next });
  };

  const selectReminderLead = async (minutes) => {
    setReminderLeadMinutes(minutes);
    await writePreference(preferenceKeys.prayerReminderLeadMinutes, minutes);
    if (reminderEnabled) {
      await syncPrayerReminders({ leadMinutes: minutes, silent: true });
    }
  };

  const toggleAdzanAudio = async () => {
    const next = !adzanAudioEnabled;
    setAdzanAudioEnabled(next);
    await writePreference(preferenceKeys.prayerAdzanAudioEnabled, next);
    setMessage(t(next ? 'prayer.adzan.enabled' : 'prayer.adzan.disabled'));
  };

  const toggleReminderPrayer = async (key) => {
    const exists = reminderPrayers.includes(key);
    const next = exists ? reminderPrayers.filter((item) => item !== key) : [...reminderPrayers, key];
    if (!next.length) return;

    setReminderPrayers(next);
    await writePreference(preferenceKeys.prayerReminderPrayers, next);
    if (reminderEnabled) {
      await syncPrayerReminders({ selectedPrayers: next, silent: true });
    }
  };

  const downloadPrayerPack = async () => {
    if (!coords) {
      setOfflineMessage(t('prayer.offline.locationRequired'));
      showInfo(t('prayer.offline.locationRequired'));
      return;
    }

    setOfflineBusy(true);
    setOfflineProgress(0);
    try {
      const overview = await buildPrayerOfflinePack({
        ...coords,
        days: 30,
        method,
        madhab,
        onProgress: (event) => {
          setOfflineMessage(event.label);
          setOfflineProgress(event.value ?? 0);
        },
      });
      setPrayerOffline(overview);
      setOfflineMessage(t('prayer.offline.saved', { days: overview.days }));
      setOfflineProgress(100);
      showSuccess(t('prayer.offline.saved', { days: overview.days }));
    } catch (error) {
      const nextMessage = error?.message ?? t('prayer.offline.saveError');
      setOfflineMessage(nextMessage);
      showError(nextMessage);
    } finally {
      setOfflineBusy(false);
    }
  };

  const clearPrayerPack = async () => {
    if (!coords) return;

    setOfflineBusy(true);
    try {
      const overview = await clearPrayerOfflinePack({ ...coords, method, madhab });
      setPrayerOffline(overview);
      setOfflineMessage(t('prayer.offline.cleared'));
      setOfflineProgress(0);
      showSuccess(t('prayer.offline.cleared'));
    } catch (error) {
      const nextMessage = error?.message ?? t('prayer.offline.clearError');
      setOfflineMessage(nextMessage);
      showError(nextMessage);
    } finally {
      setOfflineBusy(false);
    }
  };

  const useOfflineToday = async () => {
    if (!coords) return;

    try {
      const offlinePrayers = await getOfflinePrayerForDate({ ...coords, method, madhab, date: today() });
      if (!offlinePrayers) {
        setOfflineMessage(t('prayer.offline.todayMissing'));
        return;
      }
      setPrayers(offlinePrayers);
      setOfflineMessage(t('prayer.offline.todayLoaded'));
    } catch (error) {
      setOfflineMessage(error?.message ?? t('prayer.offline.loadError'));
    }
  };

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!preferencesReady || !reminderEnabled || !prayers || !notificationsSupported()) return;
    syncPrayerReminders({ silent: true });
  }, [adjustments, preferencesReady, prayers, reminderEnabled, reminderLeadMinutes, reminderPrayers]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      readPreference(preferenceKeys.prayerMethod, 'kemenag'),
      readPreference(preferenceKeys.prayerMadhab, 'shafi'),
      readPreference(preferenceKeys.prayerAdjustments, defaultAdjustments),
      readPreference(preferenceKeys.prayerAdzanAudioEnabled, false),
      readPreference(preferenceKeys.prayerReminderEnabled, false),
      readPreference(preferenceKeys.prayerReminderLeadMinutes, 10),
      readPreference(preferenceKeys.prayerReminderPrayers, defaultReminderPrayers),
      readPreference(preferenceKeys.prayerReminderIds, []),
    ]).then(([savedMethod, savedMadhab, savedAdjustments, savedAdzanAudioEnabled, savedReminderEnabled, savedLeadMinutes, savedReminderPrayers, savedNotificationIds]) => {
      if (!mounted) return;
      if (methods.some(([key]) => key === savedMethod)) {
        setMethod(savedMethod);
      }
      if (madhabs.some(([key]) => key === savedMadhab)) {
        setMadhab(savedMadhab);
      }
      setAdjustments({
        ...defaultAdjustments,
        ...(savedAdjustments && typeof savedAdjustments === 'object' ? savedAdjustments : {}),
      });
      setAdzanAudioEnabled(Boolean(savedAdzanAudioEnabled));
      setReminderEnabled(Boolean(savedReminderEnabled));
      if (reminderLeadOptions.includes(savedLeadMinutes)) {
        setReminderLeadMinutes(savedLeadMinutes);
      }
      if (Array.isArray(savedReminderPrayers) && savedReminderPrayers.some((key) => prayerLabels[key])) {
        setReminderPrayers(savedReminderPrayers.filter((key) => prayerLabels[key]));
      }
      if (Array.isArray(savedNotificationIds)) {
        setNotificationIds(savedNotificationIds);
      }
      setPreferencesReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const methodLabel = methods.find(([key]) => key === method)?.[1] ?? method;
  const madhabLabel = madhabs.find(([key]) => key === madhab)?.[1] ?? madhab;
  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTimeLabel = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const locationLabel = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    : 'Lokasi belum aktif';
  const currentPrayerKey = (() => {
    if (!prayers) return null;
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let current = null;
    scheduleRows.forEach(([key]) => {
      if (key === 'imsak' || key === 'sunrise') return;
      const secs = toSeconds(adjustedPrayerTime(key));
      if (secs !== null && secs <= nowSec) current = key;
    });
    return current;
  })();

  const renderManualLocationCard = (webApp = false) => (
    <Card style={webApp ? [styles.webAppCard, webCardStyle] : null}>
      <CardTitle
        meta="Koordinat GPS"
        metaStyle={webApp ? [styles.webAppCardMeta, { color: webTheme.accent }] : null}
        titleStyle={webApp ? [styles.webAppCardTitle, { color: webTheme.text }] : null}
      >
        Lokasi Manual
      </CardTitle>
      <Text style={webApp ? [styles.webAppMutedText, { color: webTheme.muted }] : styles.statsText}>
        Aktifkan GPS atau masukkan koordinat lokasimu untuk memuat jadwal sholat.
      </Text>
      <View style={[styles.manualLocRow, webApp ? styles.webAppManualLocRow : null]}>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setManualLatInput}
          placeholder="-6.2088 (Lintang)"
          placeholderTextColor={webApp ? webTheme.muted : colors.muted}
          returnKeyType="next"
          style={[styles.manualLocInput, webApp ? styles.webAppManualLocInput : null, webApp ? { backgroundColor: webTheme.input, borderColor: webTheme.border, color: webTheme.text } : null]}
          value={manualLatInput}
        />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setManualLngInput}
          placeholder="106.8456 (Bujur)"
          placeholderTextColor={webApp ? webTheme.muted : colors.muted}
          returnKeyType="done"
          style={[styles.manualLocInput, webApp ? styles.webAppManualLocInput : null, webApp ? { backgroundColor: webTheme.input, borderColor: webTheme.border, color: webTheme.text } : null]}
          value={manualLngInput}
        />
      </View>
      <Pressable
        disabled={!manualLatInput || !manualLngInput}
        onPress={applyManualLocation}
        style={[styles.button, webApp ? styles.webAppPrimaryButton : null, webApp ? { backgroundColor: webTheme.accent } : null, !manualLatInput || !manualLngInput ? styles.disabled : null]}
      >
        <Text style={styles.buttonText}>Terapkan Lokasi</Text>
      </Pressable>
    </Card>
  );

  if (view === 'settings') {
    if (isWebAppLayout) {
      return (
        <Screen
          contentStyle={[styles.webAppSurface, webSurfaceStyle]}
          title="Pengaturan Sholat"
          subtitle="Metode, koreksi waktu, pengingat, dan jadwal offline."
          refreshing={loading}
          onRefresh={refreshAll}
          actions={<IconActionButton Icon={ArrowLeft} label="Kembali ke jadwal sholat" onPress={() => setView('main')} />}
        >
          <View style={webSurfaceStyle} testID="prayer-web-app-settings" />
          {message ? <Text style={[styles.webAppMessage, { backgroundColor: webTheme.messageBg, borderColor: webTheme.messageBorder, color: webTheme.messageText }]}>{message}</Text> : null}

          <View style={[styles.webAppSettingsHero, webCardStyle]} testID="prayer-web-app-settings-hero">
            <Text style={[styles.webAppEyebrow, { color: webTheme.accent }]}>JADWAL SHOLAT</Text>
            <Text style={[styles.webAppHeroTitle, { color: webTheme.text }]}>Pengaturan</Text>
            <Text style={[styles.webAppHeroMeta, { color: webTheme.muted }]}>{methodLabel} · {madhabLabel}</Text>
          </View>

          <Card style={[styles.webAppCard, webCardStyle]}>
            <CardTitle
              meta="Metode"
              metaStyle={[styles.webAppCardMeta, { color: webTheme.accent }]}
              titleStyle={[styles.webAppCardTitle, { color: webTheme.text }]}
            >
              Metode Jadwal
            </CardTitle>
            <Text style={[styles.webAppSettingsLabel, { color: webTheme.muted }]}>Metode Perhitungan</Text>
            <View style={styles.methodGrid}>
              {methods.map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => selectMethod(key)}
                  style={[styles.methodButton, styles.webAppChoiceButton, { backgroundColor: webTheme.input, borderColor: webTheme.border }, method === key ? styles.webAppChoiceButtonActive : null]}
                >
                  <Text style={[styles.methodText, styles.webAppChoiceText, { color: webTheme.text }, method === key ? styles.webAppChoiceTextActive : null]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.webAppSettingsLabel, { color: webTheme.muted }]}>Mazhab Ashar</Text>
            <View style={styles.methodGrid}>
              {madhabs.map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => selectMadhab(key)}
                  style={[styles.methodButton, styles.webAppChoiceButton, { backgroundColor: webTheme.input, borderColor: webTheme.border }, madhab === key ? styles.webAppChoiceButtonActive : null]}
                >
                  <Text style={[styles.methodText, styles.webAppChoiceText, { color: webTheme.text }, madhab === key ? styles.webAppChoiceTextActive : null]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={[styles.webAppCard, webCardStyle]}>
            <CardTitle
              meta="Menit"
              metaStyle={[styles.webAppCardMeta, { color: webTheme.accent }]}
              titleStyle={[styles.webAppCardTitle, { color: webTheme.text }]}
            >
              Koreksi Manual
            </CardTitle>
            <Text style={[styles.webAppMutedText, { color: webTheme.muted }]}>Sesuaikan jadwal jika masjid setempat memakai koreksi waktu tertentu.</Text>
            {scheduleRows.map(([key, label]) => (
              <View key={key} style={[styles.webAppCorrectionRow, { borderBottomColor: webTheme.line }]}>
                <Text style={[styles.webAppPrayerLabel, { color: webTheme.text }]}>{label}</Text>
                <View style={styles.correctionButtons}>
                  <Pressable onPress={() => adjustPrayer(key, -1)} style={[styles.correctionButton, styles.webAppCorrectionButton, { backgroundColor: webTheme.input, borderColor: webTheme.border }]}>
                    <Text style={[styles.webAppCorrectionText, { color: webTheme.text }]}>-1</Text>
                  </Pressable>
                  <Text style={[styles.webAppCorrectionValue, { color: webTheme.accent }]}>
                    {(adjustments[key] ?? 0) > 0 ? '+' : ''}
                    {adjustments[key] ?? 0}
                  </Text>
                  <Pressable onPress={() => adjustPrayer(key, 1)} style={[styles.correctionButton, styles.webAppCorrectionButton, { backgroundColor: webTheme.input, borderColor: webTheme.border }]}>
                    <Text style={[styles.webAppCorrectionText, { color: webTheme.text }]}>+1</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable onPress={resetAdjustments} style={[styles.webAppSecondaryButton, { borderColor: webTheme.border }]}>
              <Text style={[styles.webAppSecondaryButtonText, { color: webTheme.text }]}>Reset koreksi</Text>
            </Pressable>
          </Card>

          <Card style={[styles.webAppCard, webCardStyle]}>
            <CardTitle
              meta={notificationsSupported() ? `${notificationIds.length} aktif` : 'Aplikasi mobile'}
              metaStyle={[styles.webAppCardMeta, { color: webTheme.accent }]}
              titleStyle={[styles.webAppCardTitle, { color: webTheme.text }]}
            >
              Pengingat Adzan
            </CardTitle>
            <View style={styles.webAppReminderRow}>
              <View style={styles.webAppReminderCopy}>
                <Text style={styles.webAppPrayerLabel}>Notifikasi Lokal</Text>
                <Text style={styles.webAppMutedText}>{reminderEnabled ? 'Aktif' : 'Nonaktif'}</Text>
              </View>
              <Pressable
                onPress={toggleReminder}
                style={[styles.toggleButton, styles.webAppToggleButton, reminderEnabled ? styles.webAppToggleButtonActive : null]}
              >
                <Text style={[styles.toggleText, styles.webAppToggleText, reminderEnabled ? styles.webAppToggleTextActive : null]}>
                  {reminderEnabled ? 'Aktif' : 'Mati'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.webAppReminderRow}>
              <View style={styles.webAppReminderCopy}>
                <Text style={styles.webAppPrayerLabel}>Audio Adzan</Text>
                <Text style={styles.webAppMutedText}>
                  {adzanAudioEnabled ? 'Diputar saat waktu masuk dan aplikasi terbuka' : 'Nonaktif'}
                </Text>
              </View>
              <Pressable
                onPress={toggleAdzanAudio}
                style={[styles.toggleButton, styles.webAppToggleButton, adzanAudioEnabled ? styles.webAppToggleButtonActive : null]}
              >
                <Text style={[styles.toggleText, styles.webAppToggleText, adzanAudioEnabled ? styles.webAppToggleTextActive : null]}>
                  {adzanAudioEnabled ? 'Aktif' : 'Mati'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.webAppSettingsLabel}>Jeda Pengingat</Text>
            <View style={styles.methodGrid}>
              {reminderLeadOptions.map((minutes) => (
                <Pressable
                  key={minutes}
                  onPress={() => selectReminderLead(minutes)}
                  style={[styles.methodButton, styles.webAppChoiceButton, reminderLeadMinutes === minutes ? styles.webAppChoiceButtonActive : null]}
                >
                  <Text style={[styles.methodText, styles.webAppChoiceText, reminderLeadMinutes === minutes ? styles.webAppChoiceTextActive : null]}>
                    {minutes ? `${minutes} menit` : 'Saat waktu masuk'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.webAppSettingsLabel}>Waktu Sholat</Text>
            <View style={styles.methodGrid}>
              {defaultReminderPrayers.map((key) => {
                const selected = reminderPrayers.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleReminderPrayer(key)}
                    style={[styles.methodButton, styles.webAppChoiceButton, selected ? styles.webAppChoiceButtonActive : null]}
                  >
                    <Text style={[styles.methodText, styles.webAppChoiceText, selected ? styles.webAppChoiceTextActive : null]}>{prayerLabels[key]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={() => syncPrayerReminders()} style={styles.webAppSecondaryButton}>
              <Text style={styles.webAppSecondaryButtonText}>Atur ulang pengingat</Text>
            </Pressable>
          </Card>

          <Card style={styles.webAppCard}>
            <CardTitle
              meta={prayerOffline?.supported === false ? 'Aplikasi mobile' : `${prayerOffline?.days ?? 0} hari`}
              metaStyle={styles.webAppCardMeta}
              titleStyle={styles.webAppCardTitle}
            >
              Jadwal Offline 30 Hari
            </CardTitle>
            <Text style={styles.webAppMutedText}>
              Simpan jadwal 30 hari untuk lokasi, metode hitung, dan mazhab Ashar saat ini.
            </Text>
            <View style={styles.webAppProgressTrack}>
              <View style={[styles.webAppProgressFill, { width: `${Math.min(offlineProgress, 100)}%` }]} />
            </View>
            <Text style={styles.webAppMutedText}>{offlineMessage}</Text>
            <View style={styles.offlineActions}>
              <Pressable
                disabled={offlineBusy || prayerOffline?.supported === false}
                onPress={downloadPrayerPack}
                style={[styles.offlineButton, styles.webAppOfflinePrimaryButton, offlineBusy || prayerOffline?.supported === false ? styles.disabled : null]}
              >
                {offlineBusy ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.offlinePrimaryText}>Simpan 30 hari</Text>}
              </Pressable>
              <Pressable
                disabled={offlineBusy || prayerOffline?.supported === false}
                onPress={useOfflineToday}
                style={[styles.offlineButton, styles.webAppOfflineButton, offlineBusy || prayerOffline?.supported === false ? styles.disabled : null]}
              >
                <Text style={styles.webAppSecondaryButtonText}>Pakai hari ini</Text>
              </Pressable>
              <Pressable
                disabled={offlineBusy || prayerOffline?.supported === false}
                onPress={clearPrayerPack}
                style={[styles.offlineButton, styles.webAppOfflineButton, offlineBusy || prayerOffline?.supported === false ? styles.disabled : null]}
              >
                <Text style={styles.webAppSecondaryButtonText}>Hapus</Text>
              </Pressable>
            </View>
          </Card>
        </Screen>
      );
    }

    return (
      <Screen
        contentStyle={isWebAppLayout ? styles.webAppSurface : null}
        title="Pengaturan Sholat"
        subtitle="Atur metode jadwal, koreksi waktu, pengingat, dan jadwal offline."
        refreshing={loading}
        onRefresh={refreshAll}
        actions={<IconActionButton Icon={ArrowLeft} label="Kembali ke jadwal sholat" onPress={() => setView('main')} />}
      >
        <View testID={isWebAppLayout ? 'prayer-web-app-settings' : 'prayer-classic-settings'} />
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Card>
          <CardTitle meta="Metode">Metode Jadwal</CardTitle>
          <Text style={styles.settingsLabel}>Metode Perhitungan</Text>
          <View style={styles.methodGrid}>
            {methods.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => selectMethod(key)}
                style={[styles.methodButton, method === key ? styles.methodButtonActive : null]}
              >
                <Text style={[styles.methodText, method === key ? styles.methodTextActive : null]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.settingsLabel}>Mazhab Ashar</Text>
          <View style={styles.methodGrid}>
            {madhabs.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => selectMadhab(key)}
                style={[styles.methodButton, madhab === key ? styles.methodButtonActive : null]}
              >
                <Text style={[styles.methodText, madhab === key ? styles.methodTextActive : null]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <CardTitle meta="Menit">Koreksi Manual</CardTitle>
          <Text style={styles.statsText}>Sesuaikan jadwal jika masjid setempat memakai koreksi waktu tertentu.</Text>
          {scheduleRows.map(([key, label]) => (
            <View key={key} style={styles.correctionRow}>
              <Text style={styles.prayerLabel}>{label}</Text>
              <View style={styles.correctionButtons}>
                <Pressable onPress={() => adjustPrayer(key, -1)} style={styles.correctionButton}>
                  <Text style={styles.correctionText}>-1</Text>
                </Pressable>
                <Text style={styles.correctionValue}>
                  {(adjustments[key] ?? 0) > 0 ? '+' : ''}
                  {adjustments[key] ?? 0}
                </Text>
                <Pressable onPress={() => adjustPrayer(key, 1)} style={styles.correctionButton}>
                  <Text style={styles.correctionText}>+1</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable onPress={resetAdjustments} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reset koreksi</Text>
          </Pressable>
        </Card>

        <Card>
          <CardTitle meta={notificationsSupported() ? `${notificationIds.length} aktif` : 'Aplikasi mobile'}>
            Pengingat Adzan
          </CardTitle>
          <View style={styles.reminderHeader}>
            <View>
              <Text style={styles.prayerLabel}>Notifikasi Lokal</Text>
              <Text style={styles.originalTime}>{reminderEnabled ? 'Aktif' : 'Nonaktif'}</Text>
            </View>
            <Pressable
              onPress={toggleReminder}
              style={[styles.toggleButton, reminderEnabled ? styles.toggleButtonActive : null]}
            >
              <Text style={[styles.toggleText, reminderEnabled ? styles.methodTextActive : null]}>
                {reminderEnabled ? 'Aktif' : 'Mati'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.reminderHeader}>
            <View>
              <Text style={styles.prayerLabel}>Audio Adzan</Text>
              <Text style={styles.originalTime}>
                {adzanAudioEnabled ? 'Diputar saat waktu masuk dan aplikasi terbuka' : 'Nonaktif'}
              </Text>
            </View>
            <Pressable
              onPress={toggleAdzanAudio}
              style={[styles.toggleButton, adzanAudioEnabled ? styles.toggleButtonActive : null]}
            >
              <Text style={[styles.toggleText, adzanAudioEnabled ? styles.methodTextActive : null]}>
                {adzanAudioEnabled ? 'Aktif' : 'Mati'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.settingsLabel}>Jeda Pengingat</Text>
          <View style={styles.methodGrid}>
            {reminderLeadOptions.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => selectReminderLead(minutes)}
                style={[styles.methodButton, reminderLeadMinutes === minutes ? styles.methodButtonActive : null]}
              >
                <Text style={[styles.methodText, reminderLeadMinutes === minutes ? styles.methodTextActive : null]}>
                  {minutes ? `${minutes} menit` : 'Saat waktu masuk'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.settingsLabel}>Waktu Sholat</Text>
          <View style={styles.methodGrid}>
            {defaultReminderPrayers.map((key) => {
              const selected = reminderPrayers.includes(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => toggleReminderPrayer(key)}
                  style={[styles.methodButton, selected ? styles.methodButtonActive : null]}
                >
                  <Text style={[styles.methodText, selected ? styles.methodTextActive : null]}>{prayerLabels[key]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => syncPrayerReminders()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Atur ulang pengingat</Text>
          </Pressable>
        </Card>

        <Card>
          <CardTitle meta={prayerOffline?.supported === false ? 'Aplikasi mobile' : `${prayerOffline?.days ?? 0} hari`}>
            Jadwal Offline 30 Hari
          </CardTitle>
          <Text style={styles.statsText}>
            Simpan jadwal 30 hari untuk lokasi, metode hitung, dan mazhab Ashar saat ini.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(offlineProgress, 100)}%` }]} />
          </View>
          <Text style={styles.originalTime}>{offlineMessage}</Text>
          <View style={styles.offlineActions}>
            <Pressable
              disabled={offlineBusy || prayerOffline?.supported === false}
              onPress={downloadPrayerPack}
              style={[styles.offlineButton, styles.offlinePrimaryButton, offlineBusy || prayerOffline?.supported === false ? styles.disabled : null]}
            >
              {offlineBusy ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.offlinePrimaryText}>Simpan 30 hari</Text>}
            </Pressable>
            <Pressable
              disabled={offlineBusy || prayerOffline?.supported === false}
              onPress={useOfflineToday}
              style={[styles.offlineButton, offlineBusy || prayerOffline?.supported === false ? styles.disabled : null]}
            >
              <Text style={styles.secondaryButtonText}>Pakai hari ini</Text>
            </Pressable>
            <Pressable
              disabled={offlineBusy || prayerOffline?.supported === false}
              onPress={clearPrayerPack}
              style={[styles.offlineButton, offlineBusy || prayerOffline?.supported === false ? styles.disabled : null]}
            >
              <Text style={styles.secondaryButtonText}>Hapus</Text>
            </Pressable>
          </View>
        </Card>
      </Screen>
    );
  }

  if (isWebAppLayout) {
    return (
      <Screen
        contentStyle={[styles.webAppSurface, webSurfaceStyle]}
        title="Jadwal Sholat"
        subtitle="Waktu sholat, hitung mundur, lokasi, dan pengingat."
        refreshing={loading}
        onRefresh={refreshAll}
        actions={
          <>
            <IconActionButton Icon={RefreshCw} label="Muat ulang jadwal" onPress={refreshAll} disabled={loading} />
            <IconActionButton Icon={Settings} label="Buka pengaturan sholat" onPress={() => setView('settings')} />
          </>
        }
      >
        <View style={webSurfaceStyle} testID="prayer-web-app-main" />
        {message ? <Text style={[styles.webAppMessage, { backgroundColor: webTheme.messageBg, borderColor: webTheme.messageBorder, color: webTheme.messageText }]}>{message}</Text> : null}

        <View style={styles.webAppHero}>
          <View style={[styles.webAppHeroIcon, { backgroundColor: webTheme.accentSoft }]}>
            <Text style={[styles.webAppHeroIconText, { color: webTheme.accent }]}>وقت</Text>
          </View>
          <Text style={[styles.webAppHeroTitle, { color: webTheme.text }]}>Jadwal Sholat</Text>
          <Text style={[styles.webAppHeroDate, { color: webTheme.muted }]}>{todayLabel}</Text>
          <Text style={[styles.webAppHeroMeta, { color: webTheme.muted }]}>{locationLabel} · {methodLabel}</Text>
        </View>

        {!coords && !loading ? renderManualLocationCard(true) : null}

        <View style={styles.webAppClockPanel}>
          <Text style={[styles.webAppClockTime, { color: webTheme.title }]}>{currentTimeLabel}</Text>
          {prayers && countdown !== null ? (
            <View style={styles.webAppCountdownRow}>
              <Text style={[styles.webAppCountdownLabel, { color: webTheme.muted }]}>
                {countdown === 0
                  ? `Waktu ${scheduleRows.find(([key]) => key === nextPrayerKey)?.[1] ?? 'Sholat'} telah tiba`
                  : `Menuju ${scheduleRows.find(([key]) => key === nextPrayerKey)?.[1] ?? 'sholat'}`}
              </Text>
              <Text style={[styles.webAppCountdownTime, { color: webTheme.accent }]}>
                {countdown === 0 ? 'Waktunya sholat' : formatCountdown(countdown)}
              </Text>
              {adzanPlaying ? (
                <Pressable onPress={stopAdzan} style={styles.webAppAdzanStopBtn}>
                  <Square size={18} color="#fff" />
                  <Text style={styles.webAppAdzanStopText}>Stop</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.webAppMutedText, { color: webTheme.muted }]}>Jadwal dimuat sesuai lokasi dan metode yang dipilih.</Text>
          )}
        </View>

        <View style={[styles.webAppScheduleCard, webCardStyle]} testID="prayer-web-app-schedule-card">
          <View style={[styles.webAppScheduleHeader, { borderBottomColor: webTheme.line }]}>
            <Text style={[styles.webAppScheduleTitle, { color: webTheme.text }]}>Hari ini</Text>
            <Text style={[styles.webAppScheduleMeta, { color: webTheme.muted }]}>{methodLabel} · {madhabLabel}</Text>
          </View>
          {loading && !prayers ? (
            <ActivityIndicator color={webTheme.accent} />
          ) : (
            scheduleRows.map(([key, label], index) => {
              const adjustment = adjustments[key] ?? 0;
              const isNext = key === nextPrayerKey && key !== 'imsak' && key !== 'sunrise';
              const isCurrent = key === currentPrayerKey && !nextPrayerKey;
              const isInfo = key === 'imsak' || key === 'sunrise';
              return (
                <View
                  key={key}
                  style={[
                    styles.webAppPrayerRow,
                    { borderBottomColor: webTheme.line },
                    index === scheduleRows.length - 1 ? styles.webAppPrayerRowLast : null,
                    isNext || isCurrent ? styles.webAppPrayerRowActive : null,
                    isInfo ? styles.webAppPrayerRowInfo : null,
                  ]}
                >
                  <View style={styles.webAppPrayerCopy}>
                    <View style={styles.webAppPrayerLabelRow}>
                      {isNext ? (
                        <Text style={styles.webAppNextBadge}>BERIKUTNYA</Text>
                      ) : null}
                      <Text style={[styles.webAppPrayerLabel, { color: webTheme.text }, isNext || isCurrent ? styles.webAppPrayerLabelActive : null]}>
                        {label}
                      </Text>
                    </View>
                    <Text style={[styles.webAppPrayerArabic, { color: webTheme.muted }, isNext || isCurrent ? styles.webAppPrayerArabicActive : null]}>
                      {prayerArabicLabels[key]}
                    </Text>
                    {adjustment ? <Text style={[styles.webAppPrayerBase, { color: webTheme.muted }]}>Dasar {prayers?.[key] ?? '--:--'}</Text> : null}
                  </View>
                  <View style={styles.webAppPrayerTimeBlock}>
                    <Text style={[styles.webAppPrayerTime, { color: webTheme.accent }, isNext || isCurrent ? styles.webAppPrayerTimeActive : null]}>
                      {adjustedPrayerTime(key)}
                    </Text>
                    {adjustment ? (
                      <Text style={[styles.webAppPrayerAdjustment, { color: webTheme.muted }, isNext || isCurrent ? styles.webAppPrayerAdjustmentActive : null]}>
                        {adjustment > 0 ? '+' : ''}
                        {adjustment} min
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text style={[styles.webAppSourceNote, { color: webTheme.muted }]}>
          Metode: {methodLabel} · Madhab: {madhabLabel}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={isWebAppLayout ? styles.webAppSurface : null}
      title="Jadwal Sholat"
      subtitle="Lihat jadwal sholat hari ini sesuai lokasi dan metode."
      refreshing={loading}
      onRefresh={refreshAll}
      actions={
        <>
          <IconActionButton Icon={RefreshCw} label="Muat ulang jadwal" onPress={refreshAll} disabled={loading} />
          <IconActionButton Icon={Settings} label="Buka pengaturan sholat" onPress={() => setView('settings')} />
        </>
      }
    >
      <View testID={isWebAppLayout ? 'prayer-web-app-main' : 'prayer-classic-main'} />
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {!coords && !loading ? renderManualLocationCard(false) : null}

      {prayers && countdown !== null ? (
        <Card>
          <View style={styles.countdownRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.countdownLabel}>
                {countdown === 0
                  ? `Waktu ${scheduleRows.find(([k]) => k === nextPrayerKey)?.[1] ?? 'Sholat'} telah tiba`
                  : `Menuju ${scheduleRows.find(([k]) => k === nextPrayerKey)?.[1] ?? 'sholat'}`
                }
              </Text>
              <Text style={styles.countdownTime}>
                {countdown === 0 ? '✧ Waktunya sholat! ✧' : formatCountdown(countdown)}
              </Text>
            </View>
            {adzanPlaying ? (
              <Pressable onPress={stopAdzan} style={styles.adzanStopBtn}>
                <Square size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12 }}>Stop</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      ) : null}

      <Card>
        <CardTitle
          meta={`${methods.find(([key]) => key === method)?.[1] ?? method} · ${madhabs.find(([key]) => key === madhab)?.[1] ?? madhab}`}
        >
          {`Hari ini · ${today()}`}
        </CardTitle>
        {loading && !prayers ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          scheduleRows.map(([key, label]) => {
            const adjustment = adjustments[key] ?? 0;
            return (
              <View key={key} style={styles.prayerRow}>
                <View>
                  <Text style={styles.prayerLabel}>{label}</Text>
                  {adjustment ? <Text style={styles.originalTime}>Dasar {prayers?.[key] ?? '--:--'}</Text> : null}
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.prayerTime}>{adjustedPrayerTime(key)}</Text>
                  {adjustment ? (
                    <Text style={styles.adjustmentText}>
                      {adjustment > 0 ? '+' : ''}
                      {adjustment} min
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  webAppSurface: {
    backgroundColor: WEB_APP_PRAYER_BG,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  webAppMessage: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderRadius: 16,
    borderWidth: 1,
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  webAppHero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  webAppSettingsHero: {
    backgroundColor: WEB_APP_PRAYER_SURFACE,
    borderColor: WEB_APP_PRAYER_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  webAppHeroIcon: {
    alignItems: 'center',
    backgroundColor: WEB_APP_PRAYER_ACCENT_SOFT,
    borderRadius: 18,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 64,
  },
  webAppHeroIconText: {
    color: WEB_APP_PRAYER_ACCENT,
    fontSize: 20,
    fontWeight: '900',
  },
  webAppEyebrow: {
    color: WEB_APP_PRAYER_ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  webAppHeroTitle: {
    color: WEB_APP_PRAYER_TEXT,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  webAppHeroDate: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  webAppHeroMeta: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  webAppCard: {
    backgroundColor: WEB_APP_PRAYER_SURFACE,
    borderColor: WEB_APP_PRAYER_BORDER,
    borderRadius: 18,
    shadowOpacity: 0,
  },
  webAppCardTitle: {
    color: WEB_APP_PRAYER_TEXT,
    fontFamily: undefined,
  },
  webAppCardMeta: {
    color: WEB_APP_PRAYER_ACCENT,
  },
  webAppMutedText: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  webAppClockPanel: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
  },
  webAppClockTime: {
    color: '#065f46',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppCountdownRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  webAppCountdownLabel: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  webAppCountdownTime: {
    color: WEB_APP_PRAYER_ACCENT,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppAdzanStopBtn: {
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  webAppAdzanStopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  webAppScheduleCard: {
    backgroundColor: WEB_APP_PRAYER_SURFACE,
    borderColor: '#eef2f7',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  webAppScheduleHeader: {
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    padding: spacing.md,
  },
  webAppScheduleTitle: {
    color: WEB_APP_PRAYER_TEXT,
    fontSize: 16,
    fontWeight: '900',
  },
  webAppScheduleMeta: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  webAppPrayerRow: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  webAppPrayerRowLast: {
    borderBottomWidth: 0,
  },
  webAppPrayerRowActive: {
    backgroundColor: WEB_APP_PRAYER_ACCENT,
    borderBottomColor: WEB_APP_PRAYER_ACCENT,
  },
  webAppPrayerRowInfo: {
    opacity: 0.68,
  },
  webAppPrayerCopy: {
    flex: 1,
    minWidth: 0,
  },
  webAppPrayerLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  webAppNextBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  webAppPrayerLabel: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '900',
  },
  webAppPrayerLabelActive: {
    color: '#ffffff',
  },
  webAppPrayerArabic: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  webAppPrayerArabicActive: {
    color: '#d1fae5',
  },
  webAppPrayerBase: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  webAppPrayerTimeBlock: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  webAppPrayerTime: {
    color: WEB_APP_PRAYER_ACCENT,
    fontSize: 21,
    fontWeight: '900',
  },
  webAppPrayerTimeActive: {
    color: '#ffffff',
  },
  webAppPrayerAdjustment: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 11,
    fontWeight: '800',
  },
  webAppPrayerAdjustmentActive: {
    color: '#d1fae5',
  },
  webAppSourceNote: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  webAppManualLocRow: {
    flexDirection: 'column',
  },
  webAppManualLocInput: {
    backgroundColor: '#f8fafc',
    borderColor: WEB_APP_PRAYER_BORDER,
    color: WEB_APP_PRAYER_TEXT,
    flex: 0,
    width: '100%',
  },
  webAppPrimaryButton: {
    backgroundColor: WEB_APP_PRAYER_ACCENT,
  },
  webAppSettingsLabel: {
    color: WEB_APP_PRAYER_MUTED,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  webAppChoiceButton: {
    backgroundColor: '#f8fafc',
    borderColor: WEB_APP_PRAYER_BORDER,
  },
  webAppChoiceButtonActive: {
    backgroundColor: WEB_APP_PRAYER_ACCENT,
    borderColor: WEB_APP_PRAYER_ACCENT,
  },
  webAppChoiceText: {
    color: WEB_APP_PRAYER_TEXT,
  },
  webAppChoiceTextActive: {
    color: '#ffffff',
  },
  webAppCorrectionRow: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  webAppCorrectionButton: {
    borderColor: WEB_APP_PRAYER_BORDER,
    backgroundColor: '#f8fafc',
  },
  webAppCorrectionText: {
    color: WEB_APP_PRAYER_TEXT,
    fontSize: 11,
    fontWeight: '900',
  },
  webAppCorrectionValue: {
    color: WEB_APP_PRAYER_ACCENT,
    fontSize: 13,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  webAppSecondaryButton: {
    alignItems: 'center',
    borderColor: WEB_APP_PRAYER_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
  },
  webAppSecondaryButtonText: {
    color: WEB_APP_PRAYER_TEXT,
    fontSize: 13,
    fontWeight: '900',
  },
  webAppReminderRow: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  webAppReminderCopy: {
    flex: 1,
    minWidth: 0,
  },
  webAppToggleButton: {
    borderColor: WEB_APP_PRAYER_BORDER,
    backgroundColor: '#f8fafc',
  },
  webAppToggleButtonActive: {
    backgroundColor: WEB_APP_PRAYER_ACCENT,
    borderColor: WEB_APP_PRAYER_ACCENT,
  },
  webAppToggleText: {
    color: WEB_APP_PRAYER_TEXT,
  },
  webAppToggleTextActive: {
    color: '#ffffff',
  },
  webAppProgressTrack: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  webAppProgressFill: {
    backgroundColor: WEB_APP_PRAYER_ACCENT,
    height: '100%',
  },
  webAppOfflineButton: {
    borderColor: WEB_APP_PRAYER_BORDER,
    backgroundColor: '#f8fafc',
  },
  webAppOfflinePrimaryButton: {
    backgroundColor: WEB_APP_PRAYER_ACCENT,
    borderColor: WEB_APP_PRAYER_ACCENT,
  },
  message: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  prayerRow: {
    alignItems: 'center',
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  prayerLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  prayerTime: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  timeBlock: {
    alignItems: 'flex-end',
  },
  originalTime: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  adjustmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  statsText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  settingsLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  methodButton: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexBasis: '48%',
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  advancedToggle: {
    marginBottom: spacing.sm,
  },
  methodTextActive: {
    color: '#ffffff',
  },
  correctionRow: {
    alignItems: 'center',
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  correctionButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  correctionButton: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 44,
  },
  correctionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  correctionValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
  offlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  offlineButton: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  offlinePrimaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  offlinePrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: colors.faint,
    borderRadius: radius.sm,
    height: 7,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.primary,
    height: '100%',
  },
  reminderHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleButton: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 70,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  manualLocRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  manualLocInput: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  countdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  countdownLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  countdownTime: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  adzanStopBtn: {
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
