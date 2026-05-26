import { ArrowLeft, BookOpenCheck, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getQuranProgress } from '../api/personal';
import { Card, CardTitle } from '../components/Card';
import { EmptyState, IconActionButton } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
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

const formatLastRead = (value) => {
  if (!value) return 'Belum tersedia';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Belum tersedia';
  return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function KhatamScreen({ isActive, navigation, onOpenTab }) {
  const { user } = useSession();
  const { isWebAppLayout } = useLayoutModePreference();
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
      setError(err?.message ?? 'Progress khatam belum bisa dimuat.');
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  if (isWebAppLayout) {
    return (
      <Screen
        contentStyle={styles.webAppSurface}
        title="Khatam"
        subtitle="Pantau progres khatam Al-Quran dan target harian."
        refreshing={loading}
        onRefresh={load}
        actions={
          <IconActionButton Icon={RefreshCw} label="Muat ulang Khatam" onPress={load} disabled={loading} />
        }
      >
        <View testID="khatam-web-app-surface" />
        {!user ? (
          <View style={styles.webAppGuestCard}>
            <View style={styles.webAppQuranIcon}>
              <BookOpenCheck color={WEB_APP_KHATAM_ACCENT} size={34} strokeWidth={2.2} />
            </View>
            <Text style={styles.webAppTitle}>Khatam Tracker</Text>
            <Text style={styles.webAppSubtitle}>Login untuk melihat progress khatam Quran-mu.</Text>
            <Pressable onPress={() => onOpenTab?.('profile')} style={styles.webAppPrimaryButton}>
              <Text style={styles.webAppPrimaryButtonText}>Masuk dari Profil</Text>
            </Pressable>
          </View>
        ) : null}

        {user && loading && !progress ? <ActivityIndicator color={WEB_APP_KHATAM_ACCENT} /> : null}
        {user && error ? <Text style={styles.webAppMessage}>{error}</Text> : null}

        {user && !loading && !error && !progress ? (
          <View style={styles.webAppGuestCard}>
            <View style={styles.webAppQuranIcon}>
              <BookOpenCheck color={WEB_APP_KHATAM_ACCENT} size={34} strokeWidth={2.2} />
            </View>
            <Text style={styles.webAppTitle}>Belum ada progress Quran</Text>
            <Text style={styles.webAppSubtitle}>Buka Quran lalu simpan progres ayat terakhir untuk mulai melacak Khatam.</Text>
            <Pressable onPress={() => navigation?.closeAndOpen?.('ibadah', 'quran')} style={styles.webAppPrimaryButton}>
              <Text style={styles.webAppPrimaryButtonText}>Buka Quran</Text>
            </Pressable>
          </View>
        ) : null}

        {progress && stats ? (
          <>
            <View style={styles.webAppHeader}>
              <View style={styles.webAppQuranIcon}>
                <BookOpenCheck color={WEB_APP_KHATAM_ACCENT} size={30} strokeWidth={2.2} />
              </View>
              <Text style={styles.webAppTitle}>Khatam Tracker</Text>
              <Text style={styles.webAppSubtitle}>Pantau progress khatam Al-Quran kamu</Text>
            </View>

            <View style={styles.webAppHeroCard}>
              <View style={styles.webAppHeroTop}>
                <View>
                  <Text style={styles.webAppHeroLabel}>PROGRESS SAAT INI</Text>
                  <Text style={styles.webAppHeroValue}>{stats.pct.toFixed(1)}%</Text>
                </View>
                <View style={styles.webAppHeroRight}>
                  <Text style={styles.webAppHeroLabel}>TERAKHIR DIBACA</Text>
                  <Text style={styles.webAppHeroSurah}>QS. {progress.surahNumber}:{progress.ayahNumber}</Text>
                </View>
              </View>
              <View style={styles.webAppHeroTrack}>
                <View style={[styles.webAppHeroFill, { width: `${Math.min(100, stats.pct)}%` }]} />
              </View>
              <View style={styles.webAppHeroFoot}>
                <Text style={styles.webAppHeroFootText}>{stats.currentIdx} / {TOTAL_AYAH} ayat</Text>
                <Text style={styles.webAppHeroFootText}>{stats.target.ayahsLeft} tersisa</Text>
              </View>
              <Text style={styles.webAppLastRead}>
                Terakhir diperbarui: {formatLastRead(progress.lastReadAt)}
              </Text>
            </View>

            <View style={styles.webAppTargetCard}>
              <Text style={styles.webAppSectionTitle}>Target Khatam</Text>
              <Text style={styles.webAppSectionHint}>Pilih durasi agar target ayat harian otomatis menyesuaikan.</Text>
              <View style={styles.webAppTargetChips}>
                {KHATAM_TARGET_OPTIONS.map((option) => {
                  const selected = option.days === targetDays;
                  return (
                    <Pressable
                      key={option.days}
                      onPress={() => selectTargetDays(option.days)}
                      style={[styles.webAppTargetChip, selected ? styles.webAppTargetChipActive : null]}
                    >
                      <Text style={[styles.webAppTargetChipText, selected ? styles.webAppTargetChipTextActive : null]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.webAppTargetGrid}>
                <View style={[styles.webAppTargetStat, styles.webAppTargetStatGreen]}>
                  <Text style={styles.webAppTargetValue}>{stats.target.daysLeft}</Text>
                  <Text style={styles.webAppTargetLabel}>Hari tersisa</Text>
                </View>
                <View style={[styles.webAppTargetStat, styles.webAppTargetStatAmber]}>
                  <Text style={[styles.webAppTargetValue, styles.webAppTargetValueAmber]}>{stats.target.ayahsPerDay}</Text>
                  <Text style={styles.webAppTargetLabel}>Ayat/hari</Text>
                </View>
                <View style={[styles.webAppTargetStat, styles.webAppTargetStatBlue]}>
                  <Text style={[styles.webAppTargetValue, styles.webAppTargetValueBlue]}>{Math.ceil(stats.target.ayahsPerDay / 15)}</Text>
                  <Text style={styles.webAppTargetLabel}>Menit/hari</Text>
                </View>
              </View>
            </View>

            <View style={styles.webAppJuzCard}>
              <Text style={styles.webAppSectionTitle}>Progress per Juz</Text>
              <View style={styles.webAppJuzGrid}>
                {stats.juz.map((item) => {
                  const partial = item.pct > 0 && item.pct < 100;
                  return (
                    <View
                      key={item.juz}
                      style={[
                        styles.webAppJuzCell,
                        item.pct >= 100 ? styles.webAppJuzCellDone : null,
                        partial ? styles.webAppJuzCellPartial : null,
                        item.isCurrent ? styles.webAppJuzCellCurrent : null,
                      ]}
                    >
                      <Text style={[
                        styles.webAppJuzText,
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
                <Text style={styles.webAppLegendText}>Selesai</Text>
                <Text style={styles.webAppLegendText}>Sebagian</Text>
                <Text style={styles.webAppLegendText}>Belum dibaca</Text>
                <Text style={styles.webAppLegendText}>Saat ini</Text>
              </View>
              <Pressable onPress={continueReading} style={styles.webAppPrimaryButton}>
                <Text style={styles.webAppPrimaryButtonText}>Lanjutkan baca</Text>
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
      title="Khatam"
      subtitle="Pantau progress khatam Quran dari posisi baca terakhir."
      refreshing={loading}
      onRefresh={load}
      actions={
        <>
          <IconActionButton Icon={ArrowLeft} label="Kembali ke Ibadah" onPress={() => navigation?.close?.('ibadah')} />
          <IconActionButton Icon={RefreshCw} label="Muat ulang Khatam" onPress={load} disabled={loading} />
        </>
      }
    >
      <View testID={isWebAppLayout ? 'khatam-web-app-surface' : 'khatam-classic-surface'} />
      {!user ? (
        <EmptyState
          Icon={BookOpenCheck}
          title="Masuk untuk melacak Khatam"
          description="Progress Khatam mengikuti progres baca Quran yang tersimpan di akunmu."
        />
      ) : null}

      {user && loading && !progress ? <ActivityIndicator color={colors.primary} /> : null}
      {user && error ? <Text style={styles.message}>{error}</Text> : null}

      {user && !loading && !error && !progress ? (
        <EmptyState
          Icon={BookOpenCheck}
          title="Belum ada progress Quran"
          description="Buka Quran lalu simpan progres ayat terakhir untuk mulai melacak Khatam."
          action={
            <Pressable onPress={() => navigation?.closeAndOpen?.('ibadah', 'quran')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Buka Quran</Text>
            </Pressable>
          }
        />
      ) : null}

      {progress && stats ? (
        <>
          <Card style={styles.heroCard}>
            <CardTitle meta={`${Math.round(stats.pct)}%`}>Progress saat ini</CardTitle>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, stats.pct)}%` }]} />
            </View>
            <View style={styles.heroStats}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.currentIdx}</Text>
                <Text style={styles.statLabel}>dari {TOTAL_AYAH} ayat</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.target.ayahsLeft}</Text>
                <Text style={styles.statLabel}>ayat tersisa</Text>
              </View>
            </View>
            <Text style={styles.lastRead}>
              Terakhir dibaca: QS. {progress.surahNumber}:{progress.ayahNumber} · {formatLastRead(progress.lastReadAt)}
            </Text>
            <Pressable onPress={continueReading} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Lanjutkan baca</Text>
            </Pressable>
          </Card>

          <Card>
            <CardTitle meta="30 hari">Target Khatam</CardTitle>
            <View style={styles.targetGrid}>
              <View style={styles.targetBox}>
                <Text style={styles.targetValue}>{stats.target.ayahsPerDay}</Text>
                <Text style={styles.targetLabel}>ayat per hari</Text>
              </View>
              <View style={styles.targetBox}>
                <Text style={styles.targetValue}>{Math.ceil(stats.target.ayahsPerDay / 20)}</Text>
                <Text style={styles.targetLabel}>halaman per hari</Text>
              </View>
            </View>
          </Card>

          <Card>
            <CardTitle meta="30 juz">Progress per Juz</CardTitle>
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
