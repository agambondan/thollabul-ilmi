import {
    BookText,
    HelpCircle,
    Info,
    Map,
    Settings,
    UserRound,
    X,
} from "lucide-react-native";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useMobileLocale } from "../i18n/MobileLocaleProvider";
import { colors, radius, spacing, touchTarget } from "../theme";
import { hapticSelection } from "../utils/haptics";

export const webAppMenuGroups = [
    {
        key: "quick",
        title: "AKSES CEPAT",
        titleKey: "menu.quickAccess",
        items: [
            {
                Icon: UserRound,
                key: "tokoh",
                label: "Tokoh Islam",
                labelKey: "menu.islamicFigure",
                params: { featureKey: "tokoh" },
                tab: "belajar",
            },
            {
                Icon: Map,
                key: "peta",
                label: "Peta Interaktif",
                labelKey: "menu.interactiveMap",
                params: { featureKey: "historical-map" },
                tab: "belajar",
            },
            {
                Icon: BookText,
                key: "perawi",
                label: "Perawi Hadith",
                labelKey: "menu.hadithNarrators",
                params: { featureKey: "perawi" },
                tab: "belajar",
            },
        ],
    },
    {
        key: "more",
        title: "LAINNYA",
        titleKey: "menu.more",
        items: [
            {
                Icon: Settings,
                key: "pengaturan",
                label: "Pengaturan",
                labelKey: "menu.settings",
                params: { featureKey: "settings", view: "settings" },
                tab: "profile",
            },
            {
                Icon: HelpCircle,
                key: "bantuan",
                label: "Bantuan",
                labelKey: "menu.help",
                params: { featureKey: "help", view: "help" },
                tab: "profile",
            },
            {
                Icon: Info,
                key: "tentang",
                label: "Tentang Aplikasi",
                labelKey: "menu.about",
                params: { featureKey: "about", view: "about" },
                tab: "profile",
            },
        ],
    },
];

const sheet = {
    active: colors.dark.primary,
    activeLight: colors.light.primary,
    backdrop: "rgba(2, 6, 23, 0.62)",
    border: colors.dark.borderStrong,
    borderLight: colors.light.borderStrong,
    ink: colors.dark.ink,
    inkLight: colors.light.ink,
    muted: colors.dark.muted,
    mutedLight: colors.light.muted,
    surface: colors.dark.surface,
    surfaceLight: colors.light.surface,
};

