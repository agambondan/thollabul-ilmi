import {
  Bell,
  Book,
  BookOpenCheck,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Grid,
  HelpCircle,
  Moon,
  Search,
  Smile,
  Star,
  Sun,
  Sunset,
  Video,
} from 'lucide-react-native';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '../../components/ContentCard';
import { arabicTypography } from '../../styles/arabicTypography';
import { colors, radius, shadows, spacing } from '../../theme';

export const homeDashboardLayouts = {
  paper: 'paper',
  webApp: 'web_app',
};

export const prayerKeyLabels = {
  asr: 'Ashar',
  dhuhr: 'Dzuhur',
  fajr: 'Subuh',
  isha: 'Isya',
  maghrib: 'Maghrib',
};

export const prayerScheduleItems = [
  { Icon: Moon, key: 'fajr', label: 'Subuh' },
  { Icon: Sun, key: 'sunrise', label: 'Terbit' },
  { Icon: Sun, key: 'dhuhr', label: 'Dzuhur' },
  { Icon: Sunset, key: 'asr', label: 'Ashar' },
  { Icon: Sunset, key: 'maghrib', label: 'Maghrib' },
  { Icon: Moon, key: 'isha', label: 'Isya' },
];

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

const webDashboardColors = {
  accent: '#fbbf24',
  bg: '#020617',
  border: '#1e293b',
  borderSoft: '#064e3b',
  card: '#0f172a',
  cardDeep: '#111827',
  iconBg: '#0f3f3a',
  muted: '#94a3b8',
  primary: '#6ee7b7',
  primaryStrong: '#10b981',
  primarySoft: '#022c22',
  text: '#cbd5e1',
  title: '#f8fafc',
};

const webDashboardFontFamily = Platform.select({
  android: 'sans-serif',
  ios: 'System',
});

const formatHadisSource = (value = '') => {
  if (!value) return '';
  return value.replace(/\bHadith\b/g, 'Hadis');
};

export function getHomeDashboardRenderer(layoutMode) {
  return layoutMode === homeDashboardLayouts.webApp ? WebAppHomeDashboard : PaperHomeDashboard;
}

export function HomeDashboardContent({ isWebAppLayout, ...props }) {
  const Renderer = getHomeDashboardRenderer(
    isWebAppLayout ? homeDashboardLayouts.webApp : homeDashboardLayouts.paper,
  );
  return <Renderer {...props} />;
}

export function PaperHomeDashboard(props) {
  return (
    <DashboardContent
      {...props}
      layout={homeDashboardLayouts.paper}
      header={<PaperHomeHeader {...props} />}
    />
  );
}

export function WebAppHomeDashboard(props) {
  return (
    <DashboardContent
      {...props}
      layout={homeDashboardLayouts.webApp}
      header={<WebAppHomeGreeting displayName={props.displayName} gregorianDate={props.gregorianDate} />}
    />
  );
}

