import { useMemo, useState } from "react";
import {
    Bell,
    Book,
    BookOpenCheck,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Clock3,
    Compass,
    FileText,
    Grid,
    HelpCircle,
    MessageCircle,
    Moon,
    Search,
    Smile,
    Star,
    Sun,
    Sunset,
    Video,
} from "lucide-react-native";
import {
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ContentCard } from "../../components/ContentCard";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import {
    defaultMobileLanguage,
    translateMobile,
} from "../../i18n/translations";
import { arabicTypography } from "../../styles/arabicTypography";
import { colors, radius, shadows, spacing } from "../../theme";

export const homeDashboardLayouts = {
    paper: "paper",
    webApp: "web_app",
};

export const prayerKeyLabels = {
    asr: "Ashar",
    dhuhr: "Dzuhur",
    fajr: "Subuh",
    isha: "Isya",
    maghrib: "Maghrib",
};

export const prayerScheduleItems = [
    { Icon: Moon, key: "fajr", label: "Subuh" },
    { Icon: Sun, key: "sunrise", label: "Terbit" },
    { Icon: Sun, key: "dhuhr", label: "Dzuhur" },
    { Icon: Sunset, key: "asr", label: "Ashar" },
    { Icon: Sunset, key: "maghrib", label: "Maghrib" },
    { Icon: Moon, key: "isha", label: "Isya" },
];

const menuItems = [
    {
        Icon: Compass,
        key: "ibadah",
        labelKey: "home.menu.qibla",
        params: { view: "qibla" },
    },
    { Icon: BookOpenCheck, key: "quran", labelKey: "home.menu.memory" },
    {
        Icon: Smile,
        featureKey: "muhasabah",
        key: "belajar",
        labelKey: "home.menu.journal",
    },
    {
        Icon: HelpCircle,
        featureKey: "quiz",
        key: "belajar",
        labelKey: "home.menu.quiz",
    },
    {
        Icon: Video,
        featureKey: "kajian",
        key: "belajar",
        labelKey: "home.menu.kajian",
    },
    {
        Icon: FileText,
        featureKey: "tafsir",
        key: "belajar",
        labelKey: "home.menu.tafsir",
    },
    { Icon: Book, key: "hadith", labelKey: "home.menu.hadith" },
    {
        Icon: Grid,
        internalView: "feature-directory",
        key: "belajar",
        labelKey: "home.menu.more",
    },
];

const webDashboardDarkColors = {
    accent: "#fbbf24",
    bg: "#020617",
    border: "#1e293b",
    borderSoft: "#064e3b",
    card: "#0f172a",
    cardDeep: "#111827",
    iconBg: "#0f3f3a",
    muted: "#94a3b8",
    primary: "#6ee7b7",
    primaryStrong: "#10b981",
    primarySoft: "#022c22",
    text: "#cbd5e1",
    title: "#f8fafc",
};

const webDashboardLightColors = {
    accent: "#0f766e",
    bg: "#ffffff",
    border: "#e5e7eb",
    borderSoft: "#a7f3d0",
    card: "#ffffff",
    cardDeep: "#f8fafc",
    iconBg: "#ecfdf5",
    muted: "#64748b",
    primary: "#047857",
    primaryStrong: "#059669",
    primarySoft: "#ecfdf5",
    reminderCard: "#ecfdf5",
    text: "#475569",
    title: "#111827",
};

const getWebDashboardColors = (isDarkTheme) =>
    isDarkTheme ? webDashboardDarkColors : webDashboardLightColors;

const webDashboardFontFamily = Platform.select({
    android: "sans-serif",
    ios: "System",
});

const createWebDashboardStyles = (dashboardColors) => ({
    accentText: { color: dashboardColors.accent },
    actionTile: {
        backgroundColor: dashboardColors.cardDeep,
        borderColor: dashboardColors.border,
    },
    card: {
        backgroundColor: dashboardColors.card,
        borderColor: dashboardColors.border,
    },
    divider: { backgroundColor: dashboardColors.border },
    iconTile: {
        backgroundColor: dashboardColors.iconBg,
        borderColor: dashboardColors.border,
    },
    menuGrid: {
        backgroundColor: dashboardColors.card,
        borderColor: dashboardColors.border,
    },
    menuLabel: { color: dashboardColors.text },
    mutedText: { color: dashboardColors.muted },
    pill: {
        backgroundColor: dashboardColors.primarySoft,
        borderColor: dashboardColors.borderSoft,
    },
    prayerCard: {
        backgroundColor: dashboardColors.card,
        borderColor: dashboardColors.borderSoft,
    },
    primaryText: { color: dashboardColors.primary },
    row: {
        backgroundColor: dashboardColors.cardDeep,
        borderColor: dashboardColors.border,
    },
    screen: { backgroundColor: dashboardColors.bg },
    scroll: { backgroundColor: dashboardColors.bg },
    sectionTitle: { color: dashboardColors.text },
    titleText: { color: dashboardColors.title },
});

