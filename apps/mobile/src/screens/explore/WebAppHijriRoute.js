import { CalendarDays } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMobileLocale } from '../../i18n/MobileLocaleProvider';
import { radius, spacing } from '../../theme';

const HIJRI_MONTHS = [
  '',
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadal Ula',
  'Jumadal Akhirah',
  'Rajab',
  "Sya'ban",
  'Ramadan',
  'Syawal',
  "Dzulqa'dah",
  'Dzulhijjah',
];

const PUASA_SUNNAH = [
  {
    days: [13, 14, 15],
    id: 'ayyamul_bidh',
    labelKey: 'explore.hijri.fast.ayyamulBidh',
    type: 'monthly',
  },
  {
    id: 'arafah',
    labelKey: 'explore.hijri.fast.arafah',
    month: 12,
    day: 9,
    type: 'fixed',
  },
  {
    days: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    id: 'dzulhijjah_1_9',
    labelKey: 'explore.hijri.fast.dzulhijjahFirstNine',
    month: 12,
    type: 'range',
  },
  {
    days: [9, 10],
    id: 'tasua_asyura',
    labelKey: 'explore.hijri.fast.tasuaAsyura',
    month: 1,
    type: 'range',
  },
  {
    id: 'muharram',
    labelKey: 'explore.hijri.fast.muharram',
    month: 1,
    type: 'month',
  },
  {
    id: 'syaban',
    labelKey: 'explore.hijri.fast.syaban',
    month: 8,
    type: 'month',
  },
];

const getRaw = (item) => item?.raw ?? {};
const getTitle = (item, index, t) =>
  getRaw(item).translation?.title_idn ??
  getRaw(item).translation?.title_en ??
  getRaw(item).translation?.idn ??
  getRaw(item).translation?.en ??
  getRaw(item).name ??
  item?.title ??
  t('explore.hijri.eventFallback', { number: index + 1 });
const getBody = (item) =>
  getRaw(item).translation?.description_idn ??
  getRaw(item).translation?.description_en ??
  getRaw(item).description ??
  item?.body ??
  '';
