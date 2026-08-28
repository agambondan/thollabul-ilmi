import { BookOpen } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { radius, spacing } from "../../theme";
import { getExploreItemKey } from "../ExploreScreen.helpers";

export const WEB_APP_TOOL_ROUTE_CONFIGS = {};

export const WEB_APP_TOOL_ROUTE_KEYS = new Set(
    Object.keys(WEB_APP_TOOL_ROUTE_CONFIGS),
);

export function WebAppToolRoute({
    activeFeature,
    error,
    items,
    loading,
    renderFeatureContent,
    renderItem,
    routeKey,
    visibleItems,
}) {
    const { t } = useMobileLocale();
    const config = {
        subtitle: activeFeature?.subtitle ?? "",
        title: activeFeature?.title ?? t("explore.tool.titleFallback"),
        ...(WEB_APP_TOOL_ROUTE_CONFIGS[routeKey] ?? {}),
    };
    const listItems = visibleItems?.length ? visibleItems : items;

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-surface' />
            <View testID={`explore-web-app-${routeKey}-surface`} />
            <View style={styles.header}>
                <View style={styles.iconWrap}>
                    <BookOpen color='#047857' size={22} strokeWidth={2.1} />
                </View>
                <View style={styles.headerText}>
                    {config.eyebrow ? (
                        <Text style={styles.eyebrow}>{config.eyebrow}</Text>
                    ) : null}
                    <Text style={styles.title}>{config.title}</Text>
                    {config.subtitle ? (
                        <Text style={styles.subtitle}>{config.subtitle}</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.panel}>
                {renderFeatureContent?.()}
                {loading ? (
                    <Text style={styles.stateText}>
                        {t("explore.tool.loading")}
                    </Text>
                ) : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {renderItem && listItems?.length ? (
                    <View style={styles.list}>
                        {listItems.map((item, index) => (
                            <View
                                key={`${getExploreItemKey(item)}-${index}`}
                                testID='web-app-tool-list-item'
                            >
                                {renderItem(item, index)}
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: "#f8fafc",
        flex: 1,
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    iconWrap: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 14,
        height: 46,
        justifyContent: "center",
        width: 46,
    },
    headerText: {
        flex: 1,
        minWidth: 0,
    },
    eyebrow: {
        color: "#047857",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 0,
    },
    title: {
        color: "#0f172a",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: 2,
    },
    panel: {
        gap: spacing.md,
    },
    list: {
        gap: spacing.sm,
    },
    stateText: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
        padding: spacing.md,
        textAlign: "center",
    },
    error: {
        backgroundColor: "#fef3c7",
        borderRadius: radius.md,
        color: "#92400e",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 17,
        padding: spacing.md,
    },
});
