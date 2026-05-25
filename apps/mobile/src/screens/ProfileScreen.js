import {
    ArrowLeft,
    Bell,
    BookOpen,
    ChevronRight,
    HardDrive,
    Lock,
    LogOut,
    Palette,
    Settings,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { updatePassword, updateProfile } from '../api/auth';
import {
    getAchievements,
    getHafalanSummary,
    getMyAchievements,
    getMyPoints,
    getMyStreak,
    getPrayerStats,
    getTilawahSummary,
} from '../api/personal';
import { Card } from '../components/Card';
import { NotificationCenter } from '../components/NotificationCenter';
import { OfflinePackCard } from '../components/OfflinePackCard';
import { Screen } from '../components/Screen';
import { SessionCard } from '../components/SessionCard';
import { useSession } from '../context/SessionContext';
import { useLayoutModePreference } from '../hooks/useLayoutModePreference';
import { defaultLayoutMode, useLayoutMode } from '../layout/LayoutModeProvider';
import { preferenceKeys, readPreference, writePreference } from '../storage/preferences';
import { colors, radius, spacing } from '../theme';

const DEFAULT_BADGES = [
    { code: 'tilawah_first', description: 'Mulai perjalanan tilawah.', icon: '📖', label: 'Tilawah Perdana', unlocked: false },
    { code: 'sholat_full', description: 'Sempurnakan catatan sholat harian.', icon: '✅', label: 'Sholat Penuh', unlocked: false },
    { code: 'starter', description: 'Akun belajar sudah aktif.', icon: '🌟', label: 'Penuntut Ilmi', unlocked: true },
    { code: 'streak_7', description: 'Jaga aktivitas belajar selama 7 hari.', icon: '🔥', label: 'Streak 7 Hari', unlocked: false },
];

const THEME_OPTIONS = [
    { key: 'system', label: 'Ikuti Sistem', meta: 'Gunakan preferensi perangkat sebagai default.' },
    { key: 'light', label: 'Terang', meta: 'Palet terang klasik Thullabul Ilmi.' },
    { key: 'dark', label: 'Gelap', meta: 'Disimpan sebagai preferensi perangkat untuk mode layout berikutnya.' },
];

const LANGUAGE_OPTIONS = [
    { key: 'idn', label: 'Indonesia', meta: 'Konten dan API memakai preferensi Indonesia.' },
    { key: 'en', label: 'English', meta: 'Konten yang sudah punya terjemahan EN akan diprioritaskan.' },
];

const LAYOUT_OPTIONS = [
    { key: 'classic', label: 'Classic', meta: 'Baseline native app saat ini.' },
    { key: 'web_app', label: 'Web App', meta: 'Preferensi mode dashboard mobile web untuk rollout bertahap.' },
];

const getResponseUser = (payload) => payload?.data ?? payload;

const normalizeAchievement = (item = {}, options = {}) => {
    const source = item.achievement ?? item;
    const code = source.code ?? `${source.id ?? item.achievement_id ?? source.name ?? 'achievement'}`;
    return {
        code,
        description: source.description ?? source.desc_en ?? '',
        earnedAt: item.earned_at ?? source.earned_at ?? null,
        icon: source.icon || '🏅',
        id: source.id ?? item.achievement_id ?? code,
        label: source.name ?? source.name_en ?? 'Pencapaian',
        category: source.category ?? '',
        rewardPoints: source.reward_points ?? source.points ?? 10,
        threshold: source.threshold ?? null,
        unlocked: Boolean(options.earned || item.earned_at || source.unlocked),
    };
};

const getAchievementProgress = (achievement, stats) => {
    const threshold = Number(achievement.threshold) || 0;
    if (!threshold) return null;

    if (achievement.category === 'streak') {
        const current = Number(stats?.streak ?? 0);
        return {
            current,
            label: `${Math.min(current, threshold)}/${threshold} hari`,
            pct: Math.min(100, Math.round((current / threshold) * 100)),
        };
    }

    if (achievement.category === 'hafalan') {
        const current = Number(stats?.hafalanCount ?? 0);
        return {
            current,
            label: `${Math.min(current, threshold)}/${threshold} surah`,
            pct: Math.min(100, Math.round((current / threshold) * 100)),
        };
    }

    return {
        current: null,
        label: `Target ${threshold}`,
        pct: achievement.unlocked ? 100 : 0,
    };
};

function SubScreen({ title, onBack, children }) {
    const { isWebAppLayout } = useLayoutModePreference();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
        >
            <View style={styles.subHeader}>
                <Pressable
                    accessibilityLabel="Kembali"
                    android_ripple={{ color: colors.faint, borderless: true }}
                    hitSlop={12}
                    onPress={onBack}
                    style={styles.backButton}
                >
                    <ArrowLeft color={colors.primary} size={20} strokeWidth={2.5} />
                </Pressable>
                <Text style={styles.subTitle}>{title}</Text>
            </View>
            <ScrollView
                contentContainerStyle={[styles.subContent, isWebAppLayout && styles.webAppSurface]}
                keyboardShouldPersistTaps="handled"
            >
                <View testID={isWebAppLayout ? 'profile-web-app-subscreen' : 'profile-classic-subscreen'} />
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function MenuRow({ Icon, label, meta, danger, onPress }) {
    return (
        <Pressable
            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
            onPress={onPress}
            style={styles.menuRow}
        >
            <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
                <Icon
                    color={danger ? colors.danger : colors.primary}
                    size={18}
                    strokeWidth={2.2}
                />
            </View>
            <View style={styles.menuText}>
                <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
                {meta ? <Text style={styles.menuMeta}>{meta}</Text> : null}
            </View>
            <ChevronRight color={colors.muted} size={18} strokeWidth={2.4} />
        </Pressable>
    );
}

function SettingsList({ onNavigate }) {
    const items = [
        {
            Icon: User,
            label: 'Akun',
            meta: 'Login, sandi, dan data akun',
            screen: 'settings-account',
        },
        {
            Icon: Bell,
            label: 'Notifikasi',
            meta: 'Pengingat sholat dan harian',
            screen: 'settings-notifications',
        },
        {
            Icon: HardDrive,
            label: 'Penyimpanan',
            meta: 'Paket offline perangkat',
            screen: 'settings-storage',
        },
        {
            Icon: Palette,
            label: 'Tampilan',
            meta: 'Tema dan bahasa',
            screen: 'settings-appearance',
        },
        {
            Icon: ShieldCheck,
            label: 'Keamanan',
            meta: 'Sesi aktif dan keamanan akun',
            screen: 'settings-security',
        },
    ];
    return (
        <Card>
            {items.map(({ Icon, label, meta, screen }) => (
                <MenuRow
                    Icon={Icon}
                    key={screen}
                    label={label}
                    meta={meta}
                    onPress={() => onNavigate(screen)}
                />
            ))}
        </Card>
    );
}

function ChoiceRow({ active, label, meta, onPress }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
            onPress={onPress}
            style={[styles.choiceRow, active && styles.choiceRowActive]}
        >
            <View style={styles.choiceBody}>
                <Text style={[styles.choiceLabel, active && styles.choiceLabelActive]}>{label}</Text>
                {meta ? <Text style={styles.choiceMeta}>{meta}</Text> : null}
            </View>
            <View style={[styles.choiceDot, active && styles.choiceDotActive]}>
                {active ? <View style={styles.choiceDotInner} /> : null}
            </View>
        </Pressable>
    );
}

function AppearanceSettings({ onUserUpdated, user }) {
    const { setLayoutMode: setAppLayoutMode } = useLayoutMode();
    const [theme, setTheme] = useState('system');
    const [language, setLanguage] = useState(user?.preferred_lang ?? 'idn');
    const [layoutMode, setLayoutMode] = useState(defaultLayoutMode);
    const [saving, setSaving] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const [storedTheme, storedLanguage, storedLayoutMode] = await Promise.all([
                readPreference(preferenceKeys.appTheme, 'system'),
                readPreference(preferenceKeys.appLanguage, user?.preferred_lang ?? 'idn'),
                readPreference(preferenceKeys.appLayoutMode, defaultLayoutMode),
            ]);

            if (!mounted) return;
            setTheme(storedTheme);
            setLanguage(user?.preferred_lang ?? storedLanguage);
            setLayoutMode(storedLayoutMode);
        };

        load();

        return () => {
            mounted = false;
        };
    }, [user?.preferred_lang]);

    const saveTheme = async (nextTheme) => {
        setSaving('theme');
        setMessage('');
        try {
            await writePreference(preferenceKeys.appTheme, nextTheme);
            setTheme(nextTheme);
            setMessage('Preferensi tema tersimpan di perangkat ini.');
        } catch (err) {
            setMessage(err?.message ?? 'Preferensi tema belum bisa disimpan.');
        } finally {
            setSaving('');
        }
    };

    const saveLayoutMode = async (nextMode) => {
        setSaving('layout');
        setMessage('');
        try {
            const storedMode = await setAppLayoutMode(nextMode);
            setLayoutMode(storedMode);
            setMessage('Mode layout tersimpan di perangkat ini.');
        } catch (err) {
            setMessage(err?.message ?? 'Mode layout belum bisa disimpan.');
        } finally {
            setSaving('');
        }
    };

    const saveLanguage = async (nextLanguage) => {
        setSaving('language');
        setMessage('');
        try {
            await writePreference(preferenceKeys.appLanguage, nextLanguage);
            setLanguage(nextLanguage);
            if (user) {
                const updatedUser = getResponseUser(await updateProfile({ preferredLang: nextLanguage }));
                await onUserUpdated?.(updatedUser);
                setMessage('Bahasa konten tersimpan ke akun dan perangkat ini.');
            } else {
                setMessage('Bahasa konten tersimpan di perangkat ini.');
            }
        } catch (err) {
            setMessage(err?.message ?? 'Bahasa konten belum bisa disimpan.');
        } finally {
            setSaving('');
        }
    };

    return (
        <>
            <Card>
                <Text style={styles.appearanceLabel}>Tema</Text>
                <Text style={styles.appearanceMeta}>
                    Pilihan ini disimpan sebagai preferensi perangkat dan dipakai oleh mode layout yang mendukung tema.
                </Text>
                <View style={styles.choiceGroup}>
                    {THEME_OPTIONS.map((item) => (
                        <ChoiceRow
                            active={theme === item.key}
                            key={item.key}
                            label={item.label}
                            meta={item.meta}
                            onPress={() => saveTheme(item.key)}
                        />
                    ))}
                </View>
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>Bahasa Konten</Text>
                <Text style={styles.appearanceMeta}>
                    Akun yang login akan menyimpan bahasa ke backend sebagai `preferred_lang`.
                </Text>
                <View style={styles.choiceGroup}>
                    {LANGUAGE_OPTIONS.map((item) => (
                        <ChoiceRow
                            active={language === item.key}
                            key={item.key}
                            label={item.label}
                            meta={item.meta}
                            onPress={() => saveLanguage(item.key)}
                        />
                    ))}
                </View>
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>Mode Layout</Text>
                <Text style={styles.appearanceMeta}>
                    Mode ini mengikuti dokumen layout mobile: classic sebagai baseline dan web app sebagai opt-in.
                </Text>
                <View style={styles.choiceGroup}>
                    {LAYOUT_OPTIONS.map((item) => (
                        <ChoiceRow
                            active={layoutMode === item.key}
                            key={item.key}
                            label={item.label}
                            meta={item.meta}
                            onPress={() => saveLayoutMode(item.key)}
                        />
                    ))}
                </View>
            </Card>

            {saving ? <ActivityIndicator color={colors.primary} /> : null}
            {message ? <Text style={styles.settingsStatus}>{message}</Text> : null}
        </>
    );
}

