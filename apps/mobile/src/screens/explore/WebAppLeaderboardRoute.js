import { Trophy } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMobileLocale } from '../../i18n/MobileLocaleProvider';
import { radius, spacing } from '../../theme';

function LeaderboardRow({
  activeMeta,
  formatScore,
  getItemKey,
  getName,
  getRank,
  getScore,
  index,
  item,
  tab,
  t,
}) {
  const rank = getRank(item, index);
  const score = getScore(item);

  return (
    <View
      key={`${getItemKey(item)}-${tab}-${index}`}
      style={[
        styles.row,
        rank === 1 && styles.rowTop,
      ]}
      testID="web-app-leaderboard-row"
    >
      <View style={[styles.rank, rank <= 3 && styles.rankTop]}>
        <Text style={[styles.rankText, rank <= 3 && styles.rankTextTop]}>
          {rank}
        </Text>
      </View>
      <View style={styles.titleBlock}>
        <Text numberOfLines={1} style={styles.name}>
          {getName(item, index)}
        </Text>
        <Text style={styles.meta}>
          {rank <= 3 ? t('explore.leaderboard.topPerformer') : t('explore.leaderboard.participant')}
        </Text>
      </View>
      <Text style={[styles.score, rank === 1 && styles.scoreTop]}>
        {formatScore(score)} <Text style={styles.unit}>{activeMeta.unit}</Text>
      </Text>
    </View>
  );
}

export function WebAppLeaderboardRoute({
  activeTab,
  entries,
  error,
  formatScore,
  getItemKey,
  getName,
  getRank,
  getScore,
  hasItems,
  loading,
  onSelectTab,
  tabs,
}) {
  const { t } = useMobileLocale();
  const activeMeta = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.root}
    >
      <View testID="explore-web-app-leaderboard-surface" />
        <View style={styles.header}>
        <Trophy color="#f59e0b" fill="#f59e0b" size={20} strokeWidth={2.2} />
        <Text style={styles.title}>{t('explore.leaderboard.title')}</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => onSelectTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            testID={`web-app-leaderboard-tab-${tab.key}`}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.notice}>{error}</Text> : null}
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#047857" size="small" />
          <Text style={styles.stateText}>{t('explore.leaderboard.loading')}</Text>
        </View>
      ) : null}
      {!loading && !error && hasItems ? (
        <>
          {entries.length ? (
            <View style={styles.list}>
              {entries.map((item, index) => (
                <LeaderboardRow
                  activeMeta={activeMeta}
                  formatScore={formatScore}
                  getItemKey={getItemKey}
                  getName={getName}
                  getRank={getRank}
                  getScore={getScore}
                  index={index}
                  item={item}
                  key={`${getItemKey(item)}-${activeTab}-${index}`}
                  tab={activeTab}
                  t={t}
                />
              ))}
            </View>
          ) : (
            <LeaderboardEmpty t={t} />
          )}
        </>
      ) : null}
      {!loading && !error && !hasItems ? <LeaderboardEmpty t={t} /> : null}
    </ScrollView>
  );
}

function LeaderboardEmpty({ t }) {
  return (
    <View style={styles.empty}>
      <Trophy color="#e5e7eb" fill="#e5e7eb" size={38} strokeWidth={1.6} />
      <Text style={styles.emptyText}>
        {t('explore.leaderboard.empty')}
      </Text>
    </View>
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
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 26,
  },
  tabs: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.xl,
    padding: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    elevation: 1,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#047857',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.md,
  },
  rowTop: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.32)',
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  meta: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  rank: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  rankTop: {
    backgroundColor: '#fef3c7',
  },
  rankText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
  rankTextTop: {
    color: '#fbbf24',
  },
  score: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '900',
  },
  scoreTop: {
    color: '#fbbf24',
  },
  unit: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 160,
  },
  stateText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
  },
  notice: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 8,
    borderWidth: 1,
    color: '#92400e',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
    padding: spacing.md,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});
