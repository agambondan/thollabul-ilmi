import {
  Bell,
  Book,
  Bookmark,
  BookOpen,
  BookOpenCheck,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Globe,
  Grid,
  HelpCircle,
  ListChecks,
  MessageCircle,
  Moon,
  Scale,
  Search,
  Smile,
  Star,
  Sun,
  Sunset,
  Users,
  Video,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDailyAyah, getDailyHadith, getHijriToday, getPrayerTimes } from '../api/client';
import { ContentCard } from '../components/ContentCard';
import { DetailHeader } from '../components/DetailHeader';
import { useSession } from '../context/SessionContext';
import { useTabActivity } from '../context/TabActivityContext';
import { GlobalSearchScreen } from './GlobalSearchScreen';
import { featureGroups } from '../data/mobileFeatures';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { arabicTypography } from '../styles/arabicTypography';
import { readPinnedFeatures, readRecentFeatures } from '../storage/recentFeatures';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors, radius, shadows, spacing } from '../theme';

const prayerKeyLabels = {
  asr: 'Ashar',
  dhuhr: 'Dzuhur',
  fajr: 'Subuh',
  isha: 'Isya',
  maghrib: 'Maghrib',
};

const prayerScheduleItems = [
  { Icon: Moon, key: 'fajr', label: 'Subuh' },
  { Icon: Sun, key: 'sunrise', label: 'Terbit' },
  { Icon: Sun, key: 'dhuhr', label: 'Dzuhur' },
  { Icon: Sunset, key: 'asr', label: 'Ashar' },
  { Icon: Sunset, key: 'maghrib', label: 'Maghrib' },
  { Icon: Moon, key: 'isha', label: 'Isya' },
];

const homeDateFormatOptions = {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  year: 'numeric',
};

