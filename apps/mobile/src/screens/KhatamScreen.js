import { ArrowLeft, BookOpenCheck, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getQuranProgress } from '../api/personal';
import { Card, CardTitle } from '../components/Card';
import { EmptyState, IconActionButton } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { useMobileLocale } from '../i18n/MobileLocaleProvider';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors, radius, spacing } from '../theme';
import { ayahIndex, dailyTarget, juzProgress, progressPct, TOTAL_AYAH } from '../utils/khatam';

const KHATAM_TARGET_OPTIONS = [
  { days: 30, label: '30d' },
  { days: 60, label: '60d' },
  { days: 90, label: '3 bln' },
  { days: 180, label: '6 bln' },
  { days: 365, label: '1 thn' },
];

const WEB_APP_KHATAM_BG = '#f8fafc';
const WEB_APP_KHATAM_SURFACE = '#ffffff';
const WEB_APP_KHATAM_BORDER = '#e5e7eb';
const WEB_APP_KHATAM_TEXT = '#0f172a';
const WEB_APP_KHATAM_MUTED = '#64748b';
const WEB_APP_KHATAM_ACCENT = '#059669';
const WEB_APP_KHATAM_AMBER = '#f59e0b';
const WEB_APP_KHATAM_THEMES = {
  light: {
    accent: WEB_APP_KHATAM_ACCENT,
    accentSoft: '#ecfdf5',
    amber: WEB_APP_KHATAM_AMBER,
    amberSoft: '#fffbeb',
    bg: WEB_APP_KHATAM_BG,
    blue: '#2563eb',
    blueSoft: '#eff6ff',
    border: WEB_APP_KHATAM_BORDER,
    cell: '#f1f5f9',
    iconBg: '#d1fae5',
    messageBg: '#fff7ed',
    messageBorder: '#fed7aa',
    messageText: '#c2410c',
    muted: WEB_APP_KHATAM_MUTED,
    surface: WEB_APP_KHATAM_SURFACE,
    text: WEB_APP_KHATAM_TEXT,
  },
  dark: {
    accent: '#34d399',
    accentSoft: '#063b31',
    amber: '#fbbf24',
    amberSoft: '#3f2f0b',
    bg: '#020617',
    blue: '#60a5fa',
    blueSoft: '#0f274a',
    border: '#334155',
    cell: '#1e293b',
    iconBg: '#064e3b',
    messageBg: '#431407',
    messageBorder: '#9a3412',
    messageText: '#fdba74',
    muted: '#94a3b8',
    surface: '#111827',
    text: '#f8fafc',
  },
};

const normalizeProgress = (payload) => {
  const data = payload?.data?.progress ?? payload?.progress ?? payload?.data ?? payload;
  const surahNumber = Number(data?.surah_number ?? data?.surahNumber ?? 0);
  const ayahNumber = Number(data?.ayah_number ?? data?.ayahNumber ?? 0);
  if (!surahNumber || !ayahNumber) return null;
  return {
    ayahNumber,
    lastReadAt: data?.last_read_at ?? data?.lastReadAt ?? null,
    surahNumber,
  };
};

const mobileDateLocales = {
  en: 'en-US',
  idn: 'id-ID',
};

