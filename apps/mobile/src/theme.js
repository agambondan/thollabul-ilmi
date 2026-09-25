export const colors = {
    bg: "#fefdf9",
    surface: "#f5f2eb",
    surfaceMuted: "#f0ece1",
    ink: "#3c3a35",
    text: "#4b463e",
    muted: "#8c8577",
    faint: "#e6e2d6",
    primary: "#5b6e5b",
    primaryDark: "#2c332c",
    accent: "#a47c48",
    danger: "#b91c1c",
    onPrimary: "#fffaf0",
    border: "#e6e2d6",
    borderStrong: "#d4d0c4",

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
        card: "#ffffff",
        cardDeep: "#f8fafc",
        iconBg: "#ecfdf5",
        borderSoft: "#a7f3d0",
        primarySoft: "#ecfdf5",
        primaryStrong: "#059669",
        reminderCard: "#ecfdf5",
        title: "#111827",
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
        card: "#0f172a",
        cardDeep: "#111827",
        iconBg: "#064e3b",
        borderSoft: "#064e3b",
        primarySoft: "#022c22",
        primaryStrong: "#10b981",
        reminderCard: "#052e2b",
        title: "#f8fafc",
    },
    classic: {
        light: {
            bg: "#fefdf9",
            surface: "#f5f2eb",
            surfaceMuted: "#f0ece1",
            ink: "#3c3a35",
            text: "#4b463e",
            muted: "#8c8577",
            faint: "#e6e2d6",
            primary: "#5b6e5b",
            primaryHover: "#4a5a4a",
            primaryBg: "#edf0eb",
            accent: "#a47c48",
            danger: "#b91c1c",
            onPrimary: "#fffaf0",
            border: "#e6e2d6",
            borderStrong: "#d4d0c4",
            card: "#f5f2eb",
            cardDeep: "#f0ece1",
            iconBg: "#edf0eb",
            borderSoft: "#d4d0c4",
            primarySoft: "#edf0eb",
            primaryStrong: "#4a5a4a",
            reminderCard: "#edf0eb",
            title: "#3c3a35",
        },
        dark: {
            bg: "#1a1c18",
            surface: "#232721",
            surfaceMuted: "#2c312a",
            ink: "#f5f2eb",
            text: "#e6e2d6",
            muted: "#9ca996",
            faint: "#2c312a",
            primary: "#8fb28f",
            primaryHover: "#a4c4a4",
            primaryBg: "#2c332c",
            accent: "#d4a876",
            danger: "#ef6b6b",
            onPrimary: "#1a1c18",
            border: "#3a3f38",
            borderStrong: "#4a4f48",
            card: "#232721",
            cardDeep: "#2c312a",
            iconBg: "#2c332c",
            borderSoft: "#3a3f38",
            primarySoft: "#2c332c",
            primaryStrong: "#a4c4a4",
            reminderCard: "#2c332c",
            title: "#f5f2eb",
        },
    },
};

export const getThemeColors = ({
    isDark = false,
    isPaperLayout = false,
} = {}) => {
    if (isPaperLayout) {
        return isDark ? colors.classic.dark : colors.classic.light;
    }
    return isDark ? colors.dark : colors.light;
};

export const getClassicThemeColors = (isDark = false) =>
    isDark ? colors.classic.dark : colors.classic.light;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const touchTarget = 44;
export const touchTargetSmall = 40;

export const iconStroke = {
    thin: 1.9,
    regular: 2.2,
    bold: 2.5,
};

export const elevation = {
    none: 0,
    low: 1,
    medium: 4,
    high: 8,
    modal: 16,
};

export const zIndex = {
    base: 0,
    card: 1,
    header: 10,
    overlay: 20,
    modal: 30,
    toast: 40,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const shadows = {
    paper: {
        elevation: 1,
        shadowColor: "#3c3a35",
        shadowOffset: { height: 1, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    raised: {
        elevation: 8,
        shadowColor: "#1a1c1a",
        shadowOffset: { height: 8, width: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
    },
};
