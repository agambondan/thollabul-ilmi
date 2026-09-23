import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path } from "react-native-svg";
import { useFeedback } from "../context/FeedbackContext";
import { useSession } from "../context/SessionContext";
import { useLayoutModePreference } from "../hooks/useLayoutModePreference";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import {
    forgotPassword,
    getWhatsappAvailability,
    register,
    resendVerification,
    verifyWhatsapp,
} from "../api/auth";
import { API_URL } from "../api/client";
import { colors, getThemeColors, radius, shadows, spacing } from "../theme";
import { Card, CardTitle } from "./Card";

const ACCOUNT_NOT_VERIFIED_MESSAGE = "account not verified";

function GoogleIcon({ size = 18 }) {
    return (
        <Svg width={size} height={size} viewBox='0 0 48 48'>
            <Path
                fill='#FFC107'
                d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'
            />
            <Path
                fill='#FF3D00'
                d='M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z'
            />
            <Path
                fill='#4CAF50'
                d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'
            />
            <Path
                fill='#1976D2'
                d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'
            />
        </Svg>
    );
}

export function SessionCard() {
    const { error, loading, signIn, signInWithSession, signOut, user } =
        useSession();
    const { showError, showInfo, showSuccess } = useFeedback();
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const theme = getThemeColors({
        isDark: isDarkTheme,
        isClassic: !isWebAppLayout,
    });
    const { t } = useMobileLocale();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [mode, setMode] = useState("signin");
    const [busy, setBusy] = useState(false);
    const [verificationChannel, setVerificationChannel] = useState("email");
    const [phone, setPhone] = useState("");
    const [waAvailable, setWaAvailable] = useState(false);
    const [verifyIdentifier, setVerifyIdentifier] = useState("");
    const [verifyChannel, setVerifyChannel] = useState("email");
    const [code, setCode] = useState("");

    useEffect(() => {
        let alive = true;
        getWhatsappAvailability()
            .then((res) => {
                if (alive) setWaAvailable(Boolean(res?.available));
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    const submit = async () => {
        setMessage("");
        try {
            await signIn({ email: email.trim(), password: password.trim() });
            setPassword("");
            setMessage(t("session.signIn.success"));
            showSuccess(t("session.signIn.success"));
        } catch (err) {
            if (
                err?.status === 401 &&
                err?.message === ACCOUNT_NOT_VERIFIED_MESSAGE
            ) {
                const identifier = email.trim();
                setVerifyIdentifier(identifier);
                setVerifyChannel(
                    identifier.includes("@") ? "email" : "whatsapp",
                );
                setCode("");
                setMode("verify");
                setMessage("");
                showInfo(t("session.verify.needed"));
                return;
            }
            setMessage("");
            showError(err?.message ?? error ?? t("session.signIn.error"));
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setBusy(true);
            const authUrl = `${API_URL}/api/v1/auth/google?source=mobile`;
            const redirectUrl = "thullaabulilmi://auth/google/callback";

            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                redirectUrl,
                {
                    toolbarColor: theme.surface,
                    controlsColor: theme.primary,
                    showInRecents: true,
                },
            );

            if (result.type === "success" && result.url) {
                const parsedUrl = new URL(result.url);
                const token = parsedUrl.searchParams.get("token");
                const refreshToken =
                    parsedUrl.searchParams.get("refresh_token");
                const googleName = parsedUrl.searchParams.get("name");
                const googleEmail = parsedUrl.searchParams.get("email");

                if (token && signInWithSession) {
                    await signInWithSession({
                        token,
                        refreshToken: refreshToken || token,
                        user:
                            googleName && googleEmail
                                ? { name: googleName, email: googleEmail }
                                : undefined,
                    });
                    showSuccess(t("session.signIn.success"));
                }
            }
        } catch (err) {
            showError(err?.message || t("session.googleLoginError"));
        } finally {
            setBusy(false);
        }
    };

    if (user) {
        return (
            <Card style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <CardTitle meta={t("session.active.meta")}>
                    {t("session.active.title")}
                </CardTitle>
                <Text style={[styles.name, { color: theme.ink }]}>
                    {user.name ||
                        user.email ||
                        t("session.active.fallbackName")}
                </Text>
                <Text style={[styles.muted, { color: theme.muted }]}>
                    {user.email || t("session.active.fallbackMeta")}
                </Text>
                <Pressable
                    accessibilityLabel={t("session.signOut.accessibility")}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: loading }}
                    android_ripple={{
                        color: "rgba(91, 110, 91, 0.12)",
                        borderless: false,
                    }}
                    disabled={loading}
                    onPress={signOut}
                    style={[
                        styles.button,
                        styles.secondaryButton,
                        {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.buttonText,
                            styles.secondaryButtonText,
                            { color: theme.primary },
                        ]}
                    >
                        {loading
                            ? t("session.signOut.loading")
                            : t("session.signOut.label")}
                    </Text>
                </Pressable>
            </Card>
        );
    }

    const submitRegister = async () => {
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();
        if (!name.trim() || !password) return;
        if (verificationChannel === "email" && !trimmedEmail) return;
        if (verificationChannel === "whatsapp" && !trimmedPhone) return;
        const trimmedPassword = password.trim();
        if (trimmedPassword.length < 8) {
            setMessage(t("session.password.minLength"));
            showInfo(t("session.password.minLength"));
            return;
        }
        if (trimmedPassword !== confirmPassword.trim()) {
            setMessage(t("session.password.mismatch"));
            showInfo(t("session.password.mismatch"));
            return;
        }
        setBusy(true);
        setMessage("");
        try {
            const registeredUser = await register({
                email: trimmedEmail,
                name: name.trim(),
                password: trimmedPassword,
                verificationChannel,
                phone:
                    verificationChannel === "whatsapp"
                        ? trimmedPhone
                        : undefined,
            });
            setPassword("");
            setConfirmPassword("");
            setVerifyIdentifier(
                verificationChannel === "whatsapp"
                    ? trimmedPhone
                    : trimmedEmail,
            );
            setVerifyChannel(
                registeredUser?.verification_channel ?? verificationChannel,
            );
            setCode("");
            setMode("verify");
            setMessage(t("session.register.success"));
            showSuccess(t("session.register.success"));
        } catch (err) {
            const nextMessage = err?.message ?? t("session.register.error");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setBusy(false);
        }
    };

    const submitVerifyCode = async () => {
        if (!code.trim()) return;
        setBusy(true);
        setMessage("");
        try {
            await verifyWhatsapp({ phone: verifyIdentifier, code: code.trim() });
            setCode("");
            setMode("signin");
            setMessage(t("session.verify.success"));
            showSuccess(t("session.verify.success"));
        } catch (err) {
            const nextMessage = err?.message ?? t("session.verify.error");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setBusy(false);
        }
    };

    const handleResendVerification = async () => {
        setBusy(true);
        setMessage("");
        try {
            await resendVerification(verifyIdentifier);
            showSuccess(t("session.resend.success"));
        } catch {
            showError(t("session.resend.error"));
        } finally {
            setBusy(false);
        }
    };

    const submitForgot = async () => {
        if (!email.trim()) return;
        setBusy(true);
        setMessage("");
        try {
            const responseMessage = await forgotPassword(email.trim());
            setMode("signin");
            setMessage(
                typeof responseMessage === "string"
                    ? responseMessage
                    : t("session.forgot.success"),
            );
            showSuccess(
                typeof responseMessage === "string"
                    ? responseMessage
                    : t("session.forgot.success"),
            );
        } catch (err) {
            const nextMessage = err?.message ?? t("session.forgot.error");
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setBusy(false);
        }
    };

    const isSignIn = mode === "signin";
    const isRegister = mode === "register";
    const isForgot = mode === "forgot";
    const isVerify = mode === "verify";
    const isVerifyWhatsapp = isVerify && verifyChannel === "whatsapp";
    const isVerifyEmail = isVerify && verifyChannel !== "whatsapp";
    const isSubmitDisabled =
        loading ||
        busy ||
        (isSignIn && (!email || !password)) ||
        (isRegister &&
            (!name.trim() ||
                (verificationChannel === "email" && !email.trim()) ||
                (verificationChannel === "whatsapp" && !phone.trim()) ||
                password.trim().length < 8 ||
                password.trim() !== confirmPassword.trim())) ||
        (isForgot && !email) ||
        (isVerifyWhatsapp && !code.trim());

    return (
        <Card style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <CardTitle meta={t("session.card.meta")}>
                {isSignIn
                    ? t("session.card.title")
                    : isRegister
                      ? t("session.register.title")
                      : isVerify
                        ? t("session.verify.title")
                        : t("session.forgot.title")}
            </CardTitle>
            <Text style={[styles.muted, { color: theme.muted }]}>
                {isVerifyWhatsapp
                    ? t("session.verify.whatsappDesc")
                    : isVerifyEmail
                      ? t("session.verify.emailDesc")
                      : t("session.card.description")}
            </Text>

            {!isVerify ? (
                <View
                    style={[
                        styles.tabContainer,
                        {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <Pressable
                        accessibilityLabel={t("session.mode.signIn")}
                        accessibilityRole='button'
                        accessibilityState={{ selected: isSignIn }}
                        android_ripple={{
                            color: isDarkTheme
                                ? "rgba(52, 211, 153, 0.15)"
                                : "rgba(4, 120, 87, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => {
                            setMode("signin");
                            setMessage("");
                        }}
                        style={[
                            styles.tabButton,
                            isSignIn && [
                                styles.tabButtonActive,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    ...shadows.paper,
                                },
                            ],
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                { color: theme.muted },
                                isSignIn && [
                                    styles.tabTextActive,
                                    { color: theme.primary },
                                ],
                            ]}
                        >
                            {t("session.signIn.label")}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityLabel={t("session.mode.register")}
                        accessibilityRole='button'
                        accessibilityState={{ selected: isRegister }}
                        android_ripple={{
                            color: isDarkTheme
                                ? "rgba(52, 211, 153, 0.15)"
                                : "rgba(4, 120, 87, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => {
                            setMode("register");
                            setMessage("");
                        }}
                        style={[
                            styles.tabButton,
                            isRegister && [
                                styles.tabButtonActive,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    ...shadows.paper,
                                },
                            ],
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                { color: theme.muted },
                                isRegister && [
                                    styles.tabTextActive,
                                    { color: theme.primary },
                                ],
                            ]}
                        >
                            {t("session.register.tab")}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityLabel={t("session.mode.forgot")}
                        accessibilityRole='button'
                        accessibilityState={{ selected: isForgot }}
                        android_ripple={{
                            color: isDarkTheme
                                ? "rgba(52, 211, 153, 0.15)"
                                : "rgba(4, 120, 87, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => {
                            setMode("forgot");
                            setMessage("");
                        }}
                        style={[
                            styles.tabButton,
                            isForgot && [
                                styles.tabButtonActive,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    ...shadows.paper,
                                },
                            ],
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                { color: theme.muted },
                                isForgot && [
                                    styles.tabTextActive,
                                    { color: theme.primary },
                                ],
                            ]}
                        >
                            {t("session.forgot.title")}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            <View style={styles.form}>
                {!isVerify && !isForgot ? (
                    <>
                        <Pressable
                            accessibilityLabel='Login dengan Google'
                            accessibilityRole='button'
                            android_ripple={{
                                color: isDarkTheme
                                    ? "rgba(255, 255, 255, 0.08)"
                                    : "rgba(0, 0, 0, 0.08)",
                                borderless: false,
                            }}
                            disabled={loading || busy}
                            onPress={handleGoogleLogin}
                            style={[
                                styles.googleButton,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                },
                            ]}
                        >
                            {busy ? (
                                <ActivityIndicator size='small' color={theme.primary} />
                            ) : (
                                <>
                                    <GoogleIcon size={18} />
                                    <Text
                                        style={[
                                            styles.googleButtonText,
                                            { color: theme.ink },
                                        ]}
                                    >
                                        {t("session.googleLogin")}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        <View style={styles.dividerRow}>
                            <View
                                style={[
                                    styles.dividerLine,
                                    { backgroundColor: theme.border },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.dividerText,
                                    { color: theme.muted },
                                ]}
                            >
                                {t("session.or")}
                            </Text>
                            <View
                                style={[
                                    styles.dividerLine,
                                    { backgroundColor: theme.border },
                                ]}
                            />
                        </View>
                    </>
                ) : null}

                {isRegister ? (
                    <TextInput
                        accessibilityLabel={t("session.name.label")}
                        autoCapitalize='words'
                        autoComplete='name'
                        autoCorrect={false}
                        onChangeText={setName}
                        placeholder={t("session.name.placeholder")}
                        placeholderTextColor={theme.muted}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                                color: theme.ink,
                            },
                        ]}
                        value={name}
                    />
                ) : null}

                {isRegister ? (
                    <View style={styles.channelRow}>
                        <Pressable
                            accessibilityLabel={t("session.channel.email")}
                            accessibilityRole='button'
                            accessibilityState={{
                                selected: verificationChannel === "email",
                            }}
                            android_ripple={{
                                color: "rgba(4, 120, 87, 0.12)",
                                borderless: false,
                            }}
                            onPress={() => setVerificationChannel("email")}
                            style={[
                                styles.channelLink,
                                { borderColor: theme.border },
                                verificationChannel === "email"
                                    ? [
                                          styles.channelLinkActive,
                                          {
                                              backgroundColor:
                                                  theme.primaryBg,
                                              borderColor: theme.primary,
                                          },
                                      ]
                                    : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.channelLinkText,
                                    { color: theme.muted },
                                    verificationChannel === "email"
                                        ? [
                                              styles.channelLinkTextActive,
                                              { color: theme.primary },
                                          ]
                                        : null,
                                ]}
                            >
                                {t("session.channel.email")}
                            </Text>
                        </Pressable>
                        <Pressable
                            accessibilityLabel={t("session.channel.whatsapp")}
                            accessibilityRole='button'
                            accessibilityState={{
                                selected: verificationChannel === "whatsapp",
                                disabled: !waAvailable,
                            }}
                            android_ripple={{
                                color: "rgba(4, 120, 87, 0.12)",
                                borderless: false,
                            }}
                            disabled={!waAvailable}
                            onPress={() =>
                                waAvailable &&
                                setVerificationChannel("whatsapp")
                            }
                            style={[
                                styles.channelLink,
                                { borderColor: theme.border },
                                verificationChannel === "whatsapp"
                                    ? [
                                          styles.channelLinkActive,
                                          {
                                              backgroundColor:
                                                  theme.primaryBg,
                                              borderColor: theme.primary,
                                          },
                                      ]
                                    : null,
                                !waAvailable ? styles.buttonDisabled : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.channelLinkText,
                                    { color: theme.muted },
                                    verificationChannel === "whatsapp"
                                        ? [
                                              styles.channelLinkTextActive,
                                              { color: theme.primary },
                                          ]
                                        : null,
                                ]}
                            >
                                {t("session.channel.whatsapp")}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}

                {!isVerify ? (
                    <TextInput
                        accessibilityLabel={t("session.email.label")}
                        autoCapitalize='none'
                        autoComplete='email'
                        autoCorrect={false}
                        keyboardType='email-address'
                        onChangeText={setEmail}
                        placeholder={
                            isRegister && verificationChannel === "whatsapp"
                                ? `${t("session.email.placeholder")} (${t("session.optional")})`
                                : t("session.email.placeholder")
                        }
                        placeholderTextColor={theme.muted}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                                color: theme.ink,
                            },
                        ]}
                        value={email}
                    />
                ) : null}

                {isRegister && verificationChannel === "whatsapp" ? (
                    <TextInput
                        accessibilityLabel={t("session.phone.label")}
                        autoCapitalize='none'
                        autoComplete='tel'
                        autoCorrect={false}
                        keyboardType='phone-pad'
                        onChangeText={setPhone}
                        placeholder={t("session.phone.placeholder")}
                        placeholderTextColor={theme.muted}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                                color: theme.ink,
                            },
                        ]}
                        value={phone}
                    />
                ) : null}

                {isVerifyWhatsapp ? (
                    <TextInput
                        accessibilityLabel={t("session.code.label")}
                        keyboardType='number-pad'
                        maxLength={6}
                        onChangeText={setCode}
                        placeholder={t("session.code.placeholder")}
                        placeholderTextColor={theme.muted}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                                color: theme.ink,
                            },
                        ]}
                        value={code}
                    />
                ) : null}

                {!isForgot && !isVerify ? (
                    <View
                        style={[
                            styles.passwordField,
                            {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                            },
                        ]}
                    >
                        <TextInput
                            accessibilityLabel={t("session.password.label")}
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            onChangeText={setPassword}
                            placeholder={
                                isRegister
                                    ? t("session.password.registerPlaceholder")
                                    : t("session.password.placeholder")
                            }
                            placeholderTextColor={theme.muted}
                            secureTextEntry={!showPassword}
                            style={[
                                styles.passwordInput,
                                { color: theme.ink },
                            ]}
                            value={password}
                        />
                        <Pressable
                            accessibilityLabel={
                                showPassword
                                    ? t("session.password.hide")
                                    : t("session.password.show")
                            }
                            accessibilityRole='button'
                            accessibilityState={{ selected: showPassword }}
                            android_ripple={{
                                color: "rgba(4, 120, 87, 0.12)",
                                borderless: true,
                            }}
                            onPress={() =>
                                setShowPassword((current) => !current)
                            }
                            style={styles.passwordToggle}
                        >
                            {showPassword ? (
                                <EyeOff
                                    color={theme.primary}
                                    size={20}
                                    strokeWidth={2.3}
                                />
                            ) : (
                                <Eye
                                    color={theme.primary}
                                    size={20}
                                    strokeWidth={2.3}
                                />
                            )}
                        </Pressable>
                    </View>
                ) : null}

                {isRegister ? (
                    <TextInput
                        accessibilityLabel={t("session.password.confirmLabel")}
                        autoComplete='new-password'
                        onChangeText={setConfirmPassword}
                        placeholder={t("session.password.confirmPlaceholder")}
                        placeholderTextColor={theme.muted}
                        secureTextEntry={!showPassword}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.bg,
                                borderColor: theme.border,
                                color: theme.ink,
                            },
                        ]}
                        value={confirmPassword}
                    />
                ) : null}

                <Pressable
                    accessibilityLabel={
                        isSignIn
                            ? t("session.signIn.accessibility")
                            : isRegister
                              ? t("session.register.accessibility")
                              : isVerifyWhatsapp
                                ? t("session.verify.accessibility")
                                : isVerifyEmail
                                  ? t("session.resend.accessibility")
                                  : t("session.forgot.accessibility")
                    }
                    accessibilityRole='button'
                    accessibilityState={{ disabled: isSubmitDisabled }}
                    android_ripple={{
                        color: "rgba(255, 255, 255, 0.14)",
                        borderless: false,
                    }}
                    disabled={isSubmitDisabled}
                    onPress={
                        isSignIn
                            ? submit
                            : isRegister
                              ? submitRegister
                              : isVerifyWhatsapp
                                ? submitVerifyCode
                                : isVerifyEmail
                                  ? handleResendVerification
                                  : submitForgot
                    }
                    style={[
                        styles.button,
                        { backgroundColor: theme.primary },
                        isSubmitDisabled ? styles.buttonDisabled : null,
                    ]}
                >
                    {loading || busy ? (
                        <ActivityIndicator color='#ffffff' />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isSignIn
                                ? t("session.signIn.label")
                                : isRegister
                                  ? t("session.register.label")
                                  : isVerifyWhatsapp
                                    ? t("session.verify.label")
                                    : isVerifyEmail
                                      ? t("session.resend.label")
                                      : t("session.forgot.label")}
                        </Text>
                    )}
                </Pressable>

                {isVerifyWhatsapp ? (
                    <Pressable
                        accessibilityLabel={t("session.resend.accessibility")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(4, 120, 87, 0.12)",
                            borderless: false,
                        }}
                        disabled={busy}
                        onPress={handleResendVerification}
                    >
                        <Text style={[styles.link, { color: theme.primary }]}>
                            {t("session.resend.label")}
                        </Text>
                    </Pressable>
                ) : null}

                {isVerify ? (
                    <Pressable
                        accessibilityLabel={t("session.mode.signIn")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(4, 120, 87, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => setMode("signin")}
                    >
                        <Text style={[styles.link, { color: theme.primary }]}>
                            {t("session.signIn.label")}
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? (
                <Text style={[styles.success, { color: theme.primary }]}>
                    {message}
                </Text>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        marginTop: spacing.md,
        padding: 4,
    },
    tabButton: {
        alignItems: "center",
        borderRadius: radius.sm,
        flex: 1,
        justifyContent: "center",
        minHeight: 36,
        paddingHorizontal: spacing.xs,
    },
    tabButtonActive: {
        borderWidth: 1,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
    },
    tabTextActive: {
        fontWeight: "800",
    },
    form: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        borderRadius: radius.md,
        borderWidth: 1,
        fontSize: 14,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    passwordField: {
        alignItems: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 46,
    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        minHeight: 46,
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
    },
    passwordToggle: {
        alignItems: "center",
        borderRadius: radius.sm,
        height: 42,
        justifyContent: "center",
        marginRight: 2,
        width: 42,
    },
    button: {
        alignItems: "center",
        borderRadius: radius.md,
        justifyContent: "center",
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    buttonDisabled: {
        opacity: 0.56,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },
    secondaryButton: {
        borderWidth: 1,
        marginTop: spacing.md,
    },
    secondaryButtonText: {},
    name: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: spacing.xs,
    },
    muted: {
        fontSize: 13,
        lineHeight: 19,
    },
    error: {
        color: colors.danger,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    success: {
        fontSize: 12,
        marginTop: spacing.sm,
    },
    channelRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    channelLink: {
        alignItems: "center",
        borderRadius: radius.sm,
        borderWidth: 1,
        flex: 1,
        justifyContent: "center",
        minHeight: 36,
        paddingHorizontal: spacing.sm,
    },
    channelLinkActive: {},
    channelLinkText: {
        fontSize: 12,
        fontWeight: "700",
    },
    channelLinkTextActive: {},
    link: {
        fontSize: 13,
        fontWeight: "700",
        marginTop: spacing.xs,
        textAlign: "center",
    },
    dividerRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        marginVertical: spacing.xs,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    googleButton: {
        alignItems: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    googleButtonText: {
        fontSize: 13,
        fontWeight: "700",
    },
});