const formatLastRead = (value, fallback, language) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(mobileDateLocales[language] ?? mobileDateLocales.idn, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function KhatamScreen({ isActive, navigation, onOpenTab }) {
  const { user } = useSession();
  const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
  const { language, t } = useMobileLocale();
  const webAppTheme = isDarkTheme ? WEB_APP_KHATAM_THEMES.dark : WEB_APP_KHATAM_THEMES.light;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [targetDays, setTargetDays] = useState(30);

  useEffect(() => {
    if (!isActive) return;
    navigation?.setBack?.(() => {
      navigation?.close?.('ibadah');
      return true;
    });
    return () => navigation?.clearBack?.();
  }, [isActive, navigation]);

  useEffect(() => {
    let mounted = true;
    readPreference(preferenceKeys.khatamTargetDays, 30).then((value) => {
      if (!mounted) return;
      const numeric = Number(value);
      if (KHATAM_TARGET_OPTIONS.some((item) => item.days === numeric)) {
        setTargetDays(numeric);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = await getQuranProgress();
      setProgress(normalizeProgress(payload));
    } catch (err) {
      setProgress(null);
      setError(err?.message ?? t('khatam.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    if (!progress) return null;
    const currentIdx = ayahIndex(progress.surahNumber, progress.ayahNumber);
    return {
      currentIdx,
      juz: juzProgress(progress.surahNumber, progress.ayahNumber),
      pct: progressPct(progress.surahNumber, progress.ayahNumber),
      target: dailyTarget(currentIdx, targetDays),
    };
  }, [progress, targetDays]);

  const selectTargetDays = async (days) => {
    setTargetDays(days);
    try {
      await writePreference(preferenceKeys.khatamTargetDays, days);
    } catch {
      // Keep the in-memory target responsive even if local persistence fails.
    }
  };

  const continueReading = () => {
    if (!progress) return;
    const params = {
      ayahNumber: progress.ayahNumber,
      surahNumber: progress.surahNumber,
      surahSlug: `${progress.surahNumber}`,
    };
    if (navigation?.closeAndOpen) {
      navigation.closeAndOpen('ibadah', 'quran', params);
      return;
    }
    navigation?.close?.('ibadah');
    onOpenTab?.('quran', params);
  };

  const lastRead = formatLastRead(progress?.lastReadAt, t('khatam.lastReadUnavailable'), language);

  if (isWebAppLayout) {
    return (
      <Screen
        contentStyle={[styles.webAppSurface, { backgroundColor: webAppTheme.bg }]}
        title={t('khatam.title')}
        subtitle={t('khatam.subtitle.webApp')}
        refreshing={loading}
        onRefresh={load}
        actions={
          <IconActionButton Icon={RefreshCw} label={t('khatam.action.refresh')} onPress={load} disabled={loading} />
        }
      >
        <View style={{ backgroundColor: webAppTheme.bg }} testID="khatam-web-app-surface" />
        {!user ? (
          <View
            style={[styles.webAppGuestCard, { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border }]}
            testID="khatam-web-app-guest-card"
          >
            <View style={[styles.webAppQuranIcon, { backgroundColor: webAppTheme.iconBg }]}>
              <BookOpenCheck color={webAppTheme.accent} size={34} strokeWidth={2.2} />
            </View>
            <Text style={[styles.webAppTitle, { color: webAppTheme.text }]}>{t('khatam.trackerTitle')}</Text>
            <Text style={[styles.webAppSubtitle, { color: webAppTheme.muted }]}>{t('khatam.guest.webApp')}</Text>
            <Pressable onPress={() => onOpenTab?.('profile')} style={styles.webAppPrimaryButton}>
              <Text style={styles.webAppPrimaryButtonText}>{t('khatam.action.loginProfile')}</Text>
            </Pressable>
          </View>
        ) : null}

        {user && loading && !progress ? <ActivityIndicator color={webAppTheme.accent} /> : null}
        {user && error ? (
          <Text
            style={[
              styles.webAppMessage,
              {
                backgroundColor: webAppTheme.messageBg,
                borderColor: webAppTheme.messageBorder,
                color: webAppTheme.messageText,
              },
            ]}
          >
            {error}
          </Text>
        ) : null}

        {user && !loading && !error && !progress ? (
          <View
            style={[styles.webAppGuestCard, { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border }]}
            testID="khatam-web-app-empty-card"
          >
            <View style={[styles.webAppQuranIcon, { backgroundColor: webAppTheme.iconBg }]}>
              <BookOpenCheck color={webAppTheme.accent} size={34} strokeWidth={2.2} />
            </View>
            <Text style={[styles.webAppTitle, { color: webAppTheme.text }]}>{t('khatam.empty.title')}</Text>
            <Text style={[styles.webAppSubtitle, { color: webAppTheme.muted }]}>{t('khatam.empty.description')}</Text>
            <Pressable onPress={() => navigation?.closeAndOpen?.('ibadah', 'quran')} style={styles.webAppPrimaryButton}>
              <Text style={styles.webAppPrimaryButtonText}>{t('khatam.action.openQuran')}</Text>
            </Pressable>
          </View>
        ) : null}

        {progress && stats ? (
          <>
            <View style={styles.webAppHeader}>
              <View style={[styles.webAppQuranIcon, { backgroundColor: webAppTheme.iconBg }]}>
                <BookOpenCheck color={webAppTheme.accent} size={30} strokeWidth={2.2} />
              </View>
              <Text style={[styles.webAppTitle, { color: webAppTheme.text }]}>{t('khatam.trackerTitle')}</Text>
              <Text style={[styles.webAppSubtitle, { color: webAppTheme.muted }]}>{t('khatam.progressSubtitle')}</Text>
            </View>

            <View style={styles.webAppHeroCard}>
              <View style={styles.webAppHeroTop}>
                <View>
                  <Text style={styles.webAppHeroLabel}>{t('khatam.hero.current')}</Text>
                  <Text style={styles.webAppHeroValue}>{stats.pct.toFixed(1)}%</Text>
                </View>
                <View style={styles.webAppHeroRight}>
                  <Text style={styles.webAppHeroLabel}>{t('khatam.hero.lastRead')}</Text>
                  <Text style={styles.webAppHeroSurah}>QS. {progress.surahNumber}:{progress.ayahNumber}</Text>
                </View>
              </View>
              <View style={styles.webAppHeroTrack}>
                <View style={[styles.webAppHeroFill, { width: `${Math.min(100, stats.pct)}%` }]} />
              </View>
              <View style={styles.webAppHeroFoot}>
                <Text style={styles.webAppHeroFootText}>{t('khatam.hero.ayahProgress', { current: stats.currentIdx, total: TOTAL_AYAH })}</Text>
                <Text style={styles.webAppHeroFootText}>{t('khatam.hero.remaining', { count: stats.target.ayahsLeft })}</Text>
              </View>
              <Text style={styles.webAppLastRead}>
                {t('khatam.lastUpdated', { date: lastRead })}
              </Text>
            </View>

            <View
              style={[styles.webAppTargetCard, { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border }]}
              testID="khatam-web-app-target-card"
            >
              <Text style={[styles.webAppSectionTitle, { color: webAppTheme.text }]}>{t('khatam.target.title')}</Text>
              <Text style={[styles.webAppSectionHint, { color: webAppTheme.muted }]}>{t('khatam.target.hint')}</Text>
              <View style={styles.webAppTargetChips}>
                {KHATAM_TARGET_OPTIONS.map((option) => {
                  const selected = option.days === targetDays;
                  return (
                    <Pressable
                      key={option.days}
                      onPress={() => selectTargetDays(option.days)}
                      style={[
                        styles.webAppTargetChip,
                        { backgroundColor: webAppTheme.accentSoft },
                        selected ? styles.webAppTargetChipActive : null,
                      ]}
                    >
                      <Text style={[
                        styles.webAppTargetChipText,
                        { color: webAppTheme.accent },
                        selected ? styles.webAppTargetChipTextActive : null,
                      ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.webAppTargetGrid}>
                <View style={[styles.webAppTargetStat, styles.webAppTargetStatGreen, { backgroundColor: webAppTheme.accentSoft }]}>
                  <Text style={[styles.webAppTargetValue, { color: webAppTheme.accent }]}>{stats.target.daysLeft}</Text>
                  <Text style={[styles.webAppTargetLabel, { color: webAppTheme.muted }]}>{t('khatam.target.daysLeft')}</Text>
                </View>
                <View style={[styles.webAppTargetStat, styles.webAppTargetStatAmber, { backgroundColor: webAppTheme.amberSoft }]}>
                  <Text style={[styles.webAppTargetValue, styles.webAppTargetValueAmber, { color: webAppTheme.amber }]}>{stats.target.ayahsPerDay}</Text>
                  <Text style={[styles.webAppTargetLabel, { color: webAppTheme.muted }]}>{t('khatam.target.ayahsPerDay')}</Text>
                </View>
                <View style={[styles.webAppTargetStat, styles.webAppTargetStatBlue, { backgroundColor: webAppTheme.blueSoft }]}>
                  <Text style={[styles.webAppTargetValue, styles.webAppTargetValueBlue, { color: webAppTheme.blue }]}>{Math.ceil(stats.target.ayahsPerDay / 15)}</Text>
                  <Text style={[styles.webAppTargetLabel, { color: webAppTheme.muted }]}>{t('khatam.target.minutesPerDay')}</Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.webAppJuzCard, { backgroundColor: webAppTheme.surface, borderColor: webAppTheme.border }]}
              testID="khatam-web-app-juz-card"
            >
              <Text style={[styles.webAppSectionTitle, { color: webAppTheme.text }]}>{t('khatam.juz.title')}</Text>
              <View style={styles.webAppJuzGrid}>
                {stats.juz.map((item) => {
                  const partial = item.pct > 0 && item.pct < 100;
                  return (
                    <View
                      key={item.juz}
                      style={[
                        styles.webAppJuzCell,
                        { backgroundColor: webAppTheme.cell },
                        item.pct >= 100 ? styles.webAppJuzCellDone : null,
                        partial ? styles.webAppJuzCellPartial : null,
                        item.isCurrent ? styles.webAppJuzCellCurrent : null,
                      ]}
                    >
                      <Text style={[
                        styles.webAppJuzText,
                        { color: webAppTheme.muted },
                        item.pct >= 100 ? styles.webAppJuzTextDone : null,
                        partial ? styles.webAppJuzTextPartial : null,
                      ]}>
                        {item.juz}
                      </Text>
                      {partial ? <View style={[styles.webAppJuzPartialBar, { width: `${item.pct}%` }]} /> : null}
                    </View>
                  );
                })}
              </View>
              <View style={styles.webAppLegendGrid}>
                <Text style={[styles.webAppLegendText, { color: webAppTheme.muted }]}>{t('khatam.juz.done')}</Text>
                <Text style={[styles.webAppLegendText, { color: webAppTheme.muted }]}>{t('khatam.juz.partial')}</Text>
                <Text style={[styles.webAppLegendText, { color: webAppTheme.muted }]}>{t('khatam.juz.unread')}</Text>
                <Text style={[styles.webAppLegendText, { color: webAppTheme.muted }]}>{t('khatam.juz.current')}</Text>
              </View>
              <Pressable onPress={continueReading} style={styles.webAppPrimaryButton}>
                <Text style={styles.webAppPrimaryButtonText}>{t('khatam.action.continueReading')}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={isWebAppLayout ? styles.webAppSurface : null}
      title={t('khatam.title')}
      subtitle={t('khatam.subtitle.classic')}
      refreshing={loading}
      onRefresh={load}
      actions={
        <>
          <IconActionButton Icon={ArrowLeft} label={t('khatam.action.backIbadah')} onPress={() => navigation?.close?.('ibadah')} />
          <IconActionButton Icon={RefreshCw} label={t('khatam.action.refresh')} onPress={load} disabled={loading} />
        </>
      }
    >
      <View testID={isWebAppLayout ? 'khatam-web-app-surface' : 'khatam-classic-surface'} />
      {!user ? (
        <EmptyState
          Icon={BookOpenCheck}
          title={t('khatam.guest.title')}
          description={t('khatam.guest.description')}
        />
      ) : null}

      {user && loading && !progress ? <ActivityIndicator color={colors.primary} /> : null}
      {user && error ? <Text style={styles.message}>{error}</Text> : null}

      {user && !loading && !error && !progress ? (
        <EmptyState
          Icon={BookOpenCheck}
          title={t('khatam.empty.title')}
          description={t('khatam.empty.description')}
          action={
            <Pressable onPress={() => navigation?.closeAndOpen?.('ibadah', 'quran')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t('khatam.action.openQuran')}</Text>
            </Pressable>
          }
        />
      ) : null}

      {progress && stats ? (
        <>
          <Card style={styles.heroCard}>
            <CardTitle meta={`${Math.round(stats.pct)}%`}>{t('khatam.progress.current')}</CardTitle>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, stats.pct)}%` }]} />
            </View>
            <View style={styles.heroStats}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.currentIdx}</Text>
                <Text style={styles.statLabel}>{t('khatam.progress.ofAyahs', { total: TOTAL_AYAH })}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.target.ayahsLeft}</Text>
                <Text style={styles.statLabel}>{t('khatam.progress.ayahsLeft')}</Text>
              </View>
            </View>
            <Text style={styles.lastRead}>
              {t('khatam.lastRead', { date: lastRead, surah: progress.surahNumber, ayah: progress.ayahNumber })}
            </Text>
            <Pressable onPress={continueReading} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t('khatam.action.continueReading')}</Text>
            </Pressable>
          </Card>

          <Card>
            <CardTitle meta={t('khatam.target.defaultMeta')}>{t('khatam.target.title')}</CardTitle>
            <View style={styles.targetGrid}>
              <View style={styles.targetBox}>
                <Text style={styles.targetValue}>{stats.target.ayahsPerDay}</Text>
                <Text style={styles.targetLabel}>{t('khatam.target.ayahsPerDayFull')}</Text>
              </View>
              <View style={styles.targetBox}>
                <Text style={styles.targetValue}>{Math.ceil(stats.target.ayahsPerDay / 20)}</Text>
                <Text style={styles.targetLabel}>{t('khatam.target.pagesPerDay')}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <CardTitle meta={t('khatam.juz.meta')}>{t('khatam.juz.title')}</CardTitle>
            <View style={styles.juzGrid}>
              {stats.juz.map((item) => (
                <View
                  key={item.juz}
                  style={[
                    styles.juzCell,
                    item.pct >= 100 && styles.juzCellDone,
                    item.isCurrent && styles.juzCellCurrent,
                  ]}
                >
                  <Text style={[styles.juzText, item.pct >= 100 && styles.juzTextDone]}>
                    {item.juz}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  webAppSurface: {
    backgroundColor: WEB_APP_KHATAM_BG,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  webAppGuestCard: {
    alignItems: 'center',
    backgroundColor: WEB_APP_KHATAM_SURFACE,
    borderColor: WEB_APP_KHATAM_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
  },
  webAppHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  webAppQuranIcon: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 18,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 64,
  },
  webAppTitle: {
    color: WEB_APP_KHATAM_TEXT,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  webAppSubtitle: {
    color: WEB_APP_KHATAM_MUTED,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  webAppHeroCard: {
    backgroundColor: '#047857',
    borderRadius: 20,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  webAppHeroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  webAppHeroRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  webAppHeroLabel: {
    color: '#d1fae5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppHeroValue: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: spacing.xs,
  },
  webAppHeroSurah: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  webAppHeroTrack: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    height: 12,
    overflow: 'hidden',
  },
  webAppHeroFill: {
    backgroundColor: '#fcd34d',
    height: '100%',
  },
  webAppHeroFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  webAppHeroFootText: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '800',
  },
  webAppLastRead: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  webAppTargetCard: {
    backgroundColor: WEB_APP_KHATAM_SURFACE,
    borderColor: WEB_APP_KHATAM_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  webAppSectionTitle: {
    color: WEB_APP_KHATAM_TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  webAppSectionHint: {
    color: WEB_APP_KHATAM_MUTED,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  webAppTargetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  webAppTargetChip: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  webAppTargetChipActive: {
    backgroundColor: WEB_APP_KHATAM_ACCENT,
  },
  webAppTargetChipText: {
    color: WEB_APP_KHATAM_ACCENT,
    fontSize: 12,
    fontWeight: '900',
  },
  webAppTargetChipTextActive: {
    color: '#ffffff',
  },
  webAppTargetGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  webAppTargetStat: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    minHeight: 86,
    justifyContent: 'center',
    padding: spacing.sm,
  },
  webAppTargetStatGreen: {
    backgroundColor: '#ecfdf5',
  },
  webAppTargetStatAmber: {
    backgroundColor: '#fffbeb',
  },
  webAppTargetStatBlue: {
    backgroundColor: '#eff6ff',
  },
  webAppTargetValue: {
    color: WEB_APP_KHATAM_ACCENT,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppTargetValueAmber: {
    color: WEB_APP_KHATAM_AMBER,
  },
  webAppTargetValueBlue: {
    color: '#2563eb',
  },
  webAppTargetLabel: {
    color: WEB_APP_KHATAM_MUTED,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  webAppJuzCard: {
    backgroundColor: WEB_APP_KHATAM_SURFACE,
    borderColor: WEB_APP_KHATAM_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
  },
  webAppJuzGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  webAppJuzCell: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 42,
  },
  webAppJuzCellDone: {
    backgroundColor: WEB_APP_KHATAM_ACCENT,
  },
  webAppJuzCellPartial: {
    backgroundColor: '#d1fae5',
  },
  webAppJuzCellCurrent: {
    borderColor: WEB_APP_KHATAM_AMBER,
  },
  webAppJuzText: {
    color: WEB_APP_KHATAM_MUTED,
    fontSize: 13,
    fontWeight: '900',
    zIndex: 1,
  },
  webAppJuzTextDone: {
    color: '#ffffff',
  },
  webAppJuzTextPartial: {
    color: '#047857',
  },
  webAppJuzPartialBar: {
    backgroundColor: WEB_APP_KHATAM_ACCENT,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
  },
  webAppLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  webAppLegendText: {
    color: WEB_APP_KHATAM_MUTED,
    fontSize: 11,
    fontWeight: '800',
  },
  webAppPrimaryButton: {
    alignItems: 'center',
    backgroundColor: WEB_APP_KHATAM_ACCENT,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  webAppPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
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
  heroCard: {
    backgroundColor: colors.surface,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  juzCell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  juzCellCurrent: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  juzCellDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  juzGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  juzText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  juzTextDone: {
    color: colors.onPrimary,
  },
  lastRead: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  progressFill: {
    backgroundColor: colors.primary,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 10,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  statBlock: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  targetBox: {
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  targetGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  targetLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  targetValue: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: '900',
  },
});