const formatHadisSource = (value = "") => {
    if (!value) return "";
    return value.replace(/\bHadith\b/g, "Hadis");
};

const defaultT = (key, values) =>
    translateMobile(defaultMobileLanguage, key, values);

const buildWebAppDailySlides = ({
    colors: dashboardColors = webDashboardDarkColors,
    dailyAyah,
    dailyHadith,
    dailyMessage,
    dailyReminders,
    loadingDaily,
    t = defaultT,
}) => {
    const ayahSlide = {
        Icon: Book,
        accentColor: dashboardColors.primary,
        arabic: dailyAyah?.arabic,
        key: "ayah",
        source: dailyAyah?.ref,
        text: loadingDaily
            ? t("home.daily.ayah.loading")
            : dailyAyah?.translation ||
              dailyMessage ||
              t("home.daily.ayah.empty"),
        title: t("home.daily.ayah.title"),
    };
    const hadithSlide = {
        Icon: BookOpenCheck,
        accentColor: dashboardColors.accent,
        arabic: dailyHadith?.arabic,
        key: "hadith",
        source: dailyHadith?.book ? formatHadisSource(dailyHadith.book) : "",
        text: loadingDaily
            ? t("home.daily.hadith.loading")
            : dailyHadith?.translation || t("home.daily.hadith.empty"),
        title: t("home.daily.hadith.title"),
    };

    const reminderSlides = (dailyReminders ?? [])
        .map((reminder, index) => ({
            Icon: MessageCircle,
            accentColor: "#38bdf8",
            arabic: null,
            key: `reminder-${reminder.id ?? index}`,
            source: reminder.source || t("home.daily.reminder.source"),
            text: reminder.text,
            title: reminder.title || t("home.daily.reminder.title"),
        }))
        .filter((slide) => slide.text);

    return [ayahSlide, hadithSlide, ...reminderSlides];
};

export function getHomeDashboardRenderer(layoutMode) {
    return layoutMode === homeDashboardLayouts.webApp
        ? WebAppHomeDashboard
        : PaperHomeDashboard;
}

export function HomeDashboardContent({
    isDarkTheme = false,
    isWebAppLayout,
    ...props
}) {
    const { t } = useMobileLocale();
    const Renderer = getHomeDashboardRenderer(
        isWebAppLayout
            ? homeDashboardLayouts.webApp
            : homeDashboardLayouts.paper,
    );
    return <Renderer isDarkTheme={isDarkTheme} t={t} {...props} />;
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
    const dashboardColors = getWebDashboardColors(props.isDarkTheme);
    return (
        <DashboardContent
            {...props}
            layout={homeDashboardLayouts.webApp}
            header={
                <WebAppHomeGreeting
                    colors={dashboardColors}
                    displayName={props.displayName}
                    gregorianDate={props.gregorianDate}
                />
            }
        />
    );
}

function PaperHomeHeader({
    displayName,
    initials,
    locationLabel,
    navigation,
    onOpenTab,
}) {
    return (
        <View style={styles.header} testID='home-classic-header'>
            <Pressable
                android_ripple={{
                    color: "rgba(91, 110, 91, 0.12)",
                    borderless: false,
                }}
                onPress={() => onOpenTab("profile")}
                style={styles.profile}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials || "TI"}</Text>
                </View>
                <View>
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.location}>{locationLabel}</Text>
                </View>
            </Pressable>
            <View style={styles.headerActions}>
                <Pressable
                    android_ripple={{
                        color: "rgba(91, 110, 91, 0.16)",
                        borderless: true,
                    }}
                    onPress={() => {
                        if (navigation?.open) {
                            navigation.open("home", "global-search");
                        } else {
                            onOpenTab("belajar", {
                                featureKey: "kamus",
                                focusSearch: true,
                            });
                        }
                    }}
                >
                    <Search color={colors.muted} size={18} strokeWidth={2.2} />
                </Pressable>
                <Pressable
                    android_ripple={{
                        color: "rgba(91, 110, 91, 0.16)",
                        borderless: true,
                    }}
                    onPress={() =>
                        onOpenTab("belajar", { featureKey: "notifications" })
                    }
                >
                    <Bell color={colors.muted} size={18} strokeWidth={2.2} />
                </Pressable>
            </View>
        </View>
    );
}

function WebAppHomeGreeting({
    colors: dashboardColors = webDashboardDarkColors,
    displayName,
    gregorianDate,
}) {
    return (
        <View style={styles.webAppGreeting} testID='home-web-app-greeting'>
            <Text
                style={[
                    styles.webAppGreetingTitle,
                    { color: dashboardColors.title },
                ]}
            >{`Assalamu'alaikum, ${displayName}`}</Text>
            <Text
                style={[
                    styles.webAppGreetingDate,
                    { color: dashboardColors.muted },
                ]}
            >
                {gregorianDate}
            </Text>
        </View>
    );
}