export function MobileMenuSheet({
    active,
    accountLabel = "Tamu",
    currentFeatureKey = null,
    isDarkTheme = false,
    onClose,
    onSelect,
    visible,
}) {
    const { t } = useMobileLocale();

    return (
        <Modal
            animationType='slide'
            onRequestClose={onClose}
            transparent
            visible={visible}
        >
            <View style={styles.modalRoot} testID='mobile-menu-sheet'>
                <Pressable
                    accessibilityLabel={t("common.closeMenu")}
                    accessibilityRole='button'
                    onPress={onClose}
                    style={styles.backdrop}
                    testID='mobile-menu-sheet-backdrop'
                />
                <View
                    style={[
                        styles.sheet,
                        isDarkTheme && styles.sheetDark,
                    ]}
                >
                    <View
                        style={[
                            styles.header,
                            isDarkTheme && styles.headerDark,
                        ]}
                    >
                        <View>
                            <Text
                                style={[
                                    styles.title,
                                    isDarkTheme && styles.titleDark,
                                ]}
                            >
                                {t("menu.title")}
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    isDarkTheme && styles.subtitleDark,
                                ]}
                            >
                                {accountLabel}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel={t("common.closeMenu")}
                            accessibilityRole='button'
                            android_ripple={{
                                color: isDarkTheme
                                    ? sheet.border
                                    : sheet.borderLight,
                                borderless: true,
                            }}
                            onPress={onClose}
                            style={styles.closeButton}
                            testID='mobile-menu-sheet-close'
                        >
                            <X
                                color={
                                    isDarkTheme ? sheet.muted : sheet.mutedLight
                                }
                                size={20}
                                strokeWidth={2.2}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {webAppMenuGroups.map((group) => (
                            <View key={group.key} style={styles.group}>
                                <Text
                                    style={[
                                        styles.groupTitle,
                                        isDarkTheme && styles.groupTitleDark,
                                    ]}
                                >
                                    {t(group.titleKey)}
                                </Text>
                                <View style={styles.grid}>
                                    {group.items.map((item) => {
                                        const selected =
                                            active === item.tab &&
                                            (!item.params?.featureKey ||
                                                currentFeatureKey ===
                                                    item.params.featureKey);
                                        const Icon = item.Icon;
                                        const label = t(item.labelKey);

                                        return (
                                            <Pressable
                                                accessibilityRole='button'
                                                accessibilityState={{
                                                    selected,
                                                }}
                                                android_ripple={{
                                                    color: isDarkTheme
                                                        ? sheet.border
                                                        : sheet.borderLight,
                                                    borderless: false,
                                                }}
                                                key={item.key}
                                                onPress={() => {
                                                    if (!selected)
                                                        hapticSelection();
                                                    onSelect(item);
                                                }}
                                                style={[
                                                    styles.item,
                                                    isDarkTheme &&
                                                        styles.itemDark,
                                                    selected &&
                                                        (isDarkTheme
                                                            ? styles.itemActiveDark
                                                            : styles.itemActive),
                                                ]}
                                                testID={`mobile-menu-item-${item.key}`}
                                            >
                                                <Icon
                                                    color={
                                                        selected
                                                            ? isDarkTheme
                                                                ? sheet.active
                                                                : sheet.activeLight
                                                            : isDarkTheme
                                                            ? sheet.muted
                                                            : sheet.mutedLight
                                                    }
                                                    size={15}
                                                    strokeWidth={2}
                                                />
                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.itemLabel,
                                                        isDarkTheme &&
                                                            styles.itemLabelDark,
                                                        selected &&
                                                            (isDarkTheme
                                                                ? styles.itemLabelActiveDark
                                                                : styles.itemLabelActive),
                                                    ]}
                                                >
                                                    {label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: sheet.backdrop,
    },
    sheet: {
        backgroundColor: sheet.surfaceLight,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        maxHeight: "78%",
        overflow: "hidden",
    },
    sheetDark: {
        backgroundColor: sheet.surface,
    },
    header: {
        alignItems: "center",
        borderBottomColor: sheet.borderLight,
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerDark: {
        borderBottomColor: sheet.border,
    },
    title: {
        color: sheet.inkLight,
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0,
    },
    titleDark: {
        color: sheet.ink,
    },
    subtitle: {
        color: sheet.mutedLight,
        fontSize: 11,
        fontWeight: "500",
        letterSpacing: 0,
        marginTop: 1,
    },
    subtitleDark: {
        color: sheet.muted,
    },
    closeButton: {
        alignItems: "center",
        borderRadius: 999,
        height: touchTarget,
        justifyContent: "center",
        width: touchTarget,
    },
    scrollContent: {
        gap: spacing.lg,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    group: {
        gap: spacing.sm,
    },
    groupTitle: {
        color: sheet.mutedLight,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    groupTitleDark: {
        color: sheet.muted,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    item: {
        alignItems: "center",
        borderColor: sheet.borderLight,
        borderRadius: radius.md,
        borderWidth: 1,
        flexBasis: "48%",
        flexDirection: "row",
        flexGrow: 1,
        gap: spacing.xs,
        minHeight: touchTarget,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    itemDark: {
        borderColor: sheet.border,
    },
    itemActive: {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderColor: colors.light.primaryHover,
    },
    itemActiveDark: {
        backgroundColor: "rgba(52, 211, 153, 0.12)",
        borderColor: colors.dark.primaryHover,
    },
    itemLabel: {
        color: sheet.inkLight,
        flex: 1,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0,
    },
    itemLabelDark: {
        color: sheet.ink,
    },
    itemLabelActive: {
        color: sheet.activeLight,
        fontWeight: "800",
    },
    itemLabelActiveDark: {
        color: sheet.active,
        fontWeight: "800",
    },
});
