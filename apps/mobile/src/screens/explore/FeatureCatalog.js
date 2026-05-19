import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { BookOpen, Bookmark, Globe, HelpCircle, ListChecks, MessageCircle, Scale, Star, StickyNote, Users, Video } from 'lucide-react-native';
import { Card, CardTitle } from '../../components/Card';
import { CompactRow, SectionHeader } from '../../components/Paper';
import { allFeatures, belajarFeatureGroups } from '../../data/mobileFeatures';
import { colors, radius, spacing } from '../../theme';

export const LOCAL_TOOL_TYPES = [
  'tasbih',
  'zakat',
  'faraidh',
  'notifications',
  'surah-content',
  'sholat-tracker',
  'asmaul-wirid',
  'asmaul-flashcard',
  'forum',
  'historical-map',
  'tokoh',
];

const featureIcons = {
  'asbabun-nuzul': BookOpen,
  'asmaul-flashcard': Star,
  'asmaul-husna': Star,
  blog: BookOpen,
  bookmarks: Bookmark,
  'community-feed': MessageCircle,
  fiqh: BookOpen,
  goals: Star,
  'jarh-tadil': Scale,
  kajian: Video,
  kamus: Star,
  leaderboard: Users,
  manasik: BookOpen,
  notes: StickyNote,
  'panduan-sholat': BookOpen,
  perawi: Users,
  quiz: HelpCircle,
  sejarah: Globe,
  siroh: Users,
  stats: Globe,
  tafsir: BookOpen,
  'user-wird': ListChecks,
};

const catalogSections = belajarFeatureGroups.map((group) => ({
  key: group.key,
  meta: group.meta,
  rows: group.features.map((feature) => ({
    Icon: featureIcons[feature.key] ?? BookOpen,
    featureKey: feature.key,
  })),
  title: group.label,
}));

const normalizeSearchText = (value = '') => `${value}`.trim().toLowerCase();

const matchesCatalogQuery = (section, feature, query) => {
  const text = [section.title, section.meta, feature?.title, feature?.subtitle, feature?.group, feature?.key]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(query);
};

export const findFeatureByKey = (featureKey) => allFeatures.find((feature) => feature.key === featureKey);

export const isPaginatedFeature = (feature) =>
  feature?.type === 'feed' || (Boolean(feature?.endpoint) && ['list', 'protected-list'].includes(feature.type));

export const getFeatureBadges = (feature, recentFeatureKeys = {}) => {
  const badges = [];

  if (recentFeatureKeys[feature?.key]) badges.push('Terakhir');
  if (Array.isArray(feature?.badges)) badges.push(...feature.badges);
  if (['protected-list', 'bookmarks', 'notes'].includes(feature?.type)) badges.push('Akun');
  if (LOCAL_TOOL_TYPES.includes(feature?.type)) badges.push('Lokal');

  return [...new Set(badges)].slice(0, 3);
};

export const getVisibleCatalogSections = (featureSearch) => {
  const query = normalizeSearchText(featureSearch);
  return catalogSections
    .map((section) => {
      const rows = section.rows
        .map((row) => ({ ...row, feature: findFeatureByKey(row.featureKey) }))
        .filter((row) => row.feature && (!query || matchesCatalogQuery(section, row.feature, query)));
      return { ...section, rows };
    })
    .filter((section) => section.rows.length > 0);
};

function FeatureCatalogBase({
  featureSearch,
  onFeaturePress,
  onTogglePinnedFeature,
  pinnedFeatureKeys,
  recentFeatureKeys,
}) {
  const visibleSections = useMemo(() => getVisibleCatalogSections(featureSearch), [featureSearch]);
  const handleFeaturePress = useCallback(
    (featureKey) => {
      const feature = findFeatureByKey(featureKey);
      if (feature) onFeaturePress(feature);
    },
    [onFeaturePress],
  );
  const handleTogglePinnedFeature = useCallback(
    (event, featureKey) => {
      const feature = findFeatureByKey(featureKey);
      if (feature) onTogglePinnedFeature(event, feature);
    },
    [onTogglePinnedFeature],
  );

  if (!visibleSections.length) {
    return (
      <Card>
        <CardTitle meta="Kosong">Tidak ada hasil</CardTitle>
        <Text style={styles.body}>Coba kata lain seperti tafsir, kamus, siroh, atau quiz.</Text>
      </Card>
    );
  }

  return visibleSections.map((section) => (
    <Section key={section.key} section={section}>
      {section.rows.map((row) => {
        const pinned = Boolean(pinnedFeatureKeys[row.feature.key]);
        const badgeLabels = getFeatureBadges(row.feature, recentFeatureKeys).join('|');
        return (
          <FeatureRow
            badgeLabels={badgeLabels}
            Icon={row.Icon}
            featureKey={row.feature.key}
            key={row.feature.key}
            onFeaturePress={handleFeaturePress}
            onTogglePinnedFeature={handleTogglePinnedFeature}
            pinned={pinned}
            subtitle={row.feature.subtitle}
            title={row.feature.title}
          />
        );
      })}
    </Section>
  ));
}

function Section({ children, section }) {
  return (
    <Card style={styles.sectionCard}>
      <SectionHeader meta={section.meta} title={section.title} />
      {children}
    </Card>
  );
}

export const FeatureCatalog = memo(FeatureCatalogBase);

const FeatureRow = memo(function FeatureRow({
  Icon,
  badgeLabels,
  featureKey,
  onFeaturePress,
  onTogglePinnedFeature,
  pinned,
  subtitle,
  title,
}) {
  const badges = useMemo(() => (badgeLabels ? badgeLabels.split('|') : []), [badgeLabels]);
  const handlePress = useCallback(() => onFeaturePress(featureKey), [featureKey, onFeaturePress]);
  const handleTogglePinned = useCallback(
    (event) => onTogglePinnedFeature(event, featureKey),
    [featureKey, onTogglePinnedFeature],
  );

  return (
    <CompactRow
      badges={badges}
      Icon={Icon}
      onPress={handlePress}
      right={(
        <Pressable
          accessibilityLabel={pinned ? `Lepas ${title} dari Beranda` : `Sematkan ${title} ke Beranda`}
          accessibilityRole="button"
          accessibilityState={{ selected: pinned }}
          android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: true }}
          onPress={handleTogglePinned}
          style={[styles.pinButton, pinned && styles.pinButtonActive]}
        >
          <Star
            color={pinned ? colors.onPrimary : colors.primary}
            fill={pinned ? colors.onPrimary : 'transparent'}
            size={15}
            strokeWidth={2.2}
          />
        </Pressable>
      )}
      subtitle={subtitle}
      title={title}
    />
  );
});

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  pinButton: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.faint,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pinButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
