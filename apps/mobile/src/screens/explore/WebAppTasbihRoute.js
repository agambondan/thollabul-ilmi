import { CheckCircle2, Hand, RefreshCcw, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '../../theme';
import { hapticTap } from '../../utils/haptics';

const PRESETS = [
  {
    arabic: 'سُبْحَانَ اللَّهِ',
    key: 'subhanallah',
    latin: 'Subhanallah',
    target: 33,
  },
  {
    arabic: 'الْحَمْدُ لِلَّهِ',
    key: 'alhamdulillah',
    latin: 'Alhamdulillah',
    target: 33,
  },
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    key: 'allahu_akbar',
    latin: 'Allahu Akbar',
    target: 33,
  },
  {
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    key: 'la_ilaha',
    latin: 'La ilaha illallah',
    target: 100,
  },
  {
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    key: 'astaghfirullah',
    latin: 'Astaghfirullah',
    target: 100,
  },
  {
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    key: 'shalawat',
    latin: 'Allahumma shalli ala Muhammad',
    target: 100,
  },
  {
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    key: 'hawqala',
    latin: 'La hawla wala quwwata illa billah',
    target: 100,
  },
  {
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    key: 'hasbunallah',
    latin: 'Hasbunallahu wa nimal wakil',
    target: 7,
  },
];

const TARGET_PRESETS = [33, 99, 100, 313, 1000];

const normalizeTarget = (value) => Math.max(0, Number(value) || 0);

function StatTile({ color, label, value }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TargetChip({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.targetChip, active && styles.targetChipActive]}>
      <Text style={[styles.targetChipText, active && styles.targetChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PresetCard({ active, onPress, preset }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.presetCard, active && styles.presetCardActive]}
      testID="web-app-tasbih-preset"
    >
      <Text style={styles.presetArabic}>{preset.arabic}</Text>
      <Text style={styles.presetLatin}>{preset.latin}</Text>
      <Text style={styles.presetTarget}>Target: {preset.target}x</Text>
    </Pressable>
  );
}