function DashboardContent({
    contextualShortcuts,
    dailyAyah,
    dailyHadith,
    dailyReminders,
    dailyMessage,
    gregorianDate,
    handleScrollActivity,
    hasPrayerSchedule,
    header,
    hijriDate,
    isDarkTheme,
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
    t = defaultT,
}) {
    const isWebApp = layout === homeDashboardLayouts.webApp;
    const dashboardColors = isWebApp
        ? getWebDashboardColors(isDarkTheme)
        : null;
    const webStyles = isWebApp ? createWebDashboardStyles(dashboardColors) : {};
    const primary = isWebApp ? dashboardColors.primary : colors.primary;
    const accent = isWebApp ? dashboardColors.accent : colors.accent;
    const muted = isWebApp ? dashboardColors.muted : colors.muted;
    const menuGrid = (
        <View
            style={[
                styles.menuGrid,
                isWebApp && styles.webAppMenuGrid,
                webStyles.menuGrid,
            ]}
            testID='home-menu-grid'
        >
            {menuItems.map(
                ({ Icon, featureKey, internalView, key, labelKey, params }) => (
                    <Pressable
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.14)",
                            borderless: false,
                        }}
                        key={labelKey}
                        onPress={() => {
                            if (internalView && navigation?.open) {
                                navigation.open("home", internalView);
                                return;
                            }
                            onOpenTab(
                                key,
                                params ?? (featureKey ? { featureKey } : null),
                            );
                        }}
                        style={styles.menuItem}
                    >
                        <View
                            style={[
                                styles.menuIcon,
                                isWebApp && styles.webAppIconTile,
                                webStyles.iconTile,
                            ]}
                        >
                            <Icon color={primary} size={18} strokeWidth={2.1} />
                        </View>
                        <Text
                            style={[
                                styles.menuLabel,
                                isWebApp && styles.webAppMenuLabel,
                                webStyles.menuLabel,
                            ]}
                        >
                            {t(labelKey)}
                        </Text>
                    </Pressable>
                ),
            )}
        </View>
    );

    return (
        <ScrollView
            contentContainerStyle={[
                styles.screen,
                isWebApp && styles.webAppScreen,
                webStyles.screen,
            ]}
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
            style={[
                styles.scroll,
                isWebApp && styles.webAppScroll,
                webStyles.scroll,
            ]}
            testID='home-scroll'
        >
            {header}

            <View
                style={[
                    styles.prayerCard,
                    isWebApp && styles.webAppPrayerCard,
                    webStyles.prayerCard,
                ]}
                testID='home-prayer-card'
            >
                <View style={styles.prayerHeader}>
                    <View
                        style={[
                            styles.prayerStatusPill,
                            isWebApp && styles.webAppPill,
                            webStyles.pill,
                        ]}
                    >
                        <Clock3 color={primary} size={13} strokeWidth={2.4} />
                        <Text
                            style={[
                                styles.prayerStatusText,
                                isWebApp && styles.webAppPrimaryText,
                                webStyles.primaryText,
                            ]}
                        >
                            {prayerStatusLabel}
                        </Text>
                    </View>
                    <View style={styles.prayerDateStack}>
                        <Text
                            style={[
                                styles.gregorianDate,
                                isWebApp && styles.webAppTitleText,
                                webStyles.titleText,
                            ]}
                        >
                            {gregorianDate}
                        </Text>
                        <View style={styles.hijriRow}>
                            <Moon color={accent} size={13} strokeWidth={2.3} />
                            <Text
                                style={[
                                    styles.hijriDate,
                                    isWebApp && styles.webAppAccentText,
                                    webStyles.accentText,
                                ]}
                            >
                                {hijriDate}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.prayerHero}>
                    <Text
                        style={[
                            styles.prayerKicker,
                            isWebApp && styles.webAppPrimaryText,
                            webStyles.primaryText,
                        ]}
                    >
                        {t("home.prayer.towards", {
                            prayer: prayerKeyLabels[nextPrayer.key] || "Sholat",
                        })}
                    </Text>
                    <Text
                        style={[
                            styles.prayerTime,
                            isWebApp && styles.webAppTitleText,
                            webStyles.titleText,
                        ]}
                    >
                        {nextPrayer.time}
                    </Text>
                    <Text
                        style={[
                            styles.prayerSummary,
                            isWebApp && styles.webAppMutedText,
                            webStyles.mutedText,
                        ]}
                    >
                        {prayerMessage || prayerSummary}
                    </Text>
                    <View
                        style={[
                            styles.countdown,
                            isWebApp && styles.webAppPill,
                            webStyles.pill,
                        ]}
                    >
                        <Clock3 color={primary} size={13} strokeWidth={2.4} />
                        <Text
                            style={[
                                styles.countdownText,
                                isWebApp && styles.webAppPrimaryText,
                                webStyles.primaryText,
                            ]}
                        >
                            {hasPrayerSchedule
                                ? nextPrayer.countdown
                                : t("home.prayer.inactive")}
                        </Text>
                    </View>
                </View>

                <View
                    style={[
                        styles.prayerTimeline,
                        isWebApp && styles.webAppDivider,
                        webStyles.divider,
                    ]}
                />
                <View style={styles.prayerScheduleRow}>
                    {prayerScheduleItems.map(({ Icon, key, label }) => {
                        const isNext =
                            key === nextPrayer.key && hasPrayerSchedule;
                        return (
                            <View key={key} style={styles.prayerScheduleItem}>
                                <Text
                                    style={[
                                        styles.prayerScheduleLabel,
                                        isWebApp && styles.webAppMutedText,
                                        webStyles.mutedText,
                                        isNext
                                            ? isWebApp
                                                ? styles.webAppAccentText
                                                : styles.prayerScheduleActive
                                            : null,
                                        isNext ? webStyles.accentText : null,
                                    ]}
                                >
                                    {label}
                                </Text>
                                <Icon
                                    color={isNext ? accent : primary}
                                    size={16}
                                    strokeWidth={2.2}
                                />
                                <Text
                                    style={[
                                        styles.prayerScheduleTime,
                                        isWebApp && styles.webAppTitleText,
                                        webStyles.titleText,
                                        isNext
                                            ? isWebApp
                                                ? styles.webAppAccentText
                                                : styles.prayerScheduleActive
                                            : null,
                                        isNext ? webStyles.accentText : null,
                                    ]}
                                >
                                    {prayerTimes?.[key] ?? "--:--"}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {!isWebApp ? menuGrid : null}

            {isWebApp ? (
                <WebAppDailyReminderCard
                    dailyAyah={dailyAyah}
                    dailyHadith={dailyHadith}
                    dailyReminders={dailyReminders}
                    dailyMessage={dailyMessage}
                    dashboardColors={dashboardColors}
                    loadingDaily={loadingDaily}
                    onOpenTab={onOpenTab}
                    t={t}
                />
            ) : (
                <View style={styles.dailyCard} testID='home-daily-card'>
                    <View style={styles.dailyHeader}>
                        <Text style={styles.dailyTitle}>Bacaan Hari Ini</Text>
                        <Text style={styles.dailyMeta}>Quran & Hadis</Text>
                    </View>
                    <Pressable
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => onOpenTab("quran", { surahNumber: 1 })}
                        style={styles.dailyItem}
                    >
                        <View style={styles.dailyAccent} />
                        <View style={styles.dailyBody}>
                            <Text style={styles.dailyLabel}>
                                {t("home.daily.ayah.title")}
                            </Text>
                            {dailyAyah?.arabic ? (
                                <Text style={styles.dailyArabic}>
                                    {dailyAyah.arabic}
                                </Text>
                            ) : null}
                            <Text style={styles.dailyText}>
                                {loadingDaily
                                    ? t("home.daily.ayah.loading")
                                    : dailyAyah?.translation ||
                                      dailyMessage ||
                                      t("home.daily.ayah.empty")}
                            </Text>
                            {dailyAyah?.ref ? (
                                <Text style={styles.dailySource}>
                                    {dailyAyah.ref}
                                </Text>
                            ) : null}
                        </View>
                    </Pressable>
                    <Pressable
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => onOpenTab("hadith")}
                        style={styles.dailyItem}
                    >
                        <View style={styles.dailyAccent} />
                        <View style={styles.dailyBody}>
                            <Text style={styles.dailyLabel}>
                                {t("home.daily.hadith.title")}
                            </Text>
                            {dailyHadith?.arabic ? (
                                <Text style={styles.dailyArabic}>
                                    {dailyHadith.arabic}
                                </Text>
                            ) : null}
                            <Text style={styles.dailyText}>
                                {loadingDaily
                                    ? t("home.daily.hadith.loading")
                                    : dailyHadith?.translation ||
                                      t("home.daily.hadith.empty")}
                            </Text>
                            {dailyHadith?.book ? (
                                <Text style={styles.dailySource}>
                                    {formatHadisSource(dailyHadith.book)}
                                </Text>
                            ) : null}
                        </View>
                    </Pressable>
                </View>
            )}

            {contextualShortcuts.length ? (
                <ContextShortcutsCard
                    isWebApp={isWebApp}
                    items={contextualShortcuts}
                    onOpenTab={onOpenTab}
                    primary={primary}
                    t={t}
                    webStyles={webStyles}
                />
            ) : null}

            {pinnedFeatures.length ? (
                <FeatureListCard
                    Icon={Star}
                    features={pinnedFeatures}
                    isWebApp={isWebApp}
                    meta={t("home.pinned.meta")}
                    muted={muted}
                    onOpenTab={onOpenTab}
                    primary={primary}
                    t={t}
                    title={t("home.pinned.title")}
                    webStyles={webStyles}
                />
            ) : null}

            {recentFeatures.length ? (
                <FeatureListCard
                    Icon={Clock3}
                    features={recentFeatures}
                    isWebApp={isWebApp}
                    meta={t("home.recent.meta")}
                    muted={muted}
                    onOpenTab={onOpenTab}
                    primary={primary}
                    t={t}
                    title={t("home.recent.title")}
                    webStyles={webStyles}
                />
            ) : null}

            {isWebApp ? (
                <View style={styles.webAppQuickAccessBlock}>
                    <Text
                        style={[
                            styles.webAppSectionTitle,
                            webStyles.sectionTitle,
                        ]}
                    >
                        {t("home.quickAccess.title")}
                    </Text>
                    {menuGrid}
                </View>
            ) : null}

            <ContentCard
                Icon={Smile}
                iconStyle={[
                    styles.journalIcon,
                    isWebApp && styles.webAppIconTile,
                    webStyles.iconTile,
                ]}
                onPress={() =>
                    onOpenTab("belajar", { featureKey: "muhasabah" })
                }
                style={[
                    styles.journalCard,
                    isWebApp && styles.webAppCard,
                    webStyles.card,
                ]}
                subtitle={t("home.journal.subtitle")}
                subtitleStyle={[
                    styles.journalDesc,
                    isWebApp && styles.webAppMutedText,
                    webStyles.mutedText,
                ]}
                title={t("home.journal.title")}
                titleStyle={[
                    styles.journalTitle,
                    isWebApp && styles.webAppTitleText,
                    webStyles.titleText,
                ]}
                trailing={
                    <ChevronRightIcon
                        color={muted}
                        size={18}
                        strokeWidth={2.4}
                    />
                }
            />
        </ScrollView>
    );
}

