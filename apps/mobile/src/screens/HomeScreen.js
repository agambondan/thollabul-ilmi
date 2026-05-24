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
  HelpCircle,
  ListChecks,
  MessageCircle,
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
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDailyAyah, getDailyHadith, getHijriToday, getPrayerTimes } from '../api/client';
import { ContentCard } from '../components/ContentCard';
import { DetailHeader } from '../components/DetailHeader';
import { useSession } from '../context/SessionContext';
import { useTabActivity } from '../context/TabActivityContext';
import { GlobalSearchScreen } from './GlobalSearchScreen';
import {
  HomeDashboardContent,
  prayerKeyLabels,
  prayerScheduleItems,
} from './home/HomeDashboardContent';
import { featureGroups } from '../data/mobileFeatures';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { readPinnedFeatures, readRecentFeatures } from '../storage/recentFeatures';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors, radius, spacing } from '../theme';

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
    <HomeDashboardContent
      contextualShortcuts={contextualShortcuts}
      dailyAyah={dailyAyah}
      dailyHadith={dailyHadith}
      dailyMessage={dailyMessage}
      displayName={displayName}
      gregorianDate={gregorianDate}
      handleScrollActivity={handleScrollActivity}
      hasPrayerSchedule={hasPrayerSchedule}
      hijriDate={hijriDate}
      initials={initials}
      isWebAppLayout={isWebAppLayout}
      loadingDaily={loadingDaily}
      loadHomeData={loadHomeData}
      locationLabel={locationLabel}
      navigation={navigation}
      nextPrayer={nextPrayer}
      onOpenTab={onOpenTab}
      pinnedFeatures={pinnedFeatures}
      prayerMessage={prayerMessage}
      prayerStatusLabel={prayerStatusLabel}
      prayerSummary={prayerSummary}
      prayerTimes={prayerTimes}
      recentFeatures={recentFeatures}
      refreshing={refreshing}
    />
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.bg,
    flex: 1,
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
    borderRadius: 0,
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    borderWidth: 0,
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
});
