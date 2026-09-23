export const colors = {
    bg: "#f8fafc",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    ink: "#0f172a",
    text: "#334155",
    muted: "#94a3b8",
    faint: "#e2e8f0",
    primary: "#047857",
    primaryDark: "#065f46",
    accent: "#f59e0b",
    danger: "#dc2626",
    onPrimary: "#ffffff",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",

    light: {
        bg: "#f8fafc",
        surface: "#ffffff",
        surfaceMuted: "#f1f5f9",
        ink: "#0f172a",
        text: "#334155",
        muted: "#94a3b8",
        faint: "#e2e8f0",
        primary: "#047857",
        primaryHover: "#065f46",
        primaryBg: "#ecfdf5",
        accent: "#f59e0b",
        danger: "#dc2626",
        onPrimary: "#ffffff",
        border: "#e2e8f0",
        borderStrong: "#cbd5e1",
    },
    dark: {
        bg: "#020617",
        surface: "#0f172a",
        surfaceMuted: "#1e293b",
        ink: "#f8fafc",
        text: "#e2e8f0",
        muted: "#94a3b8",
        faint: "#1e293b",
        primary: "#34d399",
        primaryHover: "#10b981",
        primaryBg: "#064e3b",
        accent: "#fbbf24",
        danger: "#f87171",
        onPrimary: "#020617",
        border: "#334155",
        borderStrong: "#475569",
    },
};

export const getThemeColors = ({ isDark = false } = {}) => {
    return isDark ? colors.dark : colors.light;
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
};

export const shadows = {
    paper: {
        elevation: 1,
        shadowColor: "#0f172a",
        shadowOffset: { height: 1, width: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    raised: {
        elevation: 4,
        shadowColor: "#0f172a",
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
};