const formatGregorianHomeDate = (date) => {
  try {
    return new Intl.DateTimeFormat('id-ID', homeDateFormatOptions).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

const formatFallbackHijriHomeDate = (date) => {
  const locales = ['id-ID-u-ca-islamic-umalqura', 'id-ID-u-ca-islamic'];
  for (const locale of locales) {
    try {
      const formatter = new Intl.DateTimeFormat(locale, homeDateFormatOptions);
      if (formatter.resolvedOptions().calendar !== 'gregory') {
        return formatter.format(date);
      }
    } catch {
      // Some React Native runtimes do not ship non-Gregorian Intl calendars.
    }
  }
  return 'Tanggal Hijriah belum tersedia';
};

const formatHijriHomeDate = (hijri, fallbackDate) => {
  if (hijri?.dateStr) return hijri.dateStr;
  const parts = [
    hijri?.day,
    hijri?.monthName,
    hijri?.year ? `${hijri.year} H` : hijri?.yearStr,
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : formatFallbackHijriHomeDate(fallbackDate);
};

const menuItems = [
  { Icon: Compass, key: 'ibadah', label: 'Kiblat', params: { view: 'qibla' } },
  { Icon: BookOpenCheck, key: 'quran', label: 'Hafalan' },
  { Icon: Smile, featureKey: 'muhasabah', key: 'belajar', label: 'Jurnal' },
  { Icon: HelpCircle, featureKey: 'quiz', key: 'belajar', label: 'Kuis' },
  { Icon: Video, featureKey: 'kajian', key: 'belajar', label: 'Kajian' },
  { Icon: FileText, featureKey: 'tafsir', key: 'belajar', label: 'Tafsir' },
  { Icon: Book, key: 'hadith', label: 'Hadis' },
  { Icon: Grid, internalView: 'feature-directory', key: 'belajar', label: 'Lainnya' },
];
const featureDirectoryReturnTo = { tab: 'home', view: 'feature-directory' };

const scheduleOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const featureDirectoryIcons = {
  amalan: ListChecks,
  'asbabun-nuzul': BookOpen,
  'asmaul-husna': Star,
  blog: BookOpen,
  bookmarks: Bookmark,
  'community-feed': MessageCircle,
  doa: BookOpen,
  dzikir: ListChecks,
  faraidh: Users,
  fiqh: BookOpen,
  goals: Star,
  hafalan: BookOpenCheck,
  hijri: Star,
  imsakiyah: Clock3,
  'jarh-tadil': Scale,
  kajian: Video,
  kamus: Search,
  leaderboard: Users,
  manasik: BookOpen,
  muhasabah: Smile,
  murojaah: BookOpenCheck,
  notes: FileText,
  notifications: Bell,
  'panduan-sholat': BookOpen,
  perawi: Users,
  quiz: HelpCircle,
  sejarah: Globe,
  siroh: Users,
  stats: Globe,
  tafsir: FileText,
  tahlil: Book,
  tilawah: BookOpen,
  'sholat-tracker': Compass,
  tasbih: ListChecks,
  'user-wird': ListChecks,
  wirid: ListChecks,
  zakat: Scale,
};

const toSeconds = (timeValue) => {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(`${timeValue ?? ''}`);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
};

const formatCountdown = (secondsDelta) => {
  const hours = `${Math.floor(secondsDelta / 3600)}`.padStart(2, '0');
  const minutes = `${Math.floor((secondsDelta % 3600) / 60)}`.padStart(2, '0');
  const seconds = `${secondsDelta % 60}`.padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const formatPrayerSummary = (nextPrayer, hasPrayerSchedule) => {
  if (!hasPrayerSchedule) return 'Jadwal adzan belum aktif untuk lokasimu.';

  const label = prayerKeyLabels[nextPrayer.key] || 'Sholat';
  const [hoursText, minutesText] = `${nextPrayer.countdown ?? ''}`.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return `Menuju ${label}`;
  }

  if (hours > 0) {
    return `${label} dalam ${hours} jam ${minutes} menit`;
  }

  return `${label} dalam ${minutes} menit`;
};

const hasUsablePrayerTimes = (prayers) =>
  prayerScheduleItems.some(({ key }) => toSeconds(prayers?.[key]) !== null);

const formatHadisSource = (value = '') => {
  if (!value) return '';
  return value.replace(/\bHadith\b/g, 'Hadis');
};

const waitingLocationLabel = 'MENUNGGU LOKASI';
const locationErrorLabels = new Set(['LOKASI NONAKTIF', 'LOKASI BELUM TERSEDIA', waitingLocationLabel]);
const currentLocationTimeoutMs = 3000;
const locationRetryDelays = [1000, 2500, 5000, 10000, 15000];
const prayerRetryDelays = [2500, 5000, 10000, 15000];
const homePrayerMethod = 'kemenag';
const homePrayerMadhab = 'shafi';
const emptyPrayerState = { countdown: '--:--:--', key: 'asr', time: '--:--' };

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location lookup timed out')), timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const coordsFromPosition = (position) => {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { lat: latitude, lng: longitude };
};

const formatLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeStoredLocation = (value) => {
  const latitude = Number(value?.lat);
  const longitude = Number(value?.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    lat: latitude,
    lng: longitude,
    label: typeof value?.label === 'string' && value.label.trim() ? value.label : 'LOKASI AKTIF',
    updatedAt: Number(value?.updatedAt) || 0,
  };
};

const areCoordsClose = (first, second) =>
  Boolean(first && second && Math.abs(first.lat - second.lat) < 0.001 && Math.abs(first.lng - second.lng) < 0.001);

const normalizePrayerCache = (value, dateKey) => {
  const latitude = Number(value?.coords?.lat);
  const longitude = Number(value?.coords?.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (value?.date !== dateKey) return null;
  if (value?.method !== homePrayerMethod || value?.madhab !== homePrayerMadhab) return null;
  if (!hasUsablePrayerTimes(value?.prayers)) return null;
  return {
    coords: { lat: latitude, lng: longitude },
    prayers: value.prayers,
    updatedAt: Number(value?.updatedAt) || 0,
  };
};

const toExpoLocationCoords = (coords) => {
  const latitude = Number(coords?.lat);
  const longitude = Number(coords?.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

const getHomeLocationLabel = async (coords) => {
  const expoCoords = toExpoLocationCoords(coords);
  if (!expoCoords) return 'LOKASI AKTIF';

  try {
    const places = await Location.reverseGeocodeAsync(expoCoords);
    const place = places?.[0];
    const city = place?.city || place?.subregion || place?.district || place?.region;
    return (city || 'Lokasi aktif').toUpperCase();
  } catch {
    return 'LOKASI AKTIF';
  }
};

const saveHomeLocation = async (coords, label) => {
  try {
    await writePreference(preferenceKeys.homeLastLocation, {
      ...coords,
      label,
      updatedAt: Date.now(),
    });
  } catch {
    // Location cache should never block the home screen.
  }
};

const saveHomePrayerTimes = async (coords, prayers, dateKey) => {
  try {
    await writePreference(preferenceKeys.homePrayerTimes, {
      coords,
      date: dateKey,
      madhab: homePrayerMadhab,
      method: homePrayerMethod,
      prayers,
      updatedAt: Date.now(),
    });
  } catch {
    // Prayer cache is only a speed-up path.
  }
};

const resolvePrayerState = (prayers, now = new Date()) => {
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const decorated = scheduleOrder
    .map((key) => ({
      key,
      label: prayerKeyLabels[key],
      seconds: toSeconds(prayers?.[key]),
      time: prayers?.[key] ?? '--:--',
    }))
    .filter((item) => item.seconds !== null);

  if (!decorated.length) {
    return { countdown: '--:--:--', key: 'asr', time: '--:--' };
  }

  let target = decorated.find((item) => item.seconds > currentSeconds);
  let delta = 0;

  if (target) {
    delta = target.seconds - currentSeconds;
  } else {
    target = decorated[0];
    delta = 86400 - currentSeconds + target.seconds;
  }

  return {
    countdown: formatCountdown(delta),
    key: target.key,
    time: target.time,
  };
};

export function HomeScreen({ isActive, navigation, onOpenTab }) {
  const { user } = useSession();
  const { notifyTabActivity } = useTabActivity();
  const { isWebAppLayout } = useLayoutModePreference();
  const mountedRef = useRef(true);
  const prayerRetryTimerRef = useRef(null);
  const locationRetryTimerRef = useRef(null);
  const hasDisplayedPrayerTimesRef = useRef(false);
  const [dailyHadith, setDailyHadith] = useState(null);
  const [dailyAyah, setDailyAyah] = useState(null);
  const [dateSnapshot, setDateSnapshot] = useState(() => new Date());
  const [hijriDate, setHijriDate] = useState('Memuat tanggal Hijriah');
  const [locationLabel, setLocationLabel] = useState('Memuat lokasi');
  const [nextPrayer, setNextPrayer] = useState({ countdown: '--:--:--', key: 'asr', time: '--:--' });
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyMessage, setDailyMessage] = useState('');
  const [prayerMessage, setPrayerMessage] = useState('');
  const [prayerRetryAttempt, setPrayerRetryAttempt] = useState(0);
  const [prayerSyncState, setPrayerSyncState] = useState('idle');
  const [pinnedFeatures, setPinnedFeatures] = useState([]);
  const [recentFeatures, setRecentFeatures] = useState([]);
  const handleScrollActivity = useCallback(() => {
    notifyTabActivity();
  }, [notifyTabActivity]);
  const contextualShortcuts = useMemo(() => {
    const hour = new Date().getHours();
    const items = [];

    if (hour >= 4 && hour < 12) {
      items.push({ Icon: Sun, featureKey: 'dzikir', label: 'Dzikir Pagi', sub: 'Pagi hari', tab: 'belajar' });
    } else if (hour >= 15 && hour < 20) {
      items.push({ Icon: Sunset, featureKey: 'dzikir', label: 'Dzikir Petang', sub: "Ba'da Ashar", tab: 'belajar' });
    }

    const locationActive =
      locationLabel !== 'LOKASI NONAKTIF' &&
      locationLabel !== 'Memuat lokasi' &&
      locationLabel !== 'LOKASI BELUM TERSEDIA';
    if (locationActive) {
      items.push({ Icon: Compass, label: 'Kiblat', params: { view: 'qibla' }, sub: locationLabel, tab: 'ibadah' });
    }

    if (recentFeatures.some((f) => f.key === 'quran')) {
      items.push({ Icon: FileText, featureKey: 'tafsir', label: 'Tafsir', sub: 'Setelah tilawah', tab: 'belajar' });
    }

    return items.slice(0, 3);
  }, [locationLabel, recentFeatures]);
  const directoryGroups = useMemo(() => {
    const primaryRows = [
      { Icon: Search, key: 'global-search', subtitle: 'Cari lintas Quran, Hadis, Doa, Kajian', title: 'Global Search', type: 'internal', view: 'global-search' },
      { Icon: BookOpen, key: 'quran', subtitle: 'Baca surah, hafalan, dan murojaah', title: "Al-Qur'an", type: 'tab', tab: 'quran' },
      { Icon: Book, key: 'hadith', subtitle: 'Baca hadis beserta sanad dan perawi', title: 'Hadis', type: 'tab', tab: 'hadith' },
      { Icon: Compass, key: 'qibla', subtitle: 'Arah kiblat, tracker, dan jadwal ibadah', title: 'Ibadah', type: 'tab', tab: 'ibadah', params: { view: 'qibla' } },
      { Icon: Bell, key: 'notifications', subtitle: 'Inbox, reminder, dan pengingat ibadah', title: 'Notifikasi', type: 'feature', featureKey: 'notifications' },
    ];

    const groupedFeatures = featureGroups.map((group) => ({
      key: group.key,
      label: group.label,
      rows: group.features.map((feature) => ({
        Icon: featureDirectoryIcons[feature.key] ?? Book,
        key: feature.key,
        subtitle: feature.subtitle || group.label,
        title: feature.title,
        type: 'feature',
        featureKey: feature.key,
      })),
    }));

    return [
      { key: 'utama', label: 'Utama', rows: primaryRows },
      ...groupedFeatures,
    ];
  }, []);

  const displayName = user?.name || 'Tamu';
  const hasPrayerSchedule = nextPrayer.time !== '--:--' && nextPrayer.countdown !== '--:--:--';
  const gregorianDate = useMemo(() => formatGregorianHomeDate(dateSnapshot), [dateSnapshot]);
  const prayerSummary = useMemo(
    () => formatPrayerSummary(nextPrayer, hasPrayerSchedule),
    [hasPrayerSchedule, nextPrayer],
  );
  const hasResolvedLocation =
    Boolean(locationLabel) &&
    locationLabel !== 'Memuat lokasi' &&
    !locationErrorLabels.has(locationLabel);
  const prayerStatusLabel = useMemo(() => {
    if (hasResolvedLocation) return locationLabel;
    if (prayerSyncState === 'retrying') {
      return `Mencoba ulang ${prayerRetryAttempt}/${prayerRetryDelays.length}`;
    }
    if (prayerSyncState === 'loading') return 'Sinkron jadwal';
    if (prayerSyncState === 'blocked') return 'Butuh lokasi';
    if (prayerSyncState === 'failed') return 'Tarik untuk ulang';
    if (prayerSyncState === 'waiting') return 'Menunggu lokasi';
    return 'Sinkron otomatis';
  }, [hasResolvedLocation, locationLabel, prayerRetryAttempt, prayerSyncState]);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const clearPrayerRetryTimer = useCallback(() => {
    if (prayerRetryTimerRef.current) {
      clearTimeout(prayerRetryTimerRef.current);
      prayerRetryTimerRef.current = null;
    }
  }, []);

  const clearLocationRetryTimer = useCallback(() => {
    if (locationRetryTimerRef.current) {
      clearTimeout(locationRetryTimerRef.current);
      locationRetryTimerRef.current = null;
    }
  }, []);

  const applyPrayerTimes = useCallback((nextTimes) => {
    hasDisplayedPrayerTimesRef.current = true;
    setPrayerTimes(nextTimes);
    setNextPrayer(resolvePrayerState(nextTimes));
  }, []);

  const fetchPrayerTimesWithRetry = useCallback(async function fetchPrayerTimesWithRetryForCoords(coords, dateKey, attempt = 0) {
    clearPrayerRetryTimer();

    if (!coords) {
      hasDisplayedPrayerTimesRef.current = false;
      setPrayerTimes(null);
      setNextPrayer(emptyPrayerState);
      setPrayerRetryAttempt(0);
      setPrayerSyncState('waiting');
      return false;
    }

    if (mountedRef.current) {
      setPrayerSyncState(attempt > 0 ? 'retrying' : 'loading');
      setPrayerRetryAttempt(attempt);
      if (attempt === 0) {
        setPrayerMessage('');
      } else {
        setPrayerMessage(`Jadwal sholat belum tersedia. Mencoba ulang ${attempt}/${prayerRetryDelays.length}...`);
      }
    }

    try {
      const nextTimes = await getPrayerTimes({ ...coords, madhab: homePrayerMadhab, method: homePrayerMethod });
      if (!hasUsablePrayerTimes(nextTimes)) {
        throw new Error('Prayer schedule is empty');
      }
      if (!mountedRef.current) return false;

      applyPrayerTimes(nextTimes);
      saveHomePrayerTimes(coords, nextTimes, dateKey || formatLocalDateKey(new Date()));
      setPrayerMessage('');
      setPrayerRetryAttempt(0);
      setPrayerSyncState('ready');
      return true;
    } catch {
      if (!mountedRef.current) return false;

      if (attempt < prayerRetryDelays.length) {
        const nextAttempt = attempt + 1;
        setPrayerRetryAttempt(nextAttempt);
        setPrayerSyncState('retrying');
        setPrayerMessage(`Jadwal sholat belum tersedia. Mencoba ulang ${nextAttempt}/${prayerRetryDelays.length}...`);
        prayerRetryTimerRef.current = setTimeout(() => {
          fetchPrayerTimesWithRetryForCoords(coords, dateKey, nextAttempt);
        }, prayerRetryDelays[attempt]);
        return false;
      }

      if (hasDisplayedPrayerTimesRef.current) {
        setPrayerRetryAttempt(0);
        setPrayerSyncState('ready');
        setPrayerMessage('');
        return false;
      }

      hasDisplayedPrayerTimesRef.current = false;
      setPrayerTimes(null);
      setNextPrayer(emptyPrayerState);
      setPrayerRetryAttempt(0);
      setPrayerSyncState('failed');
      setPrayerMessage('Jadwal sholat belum tersedia. Tarik untuk memuat ulang.');
      return false;
    }
  }, [applyPrayerTimes, clearPrayerRetryTimer]);

  const applyHomeLocation = useCallback(async (coords, knownLabel) => {
    const label = knownLabel || await getHomeLocationLabel(coords);
    if (!mountedRef.current) return false;
    setLocationLabel(label);
    saveHomeLocation(coords, label);
    return true;
  }, []);

  const refreshCurrentLocationInBackground = useCallback(function refreshCurrentLocationInBackgroundForCoords(baseCoords, attempt = 0) {
    clearLocationRetryTimer();

    withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      currentLocationTimeoutMs,
    )
      .then(async (position) => {
        const freshCoords = coordsFromPosition(position);
        if (!freshCoords || !mountedRef.current) return;

        const label = await getHomeLocationLabel(freshCoords);
        if (!mountedRef.current) return;

        setLocationLabel(label);
        saveHomeLocation(freshCoords, label);

        if (!areCoordsClose(baseCoords, freshCoords)) {
          fetchPrayerTimesWithRetry(freshCoords, formatLocalDateKey(new Date()));
        }
      })
      .catch(() => {
        if (baseCoords || !mountedRef.current) return;

        if (attempt < locationRetryDelays.length) {
          const nextAttempt = attempt + 1;
          setPrayerSyncState('waiting');
          setPrayerMessage(`GPS masih mencari lokasi. Mencoba lagi ${nextAttempt}/${locationRetryDelays.length}...`);
          locationRetryTimerRef.current = setTimeout(() => {
            refreshCurrentLocationInBackgroundForCoords(null, nextAttempt);
          }, locationRetryDelays[attempt]);
          return;
        }

        setPrayerSyncState('waiting');
        setPrayerMessage('GPS belum terbaca. Aktifkan lokasi presisi atau tarik untuk mencoba ulang.');
      });
  }, [clearLocationRetryTimer, fetchPrayerTimesWithRetry]);

  const loadHomeData = useCallback(async ({ refresh = false } = {}) => {
    const currentDate = new Date();
    const prayerDateKey = formatLocalDateKey(currentDate);
    setDateSnapshot(currentDate);
    clearPrayerRetryTimer();
    clearLocationRetryTimer();

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoadingDaily(true);
    }
    setDailyMessage('');
    setPrayerMessage('');
    let coords = null;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const [storedLocation, cachedPrayerTimes, lastKnownPosition] = await Promise.all([
          readPreference(preferenceKeys.homeLastLocation, null).then(normalizeStoredLocation),
          readPreference(preferenceKeys.homePrayerTimes, null).then((value) => normalizePrayerCache(value, prayerDateKey)),
          Promise.resolve(
            Location.getLastKnownPositionAsync({
              maxAge: 10 * 60 * 1000,
              requiredAccuracy: 5000,
            }),
          ).catch(() => null),
        ]);
        const lastKnownCoords = coordsFromPosition(lastKnownPosition);

        if (lastKnownCoords) {
          coords = lastKnownCoords;
          await applyHomeLocation(
            coords,
            areCoordsClose(storedLocation, lastKnownCoords) ? storedLocation.label : null,
          );
        } else if (storedLocation) {
          coords = { lat: storedLocation.lat, lng: storedLocation.lng };
          await applyHomeLocation(coords, storedLocation.label);
        }

        if (cachedPrayerTimes && (!coords || areCoordsClose(coords, cachedPrayerTimes.coords))) {
          if (!coords) {
            coords = cachedPrayerTimes.coords;
          }
          applyPrayerTimes(cachedPrayerTimes.prayers);
          setPrayerSyncState('ready');
          setPrayerMessage('');
        }

        refreshCurrentLocationInBackground(coords);

        if (!coords && mountedRef.current) {
          setLocationLabel(waitingLocationLabel);
          setPrayerSyncState('waiting');
          setPrayerMessage('GPS masih mencari lokasi. Jadwal akan dimuat otomatis saat lokasi terbaca.');
        }
      } else if (mountedRef.current) {
        setLocationLabel('LOKASI NONAKTIF');
        setPrayerSyncState('blocked');
        setPrayerMessage('Aktifkan lokasi untuk melihat jadwal sholat di tempatmu.');
      }
    } catch {
      if (mountedRef.current) {
        setLocationLabel(waitingLocationLabel);
        setPrayerSyncState('waiting');
        setPrayerMessage('Lokasi belum terbaca. Coba aktifkan GPS lalu tarik untuk memuat ulang.');
      }
    }

    const [hadithResult, ayahResult, hijriResult] = await Promise.allSettled([
      getDailyHadith(),
      getDailyAyah(),
      getHijriToday(),
    ]);

    if (!mountedRef.current) return;

    if (hadithResult.status === 'fulfilled') {
      setDailyHadith(hadithResult.value);
    } else {
      setDailyHadith(null);
    }

    if (ayahResult.status === 'fulfilled' && ayahResult.value?.id) {
      const chosen = ayahResult.value;
      setDailyAyah({
        arabic: chosen.arabic,
        ref: [chosen.surahName, chosen.number ? `Ayah ${chosen.number}` : null].filter(Boolean).join(' · '),
        translation: chosen.translation,
      });
    } else {
      setDailyAyah(null);
      setDailyMessage('Bacaan harian belum tersedia dari server.');
    }

    if (hijriResult.status === 'fulfilled') {
      setHijriDate(formatHijriHomeDate(hijriResult.value, currentDate));
    } else {
      setHijriDate(formatFallbackHijriHomeDate(currentDate));
    }

    if (coords) {
      await fetchPrayerTimesWithRetry(coords, prayerDateKey);
    } else {
      hasDisplayedPrayerTimesRef.current = false;
      setPrayerTimes(null);
      setNextPrayer(emptyPrayerState);
    }

    if (mountedRef.current) {
      setLoadingDaily(false);
      setRefreshing(false);
    }
  }, [applyHomeLocation, applyPrayerTimes, clearLocationRetryTimer, clearPrayerRetryTimer, fetchPrayerTimesWithRetry, refreshCurrentLocationInBackground]);

  useEffect(() => {
    mountedRef.current = true;
    loadHomeData();

    return () => {
      clearPrayerRetryTimer();
      clearLocationRetryTimer();
      mountedRef.current = false;
    };
  }, [clearLocationRetryTimer, clearPrayerRetryTimer, loadHomeData]);

  useEffect(() => {
    if (!prayerTimes) return undefined;

    const updateCountdown = () => {
      setNextPrayer(resolvePrayerState(prayerTimes));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  useEffect(() => {
    if (!isActive) return;
    let mounted = true;

    Promise.all([readPinnedFeatures(), readRecentFeatures()]).then(([pinnedItems, recentItems]) => {
      if (!mounted) return;
      setPinnedFeatures(pinnedItems.slice(0, 4));
      setRecentFeatures(recentItems.slice(0, 3));
    });

    return () => {
      mounted = false;
    };
  }, [isActive]);

  useEffect(() => {
    const activeView = navigation?.current?.view;
    if (!isActive || (activeView !== 'global-search' && activeView !== 'feature-directory')) {
      return undefined;
    }

    navigation?.setBack?.(() => {
      navigation?.close?.('home');
      return true;
    });

    return () => {
      navigation?.clearBack?.();
    };
  }, [isActive, navigation, navigation?.current?.view]);

  const openDirectoryRow = useCallback((row) => {
    if (row.type === 'internal' && row.view) {
      navigation?.open?.('home', row.view, { returnTo: featureDirectoryReturnTo, returnTab: null });
      return;
    }
    if (row.type === 'tab' && row.tab) {
      const params = {
        ...(row.params ?? {}),
        returnTo: featureDirectoryReturnTo,
      };
      if (navigation?.closeAndOpen) {
        navigation.closeAndOpen('home', row.tab, params);
      } else {
        navigation?.close?.('home');
        onOpenTab(row.tab, params);
      }
      return;
    }
    if (row.type === 'feature' && row.featureKey) {
      const params = {
        featureKey: row.featureKey,
        returnTo: featureDirectoryReturnTo,
      };
      if (navigation?.closeAndOpen) {
        navigation.closeAndOpen('home', 'belajar', params);
      } else {
        navigation?.close?.('home');
        onOpenTab('belajar', params);
      }
    }
  }, [navigation, onOpenTab]);

  if (navigation?.current?.view === 'global-search') {
    return (
      <GlobalSearchScreen
        initialFilter={navigation?.current?.params?.filter ?? 'all'}
        initialQuery={navigation?.current?.params?.query ?? ''}
        onBack={() => navigation?.close?.('home')}
        onOpenTab={(tab, params) => {
          if (navigation?.closeAndOpen) {
            navigation.closeAndOpen('home', tab, params);
          } else {
            navigation?.close?.('home');
            onOpenTab(tab, params);
          }
        }}
      />
    );
  }

  if (navigation?.current?.view === 'feature-directory') {
    return (
      <ScrollView
        contentContainerStyle={styles.directoryScreen}
        onMomentumScrollBegin={handleScrollActivity}
        onScroll={handleScrollActivity}
        onScrollBeginDrag={handleScrollActivity}
        scrollEventThrottle={250}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <DetailHeader
          onBack={() => navigation?.close?.('home')}
          subtitle="Pilih fitur berdasarkan kategori"
          title="Semua Fitur"
        />
        {directoryGroups.map((group) => (
          <View key={group.key} style={styles.directoryGroup}>
            <Text style={styles.directoryGroupTitle}>{group.label}</Text>
            {group.rows.map((row) => (
              <ContentCard
                Icon={row.Icon}
                iconSize={16}
                iconStyle={styles.directoryIcon}
                iconStrokeWidth={2.2}
                key={`${group.key}:${row.key}`}
                onPress={() => openDirectoryRow(row)}
                style={styles.directoryRow}
                subtitle={row.subtitle}
                subtitleStyle={styles.directoryRowSubtitle}
                title={row.title}
                titleStyle={styles.directoryRowTitle}
                trailing={<ChevronRight color={colors.muted} size={18} strokeWidth={2.3} />}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }
  return (
    <ScrollView
      contentContainerStyle={[styles.screen, isWebAppLayout && styles.webAppScreen]}
      onMomentumScrollBegin={handleScrollActivity}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={() => loadHomeData({ refresh: true })}
          refreshing={refreshing}
          tintColor={colors.primary}
        />
      }
      onScroll={handleScrollActivity}
      onScrollBeginDrag={handleScrollActivity}
      scrollEventThrottle={250}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      {isWebAppLayout ? (
        <View style={styles.webAppGreeting} testID="home-web-app-greeting">
          <Text style={styles.webAppGreetingTitle}>{`Assalamu'alaikum, ${displayName}`}</Text>
          <Text style={styles.webAppGreetingDate}>{gregorianDate}</Text>
        </View>
      ) : (
        <View style={styles.header} testID="home-classic-header">
          <Pressable android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }} onPress={() => onOpenTab('profile')} style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'TI'}</Text>
            </View>
            <View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.location}>{locationLabel}</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              android_ripple={{ color: 'rgba(91, 110, 91, 0.16)', borderless: true }}
              onPress={() => {
                if (navigation?.open) {
                  navigation.open('home', 'global-search');
                } else {
                  onOpenTab('belajar', { featureKey: 'kamus', focusSearch: true });
                }
              }}
            >
              <Search color={colors.muted} size={18} strokeWidth={2.2} />
            </Pressable>
            <Pressable android_ripple={{ color: 'rgba(91, 110, 91, 0.16)', borderless: true }} onPress={() => onOpenTab('belajar', { featureKey: 'notifications' })}>
              <Bell color={colors.muted} size={18} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.prayerCard, isWebAppLayout && styles.webAppPrayerCard]}>
        <View style={styles.prayerHeader}>
          <View style={styles.prayerStatusPill}>
            <Clock3 color={colors.primary} size={13} strokeWidth={2.4} />
            <Text style={styles.prayerStatusText}>{prayerStatusLabel}</Text>
          </View>
          <View style={styles.prayerDateStack}>
            <Text style={styles.gregorianDate}>{gregorianDate}</Text>
            <View style={styles.hijriRow}>
              <Moon color={colors.accent} size={13} strokeWidth={2.3} />
              <Text style={styles.hijriDate}>{hijriDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.prayerHero}>
          <Text style={styles.prayerKicker}>{`Menuju ${prayerKeyLabels[nextPrayer.key] || 'Sholat'}`}</Text>
          <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
          <Text style={styles.prayerSummary}>{prayerMessage || prayerSummary}</Text>
          <View style={styles.countdown}>
            <Clock3 color={colors.primary} size={13} strokeWidth={2.4} />
            <Text style={styles.countdownText}>{hasPrayerSchedule ? nextPrayer.countdown : 'Belum aktif'}</Text>
          </View>
        </View>

        <View style={styles.prayerTimeline} />
        <View style={styles.prayerScheduleRow}>
          {prayerScheduleItems.map(({ Icon, key, label }) => {
            const isNext = key === nextPrayer.key && hasPrayerSchedule;
            return (
              <View key={key} style={styles.prayerScheduleItem}>
                <Text style={[styles.prayerScheduleLabel, isNext ? styles.prayerScheduleActive : null]}>{label}</Text>
                <Icon
                  color={isNext ? colors.accent : colors.primary}
                  size={16}
                  strokeWidth={2.2}
                />
                <Text style={[styles.prayerScheduleTime, isNext ? styles.prayerScheduleActive : null]}>
                  {prayerTimes?.[key] ?? '--:--'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.menuGrid, isWebAppLayout && styles.webAppMenuGrid]}>
        {menuItems.map(({ Icon, featureKey, internalView, key, label, params }) => (
          <Pressable
            android_ripple={{ color: 'rgba(91, 110, 91, 0.14)', borderless: false }}
            key={label}
            onPress={() => {
              if (internalView && navigation?.open) {
                navigation.open('home', internalView);
                return;
              }
              onOpenTab(key, params ?? (featureKey ? { featureKey } : null));
            }}
            style={styles.menuItem}
          >
            <View style={styles.menuIcon}>
              <Icon color={colors.primary} size={18} strokeWidth={2.1} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.dailyCard, isWebAppLayout && styles.webAppDailyCard]}>
        <View style={styles.dailyHeader}>
          <Text style={styles.dailyTitle}>Bacaan Hari Ini</Text>
          <Text style={styles.dailyMeta}>Quran & Hadis</Text>
        </View>
        <Pressable
          android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
          onPress={() => onOpenTab('quran', { surahNumber: 1 })}
          style={styles.dailyItem}
        >
          <View style={styles.dailyAccent} />
          <View style={styles.dailyBody}>
            <Text style={styles.dailyLabel}>Ayat Hari Ini</Text>
            {dailyAyah?.arabic ? <Text style={styles.dailyArabic}>{dailyAyah.arabic}</Text> : null}
            <Text style={styles.dailyText}>
              {loadingDaily ? 'Memuat ayat harian...' : dailyAyah?.translation || dailyMessage || 'Ayat harian belum tersedia.'}
            </Text>
            {dailyAyah?.ref ? <Text style={styles.dailySource}>{dailyAyah.ref}</Text> : null}
          </View>
        </Pressable>
        <Pressable android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }} onPress={() => onOpenTab('hadith')} style={styles.dailyItem}>
          <View style={styles.dailyAccent} />
          <View style={styles.dailyBody}>
            <Text style={styles.dailyLabel}>Hadis Hari Ini</Text>
            {dailyHadith?.arabic ? <Text style={styles.dailyArabic}>{dailyHadith.arabic}</Text> : null}
            <Text style={styles.dailyText}>
              {loadingDaily
                ? 'Memuat hadis harian...'
                : dailyHadith?.translation || 'Hadis harian belum tersedia dari server.'}
            </Text>
            {dailyHadith?.book ? <Text style={styles.dailySource}>{formatHadisSource(dailyHadith.book)}</Text> : null}
          </View>
        </Pressable>
      </View>

      {contextualShortcuts.length ? (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>SARAN SEKARANG</Text>
          <View style={styles.contextRow}>
            {contextualShortcuts.map(({ Icon, featureKey, label, params, sub, tab }) => (
              <Pressable
                android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                key={label}
                onPress={() => onOpenTab(tab, params ?? (featureKey ? { featureKey } : null))}
                style={styles.contextItem}
              >
                <View style={styles.contextIcon}>
                  <Icon color={colors.primary} size={16} strokeWidth={2.2} />
                </View>
                <Text style={styles.contextItemLabel}>{label}</Text>
                <Text style={styles.contextItemSub}>{sub}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {pinnedFeatures.length ? (
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <View>
              <Text style={styles.recentTitle}>Disematkan</Text>
              <Text style={styles.recentMeta}>Shortcut fitur pilihanmu</Text>
            </View>
            <Star color={colors.primary} size={18} strokeWidth={2.2} />
          </View>
          {pinnedFeatures.map((feature) => (
            <ContentCard
              Icon={Star}
              iconStyle={styles.recentIcon}
              key={feature.key}
              onPress={() => onOpenTab('belajar', { featureKey: feature.key })}
              style={styles.recentRow}
              subtitle={feature.subtitle || feature.group || 'Belajar'}
              subtitleStyle={styles.recentRowSubtitle}
              title={feature.title}
              titleStyle={styles.recentRowTitle}
              trailing={<ChevronRight color={colors.muted} size={18} strokeWidth={2.4} />}
            />
          ))}
        </View>
      ) : null}

      {recentFeatures.length ? (
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <View>
              <Text style={styles.recentTitle}>Terakhir Dibuka</Text>
              <Text style={styles.recentMeta}>Lanjutkan fitur yang baru kamu pakai</Text>
            </View>
            <Clock3 color={colors.primary} size={18} strokeWidth={2.2} />
          </View>
          {recentFeatures.map((feature) => (
            <ContentCard
              Icon={Clock3}
              iconStyle={styles.recentIcon}
              key={feature.key}
              onPress={() => onOpenTab('belajar', { featureKey: feature.key })}
              style={styles.recentRow}
              subtitle={feature.subtitle || feature.group || 'Belajar'}
              subtitleStyle={styles.recentRowSubtitle}
              title={feature.title}
              titleStyle={styles.recentRowTitle}
              trailing={<ChevronRight color={colors.muted} size={18} strokeWidth={2.4} />}
            />
          ))}
        </View>
      ) : null}

      <ContentCard
        Icon={Smile}
        iconStyle={styles.journalIcon}
        onPress={() => onOpenTab('belajar', { featureKey: 'muhasabah' })}
        style={styles.journalCard}
        subtitle="Bagaimana imanmu hari ini?"
        subtitleStyle={styles.journalDesc}
        title="Jurnal Muhasabah"
        titleStyle={styles.journalTitle}
        trailing={<ChevronRight color={colors.muted} size={18} strokeWidth={2.4} />}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  screen: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  webAppScreen: {
    backgroundColor: '#f8fafc',
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  webAppGreeting: {
    marginBottom: spacing.lg,
  },
  webAppGreetingTitle: {
    color: '#064e3b',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppGreetingDate: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    marginTop: spacing.xs,
  },
  directoryScreen: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  directoryGroup: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  directoryGroupTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    textTransform: 'uppercase',
  },
  directoryRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    borderWidth: 0,
    borderRadius: 0,
    marginTop: 0,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  directoryIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  directoryRowTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  directoryRowSubtitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.faint,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
  },
  profile: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: 16,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: 'serif',
    fontSize: 12,
    fontWeight: '900',
  },
  name: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '900',
  },
  location: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  prayerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  prayerStatusPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderWidth: 1,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    maxWidth: '48%',
  },
  prayerStatusText: {
    color: colors.primary,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  prayerDateStack: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 5,
  },
  gregorianDate: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  hijriRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'flex-end',
  },
  hijriDate: {
    color: colors.accent,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  prayerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    ...shadows.paper,
  },
  webAppPrayerCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d1fae5',
    borderRadius: radius.lg,
  },
  prayerKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  prayerHero: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  prayerTime: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 42,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  prayerSummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
    textAlign: 'center',
  },
  countdown: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderWidth: 1,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  countdownText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  prayerTimeline: {
    backgroundColor: colors.faint,
    height: 1,
    marginBottom: spacing.sm,
    width: '100%',
  },
  prayerScheduleRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  prayerScheduleItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  prayerScheduleLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  prayerScheduleTime: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  prayerScheduleActive: {
    color: colors.accent,
  },
  menuGrid: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    ...shadows.paper,
  },
  webAppMenuGrid: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  menuItem: {
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '25%',
  },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 42,
  },
  menuLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  contextCard: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.paper,
  },
  contextLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  contextRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contextItem: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    paddingVertical: spacing.md,
  },
  contextIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  contextItemLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  contextItemSub: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.paper,
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  recentTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '900',
  },
  recentMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  recentRow: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  recentIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  recentRowTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  recentRowSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  journalCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.paper,
  },
  journalIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  journalTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '900',
  },
  journalDesc: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  dailyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.faint,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    ...shadows.paper,
  },
  webAppDailyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d1fae5',
    borderRadius: radius.md,
    marginTop: 0,
  },
  dailyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyTitle: {
    color: colors.ink,
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '900',
  },
  dailyMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  dailyItem: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dailyAccent: {
    backgroundColor: colors.primary,
    width: 4,
  },
  dailyBody: {
    flex: 1,
    padding: spacing.md,
  },
  dailyLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  dailyArabic: {
    ...arabicTypography.small,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  dailyText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  dailySource: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