function WebAppDailyReminderCard({
    dashboardColors = webDashboardDarkColors,
    dailyAyah,
    dailyHadith,
    dailyMessage,
    dailyReminders,
    loadingDaily,
    onOpenTab,
    t = defaultT,
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = useMemo(
        () =>
            buildWebAppDailySlides({
                colors: dashboardColors,
                dailyAyah,
                dailyHadith,
                dailyMessage,
                dailyReminders,
                loadingDaily,
                t,
            }),
        [
            dashboardColors,
            dailyAyah,
            dailyHadith,
            dailyMessage,
            dailyReminders,
            loadingDaily,
            t,
        ],
    );
    const active = slides[activeIndex % slides.length];
    const Icon = active.Icon;

    const goPrev = () =>
        setActiveIndex(
            (current) => (current - 1 + slides.length) % slides.length,
        );
    const goNext = () =>
        setActiveIndex((current) => (current + 1) % slides.length);
    const openActive = () => {
        if (active.key === "hadith") {
            onOpenTab("hadith");
            return;
        }
        if (active.key.startsWith("reminder-")) {
            onOpenTab("belajar", { featureKey: "notifications" });
            return;
        }
        onOpenTab("quran", { surahNumber: 1 });
    };

    return (
        <Pressable
            android_ripple={{
                color: "rgba(16, 185, 129, 0.12)",
                borderless: false,
            }}
            onPress={openActive}
            style={[
                styles.webAppReminderCard,
                {
                    backgroundColor:
                        dashboardColors.reminderCard ??
                        dashboardColors.primarySoft,
                    borderColor: dashboardColors.borderSoft,
                },
            ]}
            testID='home-daily-card'
        >
            <View style={styles.webAppReminderHeader}>
                <View style={styles.webAppReminderTitleRow}>
                    <Icon
                        color={active.accentColor}
                        size={17}
                        strokeWidth={2.2}
                    />
                    <Text
                        style={[
                            styles.webAppReminderTitle,
                            { color: active.accentColor },
                        ]}
                    >
                        {active.title}
                    </Text>
                </View>
                <View style={styles.webAppReminderControls}>
                    <Pressable
                        accessibilityLabel={t("home.daily.previous")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(16, 185, 129, 0.14)",
                            borderless: true,
                        }}
                        onPress={goPrev}
                        style={[
                            styles.webAppReminderButton,
                            {
                                backgroundColor: dashboardColors.card,
                                borderColor: dashboardColors.border,
                            },
                        ]}
                        testID='home-daily-prev'
                    >
                        <ChevronLeft
                            color={active.accentColor}
                            size={18}
                            strokeWidth={2.2}
                        />
                    </Pressable>
                    <Pressable
                        accessibilityLabel={t("home.daily.next")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(16, 185, 129, 0.14)",
                            borderless: true,
                        }}
                        onPress={goNext}
                        style={[
                            styles.webAppReminderButton,
                            {
                                backgroundColor: dashboardColors.card,
                                borderColor: dashboardColors.border,
                            },
                        ]}
                        testID='home-daily-next'
                    >
                        <ChevronRightIcon
                            color={active.accentColor}
                            size={18}
                            strokeWidth={2.2}
                        />
                    </Pressable>
                </View>
            </View>

            {active.arabic ? (
                <Text
                    numberOfLines={3}
                    style={[
                        styles.webAppReminderArabic,
                        { color: dashboardColors.title },
                    ]}
                >
                    {active.arabic}
                </Text>
            ) : null}
            <Text
                numberOfLines={4}
                style={[
                    styles.webAppReminderText,
                    { color: dashboardColors.text },
                ]}
            >
                {`"${active.text}"`}
            </Text>
            <View style={styles.webAppReminderFooter}>
                <Text
                    numberOfLines={1}
                    style={[
                        styles.webAppReminderSource,
                        { color: active.accentColor },
                    ]}
                >
                    {active.source || t("home.daily.reminder.source")}
                </Text>
                <Text
                    style={[
                        styles.webAppReminderLink,
                        { color: dashboardColors.primary },
                    ]}
                >
                    {t("home.daily.more")}
                </Text>
            </View>
            <View style={styles.webAppReminderDots}>
                {slides.map((slide, index) => (
                    <Pressable
                        accessibilityLabel={`Tampilkan ${slide.title}`}
                        accessibilityRole='button'
                        key={slide.key}
                        onPress={() => setActiveIndex(index)}
                        style={[
                            styles.webAppReminderDot,
                            { backgroundColor: dashboardColors.muted },
                            index === activeIndex && [
                                styles.webAppReminderDotActive,
                                { backgroundColor: active.accentColor },
                            ],
                        ]}
                        testID={`home-daily-dot-${slide.key}`}
                    />
                ))}
            </View>
        </Pressable>
    );
}

