import {
  Award,
  Bell,
  Book,
  BookMarked,
  BookOpen,
  BookText,
  Calculator,
  Calendar,
  FileText,
  Flag,
  History,
  Landmark,
  LibraryBig,
  List,
  Map,
  MessageCircle,
  MoonStar,
  NotebookTabs,
  Repeat,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Wallet,
  X,
} from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

export const webAppMenuGroups = [
  {
    key: 'main',
    title: 'BACAAN UTAMA',
    items: [
      { Icon: BookOpen, key: 'quran', label: 'Al-Quran', tab: 'quran' },
      { Icon: LibraryBig, key: 'hadith', label: 'Hadith', tab: 'hadith' },
      { Icon: BookText, key: 'perawi', label: 'Perawi Hadith', tab: 'belajar' },
      { Icon: BookMarked, key: 'khatam', label: 'Khatam Tracker', tab: 'quran' },
    ],
  },
  {
    key: 'tracker',
    title: 'IBADAH & TRACKER',
    items: [
      { Icon: Landmark, key: 'sholat-tracker', label: 'Sholat Tracker', tab: 'ibadah' },
      { Icon: BookOpen, key: 'panduan-sholat', label: 'Panduan Sholat', tab: 'ibadah' },
      { Icon: NotebookTabs, key: 'tilawah', label: 'Tilawah', tab: 'quran' },
      { Icon: Book, key: 'hafalan', label: 'Hafalan', tab: 'quran' },
      { Icon: Repeat, key: 'muroja-ah', label: "Muroja'ah", tab: 'quran' },
      { Icon: Repeat, key: 'tasbih', label: 'Tasbih Digital', tab: 'ibadah' },
      { Icon: List, key: 'amalan', label: 'Amalan', tab: 'ibadah' },
      { Icon: Sparkles, key: 'muhasabah', label: 'Muhasabah', tab: 'ibadah' },
      { Icon: Flag, key: 'goals', label: 'Target Belajar', tab: 'profile' },
    ],
  },
  {
    key: 'content',
    title: 'KONTEN ISLAM',
    items: [
      { Icon: BookOpen, key: 'tafsir', label: 'Tafsir Al-Quran', tab: 'belajar' },
      { Icon: BookOpen, key: 'asbabun-nuzul', label: 'Asbabun Nuzul', tab: 'belajar' },
      { Icon: Star, key: 'asmaul-husna', label: 'Asmaul Husna', tab: 'belajar' },
      { Icon: Sparkles, key: 'doa', label: 'Doa', tab: 'ibadah' },
      { Icon: BookText, key: 'dzikir', label: 'Dzikir', tab: 'ibadah' },
      { Icon: BookText, key: 'wirid', label: 'Wirid Sunnah', tab: 'ibadah' },
      { Icon: NotebookTabs, key: 'wirid-custom', label: 'Wirid Pribadi', tab: 'ibadah' },
      { Icon: Book, key: 'tahlil', label: 'Tahlil & Yasin', tab: 'belajar' },
      { Icon: MessageCircle, key: 'kajian', label: 'Kajian Islam', tab: 'belajar' },
      { Icon: BookOpen, key: 'siroh', label: 'Siroh', tab: 'belajar' },
      { Icon: BookOpen, key: 'fiqh', label: 'Fiqh Ringkas', tab: 'belajar' },
      { Icon: History, key: 'sejarah', label: 'Sejarah Islam', tab: 'belajar' },
      { Icon: UserRound, key: 'tokoh', label: 'Tokoh Islam', tab: 'belajar' },
      { Icon: Map, key: 'peta', label: 'Peta Interaktif', tab: 'belajar' },
      { Icon: BookOpen, key: 'manasik', label: 'Manasik', tab: 'belajar' },
      { Icon: BookMarked, key: 'library', label: 'Library', tab: 'belajar' },
      { Icon: FileText, key: 'blog', label: 'Artikel', tab: 'belajar' },
    ],
  },
  {
    key: 'tools',
    title: 'TOOLS',
    items: [
      { Icon: MoonStar, key: 'jadwal-sholat', label: 'Jadwal Sholat', tab: 'ibadah' },
      { Icon: Calendar, key: 'hijri', label: 'Kalender Hijriyah', tab: 'ibadah' },
      { Icon: BookText, key: 'kamus', label: 'Kamus Arab', tab: 'belajar' },
      { Icon: Target, key: 'kiblat', label: 'Kiblat', tab: 'ibadah' },
      { Icon: Calculator, key: 'faraidh', label: 'Faraidh', tab: 'ibadah' },
      { Icon: Wallet, key: 'zakat', label: 'Zakat', tab: 'ibadah' },
      { Icon: Search, key: 'search', label: 'Cari', tab: 'home', params: { view: 'global-search' } },
      { Icon: Trophy, key: 'quiz', label: 'Kuis', tab: 'belajar' },
      { Icon: Trophy, key: 'leaderboard', label: 'Leaderboard', tab: 'profile' },
      { Icon: Award, key: 'achievements', label: 'Pencapaian', tab: 'profile' },
      { Icon: Calendar, key: 'imsakiyah', label: 'Imsakiyah', tab: 'ibadah' },
    ],
  },
  {
    key: 'account',
    title: 'AKUN',
    items: [
      { Icon: UserRound, key: 'profile', label: 'Profile', tab: 'profile' },
      { Icon: BookMarked, key: 'bookmarks', label: 'Bookmark', tab: 'profile' },
      { Icon: FileText, key: 'notes', label: 'Catatan', tab: 'profile' },
      { Icon: Award, key: 'stats', label: 'Statistik', tab: 'profile' },
      { Icon: Bell, key: 'notifications', label: 'Notifikasi', tab: 'profile' },
    ],
  },
];