const getEventMeta = (item) => {
  const raw = getRaw(item);
  const parts = [];
  if (raw.hijri_day && raw.hijri_month) parts.push(`${raw.hijri_day}/${raw.hijri_month} H`);
  if (raw.category) parts.push(String(raw.category));
  return parts.join(' · ');
};
const getToday = (items) => items.find((item) => getRaw(item).type === 'hijri_today' || item?.id === 'hijri-today');
const getEvents = (items, today) => items.filter((item) => item !== today);
const getHijriMonth = (raw) => {
  if (raw.month) return Number(raw.month);
  const monthIndex = HIJRI_MONTHS.findIndex((month) => (
    month.toLowerCase() === String(raw.month_name ?? '').toLowerCase()
  ));
  return monthIndex > 0 ? monthIndex : 0;
};
const formatTodayHijri = (item, t) => {
  const raw = getRaw(item);
  if (raw.date_str) return raw.date_str;
  if (raw.day && raw.month_name && raw.year) return `${raw.day} ${raw.month_name} ${raw.year} H`;
  return item?.body ?? t('explore.hijri.todayUnavailable');
};
const formatTodayArabic = (item, t) => {
  const raw = getRaw(item);
  if (raw.day && raw.month_name && raw.year) {
    return `${raw.day} ${raw.month_name} ${raw.year} هـ`;
  }
  return formatTodayHijri(item, t);
};
const formatGregorian = (raw) => {
  if (raw.gregorian_year && raw.gregorian_month && raw.gregorian_day) {
    return `${raw.gregorian_year}-${String(raw.gregorian_month).padStart(2, '0')}-${String(raw.gregorian_day).padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
};
const daysUntilRamadan = (raw) => {
  const day = Number(raw.day ?? 1);
  const month = getHijriMonth(raw) || 1;
  if (month === 9) return 0;
  const monthsLeft = month < 9 ? 9 - month : 12 - month + 9;
  return (30 - day + 1) + Math.max(0, monthsLeft - 1) * 30 - 1;
};
const getTodayFasts = (raw) => {
  const day = Number(raw.day ?? 0);
  const month = getHijriMonth(raw);
  return PUASA_SUNNAH.filter((item) => {
    if (item.type === 'monthly') return item.days.includes(day);
    if (item.type === 'fixed') return item.month === month && item.day === day;
    if (item.type === 'range') return item.month === month && item.days.includes(day);
    if (item.type === 'month') return item.month === month;
    return false;
  });
};
const getUpcomingFasts = (raw) => {
  const currentDay = Number(raw.day ?? 1);
  const currentMonth = getHijriMonth(raw) || 1;
  return PUASA_SUNNAH.filter((item) => (
    item.type === 'fixed' || item.type === 'monthly' || item.type === 'range'
  )).map((item) => {
    const targetMonth = item.month ?? currentMonth;
    const targetDay = item.day ?? item.days?.find((day) => day >= currentDay) ?? item.days?.[0] ?? 1;
    const monthDistance = targetMonth >= currentMonth
      ? targetMonth - currentMonth
      : 12 - currentMonth + targetMonth;
    const days = monthDistance * 30 + targetDay - currentDay;
    return {
      ...item,
      days: days < 0 ? days + 360 : days,
      date: `${targetDay} ${HIJRI_MONTHS[targetMonth] ?? 'Hijri'}`,
    };
  }).sort((a, b) => a.days - b.days).slice(0, 3);
};

function EventCard({ index, item, t }) {
  const meta = getEventMeta(item);
  return (
    <View style={styles.eventCard} testID="web-app-hijri-event-card">
      <View style={styles.eventDateBadge}>
        <Text style={styles.eventDateText}>{getRaw(item).hijri_day ?? index + 1}</Text>
      </View>
      <View style={styles.eventMain}>
        {meta ? <Text style={styles.eventMeta}>{meta}</Text> : null}
        <Text style={styles.eventTitle}>{getTitle(item, index, t)}</Text>
        {getBody(item) ? <Text numberOfLines={3} style={styles.eventBody}>{getBody(item)}</Text> : null}
      </View>
    </View>
  );
}

export function WebAppHijriRoute({
  error,
  items = [],
  loading,
}) {
  const { t } = useMobileLocale();
  const today = getToday(items);
  const todayRaw = getRaw(today);
  const events = getEvents(items, today);
  const ramadanDays = daysUntilRamadan(todayRaw);
  const isRamadan = getHijriMonth(todayRaw) === 9;
  const todayFasts = getTodayFasts(todayRaw);
  const upcomingFasts = getUpcomingFasts(todayRaw);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.root}>
      <View testID="explore-web-app-hijri-surface" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('explore.hijri.title')}</Text>
      </View>

      {today ? (
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>{t('explore.hijri.today')}</Text>
          <Text style={styles.todayArabic}>{formatTodayArabic(today, t)}</Text>
          <Text style={styles.todayText}>{formatTodayHijri(today, t)}</Text>
        </View>
      ) : null}

      {today ? (
        <>
          <View style={styles.countdownCard}>
            <View style={styles.countdownIcon}>
              <CalendarDays color="#fde68a" size={22} strokeWidth={2.2} />
            </View>
            <View style={styles.countdownText}>
              <Text style={styles.countdownEyebrow}>{isRamadan ? t('explore.hijri.ramadanMonth') : t('explore.hijri.toRamadan')}</Text>
              <Text style={styles.countdownTitle}>
                {isRamadan ? todayRaw.day : ramadanDays}
                <Text style={styles.countdownUnit}>{isRamadan ? t('explore.hijri.ramadanDayUnit') : t('explore.hijri.daysLeftUnit')}</Text>
              </Text>
              <Text style={styles.countdownBody}>
                {formatTodayHijri(today, t)}
              </Text>
            </View>
          </View>

          <View style={styles.fastingCard}>
            <View style={styles.fastingHeader}>
              <CalendarDays color="#059669" size={18} strokeWidth={2.2} />
              <Text style={styles.fastingTitle}>{t('explore.hijri.fastingTitle')}</Text>
            </View>
            <View style={styles.fastingToday}>
              <Text style={styles.fastingTodayLabel}>{t('explore.hijri.today')}</Text>
              {todayFasts.length ? (
                todayFasts.map((item) => (
                  <Text key={item.id} style={styles.fastingTodayText}>{t(item.labelKey)}</Text>
                ))
              ) : (
                <Text style={styles.fastingEmptyText}>{t('explore.hijri.noSpecialFastToday')}</Text>
              )}
            </View>
            {upcomingFasts.length ? (
              <View style={styles.upcomingList}>
                <Text style={styles.upcomingTitle}>{t('explore.hijri.upcoming')}</Text>
                {upcomingFasts.map((item) => (
                  <View key={item.id} style={styles.upcomingRow}>
                    <View style={styles.upcomingDayBadge}>
                      <Text style={styles.upcomingDayText}>{item.days}</Text>
                    </View>
                    <View style={styles.upcomingTextWrap}>
                      <Text style={styles.upcomingLabel}>{t(item.labelKey)}</Text>
                      <Text style={styles.upcomingDate}>{item.date} H</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.fastingNote}>
              <Text style={styles.fastingNoteText}>
                {t('explore.hijri.fastingNote')}
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.converterCard}>
        <Text style={styles.converterTitle}>{t('explore.hijri.converterTitle')}</Text>
        <View style={styles.converterRow}>
          <Text style={styles.converterInput}>{formatGregorian(todayRaw)}</Text>
          <Text style={styles.converterButton}>{t('explore.hijri.convert')}</Text>
        </View>
        {today ? (
          <View style={styles.converterResult}>
            <Text style={styles.converterResultArabic}>{formatTodayArabic(today, t)}</Text>
            <Text style={styles.converterResultText}>{formatTodayHijri(today, t)}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#059669" size="small" />
          <Text style={styles.stateText}>{t('explore.hijri.loading')}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{t('explore.hijri.loadError')}</Text> : null}

      {!loading && !error && events.length ? (
        <View style={styles.events}>
          <Text style={styles.sectionTitle}>{t('explore.hijri.eventsTitle')}</Text>
          {events.slice(0, 8).map((item, index) => (
            <EventCard index={index} item={item} key={`${item?.id ?? getTitle(item, index, t)}-${index}`} t={t} />
          ))}
        </View>
      ) : null}

      {!loading && !error && !items.length ? (
        <View style={styles.empty}>
          <CalendarDays color="#9ca3af" size={32} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>{t('explore.hijri.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('explore.hijri.emptyText')}</Text>
        </View>
      ) : null}
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
    marginBottom: spacing.md,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  todayCard: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: radius.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  todayLabel: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  todayArabic: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
  },
  todayText: {
    color: '#d1fae5',
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  countdownCard: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  countdownIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  countdownText: {
    flex: 1,
    minWidth: 0,
  },
  countdownEyebrow: {
    color: '#d1fae5',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  countdownTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  countdownUnit: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '800',
  },
  countdownBody: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  fastingCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  fastingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fastingTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  fastingToday: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  fastingTodayLabel: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  fastingTodayText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 19,
  },
  fastingEmptyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  upcomingList: {
    marginTop: spacing.md,
  },
  upcomingTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  upcomingRow: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  upcomingDayBadge: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 34,
    width: 48,
  },
  upcomingDayText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
  upcomingTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  upcomingLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  upcomingDate: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  fastingNote: {
    backgroundColor: '#fffbeb',
    borderRadius: radius.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  fastingNoteText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  converterCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  converterTitle: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  converterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  converterInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
    borderRadius: radius.sm,
    borderWidth: 1,
    color: '#374151',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  converterButton: {
    backgroundColor: '#047857',
    borderRadius: radius.sm,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  converterResult: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  converterResultArabic: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  converterResultText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 120,
  },
  stateText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '800',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  events: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  eventCard: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  eventDateBadge: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  eventDateText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  eventMain: {
    flex: 1,
    minWidth: 0,
  },
  eventMeta: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 2,
  },
  eventTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  eventBody: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 150,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