function SecuritySettings({ onSignOut, user }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const submitPassword = async () => {
        setMessage('');
        setError('');

        if (!oldPassword || !newPassword) {
            setError('Isi sandi saat ini dan sandi baru.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Sandi baru minimal 8 karakter.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Konfirmasi sandi baru belum sama.');
            return;
        }

        setSaving(true);
        try {
            await updatePassword({ oldPassword, newPassword });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setMessage('Sandi berhasil diperbarui.');
        } catch (err) {
            setError(err?.message ?? 'Sandi belum bisa diperbarui.');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <Card>
                <Text style={styles.appearanceLabel}>Keamanan Akun</Text>
                <Text style={styles.appearanceMeta}>
                    Masuk dulu untuk mengelola sesi perangkat dan sandi akun.
                </Text>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <Text style={styles.appearanceLabel}>Sesi Aktif</Text>
                <View style={styles.sessionDeviceCard}>
                    <View style={styles.sessionDeviceIcon}>
                        <ShieldCheck color={colors.primary} size={20} strokeWidth={2.4} />
                    </View>
                    <View style={styles.sessionDeviceBody}>
                        <Text style={styles.sessionDeviceTitle}>Perangkat ini</Text>
                        <Text style={styles.sessionDeviceMeta}>
                            {user.email || 'Sesi mobile aktif dengan token perangkat ini.'}
                        </Text>
                    </View>
                </View>
                <Pressable
                    android_ripple={{ color: 'rgba(185, 28, 28, 0.12)', borderless: false }}
                    onPress={onSignOut}
                    style={[styles.formButton, styles.formButtonDanger]}
                >
                    <LogOut color={colors.danger} size={16} strokeWidth={2.4} />
                    <Text style={styles.formButtonDangerText}>Keluar dari perangkat ini</Text>
                </Pressable>
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>Ganti Sandi</Text>
                <Text style={styles.appearanceMeta}>Perbarui sandi langsung melalui endpoint akun mobile.</Text>
                <View style={styles.formBlock}>
                    <TextInput
                        accessibilityLabel="Sandi saat ini"
                        onChangeText={setOldPassword}
                        placeholder="Sandi saat ini"
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={styles.formInput}
                        value={oldPassword}
                    />
                    <TextInput
                        accessibilityLabel="Sandi baru"
                        onChangeText={setNewPassword}
                        placeholder="Sandi baru minimal 8 karakter"
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={styles.formInput}
                        value={newPassword}
                    />
                    <TextInput
                        accessibilityLabel="Konfirmasi sandi baru"
                        onChangeText={setConfirmPassword}
                        placeholder="Konfirmasi sandi baru"
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={styles.formInput}
                        value={confirmPassword}
                    />
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: saving }}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.16)', borderless: false }}
                        disabled={saving}
                        onPress={submitPassword}
                        style={[styles.formButton, saving && styles.formButtonDisabled]}
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.onPrimary} />
                        ) : (
                            <Text style={styles.formButtonText}>Simpan Sandi Baru</Text>
                        )}
                    </Pressable>
                </View>
                {error ? <Text style={[styles.settingsStatus, styles.settingsStatusError]}>{error}</Text> : null}
                {message ? <Text style={styles.settingsStatus}>{message}</Text> : null}
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>Hapus Akun</Text>
                <Text style={styles.appearanceMeta}>
                    Penghapusan akun masih melalui kontak tim agar data personal bisa diverifikasi lebih dulu.
                </Text>
            </Card>
        </>
    );
}

