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
import { StyleSheet, View } from 'react-native';
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