const sheet = {
  active: '#34d399',
  backdrop: 'rgba(2, 6, 23, 0.62)',
  border: '#243044',
  ink: '#f8fafc',
  muted: '#94a3b8',
  surface: '#111827',
};

export function MobileMenuSheet({ active, accountLabel = 'Tamu', onClose, onSelect, visible }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot} testID="mobile-menu-sheet">
        <Pressable
          accessibilityLabel="Tutup menu"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
          testID="mobile-menu-sheet-backdrop"
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Menu</Text>
              <Text style={styles.subtitle}>{accountLabel}</Text>
            </View>
            <Pressable
              accessibilityLabel="Tutup menu"
              accessibilityRole="button"
              android_ripple={{ color: '#1f2937', borderless: true }}
              onPress={onClose}
              style={styles.closeButton}
              testID="mobile-menu-sheet-close"
            >
              <X color={sheet.muted} size={20} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {webAppMenuGroups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.grid}>
                  {group.items.map((item) => {
                    const selected = active === item.tab || active === item.key;
                    const Icon = item.Icon;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        android_ripple={{ color: '#1f2937', borderless: false }}
                        key={item.key}
                        onPress={() => {
                          if (!selected) hapticSelection();
                          onSelect(item);
                        }}
                        style={[styles.item, selected && styles.itemActive]}
                        testID={`mobile-menu-item-${item.key}`}
                      >
                        <Icon color={selected ? sheet.active : '#cbd5e1'} size={15} strokeWidth={2} />
                        <Text numberOfLines={1} style={[styles.itemLabel, selected && styles.itemLabelActive]}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: sheet.backdrop,
  },
  sheet: {
    backgroundColor: sheet.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '78%',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: sheet.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    color: sheet.ink,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: sheet.muted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 1,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  groupTitle: {
    color: sheet.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  item: {
    alignItems: 'center',
    borderColor: sheet.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '48%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#065f46',
  },
  itemLabel: {
    color: '#e5e7eb',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
  },
  itemLabelActive: {
    color: sheet.active,
    fontWeight: '800',
  },
});