function AchievementsDetail({ achievements, loading, message, onBack, points, stats, user }) {
    const earnedCount = achievements.filter((item) => item.unlocked).length;

    return (
        <SubScreen title="Pencapaian" onBack={onBack}>
            <Card style={styles.achievementHero}>
                <View style={styles.achievementHeroIcon}>
                    <Trophy color={colors.accent} size={28} strokeWidth={2.4} />
                </View>
                <View style={styles.achievementHeroBody}>
                    <Text style={styles.achievementHeroValue}>
                        {user ? (points ?? 0).toLocaleString('id-ID') : '—'}
                    </Text>
                    <Text style={styles.achievementHeroLabel}>Total Poin</Text>
                    <Text style={styles.achievementHeroMeta}>
                        {earnedCount}/{achievements.length} badge diperoleh
                    </Text>
                </View>
            </Card>

            {!user ? (
                <Card style={styles.emptyAchievementCard}>
                    <Text style={styles.emptyAchievementIcon}>🏅</Text>
                    <Text style={styles.emptyAchievementTitle}>Masuk untuk melihat pencapaian kamu.</Text>
                    <Text style={styles.emptyAchievementText}>
                        Badge yang terkunci tetap ditampilkan agar target belajarnya jelas.
                    </Text>
                </Card>
            ) : null}

            {message ? <Text style={styles.sectionHint}>{message}</Text> : null}
            {loading ? <ActivityIndicator color={colors.primary} /> : null}

            <View style={styles.achievementList}>
                {achievements.map((achievement) => {
                    const progress = getAchievementProgress(achievement, stats);
                    return (
                        <Card
                            key={achievement.code ?? achievement.label}
                            style={[
                                styles.achievementDetailCard,
                                !achievement.unlocked && styles.achievementDetailLocked,
                            ]}
                        >
                            <View style={styles.achievementDetailTop}>
                                <View
                                    style={[
                                        styles.achievementDetailIcon,
                                        achievement.unlocked && styles.achievementDetailIconUnlocked,
                                    ]}
                                >
                                    <Text style={styles.achievementDetailEmoji}>
                                        {achievement.unlocked ? achievement.icon : '•'}
                                    </Text>
                                    {!achievement.unlocked ? (
                                        <View style={styles.badgeLock}>
                                            <Lock color={colors.muted} size={10} strokeWidth={2.4} />
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.achievementDetailBody}>
                                    <View style={styles.achievementDetailTitleRow}>
                                        <Text style={styles.achievementDetailTitle}>{achievement.label}</Text>
                                        <View
                                            style={[
                                                styles.achievementStatePill,
                                                achievement.unlocked && styles.achievementStatePillUnlocked,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.achievementStateText,
                                                    achievement.unlocked && styles.achievementStateTextUnlocked,
                                                ]}
                                            >
                                                {achievement.unlocked ? 'Diperoleh' : 'Terkunci'}
                                            </Text>
                                        </View>
                                    </View>
                                    {achievement.description ? (
                                        <Text style={styles.achievementDetailDescription}>
                                            {achievement.description}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>

                            {progress ? (
                                <View style={styles.achievementProgressBlock}>
                                    <View style={styles.achievementProgressHeader}>
                                        <Text style={styles.achievementProgressLabel}>Progress</Text>
                                        <Text style={styles.achievementProgressValue}>{progress.label}</Text>
                                    </View>
                                    <View style={styles.achievementProgressTrack}>
                                        <View
                                            style={[
                                                styles.achievementProgressFill,
                                                { width: `${achievement.unlocked ? 100 : progress.pct}%` },
                                            ]}
                                        />
                                    </View>
                                </View>
                            ) : null}

                            <View style={styles.achievementRewardRow}>
                                <Sparkles color={colors.accent} size={14} strokeWidth={2.4} />
                                <Text style={styles.achievementRewardText}>
                                    Reward {achievement.rewardPoints} poin
                                </Text>
                                {achievement.earnedAt ? (
                                    <Text style={styles.achievementEarnedDate}>Sudah diperoleh</Text>
                                ) : null}
                            </View>
                        </Card>
                    );
                })}
            </View>
        </SubScreen>
    );
}

export function ProfileScreen({ isActive, navigation, onOpenTab }) {
    const { loading: sessionLoading, session, signOut, updateCurrentUser, user } = useSession();
    const { isWebAppLayout } = useLayoutModePreference();
    const [stack, setStack] = useState([]);
    const [stats, setStats] = useState(null);
    const [achievements, setAchievements] = useState(DEFAULT_BADGES);
    const [achievementsLoading, setAchievementsLoading] = useState(false);
    const [achievementsMessage, setAchievementsMessage] = useState('');

    const push = (screen) => setStack((s) => [...s, screen]);
    const pop = () => setStack((s) => s.slice(0, -1));
    const currentScreen = stack[stack.length - 1] ?? 'main';

    useEffect(() => {
        const routeView = navigation?.current?.view;
        if (routeView === 'settings') {
            setStack(['settings']);
        }
        if (routeView === 'achievements') {
            setStack(['achievements']);
        }
        if (typeof routeView === 'string' && routeView.startsWith('settings-')) {
            setStack(['settings', routeView]);
        }
    }, [navigation?.current?.id, navigation?.current?.view]);

    useEffect(() => {
        if (!isActive) return;
        if (stack.length > 0) {
            navigation?.setBack(() => { pop(); return true; });
        } else {
            navigation?.clearBack?.();
        }
    }, [isActive, stack.length, navigation]);

    const initials = `${user?.name || user?.email || 'TI'}`
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    useEffect(() => {
        let mounted = true;

        const loadProfileData = async () => {
            setAchievementsLoading(true);
            setAchievementsMessage('');

            const publicAchievementsPromise = getAchievements();
            const personalPromises = session?.token
                ? [
                    getMyPoints(),
                    getMyStreak(),
                    getHafalanSummary(),
                    getPrayerStats(),
                    getTilawahSummary(),
                    getMyAchievements(),
                ]
                : [
                    Promise.resolve(null),
                    Promise.resolve(null),
                    Promise.resolve(null),
                    Promise.resolve(null),
                    Promise.resolve(null),
                    Promise.resolve([]),
                ];

            const [
                allAchievementsRes,
                pointsRes,
                streakRes,
                hafalanRes,
                prayerRes,
                tilawahRes,
                myAchievementsRes,
            ] = await Promise.allSettled([
                publicAchievementsPromise,
                ...personalPromises,
            ]);

            if (!mounted) return;

            if (session?.token) {
                setStats({
                    points:
                        pointsRes.status === 'fulfilled'
                            ? (pointsRes.value?.total_points ?? pointsRes.value?.points ?? pointsRes.value?.data?.total_points ?? 0)
                            : 0,
                    streak:
                        streakRes.status === 'fulfilled'
                            ? (streakRes.value?.current_streak ?? streakRes.value?.streak ?? streakRes.value?.data?.current_streak ?? 0)
                            : 0,
                    hafalanCount:
                        hafalanRes.status === 'fulfilled'
                            ? (hafalanRes.value?.memorized_count ?? hafalanRes.value?.total ?? hafalanRes.value?.data?.memorized_count ?? 0)
                            : null,
                    sholatWeekly:
                        prayerRes.status === 'fulfilled'
                            ? (prayerRes.value?.weekly_completion_pct ?? prayerRes.value?.completion_pct ?? prayerRes.value?.data?.weekly_completion_pct ?? null)
                            : null,
                    tilawahPages:
                        tilawahRes.status === 'fulfilled'
                            ? (tilawahRes.value?.total_pages ?? tilawahRes.value?.pages ?? tilawahRes.value?.data?.total_pages ?? null)
                            : null,
                });
            } else {
                setStats(null);
            }

            const allAchievements =
                allAchievementsRes.status === 'fulfilled'
                    ? allAchievementsRes.value.map((item) => normalizeAchievement(item))
                    : DEFAULT_BADGES;
            const earnedAchievements =
                myAchievementsRes.status === 'fulfilled'
                    ? myAchievementsRes.value.map((item) => normalizeAchievement(item, { earned: true }))
                    : [];
            const earnedByCode = earnedAchievements.reduce((acc, item) => {
                acc[item.code] = item;
                return acc;
            }, {});

            const merged = allAchievements.map((item) => ({
                ...item,
                earnedAt: earnedByCode[item.code]?.earnedAt ?? item.earnedAt,
                unlocked: Boolean(earnedByCode[item.code] || item.unlocked),
            }));

            setAchievements(merged.length ? merged : DEFAULT_BADGES);
            if (allAchievementsRes.status !== 'fulfilled') {
                setAchievementsMessage('Daftar pencapaian belum bisa dimuat.');
            } else if (!session?.token) {
                setAchievementsMessage('Masuk untuk melihat badge yang sudah kamu raih.');
            }
            setAchievementsLoading(false);
        };

        loadProfileData();

        return () => {
            mounted = false;
        };
    }, [session?.token]);

    if (currentScreen === 'settings') {
        return (
            <SubScreen title="Pengaturan" onBack={pop}>
                <SettingsList onNavigate={push} />
            </SubScreen>
        );
    }

    if (currentScreen === 'achievements') {
        return (
            <AchievementsDetail
                achievements={achievements}
                loading={achievementsLoading}
                message={achievementsMessage}
                onBack={pop}
                points={stats?.points}
                stats={stats}
                user={user}
            />
        );
    }

    if (currentScreen === 'settings-account') {
        return (
            <SubScreen title="Akun" onBack={pop}>
                <SessionCard />
                {user ? (
                    <Pressable
                        android_ripple={{ color: 'rgba(185, 28, 28, 0.12)', borderless: false }}
                        disabled={sessionLoading}
                        onPress={signOut}
                        style={styles.signOutButton}
                    >
                        <LogOut color={colors.danger} size={16} strokeWidth={2.4} />
                        <Text style={styles.signOutText}>
                            {sessionLoading ? 'Keluar...' : 'Keluar dari Akun'}
                        </Text>
                    </Pressable>
                ) : null}
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-notifications') {
        return (
            <SubScreen title="Notifikasi" onBack={pop}>
                <NotificationCenter />
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-storage') {
        return (
            <SubScreen title="Penyimpanan" onBack={pop}>
                <OfflinePackCard />
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-appearance') {
        return (
            <SubScreen title="Tampilan" onBack={pop}>
                <AppearanceSettings onUserUpdated={updateCurrentUser} user={user} />
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-security') {
        return (
            <SubScreen title="Keamanan" onBack={pop}>
                <SecuritySettings onSignOut={signOut} user={user} />
            </SubScreen>
        );
    }

    return (
        <Screen
            contentStyle={isWebAppLayout ? styles.webAppSurface : null}
            subtitle="Kelola akun, progress belajar, dan preferensi pribadimu."
            title="Profil"
        >
            <View testID={isWebAppLayout ? 'profile-web-app-surface' : 'profile-classic-surface'} />
            <Card style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials || 'TI'}</Text>
                </View>
                <View style={styles.profileBody}>
                    <Text style={styles.name}>{user?.name || 'Thullabul Ilmi'}</Text>
                    <Text style={styles.email}>
                        {user?.email || 'Belum masuk ke akun'}
                    </Text>
                </View>
                <Pressable
                    accessibilityLabel="Buka pengaturan profil"
                    android_ripple={{ color: colors.faint, borderless: true }}
                    hitSlop={12}
                    onPress={() => push('settings')}
                    style={styles.gearButton}
                >
                    <Settings color={colors.muted} size={20} strokeWidth={2} />
                </Pressable>
            </Card>

            {stats ? (
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {stats.points.toLocaleString('id-ID')}
                        </Text>
                        <Text style={styles.statLabel}>Total Poin</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.streak}</Text>
                        <Text style={styles.statLabel}>Hari Streak</Text>
                    </Card>
                </View>
            ) : null}

            {stats && (stats.hafalanCount !== null || stats.sholatWeekly !== null || stats.tilawahPages !== null) ? (
                <View style={styles.progressSection}>
                    <Text style={styles.sectionLabel}>RINGKASAN PROGRESS</Text>
                    <View style={styles.progressGrid}>
                        {stats.hafalanCount !== null ? (
                            <Pressable
                                onPress={() => onOpenTab('quran', { tab: 'hafalan' })}
                                style={styles.progressCard}
                            >
                                <BookOpen color={colors.primary} size={20} strokeWidth={2} />
                                <Text style={styles.progressValue}>{stats.hafalanCount}</Text>
                                <Text style={styles.progressLabel}>Surah Hafalan</Text>
                            </Pressable>
                        ) : null}
                        {stats.sholatWeekly !== null ? (
                            <Pressable
                                onPress={() => onOpenTab('ibadah')}
                                style={styles.progressCard}
                            >
                                <Target color={colors.primary} size={20} strokeWidth={2} />
                                <Text style={styles.progressValue}>{stats.sholatWeekly}%</Text>
                                <Text style={styles.progressLabel}>Sholat Minggu Ini</Text>
                            </Pressable>
                        ) : null}
                        {stats.tilawahPages !== null ? (
                            <Pressable
                                onPress={() => onOpenTab('quran')}
                                style={styles.progressCard}
                            >
                                <Trophy color={colors.primary} size={20} strokeWidth={2} />
                                <Text style={styles.progressValue}>{stats.tilawahPages}</Text>
                                <Text style={styles.progressLabel}>Halaman Tilawah</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.badgeSection}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>PENCAPAIAN</Text>
                    <View style={styles.sectionHeaderActions}>
                        {achievementsLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                        <Pressable
                            accessibilityLabel="Lihat semua pencapaian"
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            onPress={() => push('achievements')}
                            style={styles.sectionLink}
                        >
                            <Text style={styles.sectionLinkText}>Lihat semua</Text>
                            <ChevronRight color={colors.primary} size={14} strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </View>
                {achievementsMessage ? <Text style={styles.sectionHint}>{achievementsMessage}</Text> : null}
                <View style={styles.badgeGrid}>
                    {achievements.slice(0, 6).map((badge) => (
                        <Pressable
                            key={badge.code ?? badge.label}
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            onPress={() => push('achievements')}
                            style={[styles.badge, !badge.unlocked && styles.badgeLocked]}
                        >
                            <View style={[styles.badgeIconShell, badge.unlocked && styles.badgeIconShellUnlocked]}>
                                <Text style={styles.badgeEmoji}>{badge.unlocked ? badge.icon : '•'}</Text>
                                {!badge.unlocked ? (
                                    <View style={styles.badgeLock}>
                                        <Lock color={colors.muted} size={10} strokeWidth={2.4} />
                                    </View>
                                ) : null}
                            </View>
                            <Text
                                style={[
                                    styles.badgeLabel,
                                    !badge.unlocked && styles.badgeLabelLocked,
                                ]}
                            >
                                {badge.label}
                            </Text>
                            {badge.description ? (
                                <Text numberOfLines={2} style={styles.badgeDescription}>
                                    {badge.description}
                                </Text>
                            ) : null}
                        </Pressable>
                    ))}
                </View>
            </View>

            <Card>
                <MenuRow
                    Icon={Trophy}
                    label="Leaderboard"
                    meta="Peringkat streak komunitas"
                    onPress={() => onOpenTab('belajar', { featureKey: 'leaderboard' })}
                />
                <MenuRow
                    Icon={Target}
                    label="Target Belajar"
                    meta="Target pembelajaran personal"
                    onPress={() => onOpenTab('belajar', { featureKey: 'goals' })}
                />
                {user ? (
                    <MenuRow
                        Icon={LogOut}
                        danger
                        label="Keluar"
                        onPress={signOut}
                    />
                ) : (
                    <MenuRow
                        Icon={User}
                        label="Masuk / Daftar"
                        meta="Login untuk fitur personal"
                        onPress={() => push('settings-account')}
                    />
                )}
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    webAppSurface: {
        backgroundColor: '#f8fafc',
        borderRadius: radius.md,
        padding: spacing.sm,
    },
    subHeader: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 56,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    backButton: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 38,
        justifyContent: 'center',
        width: 38,
    },
    subTitle: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 16,
        fontWeight: '900',
    },
    subContent: {
        backgroundColor: colors.bg,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    gap: {
        height: spacing.md,
    },
    profileCard: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.md,
    },
    avatar: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 24,
        height: 52,
        justifyContent: 'center',
        width: 52,
    },
    avatarText: {
        color: colors.onPrimary,
        fontFamily: 'serif',
        fontSize: 18,
        fontWeight: '900',
    },
    profileBody: {
        flex: 1,
    },
    name: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 16,
        fontWeight: '900',
    },
    email: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.xs,
    },
    gearButton: {
        alignItems: 'center',
        height: 40,
        justifyContent: 'center',
        width: 40,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: spacing.md,
    },
    statValue: {
        color: colors.primaryDark,
        fontFamily: 'serif',
        fontSize: 24,
        fontWeight: '900',
    },
    statLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '700',
        marginTop: spacing.xs,
        textTransform: 'uppercase',
    },
    progressSection: {
        marginBottom: spacing.md,
    },
    progressGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    progressCard: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flex: 1,
        gap: spacing.xs,
        paddingVertical: spacing.md,
    },
    progressValue: {
        color: colors.primaryDark,
        fontFamily: 'serif',
        fontSize: 20,
        fontWeight: '900',
    },
    progressLabel: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    badgeSection: {
        marginBottom: spacing.md,
    },
    sectionHeaderRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    sectionHeaderActions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    sectionLink: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 2,
        minHeight: 30,
        paddingHorizontal: spacing.sm,
    },
    sectionLinkText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '900',
    },
    sectionLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    sectionHint: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginBottom: spacing.sm,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    badge: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexBasis: '47%',
        flexGrow: 1,
        gap: spacing.xs,
        minHeight: 124,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.md,
    },
    badgeLocked: {
        backgroundColor: colors.bg,
    },
    badgeIconShell: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    badgeIconShellUnlocked: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    badgeEmoji: {
        color: colors.muted,
        fontSize: 21,
    },
    badgeLock: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: 9,
        borderWidth: 1,
        bottom: -4,
        height: 18,
        justifyContent: 'center',
        position: 'absolute',
        right: -4,
        width: 18,
    },
    badgeLabel: {
        color: colors.ink,
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    badgeLabelLocked: {
        color: colors.muted,
    },
    badgeDescription: {
        color: colors.muted,
        fontSize: 10,
        lineHeight: 14,
        paddingHorizontal: spacing.xs,
        textAlign: 'center',
    },
    achievementHero: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.md,
    },
    achievementHeroIcon: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        height: 58,
        justifyContent: 'center',
        width: 58,
    },
    achievementHeroBody: {
        flex: 1,
    },
    achievementHeroValue: {
        color: colors.primaryDark,
        fontFamily: 'serif',
        fontSize: 28,
        fontWeight: '900',
    },
    achievementHeroLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    achievementHeroMeta: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '700',
        marginTop: spacing.xs,
    },
    emptyAchievementCard: {
        alignItems: 'center',
    },
    emptyAchievementIcon: {
        fontSize: 34,
        marginBottom: spacing.sm,
    },
    emptyAchievementTitle: {
        color: colors.ink,
        fontSize: 14,
        fontWeight: '900',
        textAlign: 'center',
    },
    emptyAchievementText: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    achievementList: {
        gap: spacing.md,
    },
    achievementDetailCard: {
        gap: spacing.md,
    },
    achievementDetailLocked: {
        backgroundColor: colors.bg,
    },
    achievementDetailTop: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: spacing.md,
    },
    achievementDetailIcon: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.lg,
        borderWidth: 1,
        height: 48,
        justifyContent: 'center',
        width: 48,
    },
    achievementDetailIconUnlocked: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    achievementDetailEmoji: {
        color: colors.muted,
        fontSize: 22,
    },
    achievementDetailBody: {
        flex: 1,
        minWidth: 0,
    },
    achievementDetailTitleRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    achievementDetailTitle: {
        color: colors.ink,
        flex: 1,
        fontFamily: 'serif',
        fontSize: 15,
        fontWeight: '900',
        lineHeight: 20,
    },
    achievementDetailDescription: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.xs,
    },
    achievementStatePill: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
    },
    achievementStatePillUnlocked: {
        backgroundColor: '#ecfdf5',
        borderColor: '#bbf7d0',
    },
    achievementStateText: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: '900',
    },
    achievementStateTextUnlocked: {
        color: '#047857',
    },
    achievementProgressBlock: {
        gap: spacing.xs,
    },
    achievementProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    achievementProgressLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    achievementProgressValue: {
        color: colors.primaryDark,
        fontSize: 11,
        fontWeight: '900',
    },
    achievementProgressTrack: {
        backgroundColor: colors.faint,
        borderRadius: 999,
        height: 8,
        overflow: 'hidden',
    },
    achievementProgressFill: {
        backgroundColor: colors.primary,
        borderRadius: 999,
        height: '100%',
    },
    achievementRewardRow: {
        alignItems: 'center',
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: spacing.xs,
        paddingTop: spacing.sm,
    },
    achievementRewardText: {
        color: colors.text,
        flex: 1,
        fontSize: 12,
        fontWeight: '800',
    },
    achievementEarnedDate: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '700',
    },
    menuRow: {
        alignItems: 'center',
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 56,
        paddingVertical: spacing.sm,
    },
    menuIcon: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 38,
        justifyContent: 'center',
        width: 38,
    },
    menuIconDanger: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 14,
        fontWeight: '900',
    },
    menuLabelDanger: {
        color: colors.danger,
    },
    menuMeta: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2,
    },
    signOutButton: {
        alignItems: 'center',
        borderColor: '#fecaca',
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        marginTop: spacing.md,
        minHeight: 46,
    },
    signOutText: {
        color: colors.danger,
        fontSize: 13,
        fontWeight: '800',
    },
    choiceGroup: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    choiceRow: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        minHeight: 58,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    choiceRowActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    choiceBody: {
        flex: 1,
        minWidth: 0,
    },
    choiceLabel: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: '900',
    },
    choiceLabelActive: {
        color: colors.primaryDark,
    },
    choiceMeta: {
        color: colors.muted,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 2,
    },
    choiceDot: {
        alignItems: 'center',
        borderColor: colors.faint,
        borderRadius: 10,
        borderWidth: 2,
        height: 20,
        justifyContent: 'center',
        width: 20,
    },
    choiceDotActive: {
        borderColor: colors.primary,
    },
    choiceDotInner: {
        backgroundColor: colors.primary,
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    formBlock: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    formInput: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 14,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    formButton: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    formButtonDisabled: {
        opacity: 0.65,
    },
    formButtonText: {
        color: colors.onPrimary,
        fontSize: 13,
        fontWeight: '900',
    },
    formButtonDanger: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        borderWidth: 1,
        marginTop: spacing.md,
    },
    formButtonDangerText: {
        color: colors.danger,
        fontSize: 13,
        fontWeight: '900',
    },
    sessionDeviceCard: {
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
        padding: spacing.md,
    },
    sessionDeviceIcon: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    sessionDeviceBody: {
        flex: 1,
        minWidth: 0,
    },
    sessionDeviceTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: '900',
    },
    sessionDeviceMeta: {
        color: colors.muted,
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    settingsStatus: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 18,
        textAlign: 'center',
    },
    settingsStatusError: {
        color: colors.danger,
    },
    appearanceLabel: {
        color: colors.ink,
        fontFamily: 'serif',
        fontSize: 14,
        fontWeight: '900',
        marginBottom: spacing.xs,
    },
    appearanceLabelGap: {
        marginTop: spacing.lg,
    },
    appearanceMeta: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
    },
});
