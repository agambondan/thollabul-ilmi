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
    Text,
    TextInput,
    View,
} from 'react-native';
import { getAuthSessions, revokeAuthSession, updatePassword, updateProfile } from '../api/auth';
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
import { colors } from '../theme';
import { styles, WEB_APP_PROFILE_ACCENT } from './ProfileScreen.styles';

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

const formatSessionDate = (value) => {
    if (!value) return 'sekarang';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'sekarang';
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

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
    const {
        setLayoutMode: setAppLayoutMode,
        setThemePreference: setAppThemePreference,
    } = useLayoutMode();
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
            const storedTheme = await setAppThemePreference(nextTheme);
            setTheme(storedTheme);
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

function SecuritySettings({ onDeleteAccount, onSignOut, user }) {
    const { session } = useSession();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokingSessionId, setRevokingSessionId] = useState(null);

    const loadSessions = async (shouldApply = () => true) => {
        if (!user) return;
        setSessionsLoading(true);
        try {
            const items = await getAuthSessions(session?.refreshToken ?? '');
            if (shouldApply()) setSessions(items);
        } catch {
            if (shouldApply()) setSessions([]);
        } finally {
            if (shouldApply()) setSessionsLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        loadSessions(() => mounted);
        return () => {
            mounted = false;
        };
    }, [session?.refreshToken, user]);

    const submitDeleteAccount = async () => {
        setMessage('');
        setError('');
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            setMessage('Tekan sekali lagi untuk menghapus akun dan keluar dari perangkat ini.');
            return;
        }

        setDeleting(true);
        try {
            await onDeleteAccount();
        } catch (err) {
            setError(err?.message ?? 'Akun belum bisa dihapus.');
            setDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

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

    const revokeSession = async (item) => {
        if (!item?.id || item.current || revokingSessionId) return;

        setMessage('');
        setError('');
        setRevokingSessionId(item.id);
        try {
            await revokeAuthSession(item.id, session?.refreshToken ?? '');
            await loadSessions();
            setMessage('Sesi login lain berhasil dikeluarkan.');
        } catch (err) {
            setError(err?.message ?? 'Sesi login belum bisa dikeluarkan.');
        } finally {
            setRevokingSessionId(null);
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
                {sessionsLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                {sessions.length ? (
                    <View style={styles.sessionList}>
                        {sessions.slice(0, 3).map((item) => (
                            <View key={item.id} style={styles.sessionListRow}>
                                <View style={styles.sessionListInfo}>
                                    <Text style={styles.sessionListTitle}>
                                        {item.current ? 'Perangkat ini' : 'Sesi login'}
                                    </Text>
                                    <Text style={styles.sessionListMeta}>
                                        Aktif sejak {formatSessionDate(item.created_at)}
                                    </Text>
                                </View>
                                {item.current ? (
                                    <Text style={styles.sessionCurrentPill}>Aktif</Text>
                                ) : (
                                    <Pressable
                                        accessibilityLabel={`Keluar dari sesi login ${item.id}`}
                                        accessibilityRole="button"
                                        accessibilityState={{ disabled: revokingSessionId === item.id }}
                                        disabled={revokingSessionId === item.id}
                                        onPress={() => revokeSession(item)}
                                        style={[
                                            styles.sessionRevokeButton,
                                            revokingSessionId === item.id && styles.formButtonDisabled,
                                        ]}
                                    >
                                        <Text style={styles.sessionRevokeText}>
                                            {revokingSessionId === item.id ? '...' : 'Keluar'}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        ))}
                    </View>
                ) : null}
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
                    Akun, token login, dan akses personal akan dinonaktifkan dari perangkat ini.
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: deleting }}
                    android_ripple={{ color: 'rgba(185, 28, 28, 0.12)', borderless: false }}
                    disabled={deleting}
                    onPress={submitDeleteAccount}
                    style={[styles.formButton, styles.formButtonDanger]}
                >
                    {deleting ? (
                        <ActivityIndicator color={colors.danger} size="small" />
                    ) : (
                        <Text style={styles.formButtonDangerText}>
                            {deleteConfirm ? 'Konfirmasi Hapus Akun' : 'Hapus Akun'}
                        </Text>
                    )}
                </Pressable>
            </Card>
        </>
    );
}

function AchievementsDetail({ achievements, isWebAppLayout, loading, message, onBack, points, stats, user }) {
    const earnedCount = achievements.filter((item) => item.unlocked).length;

    if (isWebAppLayout) {
        return (
            <ScrollView
                contentContainerStyle={styles.webAppAchievementsContent}
                showsVerticalScrollIndicator={false}
                style={styles.webAppAchievementsRoot}
            >
                <View testID="profile-web-app-achievements-route" />
                <View style={styles.webAppAchievementsHeader}>
                    <View style={styles.webAppAchievementsIcon}>
                        <Trophy color="#d97706" size={30} strokeWidth={2.3} />
                    </View>
                    <Text style={styles.webAppAchievementsTitle}>Pencapaian</Text>
                    <Text style={styles.webAppAchievementsSubtitle}>
                        Kumpulkan badge dengan menyelesaikan aktivitas
                    </Text>
                </View>

                {user ? (
                    <View style={styles.webAppAchievementsHero}>
                        <Text style={styles.webAppAchievementsHeroLabel}>Total Poin</Text>
                        <Text style={styles.webAppAchievementsHeroValue}>
                            {(points ?? 0).toLocaleString('id-ID')}
                        </Text>
                        <Text style={styles.webAppAchievementsHeroMeta}>
                            {earnedCount}/{achievements.length} badge diperoleh
                        </Text>
                    </View>
                ) : (
                    <View style={styles.webAppAchievementsNotice}>
                        <Text style={styles.webAppAchievementsNoticeIcon}>🏅</Text>
                        <Text style={styles.webAppAchievementsNoticeText}>
                            Login untuk melihat pencapaian kamu.
                        </Text>
                    </View>
                )}

                {message ? <Text style={styles.webAppAchievementsHint}>{message}</Text> : null}

                {loading ? (
                    <View style={styles.webAppAchievementsState}>
                        <ActivityIndicator color="#d97706" />
                    </View>
                ) : null}

                {!loading && achievements.length ? (
                    <View style={styles.webAppAchievementsList}>
                        {achievements.map((achievement) => (
                            <View
                                key={achievement.code ?? achievement.label}
                                style={[
                                    styles.webAppAchievementsCard,
                                    !achievement.unlocked && styles.webAppAchievementsCardLocked,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.webAppAchievementsBadge,
                                        achievement.unlocked && styles.webAppAchievementsBadgeEarned,
                                    ]}
                                >
                                    <Text style={styles.webAppAchievementsBadgeIcon}>
                                        {achievement.icon || '🏅'}
                                    </Text>
                                </View>
                                <View style={styles.webAppAchievementsCardBody}>
                                    <Text style={styles.webAppAchievementsCardTitle}>
                                        {achievement.label}
                                    </Text>
                                    {achievement.description ? (
                                        <Text style={styles.webAppAchievementsCardDescription}>
                                            {achievement.description}
                                        </Text>
                                    ) : null}
                                </View>
                                <View
                                    style={[
                                        styles.webAppAchievementsStatus,
                                        achievement.unlocked && styles.webAppAchievementsStatusEarned,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.webAppAchievementsStatusText,
                                            achievement.unlocked && styles.webAppAchievementsStatusTextEarned,
                                        ]}
                                    >
                                        {achievement.unlocked ? 'Diperoleh' : 'Terkunci'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : null}

                {!loading && !achievements.length ? (
                    <View style={styles.webAppAchievementsEmpty}>
                        <Trophy color="#cbd5e1" size={34} strokeWidth={2.2} />
                        <Text style={styles.webAppAchievementsEmptyText}>
                            Belum ada pencapaian yang tersedia.
                        </Text>
                    </View>
                ) : null}
            </ScrollView>
        );
    }

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
    const { deleteAccount, loading: sessionLoading, session, signOut, updateCurrentUser, user } = useSession();
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
                isWebAppLayout={isWebAppLayout}
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
                <SecuritySettings onDeleteAccount={deleteAccount} onSignOut={signOut} user={user} />
            </SubScreen>
        );
    }

    if (isWebAppLayout) {
        const accountActions = user
            ? [
                { Icon: Trophy, key: 'leaderboard', label: 'Leaderboard', meta: 'Peringkat streak komunitas', onPress: () => onOpenTab('belajar', { featureKey: 'leaderboard' }) },
                { Icon: Target, key: 'goals', label: 'Target Belajar', meta: 'Target pembelajaran personal', onPress: () => onOpenTab('belajar', { featureKey: 'goals' }) },
                { Icon: Settings, key: 'settings', label: 'Pengaturan', meta: 'Akun, tampilan, keamanan', onPress: () => push('settings') },
                { Icon: LogOut, danger: true, key: 'logout', label: 'Keluar', meta: 'Akhiri sesi perangkat ini', onPress: signOut },
            ]
            : [
                { Icon: User, key: 'login', label: 'Masuk / Daftar', meta: 'Login untuk fitur personal', onPress: () => push('settings-account') },
                { Icon: Settings, key: 'settings', label: 'Pengaturan', meta: 'Tampilan dan penyimpanan lokal', onPress: () => push('settings') },
            ];

        return (
            <ScrollView
                contentContainerStyle={styles.webAppProfileContent}
                showsVerticalScrollIndicator={false}
                style={styles.webAppProfileRoot}
            >
                <View testID="profile-web-app-surface" />
                <View style={styles.webAppProfileHero}>
                    <View style={styles.webAppAvatar}>
                        <Text style={styles.webAppAvatarText}>{initials || 'TI'}</Text>
                    </View>
                    <Text style={styles.webAppEyebrow}>AKUN</Text>
                    <Text style={styles.webAppProfileName}>{user?.name || 'Thullabul Ilmi'}</Text>
                    <Text style={styles.webAppProfileEmail}>{user?.email || 'Belum masuk ke akun'}</Text>
                    <Pressable
                        accessibilityLabel="Buka pengaturan profil"
                        android_ripple={{ color: '#1f2937', borderless: false }}
                        onPress={() => push('settings')}
                        style={styles.webAppSettingsButton}
                    >
                        <Settings color="#ffffff" size={16} strokeWidth={2.2} />
                        <Text style={styles.webAppSettingsText}>Pengaturan</Text>
                    </Pressable>
                </View>

                {stats ? (
                    <View style={styles.webAppStatsGrid}>
                        <View style={styles.webAppStatTile}>
                            <Text style={styles.webAppStatValue}>{stats.points.toLocaleString('id-ID')}</Text>
                            <Text style={styles.webAppStatLabel}>Total Poin</Text>
                        </View>
                        <View style={styles.webAppStatTile}>
                            <Text style={styles.webAppStatValue}>{stats.streak}</Text>
                            <Text style={styles.webAppStatLabel}>Hari Streak</Text>
                        </View>
                    </View>
                ) : null}

                {stats && (stats.hafalanCount !== null || stats.sholatWeekly !== null || stats.tilawahPages !== null) ? (
                    <View style={styles.webAppSection}>
                        <Text style={styles.webAppSectionTitle}>RINGKASAN PROGRESS</Text>
                        <View style={styles.webAppProgressGrid}>
                            {stats.hafalanCount !== null ? (
                                <Pressable onPress={() => onOpenTab('quran', { tab: 'hafalan' })} style={styles.webAppProgressTile}>
                                    <BookOpen color={WEB_APP_PROFILE_ACCENT} size={19} strokeWidth={2.2} />
                                    <Text style={styles.webAppProgressValue}>{stats.hafalanCount}</Text>
                                    <Text style={styles.webAppProgressLabel}>Surah Hafalan</Text>
                                </Pressable>
                            ) : null}
                            {stats.sholatWeekly !== null ? (
                                <Pressable onPress={() => onOpenTab('ibadah')} style={styles.webAppProgressTile}>
                                    <Target color={WEB_APP_PROFILE_ACCENT} size={19} strokeWidth={2.2} />
                                    <Text style={styles.webAppProgressValue}>{stats.sholatWeekly}%</Text>
                                    <Text style={styles.webAppProgressLabel}>Sholat Minggu Ini</Text>
                                </Pressable>
                            ) : null}
                            {stats.tilawahPages !== null ? (
                                <Pressable onPress={() => onOpenTab('quran')} style={styles.webAppProgressTile}>
                                    <Trophy color={WEB_APP_PROFILE_ACCENT} size={19} strokeWidth={2.2} />
                                    <Text style={styles.webAppProgressValue}>{stats.tilawahPages}</Text>
                                    <Text style={styles.webAppProgressLabel}>Halaman Tilawah</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                <View style={styles.webAppSection}>
                    <View style={styles.webAppSectionHeader}>
                        <Text style={styles.webAppSectionTitle}>PENCAPAIAN</Text>
                        {achievementsLoading ? <ActivityIndicator color={WEB_APP_PROFILE_ACCENT} size="small" /> : null}
                        <Pressable
                            accessibilityLabel="Lihat semua pencapaian"
                            onPress={() => push('achievements')}
                            style={styles.webAppSectionLink}
                        >
                            <Text style={styles.webAppSectionLinkText}>Lihat semua</Text>
                            <ChevronRight color={WEB_APP_PROFILE_ACCENT} size={14} strokeWidth={2.4} />
                        </Pressable>
                    </View>
                    {achievementsMessage ? <Text style={styles.webAppSectionHint}>{achievementsMessage}</Text> : null}
                    <View style={styles.webAppBadgeGrid}>
                        {achievements.slice(0, 6).map((badge) => (
                            <Pressable
                                android_ripple={{ color: '#1f2937', borderless: false }}
                                key={badge.code ?? badge.label}
                                onPress={() => push('achievements')}
                                style={[styles.webAppBadge, !badge.unlocked && styles.webAppBadgeLocked]}
                            >
                                <Text style={styles.webAppBadgeIcon}>{badge.unlocked ? badge.icon : '•'}</Text>
                                <Text numberOfLines={2} style={[styles.webAppBadgeLabel, !badge.unlocked && styles.webAppBadgeLabelLocked]}>
                                    {badge.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.webAppSection}>
                    <Text style={styles.webAppSectionTitle}>AKSI AKUN</Text>
                    <View style={styles.webAppActionGrid}>
                        {accountActions.map((item) => {
                            const Icon = item.Icon;
                            return (
                                <Pressable
                                    android_ripple={{ color: '#1f2937', borderless: false }}
                                    key={item.key}
                                    onPress={item.onPress}
                                    style={[styles.webAppActionTile, item.danger && styles.webAppActionTileDanger]}
                                >
                                    <View style={[styles.webAppActionIcon, item.danger && styles.webAppActionIconDanger]}>
                                        <Icon color={item.danger ? '#fca5a5' : WEB_APP_PROFILE_ACCENT} size={18} strokeWidth={2.2} />
                                    </View>
                                    <Text style={[styles.webAppActionLabel, item.danger && styles.webAppActionLabelDanger]}>
                                        {item.label}
                                    </Text>
                                    {item.meta ? <Text style={styles.webAppActionMeta}>{item.meta}</Text> : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
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
