import {
  BookOpenCheck,
  Calculator,
  CalendarDays,
  CheckSquare,
  Clock3,
  Compass,
  HandHeart,
  ListChecks,
  Map,
  ScrollText,
  Sparkles,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { CompactRow, SectionHeader } from '../components/Paper';
import { Screen } from '../components/Screen';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { radius, spacing } from '../theme';
import { KhatamScreen } from './KhatamScreen';
import { PrayerScreen } from './PrayerScreen';
import { QiblaScreen } from './QiblaScreen';

const sections = [
  {
    key: 'harian',
    meta: 'Sholat dan rutinitas',
    title: 'Harian',
    rows: [
      {
        Icon: Clock3,
        key: 'prayer',
        subtitle: 'Jadwal, pengingat, dan pengaturan waktu',
        title: 'Jadwal Sholat',
        view: 'prayer',
      },
      {
        Icon: HandHeart,
        featureKey: 'doa',
        subtitle: 'Doa harian per kategori',
        title: 'Doa',
      },
      {
        Icon: Sparkles,
        featureKey: 'dzikir',
        subtitle: 'Dzikir pagi, petang, dan setelah sholat',
        title: 'Dzikir',
      },
    ],
  },
  {
    key: 'arah-waktu',
    meta: 'Arah dan kalender',
    title: 'Arah & Waktu',
    rows: [
      {
        Icon: Compass,
        subtitle: 'Kompas kiblat dan lokasi manual',
        title: 'Qibla',
        view: 'qibla',
      },
      {
        Icon: CalendarDays,
        featureKey: 'hijri',
        subtitle: 'Tanggal Hijriah dan peristiwa',
        title: 'Kalender Hijriah',
      },
      {
        Icon: Clock3,
        featureKey: 'imsakiyah',
        subtitle: 'Jadwal imsak dan Ramadan',
        title: 'Imsakiyah',
      },
    ],
  },
  {
    key: 'bacaan',
    meta: 'Wirid dan bacaan',
    title: 'Dzikir & Bacaan',
    rows: [
      {
        Icon: ScrollText,
        featureKey: 'wirid',
        subtitle: 'Bacaan wirid rutin',
        title: 'Wirid',
      },
      {
        Icon: ListChecks,
        featureKey: 'user-wird',
        subtitle: 'Susun bacaan wirid pribadi',
        title: 'Wirid Saya',
      },
      {
        Icon: BookOpenCheck,
        featureKey: 'tahlil',
        subtitle: 'Tahlil dan Yasin digital',
        title: 'Tahlil',
      },
      {
        Icon: Sparkles,
        featureKey: 'asmaul-husna',
        subtitle: '99 nama Allah untuk dzikir dan refleksi',
        title: 'Asmaul Husna',
      },
    ],
  },
  {
    key: 'alat',
    meta: 'Kalkulator dan tools',
    title: 'Alat',
    rows: [
      {
        Icon: ListChecks,
        featureKey: 'tasbih',
        subtitle: 'Penghitung dzikir dengan target',
        title: 'Tasbih',
      },
      {
        Icon: Calculator,
        featureKey: 'zakat',
        subtitle: 'Hitung zakat maal',
        title: 'Zakat',
      },
      {
        Icon: Calculator,
        featureKey: 'faraidh',
        subtitle: 'Pembagian waris keluarga',
        title: 'Faraidh',
      },
    ],
  },
  {
    key: 'rencana',
    meta: 'Ibadah terencana',
    title: 'Rencana',
    rows: [
      {
        Icon: CheckSquare,
        featureKey: 'sholat-tracker',
        subtitle: 'Catat status sholat harian',
        title: 'Log Sholat',
      },
      {
        Icon: Map,
        featureKey: 'manasik',
        subtitle: 'Panduan haji dan umrah',
        title: 'Manasik',
      },
      {
        Icon: BookOpenCheck,
        key: 'khatam',
        subtitle: 'Tracker khatam Quran',
        title: 'Khatam',
        view: 'khatam',
      },
    ],
  },
];

const WEB_APP_IBADAH_BG = '#020617';
const WEB_APP_IBADAH_SURFACE = '#111827';
const WEB_APP_IBADAH_TILE = '#1e293b';
const WEB_APP_IBADAH_TILE_ACTIVE = '#064e3b';
const WEB_APP_IBADAH_BORDER = '#243044';
const WEB_APP_IBADAH_ACCENT = '#34d399';
const WEB_APP_IBADAH_MUTED = '#94a3b8';

function IbadahHub({ navigation, onOpenTab }) {
  const { isWebAppLayout } = useLayoutModePreference();

  const openRow = (row) => {
    if (row.view) {
      navigation?.open?.('ibadah', row.view);
      return;
    }

    if (row.tab) {
      onOpenTab?.(row.tab);
      return;
    }

    if (row.featureKey) {
      onOpenTab?.('belajar', { featureKey: row.featureKey });
    }
  };

  if (isWebAppLayout) {
    return (
      <ScrollView
        contentContainerStyle={styles.webAppContent}
        showsVerticalScrollIndicator={false}
        style={styles.webAppRoot}
      >
        <View testID="ibadah-web-app-hub" />
        <View style={styles.webAppHero}>
          <Text style={styles.webAppEyebrow}>IBADAH & TRACKER</Text>
          <Text style={styles.webAppTitle}>Ibadah</Text>
          <Text style={styles.webAppSubtitle}>
            Sholat, qibla, dzikir, bacaan, dan alat ibadah dalam satu hub ringkas.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.key} style={styles.webAppSection}>
            <View style={styles.webAppSectionHeader}>
              <Text style={styles.webAppSectionTitle}>{section.title.toUpperCase()}</Text>
              <Text style={styles.webAppSectionMeta}>{section.meta}</Text>
            </View>
            <View style={styles.webAppGrid}>
              {section.rows.map((row) => {
                const Icon = row.Icon;
                const primary = row.view === 'prayer' || row.view === 'qibla' || row.view === 'khatam';

                return (
                  <Pressable
                    android_ripple={{ color: '#1f2937', borderless: false }}
                    key={row.key ?? row.featureKey ?? row.title}
                    onPress={() => openRow(row)}
                    style={[styles.webAppTile, primary && styles.webAppTilePrimary]}
                  >
                    <View style={[styles.webAppIconWrap, primary && styles.webAppIconWrapPrimary]}>
                      <Icon color={primary ? '#ffffff' : WEB_APP_IBADAH_ACCENT} size={18} strokeWidth={2.2} />
                    </View>
                    <Text numberOfLines={1} style={styles.webAppTileTitle}>{row.title}</Text>
                    <Text numberOfLines={2} style={styles.webAppTileSubtitle}>{row.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <Screen
      contentStyle={isWebAppLayout ? styles.webAppSurface : null}
      subtitle="Sholat, qibla, dzikir, bacaan, dan alat ibadah dalam satu hub ringkas."
      title="Ibadah"
    >
      <View testID={isWebAppLayout ? 'ibadah-web-app-hub' : 'ibadah-classic-hub'} />
      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <SectionHeader meta={section.meta} title={section.title} />
          <Card style={styles.sectionCard}>
            {section.rows.map((row) => (
              <CompactRow
                Icon={row.Icon}
                key={row.key ?? row.featureKey ?? row.title}
                meta={row.view ? 'Ibadah' : row.tab === 'quran' ? 'Quran' : 'Belajar'}
                onPress={() => openRow(row)}
                subtitle={row.subtitle}
                title={row.title}
              />
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

export function IbadahScreen({ isActive, navigation, onOpenTab }) {
  const view = navigation?.current?.view;

  if (view === 'qibla') {
    return <QiblaScreen navigation={navigation} onBack={() => navigation?.close?.('ibadah')} onOpenTab={onOpenTab} />;
  }

  if (view === 'prayer' || view === 'settings') {
    return <PrayerScreen isActive={isActive} navigation={navigation} />;
  }

  if (view === 'khatam') {
    return <KhatamScreen isActive={isActive} navigation={navigation} onOpenTab={onOpenTab} />;
  }

  return <IbadahHub navigation={navigation} onOpenTab={onOpenTab} />;
}

const styles = StyleSheet.create({
  webAppRoot: {
    backgroundColor: WEB_APP_IBADAH_BG,
    flex: 1,
  },
  webAppContent: {
    backgroundColor: WEB_APP_IBADAH_BG,
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  webAppHero: {
    backgroundColor: WEB_APP_IBADAH_SURFACE,
    borderColor: WEB_APP_IBADAH_BORDER,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  webAppEyebrow: {
    color: WEB_APP_IBADAH_ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  webAppTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 34,
  },
  webAppSubtitle: {
    color: WEB_APP_IBADAH_MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  webAppSection: {
    marginTop: spacing.lg,
  },
  webAppSectionHeader: {
    marginBottom: spacing.sm,
  },
  webAppSectionTitle: {
    color: WEB_APP_IBADAH_ACCENT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppSectionMeta: {
    color: WEB_APP_IBADAH_MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  webAppGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  webAppTile: {
    backgroundColor: WEB_APP_IBADAH_TILE,
    borderColor: WEB_APP_IBADAH_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 118,
    minWidth: 146,
    padding: spacing.md,
  },
  webAppTilePrimary: {
    backgroundColor: WEB_APP_IBADAH_TILE_ACTIVE,
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  webAppIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.10)',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 34,
  },
  webAppIconWrapPrimary: {
    backgroundColor: '#059669',
  },
  webAppTileTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webAppTileSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  webAppSurface: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
});
