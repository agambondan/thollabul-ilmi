import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useFeedback } from "../context/FeedbackContext";
import { useSession } from "../context/SessionContext";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import {
    forgotPassword,
    getWhatsappAvailability,
    register,
    resendVerification,
    verifyWhatsapp,
} from "../api/auth";
import { colors, radius, spacing } from "../theme";
import { Card, CardTitle } from "./Card";

const ACCOUNT_NOT_VERIFIED_MESSAGE = "account not verified";

export function SessionCard() {
    const { error, loading, signIn, signOut, user } = useSession();
    const { showError, showInfo, showSuccess } = useFeedback();
    const { t } = useMobileLocale();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [mode, setMode] = useState("signin");
    const [busy, setBusy] = useState(false);
    // Registration channel choice + the WhatsApp-only phone field.
    const [verificationChannel, setVerificationChannel] = useState("email");
    const [phone, setPhone] = useState("");
    const [waAvailable, setWaAvailable] = useState(false);
    // Carried into "verify" mode after a successful register or a
    // not-yet-verified login, so the same screen serves both entry points.
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
            if (err?.status === 401 && err?.message === ACCOUNT_NOT_VERIFIED_MESSAGE) {
                const identifier = email.trim();
                setVerifyIdentifier(identifier);
                setVerifyChannel(identifier.includes("@") ? "email" : "whatsapp");
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

    if (user) {
        return (
            <Card>
                <CardTitle meta={t("session.active.meta")}>
                    {t("session.active.title")}
                </CardTitle>
                <Text style={styles.name}>
                    {user.name ||
                        user.email ||
                        t("session.active.fallbackName")}
                </Text>
                <Text style={styles.muted}>
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
                    style={[styles.button, styles.secondaryButton]}
                >
                    <Text
                        style={[styles.buttonText, styles.secondaryButtonText]}
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
            const user = await register({
                email: trimmedEmail,
                name: name.trim(),
                password: trimmedPassword,
                verificationChannel,
                phone: verificationChannel === "whatsapp" ? trimmedPhone : undefined,
            });
            setPassword("");
            setConfirmPassword("");
            setVerifyIdentifier(
                verificationChannel === "whatsapp" ? trimmedPhone : trimmedEmail,
            );
            setVerifyChannel(user?.verification_channel ?? verificationChannel);
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
        <Card>
            <CardTitle meta={t("session.card.meta")}>
                {isSignIn
                    ? t("session.signIn.title")
                    : isRegister
                      ? t("session.register.title")
                      : isVerify
                        ? t("session.verify.title")
                        : t("session.forgot.title")}
            </CardTitle>
            <Text style={styles.muted}>
                {isVerifyWhatsapp
                    ? t("session.verify.whatsappDesc")
                    : isVerifyEmail
                      ? t("session.verify.emailDesc")
                      : t("session.card.description")}
            </Text>
            <View style={styles.form}>
                {isRegister ? (
                    <TextInput
                        accessibilityLabel={t("session.name.label")}
                        autoCapitalize='words'
                        autoCorrect={false}
                        onChangeText={setName}
                        placeholder={t("session.name.placeholder")}
                        placeholderTextColor={colors.muted}
                        style={styles.input}
                        value={name}
                    />
                ) : null}
                {isRegister ? (
                    <View style={styles.modeRow}>
                        <Pressable
                            accessibilityLabel={t("session.channel.email")}
                            accessibilityRole='button'
                            accessibilityState={{
                                selected: verificationChannel === "email",
                            }}
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            onPress={() => setVerificationChannel("email")}
                            style={[
                                styles.modeLink,
                                verificationChannel === "email"
                                    ? styles.modeLinkActive
                                    : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.modeLinkText,
                                    verificationChannel === "email"
                                        ? styles.modeLinkTextActive
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
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            disabled={!waAvailable}
                            onPress={() =>
                                waAvailable &&
                                setVerificationChannel("whatsapp")
                            }
                            style={[
                                styles.modeLink,
                                verificationChannel === "whatsapp"
                                    ? styles.modeLinkActive
                                    : null,
                                !waAvailable ? styles.buttonDisabled : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.modeLinkText,
                                    verificationChannel === "whatsapp"
                                        ? styles.modeLinkTextActive
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
                        autoCorrect={false}
                        keyboardType='email-address'
                        onChangeText={setEmail}
                        placeholder={
                            isRegister && verificationChannel === "whatsapp"
                                ? `${t("session.email.placeholder")} (${t("session.optional")})`
                                : t("session.email.placeholder")
                        }
                        placeholderTextColor={colors.muted}
                        style={styles.input}
                        value={email}
                    />
                ) : null}
                {isRegister && verificationChannel === "whatsapp" ? (
                    <TextInput
                        accessibilityLabel={t("session.phone.label")}
                        autoCapitalize='none'
                        autoCorrect={false}
                        keyboardType='phone-pad'
                        onChangeText={setPhone}
                        placeholder={t("session.phone.placeholder")}
                        placeholderTextColor={colors.muted}
                        style={styles.input}
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
                        placeholderTextColor={colors.muted}
                        style={styles.input}
                        value={code}
                    />
                ) : null}
                {!isForgot && !isVerify ? (
                    <View style={styles.passwordField}>
                        <TextInput
                            accessibilityLabel={t("session.password.label")}
                            onChangeText={setPassword}
                            placeholder={
                                isRegister
                                    ? t("session.password.registerPlaceholder")
                                    : t("session.password.placeholder")
                            }
                            placeholderTextColor={colors.muted}
                            secureTextEntry={!showPassword}
                            style={styles.passwordInput}
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
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: true,
                            }}
                            onPress={() =>
                                setShowPassword((current) => !current)
                            }
                            style={styles.passwordToggle}
                        >
                            {showPassword ? (
                                <EyeOff
                                    color={colors.primary}
                                    size={20}
                                    strokeWidth={2.3}
                                />
                            ) : (
                                <Eye
                                    color={colors.primary}
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
                        onChangeText={setConfirmPassword}
                        placeholder={t("session.password.confirmPlaceholder")}
                        placeholderTextColor={colors.muted}
                        secureTextEntry={!showPassword}
                        style={styles.input}
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
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        disabled={busy}
                        onPress={handleResendVerification}
                    >
                        <Text style={styles.link}>
                            {t("session.resend.label")}
                        </Text>
                    </Pressable>
                ) : null}
                {isVerify ? (
                    <Pressable
                        accessibilityLabel={t("session.mode.signIn")}
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        onPress={() => setMode("signin")}
                    >
                        <Text style={styles.link}>
                            {t("session.signIn.label")}
                        </Text>
                    </Pressable>
                ) : null}
            </View>
            {!isVerify ? (
            <View style={styles.modeRow}>
                <Pressable
                    accessibilityLabel={t("session.mode.signIn")}
                    accessibilityRole='button'
                    accessibilityState={{ selected: isSignIn }}
                    android_ripple={{
                        color: "rgba(91, 110, 91, 0.12)",
                        borderless: false,
                    }}
                    onPress={() => setMode("signin")}
                    style={[
                        styles.modeLink,
                        isSignIn ? styles.modeLinkActive : null,
                    ]}
                >
                    <Text
                        style={[
                            styles.modeLinkText,
                            isSignIn ? styles.modeLinkTextActive : null,
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
                        color: "rgba(91, 110, 91, 0.12)",
                        borderless: false,
                    }}
                    onPress={() => setMode("register")}
                    style={[
                        styles.modeLink,
                        isRegister ? styles.modeLinkActive : null,
                    ]}
                >
                    <Text
                        style={[
                            styles.modeLinkText,
                            isRegister ? styles.modeLinkTextActive : null,
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
                        color: "rgba(91, 110, 91, 0.12)",
                        borderless: false,
                    }}
                    onPress={() => setMode("forgot")}
                    style={[
                        styles.modeLink,
                        isForgot ? styles.modeLinkActive : null,
                    ]}
                >
                    <Text
                        style={[
                            styles.modeLinkText,
                            isForgot ? styles.modeLinkTextActive : null,
                        ]}
                    >
                        {t("session.forgot.title")}
                    </Text>
                </Pressable>
            </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.success}>{message}</Text> : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    form: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 14,
        minHeight: 46,
        paddingHorizontal: spacing.md,
    },
    passwordField: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 46,
    },
    passwordInput: {
        color: colors.ink,
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
        backgroundColor: colors.primary,
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
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderWidth: 1,
        marginTop: spacing.md,
    },
    secondaryButtonText: {
        color: colors.primary,
    },
    name: {
        color: colors.ink,
        fontSize: 16,
        fontWeight: "800",
        marginBottom: spacing.xs,
    },
    muted: {
        color: colors.muted,
        fontSize: 13,
        lineHeight: 19,
    },
    error: {
        color: colors.danger,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    success: {
        color: colors.primary,
        fontSize: 12,
        marginTop: spacing.sm,
    },
    modeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    modeLink: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexGrow: 1,
        justifyContent: "center",
        minHeight: 34,
        minWidth: 88,
        paddingHorizontal: spacing.sm,
    },
    modeLinkActive: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.primary,
    },
    modeLinkText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
    },
    modeLinkTextActive: {
        color: colors.primary,
    },
    link: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
        marginTop: spacing.xs,
    },
});