function ContextShortcutsCard({
    isWebApp,
    items,
    onOpenTab,
    primary,
    t = defaultT,
    webStyles = {},
}) {
    return (
        <View
            style={[
                styles.contextCard,
                isWebApp && styles.webAppCard,
                webStyles.card,
            ]}
        >
            <Text
                style={[
                    styles.contextLabel,
                    isWebApp && styles.webAppMutedText,
                    webStyles.mutedText,
                ]}
            >
                {t("home.suggestions.title")}
            </Text>
            <View style={styles.contextRow}>
                {items.map(({ Icon, featureKey, label, params, sub, tab }) => (
                    <Pressable
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        key={label}
                        onPress={() =>
                            onOpenTab(
                                tab,
                                params ?? (featureKey ? { featureKey } : null),
                            )
                        }
                        style={[
                            styles.contextItem,
                            isWebApp && styles.webAppActionTile,
                            webStyles.actionTile,
                        ]}
                    >
                        <View
                            style={[
                                styles.contextIcon,
                                isWebApp && styles.webAppIconTile,
                                webStyles.iconTile,
                            ]}
                        >
                            <Icon color={primary} size={16} strokeWidth={2.2} />
                        </View>
                        <Text
                            style={[
                                styles.contextItemLabel,
                                isWebApp && styles.webAppTitleText,
                                webStyles.titleText,
                            ]}
                        >
                            {label}
                        </Text>
                        <Text
                            style={[
                                styles.contextItemSub,
                                isWebApp && styles.webAppMutedText,
                                webStyles.mutedText,
                            ]}
                        >
                            {sub}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

function FeatureListCard({
    Icon,
    features,
    isWebApp,
    meta,
    muted,
    onOpenTab,
    primary,
    t = defaultT,
    title,
    webStyles = {},
}) {
    return (
        <View
            style={[
                styles.recentCard,
                isWebApp && styles.webAppCard,
                webStyles.card,
            ]}
        >
            <View style={styles.recentHeader}>
                <View>
                    <Text
                        style={[
                            styles.recentTitle,
                            isWebApp && styles.webAppTitleText,
                            webStyles.titleText,
                        ]}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[
                            styles.recentMeta,
                            isWebApp && styles.webAppMutedText,
                            webStyles.mutedText,
                        ]}
                    >
                        {meta}
                    </Text>
                </View>
                <Icon color={primary} size={18} strokeWidth={2.2} />
            </View>
            {features.map((feature) => (
                <ContentCard
                    Icon={Icon}
                    iconStyle={[
                        styles.recentIcon,
                        isWebApp && styles.webAppIconTile,
                        webStyles.iconTile,
                    ]}
                    key={feature.key}
                    onPress={() =>
                        onOpenTab("belajar", { featureKey: feature.key })
                    }
                    style={[
                        styles.recentRow,
                        isWebApp && styles.webAppRow,
                        webStyles.row,
                    ]}
                    subtitle={
                        feature.subtitle ||
                        feature.group ||
                        t("home.feature.fallbackSubtitle")
                    }
                    subtitleStyle={[
                        styles.recentRowSubtitle,
                        isWebApp && styles.webAppMutedText,
                        webStyles.mutedText,
                    ]}
                    title={feature.title}
                    titleStyle={[
                        styles.recentRowTitle,
                        isWebApp && styles.webAppTitleText,
                        webStyles.titleText,
                    ]}
                    trailing={
                        <ChevronRightIcon
                            color={muted}
                            size={18}
                            strokeWidth={2.4}
                        />
                    }
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
        backgroundColor: webDashboardDarkColors.bg,
    },
    screen: {
        backgroundColor: colors.bg,
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        paddingTop: spacing.xl,
    },
    webAppScreen: {
        backgroundColor: webDashboardDarkColors.bg,
        paddingBottom: spacing.lg,
        paddingTop: spacing.lg,
    },
    webAppGreeting: {
        marginBottom: spacing.lg,
    },
    webAppGreetingTitle: {
        color: webDashboardDarkColors.title,
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 0,
    },
    webAppGreetingDate: {
        color: webDashboardDarkColors.muted,
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0,
        marginTop: spacing.xs,
    },
    header: {
        alignItems: "center",
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.lg,
        paddingBottom: spacing.md,
    },
    profile: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
    },
    avatar: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: 16,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    avatarText: {
        color: colors.primary,
        fontFamily: "serif",
        fontSize: 12,
        fontWeight: "900",
    },
    name: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 14,
        fontWeight: "900",
    },
    location: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
    },
    headerActions: {
        flexDirection: "row",
        gap: spacing.md,
    },
    prayerHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: spacing.lg,
    },
    prayerStatusPill: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderWidth: 1,
        borderRadius: radius.sm,
        flexDirection: "row",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: 7,
        maxWidth: "48%",
    },
    prayerStatusText: {
        color: colors.primary,
        flexShrink: 1,
        fontSize: 11,
        fontWeight: "900",
        textTransform: "uppercase",
    },
    prayerDateStack: {
        alignItems: "flex-end",
        flex: 1,
        gap: 5,
    },
    gregorianDate: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
        textAlign: "right",
    },
    hijriRow: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5,
        justifyContent: "flex-end",
    },
    hijriDate: {
        color: colors.accent,
        flexShrink: 1,
        fontSize: 12,
        fontWeight: "800",
        textAlign: "right",
    },
    prayerCard: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderWidth: 1,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        overflow: "hidden",
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        ...shadows.paper,
    },
    webAppPrayerCard: {
        backgroundColor: webDashboardDarkColors.card,
        borderColor: webDashboardDarkColors.borderSoft,
        borderRadius: 24,
    },
    webAppCard: {
        backgroundColor: webDashboardDarkColors.card,
        borderColor: webDashboardDarkColors.border,
        borderRadius: radius.md,
    },
    webAppPill: {
        backgroundColor: webDashboardDarkColors.primarySoft,
        borderColor: "#065f46",
    },
    webAppDivider: {
        backgroundColor: webDashboardDarkColors.border,
    },
    webAppTitleText: {
        color: webDashboardDarkColors.title,
        fontFamily: webDashboardFontFamily,
    },
    webAppText: {
        color: webDashboardDarkColors.text,
    },
    webAppMutedText: {
        color: webDashboardDarkColors.muted,
    },
    webAppPrimaryText: {
        color: webDashboardDarkColors.primary,
    },
    webAppAccentText: {
        color: webDashboardDarkColors.accent,
    },
    prayerKicker: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
        textTransform: "uppercase",
    },
    prayerHero: {
        alignItems: "center",
        marginBottom: spacing.md,
    },
    prayerTime: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 42,
        fontWeight: "900",
        marginTop: spacing.xs,
    },
    prayerSummary: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 17,
        marginTop: 2,
        textAlign: "center",
    },
    countdown: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderWidth: 1,
        borderRadius: radius.sm,
        flexDirection: "row",
        gap: 4,
        marginTop: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
    },
    countdownText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "800",
    },
    prayerTimeline: {
        backgroundColor: colors.faint,
        height: 1,
        marginBottom: spacing.sm,
        width: "100%",
    },
    prayerScheduleRow: {
        flexDirection: "row",
        gap: 4,
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    prayerScheduleItem: {
        alignItems: "center",
        flex: 1,
        gap: 4,
        minWidth: 0,
    },
    prayerScheduleLabel: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: "800",
        textAlign: "center",
    },
    prayerScheduleTime: {
        color: colors.ink,
        fontSize: 10,
        fontWeight: "900",
        textAlign: "center",
    },
    prayerScheduleActive: {
        color: colors.accent,
    },
    menuGrid: {
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.md,
        ...shadows.paper,
    },
    webAppMenuGrid: {
        backgroundColor: webDashboardDarkColors.card,
        borderColor: webDashboardDarkColors.border,
        borderRadius: radius.md,
        marginTop: 0,
    },
    webAppQuickAccessBlock: {
        marginBottom: spacing.md,
    },
    webAppSectionTitle: {
        color: webDashboardDarkColors.text,
        fontSize: 14,
        fontWeight: "900",
        marginBottom: spacing.sm,
    },
    webAppIconTile: {
        backgroundColor: webDashboardDarkColors.iconBg,
        borderColor: webDashboardDarkColors.border,
    },
    webAppActionTile: {
        backgroundColor: webDashboardDarkColors.cardDeep,
        borderColor: webDashboardDarkColors.border,
    },
    webAppRow: {
        backgroundColor: webDashboardDarkColors.cardDeep,
        borderColor: webDashboardDarkColors.border,
    },
    menuItem: {
        alignItems: "center",
        marginBottom: spacing.md,
        width: "25%",
    },
    menuIcon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 42,
        justifyContent: "center",
        marginBottom: spacing.sm,
        width: 42,
    },
    menuLabel: {
        color: colors.ink,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0,
        textTransform: "uppercase",
    },
    webAppMenuLabel: {
        color: webDashboardDarkColors.text,
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
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: spacing.sm,
        textTransform: "uppercase",
    },
    contextRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    contextItem: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flex: 1,
        gap: 4,
        paddingVertical: spacing.md,
    },
    contextIcon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    contextItemLabel: {
        color: colors.ink,
        fontSize: 12,
        fontWeight: "900",
        textAlign: "center",
    },
    contextItemSub: {
        color: colors.muted,
        fontSize: 10,
        textAlign: "center",
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
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    recentTitle: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 14,
        fontWeight: "900",
    },
    recentMeta: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2,
    },
    recentRow: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.sm,
        minHeight: 52,
        paddingHorizontal: spacing.sm,
    },
    recentIcon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    recentRowTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
    },
    recentRowSubtitle: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2,
    },
    journalCard: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        padding: spacing.md,
        ...shadows.paper,
    },
    journalIcon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 42,
        justifyContent: "center",
        width: 42,
    },
    journalTitle: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 14,
        fontWeight: "900",
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
    webAppReminderCard: {
        backgroundColor: "#052e2b",
        borderColor: webDashboardDarkColors.borderSoft,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: spacing.lg,
        overflow: "hidden",
        padding: spacing.lg,
    },
    webAppReminderHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    webAppReminderTitleRow: {
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: spacing.xs,
        minWidth: 0,
    },
    webAppReminderTitle: {
        flex: 1,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    webAppReminderControls: {
        flexDirection: "row",
        gap: spacing.xs,
    },
    webAppReminderButton: {
        alignItems: "center",
        backgroundColor: webDashboardDarkColors.card,
        borderColor: webDashboardDarkColors.border,
        borderRadius: 999,
        borderWidth: 1,
        height: 32,
        justifyContent: "center",
        width: 32,
    },
    webAppReminderArabic: {
        ...arabicTypography.small,
        color: webDashboardDarkColors.title,
        fontFamily: webDashboardFontFamily,
        fontSize: 24,
        lineHeight: 40,
        marginBottom: spacing.sm,
        textAlign: "right",
        writingDirection: "rtl",
    },
    webAppReminderText: {
        color: webDashboardDarkColors.text,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    webAppReminderFooter: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
    },
    webAppReminderSource: {
        flex: 1,
        fontSize: 12,
        fontWeight: "800",
    },
    webAppReminderLink: {
        color: webDashboardDarkColors.primary,
        fontSize: 12,
        fontWeight: "800",
    },
    webAppReminderDots: {
        flexDirection: "row",
        gap: 6,
        marginTop: spacing.md,
    },
    webAppReminderDot: {
        backgroundColor: "#475569",
        borderRadius: 999,
        height: 6,
        width: 6,
    },
    webAppReminderDotActive: {
        width: 24,
    },
    dailyHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dailyTitle: {
        color: colors.ink,
        fontFamily: "serif",
        fontSize: 15,
        fontWeight: "900",
    },
    dailyMeta: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
    },
    dailyItem: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        overflow: "hidden",
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
        fontWeight: "900",
        letterSpacing: 0,
        textTransform: "uppercase",
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
        fontWeight: "800",
        marginTop: spacing.xs,
    },
});