export function WebAppTasbihRoute({
  setTasbih = () => {},
  tasbih = { count: 0, target: 33 },
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalToday, setTotalToday] = useState(tasbih.count ?? 0);
  const [vibrate, setVibrate] = useState(true);

  const active = PRESETS[activeIndex] ?? PRESETS[0];
  const count = Number(tasbih.count ?? 0);
  const target = normalizeTarget(tasbih.target ?? active.target);
  const reachedTarget = target > 0 && count >= target;
  const progressPct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  const updateTasbih = (updater) => {
    setTasbih((current) => {
      const next = typeof updater === 'function' ? updater(current ?? tasbih) : updater;
      return {
        count: normalizeTarget(next.count),
        target: normalizeTarget(next.target),
      };
    });
  };

  const handleTap = () => {
    if (vibrate) hapticTap();
    updateTasbih((current) => ({
      ...current,
      count: normalizeTarget(current.count) + 1,
    }));
    setTotalToday((current) => current + 1);
  };

  const reset = () => updateTasbih((current) => ({ ...current, count: 0 }));
  const resetAll = () => {
    updateTasbih((current) => ({ ...current, count: 0 }));
    setTotalToday(0);
  };
  const setTarget = (nextTarget) => updateTasbih({ count: 0, target: normalizeTarget(nextTarget) });
  const choosePreset = (index) => {
    const preset = PRESETS[index] ?? PRESETS[0];
    setActiveIndex(index);
    setTarget(preset.target);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.root}>
      <View testID="explore-web-app-tasbih-surface" />
      <View style={styles.header}>
        <Text style={styles.headerArabic}>تَسْبِيحٌ</Text>
        <Text style={styles.title}>Tasbih Digital</Text>
        <Text style={styles.subtitle}>Hitung dzikir dengan target dan riwayat harian</Text>
      </View>

      <View style={styles.counterCard}>
        <Text style={styles.activeArabic}>{active.arabic}</Text>
        <Text style={styles.activeLatin}>{active.latin}</Text>

        <View style={styles.counterWrap}>
          <Pressable
            accessibilityRole="button"
            onPress={handleTap}
            style={[styles.counterButton, reachedTarget && styles.counterButtonDone]}
            testID="web-app-tasbih-counter"
          >
            <Text style={styles.counterNumber}>{count}</Text>
            <Text style={styles.counterTarget}>{target > 0 ? `/ ${target}` : 'Tap untuk hitung'}</Text>
            {reachedTarget ? (
              <View style={styles.doneBadge}>
                <CheckCircle2 color="#064e3b" size={20} strokeWidth={2.4} />
              </View>
            ) : null}
          </Pressable>
        </View>

        {target > 0 ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPct}%</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable onPress={reset} style={styles.neutralButton}>
            <RotateCcw color="#374151" size={15} strokeWidth={2.2} />
            <Text style={styles.neutralButtonText}>Reset</Text>
          </Pressable>
          <Pressable onPress={resetAll} style={styles.dangerButton}>
            <RefreshCcw color="#dc2626" size={15} strokeWidth={2.2} />
            <Text style={styles.dangerButtonText}>Reset Semua</Text>
          </Pressable>
          <Pressable onPress={() => setVibrate((current) => !current)} style={[styles.vibrateButton, vibrate && styles.vibrateButtonActive]}>
            <Hand color={vibrate ? '#047857' : '#64748b'} size={15} strokeWidth={2.2} />
            <Text style={[styles.vibrateButtonText, vibrate && styles.vibrateButtonTextActive]}>
              Getar: {vibrate ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatTile color="#047857" label="Hitungan" value={count} />
        <StatTile color="#d97706" label="Target" value={target || '∞'} />
        <StatTile color="#2563eb" label="Total Hari Ini" value={totalToday} />
      </View>

      <View style={styles.targetCard}>
        <View style={styles.targetHeader}>
          <Text style={styles.targetTitle}>Atur Target</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setTarget}
            style={styles.targetInput}
            value={`${target}`}
          />
        </View>
        <View style={styles.targetChips}>
          {TARGET_PRESETS.map((preset) => (
            <TargetChip
              active={target === preset}
              key={preset}
              label={`${preset}`}
              onPress={() => setTarget(preset)}
            />
          ))}
          <TargetChip active={target === 0} label="Tanpa Batas" onPress={() => setTarget(0)} />
        </View>
      </View>

      <View style={styles.presetsSection}>
        <Text style={styles.presetsTitle}>Pilihan Dzikir</Text>
        <View style={styles.presetsGrid}>
          {PRESETS.map((preset, index) => (
            <PresetCard
              active={index === activeIndex}
              key={preset.key}
              onPress={() => choosePreset(index)}
              preset={preset}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerArabic: {
    color: '#047857',
    fontSize: 30,
    lineHeight: 42,
    marginBottom: 2,
    textAlign: 'center',
  },
  title: {
    color: '#064e3b',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 3,
    textAlign: 'center',
  },
  counterCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d1fae5',
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  activeArabic: {
    color: '#064e3b',
    fontSize: 29,
    lineHeight: 43,
    textAlign: 'center',
  },
  activeLatin: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  counterWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  counterButton: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 112,
    height: 224,
    justifyContent: 'center',
    shadowColor: '#064e3b',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    width: 224,
  },
  counterButtonDone: {
    backgroundColor: '#059669',
  },
  counterNumber: {
    color: '#ffffff',
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 66,
  },
  counterTarget: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  doneBadge: {
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    top: 12,
    width: 36,
  },
  progressBlock: {
    marginBottom: spacing.lg,
  },
  progressTrack: {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    height: '100%',
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  neutralButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  neutralButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '900',
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dangerButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '900',
  },
  vibrateButton: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  vibrateButtonActive: {
    backgroundColor: '#ecfdf5',
  },
  vibrateButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
  },
  vibrateButtonTextActive: {
    color: '#047857',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statTile: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    justifyContent: 'center',
    padding: spacing.sm,
  },
  statValue: {
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 29,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'center',
  },
  targetCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  targetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  targetTitle: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900',
  },
  targetInput: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.sm,
    borderWidth: 1,
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    minWidth: 86,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    textAlign: 'right',
  },
  targetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  targetChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  targetChipActive: {
    backgroundColor: '#10b981',
  },
  targetChipText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '900',
  },
  targetChipTextActive: {
    color: '#ffffff',
  },
  presetsSection: {
    marginBottom: spacing.md,
  },
  presetsTitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  presetsGrid: {
    gap: spacing.sm,
  },
  presetCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  presetCardActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  presetArabic: {
    color: '#064e3b',
    fontSize: 21,
    lineHeight: 33,
    textAlign: 'right',
  },
  presetLatin: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  presetTarget: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
});