function PaperHomeHeader({ displayName, initials, locationLabel, navigation, onOpenTab }) {
  return (
    <View style={styles.header} testID="home-classic-header">
      <Pressable
        android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
        onPress={() => onOpenTab('profile')}
        style={styles.profile}
      >
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
        <Pressable
          android_ripple={{ color: 'rgba(91, 110, 91, 0.16)', borderless: true }}
          onPress={() => onOpenTab('belajar', { featureKey: 'notifications' })}
        >
          <Bell color={colors.muted} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function WebAppHomeGreeting({ displayName, gregorianDate }) {
  return (
    <View style={styles.webAppGreeting} testID="home-web-app-greeting">
      <Text style={styles.webAppGreetingTitle}>{`Assalamu'alaikum, ${displayName}`}</Text>
      <Text style={styles.webAppGreetingDate}>{gregorianDate}</Text>
    </View>
  );
}

function DashboardContent({
  contextualShortcuts,
  dailyAyah,
  dailyHadith,
  dailyMessage,
  gregorianDate,
  handleScrollActivity,
  hasPrayerSchedule,
  header,
  hijriDate,
  layout,
  loadingDaily,
  loadHomeData,
  navigation,
  nextPrayer,
  onOpenTab,
  pinnedFeatures,
  prayerMessage,
  prayerStatusLabel,
  prayerSummary,
  prayerTimes,
  recentFeatures,
  refreshing,
}) {
  const isWebApp = layout === homeDashboardLayouts.webApp;
  const primary = isWebApp ? webDashboardColors.primary : colors.primary;
  const accent = isWebApp ? webDashboardColors.accent : colors.accent;
  const muted = isWebApp ? webDashboardColors.muted : colors.muted;
  const menuGrid = (
    <View style={[styles.menuGrid, isWebApp && styles.webAppMenuGrid]} testID="home-menu-grid">
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
          <View style={[styles.menuIcon, isWebApp && styles.webAppIconTile]}>
            <Icon color={primary} size={18} strokeWidth={2.1} />
          </View>
          <Text style={[styles.menuLabel, isWebApp && styles.webAppMenuLabel]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.screen, isWebApp && styles.webAppScreen]}
      onMomentumScrollBegin={handleScrollActivity}
      refreshControl={
        <RefreshControl
          colors={[primary]}
          onRefresh={() => loadHomeData({ refresh: true })}
          refreshing={refreshing}
          tintColor={primary}
        />
      }
      onScroll={handleScrollActivity}
      onScrollBeginDrag={handleScrollActivity}
      scrollEventThrottle={250}
      showsVerticalScrollIndicator={false}
      style={[styles.scroll, isWebApp && styles.webAppScroll]}
      testID="home-scroll"
    >
      {header}

      <View style={[styles.prayerCard, isWebApp && styles.webAppPrayerCard]} testID="home-prayer-card">
        <View style={styles.prayerHeader}>
          <View style={[styles.prayerStatusPill, isWebApp && styles.webAppPill]}>
            <Clock3 color={primary} size={13} strokeWidth={2.4} />
            <Text style={[styles.prayerStatusText, isWebApp && styles.webAppPrimaryText]}>
              {prayerStatusLabel}
            </Text>
          </View>
          <View style={styles.prayerDateStack}>
            <Text style={[styles.gregorianDate, isWebApp && styles.webAppTitleText]}>{gregorianDate}</Text>
            <View style={styles.hijriRow}>
              <Moon color={accent} size={13} strokeWidth={2.3} />
              <Text style={[styles.hijriDate, isWebApp && styles.webAppAccentText]}>{hijriDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.prayerHero}>
          <Text style={[styles.prayerKicker, isWebApp && styles.webAppPrimaryText]}>
            {`Menuju ${prayerKeyLabels[nextPrayer.key] || 'Sholat'}`}
          </Text>
          <Text style={[styles.prayerTime, isWebApp && styles.webAppTitleText]}>{nextPrayer.time}</Text>
          <Text style={[styles.prayerSummary, isWebApp && styles.webAppMutedText]}>
            {prayerMessage || prayerSummary}
          </Text>
          <View style={[styles.countdown, isWebApp && styles.webAppPill]}>
            <Clock3 color={primary} size={13} strokeWidth={2.4} />
            <Text style={[styles.countdownText, isWebApp && styles.webAppPrimaryText]}>
              {hasPrayerSchedule ? nextPrayer.countdown : 'Belum aktif'}
            </Text>
          </View>
        </View>

        <View style={[styles.prayerTimeline, isWebApp && styles.webAppDivider]} />
        <View style={styles.prayerScheduleRow}>
          {prayerScheduleItems.map(({ Icon, key, label }) => {
            const isNext = key === nextPrayer.key && hasPrayerSchedule;
            return (
              <View key={key} style={styles.prayerScheduleItem}>
                <Text
                  style={[
                    styles.prayerScheduleLabel,
                    isWebApp && styles.webAppMutedText,
                    isNext ? (isWebApp ? styles.webAppAccentText : styles.prayerScheduleActive) : null,
                  ]}
                >
                  {label}
                </Text>
                <Icon color={isNext ? accent : primary} size={16} strokeWidth={2.2} />
                <Text
                  style={[
                    styles.prayerScheduleTime,
                    isWebApp && styles.webAppTitleText,
                    isNext ? (isWebApp ? styles.webAppAccentText : styles.prayerScheduleActive) : null,
                  ]}
                >
                  {prayerTimes?.[key] ?? '--:--'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {!isWebApp ? menuGrid : null}

      <View style={[styles.dailyCard, isWebApp && styles.webAppDailyCard]} testID="home-daily-card">
        <View style={styles.dailyHeader}>
          <Text style={[styles.dailyTitle, isWebApp && styles.webAppTitleText]}>Bacaan Hari Ini</Text>
          <Text style={[styles.dailyMeta, isWebApp && styles.webAppMutedText]}>Quran & Hadis</Text>
        </View>
        <Pressable
          android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
          onPress={() => onOpenTab('quran', { surahNumber: 1 })}
          style={[styles.dailyItem, isWebApp && styles.webAppDailyItem]}
        >
          <View style={[styles.dailyAccent, isWebApp && styles.webAppDailyAccent]} />
          <View style={styles.dailyBody}>
            <Text style={[styles.dailyLabel, isWebApp && styles.webAppPrimaryText]}>Ayat Hari Ini</Text>
            {dailyAyah?.arabic ? (
              <Text style={[styles.dailyArabic, isWebApp && styles.webAppTitleText]}>{dailyAyah.arabic}</Text>
            ) : null}
            <Text style={[styles.dailyText, isWebApp && styles.webAppText]}>
              {loadingDaily ? 'Memuat ayat harian...' : dailyAyah?.translation || dailyMessage || 'Ayat harian belum tersedia.'}
            </Text>
            {dailyAyah?.ref ? <Text style={[styles.dailySource, isWebApp && styles.webAppMutedText]}>{dailyAyah.ref}</Text> : null}
          </View>
        </Pressable>
        <Pressable
          android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
          onPress={() => onOpenTab('hadith')}
          style={[styles.dailyItem, isWebApp && styles.webAppDailyItem]}
        >
          <View style={[styles.dailyAccent, isWebApp && styles.webAppDailyAccent]} />
          <View style={styles.dailyBody}>
            <Text style={[styles.dailyLabel, isWebApp && styles.webAppPrimaryText]}>Hadis Hari Ini</Text>
            {dailyHadith?.arabic ? (
              <Text style={[styles.dailyArabic, isWebApp && styles.webAppTitleText]}>{dailyHadith.arabic}</Text>
            ) : null}
            <Text style={[styles.dailyText, isWebApp && styles.webAppText]}>
              {loadingDaily
                ? 'Memuat hadis harian...'
                : dailyHadith?.translation || 'Hadis harian belum tersedia dari server.'}
            </Text>
            {dailyHadith?.book ? (
              <Text style={[styles.dailySource, isWebApp && styles.webAppMutedText]}>{formatHadisSource(dailyHadith.book)}</Text>
            ) : null}
          </View>
        </Pressable>
      </View>

      {contextualShortcuts.length ? (
        <ContextShortcutsCard
          isWebApp={isWebApp}
          items={contextualShortcuts}
          onOpenTab={onOpenTab}
          primary={primary}
        />
      ) : null}

      {pinnedFeatures.length ? (
        <FeatureListCard
          Icon={Star}
          features={pinnedFeatures}
          isWebApp={isWebApp}
          meta="Shortcut fitur pilihanmu"
          muted={muted}
          onOpenTab={onOpenTab}
          primary={primary}
          title="Disematkan"
        />
      ) : null}

      {recentFeatures.length ? (
        <FeatureListCard
          Icon={Clock3}
          features={recentFeatures}
          isWebApp={isWebApp}
          meta="Lanjutkan fitur yang baru kamu pakai"
          muted={muted}
          onOpenTab={onOpenTab}
          primary={primary}
          title="Terakhir Dibuka"
        />
      ) : null}

      {isWebApp ? (
        <View style={styles.webAppQuickAccessBlock}>
          <Text style={styles.webAppSectionTitle}>Akses Cepat</Text>
          {menuGrid}
        </View>
      ) : null}

      <ContentCard
        Icon={Smile}
        iconStyle={[styles.journalIcon, isWebApp && styles.webAppIconTile]}
        onPress={() => onOpenTab('belajar', { featureKey: 'muhasabah' })}
        style={[styles.journalCard, isWebApp && styles.webAppCard]}
        subtitle="Bagaimana imanmu hari ini?"
        subtitleStyle={[styles.journalDesc, isWebApp && styles.webAppMutedText]}
        title="Jurnal Muhasabah"
        titleStyle={[styles.journalTitle, isWebApp && styles.webAppTitleText]}
        trailing={<ChevronRight color={muted} size={18} strokeWidth={2.4} />}
      />
    </ScrollView>
  );
}

function ContextShortcutsCard({ isWebApp, items, onOpenTab, primary }) {
  return (
    <View style={[styles.contextCard, isWebApp && styles.webAppCard]}>
      <Text style={[styles.contextLabel, isWebApp && styles.webAppMutedText]}>SARAN SEKARANG</Text>
      <View style={styles.contextRow}>
        {items.map(({ Icon, featureKey, label, params, sub, tab }) => (
          <Pressable
            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
            key={label}
            onPress={() => onOpenTab(tab, params ?? (featureKey ? { featureKey } : null))}
            style={[styles.contextItem, isWebApp && styles.webAppActionTile]}
          >
            <View style={[styles.contextIcon, isWebApp && styles.webAppIconTile]}>
              <Icon color={primary} size={16} strokeWidth={2.2} />
            </View>
            <Text style={[styles.contextItemLabel, isWebApp && styles.webAppTitleText]}>{label}</Text>
            <Text style={[styles.contextItemSub, isWebApp && styles.webAppMutedText]}>{sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FeatureListCard({ Icon, features, isWebApp, meta, muted, onOpenTab, primary, title }) {
  return (
    <View style={[styles.recentCard, isWebApp && styles.webAppCard]}>
      <View style={styles.recentHeader}>
        <View>
          <Text style={[styles.recentTitle, isWebApp && styles.webAppTitleText]}>{title}</Text>
          <Text style={[styles.recentMeta, isWebApp && styles.webAppMutedText]}>{meta}</Text>
        </View>
        <Icon color={primary} size={18} strokeWidth={2.2} />
      </View>
      {features.map((feature) => (
        <ContentCard
          Icon={Icon}
          iconStyle={[styles.recentIcon, isWebApp && styles.webAppIconTile]}
          key={feature.key}
          onPress={() => onOpenTab('belajar', { featureKey: feature.key })}
          style={[styles.recentRow, isWebApp && styles.webAppRow]}
          subtitle={feature.subtitle || feature.group || 'Belajar'}
          subtitleStyle={[styles.recentRowSubtitle, isWebApp && styles.webAppMutedText]}
          title={feature.title}
          titleStyle={[styles.recentRowTitle, isWebApp && styles.webAppTitleText]}
          trailing={<ChevronRight color={muted} size={18} strokeWidth={2.4} />}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  webAppScroll: {
    backgroundColor: webDashboardColors.bg,
  },
  screen: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  webAppScreen: {
    backgroundColor: webDashboardColors.bg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  webAppGreeting: {
    marginBottom: spacing.lg,
  },
  webAppGreetingTitle: {
    color: webDashboardColors.title,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppGreetingDate: {
    color: webDashboardColors.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    marginTop: spacing.xs,
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
    backgroundColor: webDashboardColors.card,
    borderColor: webDashboardColors.borderSoft,
    borderRadius: 24,
  },
  webAppCard: {
    backgroundColor: webDashboardColors.card,
    borderColor: webDashboardColors.border,
    borderRadius: radius.md,
  },
  webAppPill: {
    backgroundColor: webDashboardColors.primarySoft,
    borderColor: '#065f46',
  },
  webAppDivider: {
    backgroundColor: webDashboardColors.border,
  },
  webAppTitleText: {
    color: webDashboardColors.title,
    fontFamily: webDashboardFontFamily,
  },
  webAppText: {
    color: webDashboardColors.text,
  },
  webAppMutedText: {
    color: webDashboardColors.muted,
  },
  webAppPrimaryText: {
    color: webDashboardColors.primary,
  },
  webAppAccentText: {
    color: webDashboardColors.accent,
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
    backgroundColor: webDashboardColors.card,
    borderColor: webDashboardColors.border,
    borderRadius: radius.md,
    marginTop: 0,
  },
  webAppQuickAccessBlock: {
    marginBottom: spacing.md,
  },
  webAppSectionTitle: {
    color: webDashboardColors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  webAppIconTile: {
    backgroundColor: webDashboardColors.iconBg,
    borderColor: webDashboardColors.border,
  },
  webAppActionTile: {
    backgroundColor: webDashboardColors.cardDeep,
    borderColor: webDashboardColors.border,
  },
  webAppRow: {
    backgroundColor: webDashboardColors.cardDeep,
    borderColor: webDashboardColors.border,
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
  webAppMenuLabel: {
    color: webDashboardColors.text,
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
    backgroundColor: webDashboardColors.card,
    borderColor: webDashboardColors.border,
    borderRadius: radius.md,
    marginTop: 0,
  },
  webAppDailyItem: {
    backgroundColor: webDashboardColors.cardDeep,
    borderColor: webDashboardColors.border,
  },
  webAppDailyAccent: {
    backgroundColor: webDashboardColors.primaryStrong,
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
