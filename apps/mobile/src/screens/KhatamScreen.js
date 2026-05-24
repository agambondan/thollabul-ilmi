import { ArrowLeft, BookOpenCheck, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getQuranProgress } from '../api/personal';
import { Card, CardTitle } from '../components/Card';
import { EmptyState, IconActionButton } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { colors, radius, spacing } from '../theme';
import { ayahIndex, dailyTarget, juzProgress, progressPct, TOTAL_AYAH } from '../utils/khatam';

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

  useEffect(() => {
    if (!isActive) return;
    navigation?.setBack?.(() => {
      navigation?.close?.('ibadah');
      return true;
    });
    return () => navigation?.clearBack?.();
  }, [isActive, navigation]);

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
    const target = dailyTarget(currentIdx, 30);
    return {
      currentIdx,
      juz: juzProgress(progress.surahNumber, progress.ayahNumber),
      pct: progressPct(progress.surahNumber, progress.ayahNumber),
      target,
    };
  }, [progress]);

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
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: spacing.sm,
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
