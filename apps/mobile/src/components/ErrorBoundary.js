import { Component } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { captureException } from "../utils/crashReporting";
import { colors, radius, spacing } from "../theme";

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        captureException(error, {
            componentStack: errorInfo?.componentStack,
        });
        this.props.onError?.(error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return typeof this.props.fallback === "function"
                    ? this.props.fallback({
                          error: this.state.error,
                          resetError: this.resetError,
                      })
                    : this.props.fallback;
            }

            return (
                <View
                    accessibilityRole='alert'
                    style={styles.container}
                    testID='error-boundary-fallback'
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>Terjadi Kesalahan</Text>
                        <Text style={styles.message}>
                            {this.state.error?.message ||
                                "Aplikasi mengalami kendala teknis yang tidak terduga."}
                        </Text>
                        <Pressable
                            accessibilityHint='Tekan untuk memuat ulang tampilan yang error'
                            accessibilityLabel='Coba Lagi'
                            accessibilityRole='button'
                            onPress={this.resetError}
                            style={styles.button}
                            testID='error-boundary-retry'
                        >
                            <Text style={styles.buttonText}>Coba Lagi</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        backgroundColor: colors.bg || "#f8fafc",
        flex: 1,
        justifyContent: "center",
        padding: spacing.lg,
    },
    card: {
        alignItems: "center",
        backgroundColor: colors.surface || "#ffffff",
        borderColor: colors.border || "#e2e8f0",
        borderRadius: radius.lg || 16,
        borderWidth: 1,
        maxWidth: 400,
        padding: spacing.xl,
        width: "100%",
    },
    title: {
        color: colors.ink || "#0f172a",
        fontSize: 18,
        fontWeight: "900",
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    message: {
        color: colors.muted || "#64748b",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: spacing.lg,
        textAlign: "center",
    },
    button: {
        alignItems: "center",
        backgroundColor: colors.primary || "#059669",
        borderRadius: radius.md || 10,
        minHeight: 44,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },
});
