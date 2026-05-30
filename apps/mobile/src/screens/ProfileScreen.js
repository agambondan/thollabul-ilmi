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
import { useMobileLocale } from '../i18n/MobileLocaleProvider';
import { defaultLayoutMode, useLayoutMode } from '../layout/LayoutModeProvider';
import { preferenceKeys, readPreference } from '../storage/preferences';
import { colors } from '../theme';
import { styles, WEB_APP_PROFILE_THEMES } from './ProfileScreen.styles';

const DEFAULT_BADGES = [
    { code: 'tilawah_first', description: 'Mulai perjalanan tilawah.', icon: '📖', label: 'Tilawah Perdana', unlocked: false },
    { code: 'sholat_full', description: 'Sempurnakan catatan sholat harian.', icon: '✅', label: 'Sholat Penuh', unlocked: false },
    { code: 'starter', description: 'Akun belajar sudah aktif.', icon: '🌟', label: 'Penuntut Ilmi', unlocked: true },
    { code: 'streak_7', description: 'Jaga aktivitas belajar selama 7 hari.', icon: '🔥', label: 'Streak 7 Hari', unlocked: false },
];

const THEME_OPTIONS = [
    { key: 'system', labelKey: 'theme.system.label', metaKey: 'theme.system.meta' },
    { key: 'light', labelKey: 'theme.light.label', metaKey: 'theme.light.meta' },
    { key: 'dark', labelKey: 'theme.dark.label', metaKey: 'theme.dark.meta' },
];

const LANGUAGE_OPTIONS = [
    { key: 'idn', labelKey: 'language.indonesia.label', metaKey: 'language.indonesia.meta' },
    { key: 'en', labelKey: 'language.english.label', metaKey: 'language.english.meta' },
];

const LAYOUT_OPTIONS = [
    { key: 'classic', labelKey: 'layout.classic.label', metaKey: 'layout.classic.meta' },
    { key: 'web_app', labelKey: 'layout.webApp.label', metaKey: 'layout.webApp.meta' },
];

const getResponseUser = (payload) => payload?.data ?? payload;

const mobileDateLocales = {
    en: 'en-US',
    idn: 'id-ID',
};

const formatSessionDate = (value, fallback, language) => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString(mobileDateLocales[language] ?? mobileDateLocales.idn, {
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

const getAchievementProgress = (achievement, stats, t) => {
    const threshold = Number(achievement.threshold) || 0;
    if (!threshold) return null;

    if (achievement.category === 'streak') {
        const current = Number(stats?.streak ?? 0);
        return {
            current,
            label: t('profile.achievements.progress.days', { current: Math.min(current, threshold), threshold }),
            pct: Math.min(100, Math.round((current / threshold) * 100)),
        };
    }

    if (achievement.category === 'hafalan') {
        const current = Number(stats?.hafalanCount ?? 0);
        return {
            current,
            label: t('profile.achievements.progress.surah', { current: Math.min(current, threshold), threshold }),
            pct: Math.min(100, Math.round((current / threshold) * 100)),
        };
    }

    return {
        current: null,
        label: t('profile.achievements.progress.target', { threshold }),
        pct: achievement.unlocked ? 100 : 0,
    };
};

function SubScreen({ title, onBack, children }) {
    const { isWebAppLayout } = useLayoutModePreference();
    const { t } = useMobileLocale();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
        >
            <View style={styles.subHeader}>
                <Pressable
                    accessibilityLabel={t('common.back')}
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
    const { t } = useMobileLocale();
    const items = [
        {
            Icon: User,
            label: t('profile.settings.account.label'),
            meta: t('profile.settings.account.meta'),
            screen: 'settings-account',
        },
        {
            Icon: Bell,
            label: t('profile.settings.notifications.label'),
            meta: t('profile.settings.notifications.meta'),
            screen: 'settings-notifications',
        },
        {
            Icon: HardDrive,
            label: t('profile.settings.storage.label'),
            meta: t('profile.settings.storage.meta'),
            screen: 'settings-storage',
        },
        {
            Icon: Palette,
            label: t('profile.settings.appearance.label'),
            meta: t('profile.settings.appearance.meta'),
            screen: 'settings-appearance',
        },
        {
            Icon: ShieldCheck,
            label: t('profile.settings.security.label'),
            meta: t('profile.settings.security.meta'),
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
    const { setLanguage: setAppLanguage, t } = useMobileLocale();
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
            setMessage(t('theme.saved'));
        } catch (err) {
            setMessage(err?.message ?? t('theme.saveError'));
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
            setMessage(t('layout.saved'));
        } catch (err) {
            setMessage(err?.message ?? t('layout.saveError'));
        } finally {
            setSaving('');
        }
    };

    const saveLanguage = async (nextLanguage) => {
        setSaving('language');
        setMessage('');
        try {
            const storedLanguage = await setAppLanguage(nextLanguage);
            setLanguage(storedLanguage);
            if (user) {
                const updatedUser = getResponseUser(await updateProfile({ preferredLang: storedLanguage }));
                await onUserUpdated?.(updatedUser);
                setMessage(t('language.savedAccount'));
            } else {
                setMessage(t('language.savedDevice'));
            }
        } catch (err) {
            setMessage(err?.message ?? t('language.saveError'));
        } finally {
            setSaving('');
        }
    };

    return (
        <>
            <Card>
                <Text style={styles.appearanceLabel}>{t('profile.appearance.theme.label')}</Text>
                <Text style={styles.appearanceMeta}>
                    {t('profile.appearance.theme.meta')}
                </Text>
                <View style={styles.choiceGroup}>
                    {THEME_OPTIONS.map((item) => (
                        <ChoiceRow
                            active={theme === item.key}
                            key={item.key}
                            label={t(item.labelKey)}
                            meta={t(item.metaKey)}
                            onPress={() => saveTheme(item.key)}
                        />
                    ))}
                </View>
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>{t('profile.appearance.language.label')}</Text>
                <Text style={styles.appearanceMeta}>
                    {t('profile.appearance.language.meta')}
                </Text>
                <View style={styles.choiceGroup}>
                    {LANGUAGE_OPTIONS.map((item) => (
                        <ChoiceRow
                            active={language === item.key}
                            key={item.key}
                            label={t(item.labelKey)}
                            meta={t(item.metaKey)}
                            onPress={() => saveLanguage(item.key)}
                        />
                    ))}
                </View>
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>{t('layout.mode.label')}</Text>
                <Text style={styles.appearanceMeta}>
                    {t('layout.mode.meta')}
                </Text>
                <View style={styles.choiceGroup}>
                    {LAYOUT_OPTIONS.map((item) => (
                        <ChoiceRow
                            active={layoutMode === item.key}
                            key={item.key}
                            label={t(item.labelKey)}
                            meta={t(item.metaKey)}
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
    const { language, t } = useMobileLocale();
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
            setMessage(t('profile.security.delete.confirmMessage'));
            return;
        }

        setDeleting(true);
        try {
            await onDeleteAccount();
        } catch (err) {
            setError(err?.message ?? t('profile.security.delete.error'));
            setDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    const submitPassword = async () => {
        setMessage('');
        setError('');

        if (!oldPassword || !newPassword) {
            setError(t('profile.security.password.required'));
            return;
        }
        if (newPassword.length < 8) {
            setError(t('profile.security.password.minLength'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('profile.security.password.confirmMismatch'));
            return;
        }

        setSaving(true);
        try {
            await updatePassword({ oldPassword, newPassword });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setMessage(t('profile.security.password.saved'));
        } catch (err) {
            setError(err?.message ?? t('profile.security.password.error'));
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
            setMessage(t('profile.security.session.revoked'));
        } catch (err) {
            setError(err?.message ?? t('profile.security.session.revokeError'));
        } finally {
            setRevokingSessionId(null);
        }
    };

    if (!user) {
        return (
            <Card>
                <Text style={styles.appearanceLabel}>{t('profile.security.guest.title')}</Text>
                <Text style={styles.appearanceMeta}>
                    {t('profile.security.guest.description')}
                </Text>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <Text style={styles.appearanceLabel}>{t('profile.security.sessions.title')}</Text>
                <View style={styles.sessionDeviceCard}>
                    <View style={styles.sessionDeviceIcon}>
                        <ShieldCheck color={colors.primary} size={20} strokeWidth={2.4} />
                    </View>
                    <View style={styles.sessionDeviceBody}>
                        <Text style={styles.sessionDeviceTitle}>{t('profile.security.session.currentDevice')}</Text>
                        <Text style={styles.sessionDeviceMeta}>
                            {user.email || t('profile.security.session.currentMeta')}
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
                                        {item.current ? t('profile.security.session.currentDevice') : t('profile.security.session.loginSession')}
                                    </Text>
                                    <Text style={styles.sessionListMeta}>
                                        {t('profile.security.session.activeSince', {
                                            date: formatSessionDate(item.created_at, t('profile.security.session.now'), language),
                                        })}
                                    </Text>
                                </View>
                                {item.current ? (
                                    <Text style={styles.sessionCurrentPill}>{t('profile.security.session.active')}</Text>
                                ) : (
                                    <Pressable
                                        accessibilityLabel={t('profile.security.session.revokeAccessibility', { id: item.id })}
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
                                            {revokingSessionId === item.id ? '...' : t('profile.security.session.revoke')}
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
                    <Text style={styles.formButtonDangerText}>{t('profile.security.signOutDevice')}</Text>
                </Pressable>
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>{t('profile.security.password.title')}</Text>
                <Text style={styles.appearanceMeta}>{t('profile.security.password.description')}</Text>
                <View style={styles.formBlock}>
                    <TextInput
                        accessibilityLabel={t('profile.security.password.current')}
                        onChangeText={setOldPassword}
                        placeholder={t('profile.security.password.current')}
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={styles.formInput}
                        value={oldPassword}
                    />
                    <TextInput
                        accessibilityLabel={t('profile.security.password.new')}
                        onChangeText={setNewPassword}
                        placeholder={t('profile.security.password.newPlaceholder')}
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                        style={styles.formInput}
                        value={newPassword}
                    />
                    <TextInput
                        accessibilityLabel={t('profile.security.password.confirm')}
                        onChangeText={setConfirmPassword}
                        placeholder={t('profile.security.password.confirm')}
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
                            <Text style={styles.formButtonText}>{t('profile.security.password.save')}</Text>
                        )}
                    </Pressable>
                </View>
                {error ? <Text style={[styles.settingsStatus, styles.settingsStatusError]}>{error}</Text> : null}
                {message ? <Text style={styles.settingsStatus}>{message}</Text> : null}
            </Card>

            <Card>
                <Text style={styles.appearanceLabel}>{t('profile.security.delete.title')}</Text>
                <Text style={styles.appearanceMeta}>
                    {t('profile.security.delete.description')}
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
                            {deleteConfirm ? t('profile.security.delete.confirm') : t('profile.security.delete.action')}
                        </Text>
                    )}
                </Pressable>
            </Card>
        </>
    );
}

function AchievementsDetail({ achievements, isWebAppLayout, loading, message, onBack, points, stats, user }) {
    const { t } = useMobileLocale();
    const earnedCount = achievements.filter((item) => item.unlocked).length;
    const earnedSummary = t('profile.achievements.earnedSummary', {
        count: earnedCount,
        total: achievements.length,
    });

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
                    <Text style={styles.webAppAchievementsTitle}>{t('profile.achievements.title')}</Text>
                    <Text style={styles.webAppAchievementsSubtitle}>
                        {t('profile.achievements.subtitle')}
                    </Text>
                </View>

                {user ? (
                    <View style={styles.webAppAchievementsHero}>
                        <Text style={styles.webAppAchievementsHeroLabel}>{t('profile.stats.totalPoints')}</Text>
                        <Text style={styles.webAppAchievementsHeroValue}>
                            {(points ?? 0).toLocaleString('id-ID')}
                        </Text>
                        <Text style={styles.webAppAchievementsHeroMeta}>
                            {earnedSummary}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.webAppAchievementsNotice}>
                        <Text style={styles.webAppAchievementsNoticeIcon}>🏅</Text>
                        <Text style={styles.webAppAchievementsNoticeText}>
                            {t('profile.achievements.loginPrompt')}
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
                                        {achievement.unlocked ? t('profile.achievements.earned') : t('profile.achievements.locked')}
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
                            {t('profile.achievements.empty')}
                        </Text>
                    </View>
                ) : null}
            </ScrollView>
        );
    }

    return (
        <SubScreen title={t('profile.achievements.title')} onBack={onBack}>
            <Card style={styles.achievementHero}>
                <View style={styles.achievementHeroIcon}>
                    <Trophy color={colors.accent} size={28} strokeWidth={2.4} />
                </View>
                <View style={styles.achievementHeroBody}>
                    <Text style={styles.achievementHeroValue}>
                        {user ? (points ?? 0).toLocaleString('id-ID') : '—'}
                    </Text>
                    <Text style={styles.achievementHeroLabel}>{t('profile.stats.totalPoints')}</Text>
                    <Text style={styles.achievementHeroMeta}>
                        {earnedSummary}
                    </Text>
                </View>
            </Card>

            {!user ? (
                <Card style={styles.emptyAchievementCard}>
                    <Text style={styles.emptyAchievementIcon}>🏅</Text>
                    <Text style={styles.emptyAchievementTitle}>{t('profile.achievements.loginPrompt')}</Text>
                    <Text style={styles.emptyAchievementText}>
                        {t('profile.achievements.loginDescription')}
                    </Text>
                </Card>
            ) : null}

            {message ? <Text style={styles.sectionHint}>{message}</Text> : null}
            {loading ? <ActivityIndicator color={colors.primary} /> : null}

            <View style={styles.achievementList}>
                {achievements.map((achievement) => {
                    const progress = getAchievementProgress(achievement, stats, t);
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
                                                {achievement.unlocked ? t('profile.achievements.earned') : t('profile.achievements.locked')}
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
                                        <Text style={styles.achievementProgressLabel}>{t('profile.achievements.progress.label')}</Text>
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
                                    {t('profile.achievements.reward', { points: achievement.rewardPoints })}
                                </Text>
                                {achievement.earnedAt ? (
                                    <Text style={styles.achievementEarnedDate}>{t('profile.achievements.alreadyEarned')}</Text>
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
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const { t } = useMobileLocale();
    const webAppProfileTheme = isDarkTheme ? WEB_APP_PROFILE_THEMES.dark : WEB_APP_PROFILE_THEMES.light;
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
                setAchievementsMessage(t('profile.achievements.loadError'));
            } else if (!session?.token) {
                setAchievementsMessage(t('profile.achievements.guestMessage'));
            }
            setAchievementsLoading(false);
        };

        loadProfileData();

        return () => {
            mounted = false;
        };
    }, [session?.token, t]);

    if (currentScreen === 'settings') {
        return (
            <SubScreen title={t('profile.settings.title')} onBack={pop}>
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
            <SubScreen title={t('profile.settings.account.label')} onBack={pop}>
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
                            {sessionLoading ? t('account.logoutLoading') : t('profile.account.signOut')}
                        </Text>
                    </Pressable>
                ) : null}
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-notifications') {
        return (
            <SubScreen title={t('profile.settings.notifications.label')} onBack={pop}>
                <NotificationCenter />
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-storage') {
        return (
            <SubScreen title={t('profile.settings.storage.label')} onBack={pop}>
                <OfflinePackCard />
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-appearance') {
        return (
            <SubScreen title={t('profile.settings.appearance.label')} onBack={pop}>
                <AppearanceSettings onUserUpdated={updateCurrentUser} user={user} />
            </SubScreen>
        );
    }

    if (currentScreen === 'settings-security') {
        return (
            <SubScreen title={t('profile.settings.security.label')} onBack={pop}>
                <SecuritySettings onDeleteAccount={deleteAccount} onSignOut={signOut} user={user} />
            </SubScreen>
        );
    }

    if (isWebAppLayout) {
        const accountActions = user
            ? [
                { Icon: Trophy, key: 'leaderboard', label: 'Leaderboard', meta: t('profile.actions.leaderboard.meta'), onPress: () => onOpenTab('belajar', { featureKey: 'leaderboard' }) },
                { Icon: Target, key: 'goals', label: t('profile.actions.goals.label'), meta: t('profile.actions.goals.meta'), onPress: () => onOpenTab('belajar', { featureKey: 'goals' }) },
                { Icon: Settings, key: 'settings', label: t('profile.settings.title'), meta: t('profile.actions.settings.meta'), onPress: () => push('settings') },
                { Icon: LogOut, danger: true, key: 'logout', label: t('account.logout'), meta: t('profile.actions.logout.meta'), onPress: signOut },
            ]
            : [
                { Icon: User, key: 'login', label: t('profile.actions.login.label'), meta: t('profile.actions.login.meta'), onPress: () => push('settings-account') },
                { Icon: Settings, key: 'settings', label: t('profile.settings.title'), meta: t('profile.actions.localSettings.meta'), onPress: () => push('settings') },
            ];

        return (
            <ScrollView
                contentContainerStyle={[styles.webAppProfileContent, { backgroundColor: webAppProfileTheme.bg }]}
                showsVerticalScrollIndicator={false}
                style={[styles.webAppProfileRoot, { backgroundColor: webAppProfileTheme.bg }]}
                testID="profile-web-app-scroll"
            >
                <View testID="profile-web-app-surface" />
                <View
                    style={[
                        styles.webAppProfileHero,
                        { backgroundColor: webAppProfileTheme.surface, borderColor: webAppProfileTheme.border },
                    ]}
                    testID="profile-web-app-hero"
                >
                    <View style={styles.webAppAvatar}>
                        <Text style={styles.webAppAvatarText}>{initials || 'TI'}</Text>
                    </View>
                    <Text style={[styles.webAppEyebrow, { color: webAppProfileTheme.accent }]}>{t('profile.eyebrow')}</Text>
                    <Text style={[styles.webAppProfileName, { color: webAppProfileTheme.title }]}>{user?.name || 'Thullabul Ilmi'}</Text>
                    <Text style={[styles.webAppProfileEmail, { color: webAppProfileTheme.muted }]}>{user?.email || t('profile.guestEmail')}</Text>
                    <Pressable
                        accessibilityLabel={t('profile.settings.open')}
                        android_ripple={{ color: webAppProfileTheme.ripple, borderless: false }}
                        onPress={() => push('settings')}
                        style={styles.webAppSettingsButton}
                    >
                        <Settings color="#ffffff" size={16} strokeWidth={2.2} />
                        <Text style={styles.webAppSettingsText}>{t('profile.settings.title')}</Text>
                    </Pressable>
                </View>

                {stats ? (
                    <View style={styles.webAppStatsGrid}>
                        <View style={[styles.webAppStatTile, { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border }]}>
                            <Text style={[styles.webAppStatValue, { color: webAppProfileTheme.accent }]}>{stats.points.toLocaleString('id-ID')}</Text>
                            <Text style={[styles.webAppStatLabel, { color: webAppProfileTheme.text }]}>{t('profile.stats.totalPoints')}</Text>
                        </View>
                        <View style={[styles.webAppStatTile, { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border }]}>
                            <Text style={[styles.webAppStatValue, { color: webAppProfileTheme.accent }]}>{stats.streak}</Text>
                            <Text style={[styles.webAppStatLabel, { color: webAppProfileTheme.text }]}>{t('profile.stats.streakDays')}</Text>
                        </View>
                    </View>
                ) : null}

                {stats && (stats.hafalanCount !== null || stats.sholatWeekly !== null || stats.tilawahPages !== null) ? (
                    <View style={styles.webAppSection}>
                        <Text style={[styles.webAppSectionTitle, { color: webAppProfileTheme.accent }]}>{t('profile.progress.title')}</Text>
                        <View style={styles.webAppProgressGrid}>
                            {stats.hafalanCount !== null ? (
                                <Pressable onPress={() => onOpenTab('quran', { tab: 'hafalan' })} style={[styles.webAppProgressTile, { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border }]}>
                                    <BookOpen color={webAppProfileTheme.accent} size={19} strokeWidth={2.2} />
                                    <Text style={[styles.webAppProgressValue, { color: webAppProfileTheme.title }]}>{stats.hafalanCount}</Text>
                                    <Text style={[styles.webAppProgressLabel, { color: webAppProfileTheme.text }]}>{t('profile.progress.hafalan')}</Text>
                                </Pressable>
                            ) : null}
                            {stats.sholatWeekly !== null ? (
                                <Pressable onPress={() => onOpenTab('ibadah')} style={[styles.webAppProgressTile, { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border }]}>
                                    <Target color={webAppProfileTheme.accent} size={19} strokeWidth={2.2} />
                                    <Text style={[styles.webAppProgressValue, { color: webAppProfileTheme.title }]}>{stats.sholatWeekly}%</Text>
                                    <Text style={[styles.webAppProgressLabel, { color: webAppProfileTheme.text }]}>{t('profile.progress.prayerWeek')}</Text>
                                </Pressable>
                            ) : null}
                            {stats.tilawahPages !== null ? (
                                <Pressable onPress={() => onOpenTab('quran')} style={[styles.webAppProgressTile, { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border }]}>
                                    <Trophy color={webAppProfileTheme.accent} size={19} strokeWidth={2.2} />
                                    <Text style={[styles.webAppProgressValue, { color: webAppProfileTheme.title }]}>{stats.tilawahPages}</Text>
                                    <Text style={[styles.webAppProgressLabel, { color: webAppProfileTheme.text }]}>{t('profile.progress.tilawahPages')}</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                <View style={styles.webAppSection}>
                    <View style={styles.webAppSectionHeader}>
                        <Text style={[styles.webAppSectionTitle, { color: webAppProfileTheme.accent }]}>{t('profile.achievements.sectionTitle')}</Text>
                        {achievementsLoading ? <ActivityIndicator color={webAppProfileTheme.accent} size="small" /> : null}
                        <Pressable
                            accessibilityLabel={t('profile.achievements.seeAllAccessibility')}
                            onPress={() => push('achievements')}
                            style={[styles.webAppSectionLink, { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border }]}
                        >
                            <Text style={[styles.webAppSectionLinkText, { color: webAppProfileTheme.accent }]}>{t('profile.achievements.seeAll')}</Text>
                            <ChevronRight color={webAppProfileTheme.accent} size={14} strokeWidth={2.4} />
                        </Pressable>
                    </View>
                    {achievementsMessage ? <Text style={[styles.webAppSectionHint, { color: webAppProfileTheme.muted }]}>{achievementsMessage}</Text> : null}
                    <View style={styles.webAppBadgeGrid}>
                        {achievements.slice(0, 6).map((badge) => (
                            <Pressable
                                android_ripple={{ color: webAppProfileTheme.ripple, borderless: false }}
                                key={badge.code ?? badge.label}
                                onPress={() => push('achievements')}
                                style={[
                                    styles.webAppBadge,
                                    { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border },
                                    !badge.unlocked && styles.webAppBadgeLocked,
                                ]}
                            >
                                <Text style={[styles.webAppBadgeIcon, { color: webAppProfileTheme.title }]}>{badge.unlocked ? badge.icon : '•'}</Text>
                                <Text numberOfLines={2} style={[styles.webAppBadgeLabel, { color: webAppProfileTheme.title }, !badge.unlocked && { color: webAppProfileTheme.muted }]}>
                                    {badge.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.webAppSection}>
                    <Text style={[styles.webAppSectionTitle, { color: webAppProfileTheme.accent }]}>{t('profile.actions.title')}</Text>
                    <View style={styles.webAppActionGrid}>
                        {accountActions.map((item) => {
                            const Icon = item.Icon;
                            const actionTileStyle = item.danger
                                ? { backgroundColor: webAppProfileTheme.actionDangerBg, borderColor: webAppProfileTheme.actionDangerBorder }
                                : { backgroundColor: webAppProfileTheme.tile, borderColor: webAppProfileTheme.border };
                            return (
                                <Pressable
                                    android_ripple={{ color: webAppProfileTheme.ripple, borderless: false }}
                                    key={item.key}
                                    onPress={item.onPress}
                                    style={[styles.webAppActionTile, item.danger && styles.webAppActionTileDanger, actionTileStyle]}
                                >
                                    <View style={[styles.webAppActionIcon, item.danger && styles.webAppActionIconDanger, { backgroundColor: item.danger ? 'rgba(248, 113, 113, 0.12)' : webAppProfileTheme.iconBg }]}>
                                        <Icon color={item.danger ? webAppProfileTheme.actionDangerIcon : webAppProfileTheme.accent} size={18} strokeWidth={2.2} />
                                    </View>
                                    <Text style={[styles.webAppActionLabel, item.danger && styles.webAppActionLabelDanger, { color: item.danger ? webAppProfileTheme.actionDangerLabel : webAppProfileTheme.title }]}>
                                        {item.label}
                                    </Text>
                                    {item.meta ? <Text style={[styles.webAppActionMeta, { color: webAppProfileTheme.text }]}>{item.meta}</Text> : null}
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
            subtitle={t('profile.subtitle')}
            title={t('profile.title')}
        >
            <View testID={isWebAppLayout ? 'profile-web-app-surface' : 'profile-classic-surface'} />
            <Card style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials || 'TI'}</Text>
                </View>
                <View style={styles.profileBody}>
                    <Text style={styles.name}>{user?.name || 'Thullabul Ilmi'}</Text>
                    <Text style={styles.email}>
                        {user?.email || t('profile.guestEmail')}
                    </Text>
                </View>
                <Pressable
                    accessibilityLabel={t('profile.settings.open')}
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
                        <Text style={styles.statLabel}>{t('profile.stats.totalPoints')}</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.streak}</Text>
                        <Text style={styles.statLabel}>{t('profile.stats.streakDays')}</Text>
                    </Card>
                </View>
            ) : null}

            {stats && (stats.hafalanCount !== null || stats.sholatWeekly !== null || stats.tilawahPages !== null) ? (
                <View style={styles.progressSection}>
                    <Text style={styles.sectionLabel}>{t('profile.progress.title')}</Text>
                    <View style={styles.progressGrid}>
                        {stats.hafalanCount !== null ? (
                            <Pressable
                                onPress={() => onOpenTab('quran', { tab: 'hafalan' })}
                                style={styles.progressCard}
                            >
                                <BookOpen color={colors.primary} size={20} strokeWidth={2} />
                                <Text style={styles.progressValue}>{stats.hafalanCount}</Text>
                                <Text style={styles.progressLabel}>{t('profile.progress.hafalan')}</Text>
                            </Pressable>
                        ) : null}
                        {stats.sholatWeekly !== null ? (
                            <Pressable
                                onPress={() => onOpenTab('ibadah')}
                                style={styles.progressCard}
                            >
                                <Target color={colors.primary} size={20} strokeWidth={2} />
                                <Text style={styles.progressValue}>{stats.sholatWeekly}%</Text>
                                <Text style={styles.progressLabel}>{t('profile.progress.prayerWeek')}</Text>
                            </Pressable>
                        ) : null}
                        {stats.tilawahPages !== null ? (
                            <Pressable
                                onPress={() => onOpenTab('quran')}
                                style={styles.progressCard}
                            >
                                <Trophy color={colors.primary} size={20} strokeWidth={2} />
                                <Text style={styles.progressValue}>{stats.tilawahPages}</Text>
                                <Text style={styles.progressLabel}>{t('profile.progress.tilawahPages')}</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.badgeSection}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>{t('profile.achievements.sectionTitle')}</Text>
                    <View style={styles.sectionHeaderActions}>
                        {achievementsLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                        <Pressable
                            accessibilityLabel={t('profile.achievements.seeAllAccessibility')}
                            android_ripple={{ color: 'rgba(91, 110, 91, 0.12)', borderless: false }}
                            onPress={() => push('achievements')}
                            style={styles.sectionLink}
                        >
                            <Text style={styles.sectionLinkText}>{t('profile.achievements.seeAll')}</Text>
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
                    meta={t('profile.actions.leaderboard.meta')}
                    onPress={() => onOpenTab('belajar', { featureKey: 'leaderboard' })}
                />
                <MenuRow
                    Icon={Target}
                    label={t('profile.actions.goals.label')}
                    meta={t('profile.actions.goals.meta')}
                    onPress={() => onOpenTab('belajar', { featureKey: 'goals' })}
                />
                {user ? (
                    <MenuRow
                        Icon={LogOut}
                        danger
                        label={t('account.logout')}
                        onPress={signOut}
                    />
                ) : (
                    <MenuRow
                        Icon={User}
                        label={t('profile.actions.login.label')}
                        meta={t('profile.actions.login.meta')}
                        onPress={() => push('settings-account')}
                    />
                )}
            </Card>
        </Screen>
    );
}
