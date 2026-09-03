import { ArrowLeft, BookOpen, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { colors, spacing } from "../../theme";
import { styles } from "../ExploreScreen.styles";

const formatDate = (item, language) => {
    const value = item?.created_at ?? item?.createdAt;
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString(
            language === "en" ? "en-US" : "id-ID",
            { day: "numeric", month: "short", year: "numeric" },
        );
    } catch {
        return "";
    }
};

export function ClassicZakatHistoryItem({ formatCurrency, item, onDelete }) {
    const { language, t } = useMobileLocale();
    return (
        <View
            key={item.id}
            style={[styles.faraidhHistoryCard, { marginTop: spacing.xs }]}
        >
            <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: colors.ink }}>
                    {item.nama_jenis}
                </Text>
                <Text style={[styles.resultValue, { fontSize: 13 }]}>
                    {formatCurrency(item.jumlah_zakat)}
                </Text>
                <Text
                    style={{
                        fontSize: 11,
                        color: item.is_local ? colors.muted : colors.primary,
                    }}
                >
                    {item.is_local
                        ? t("explore.zakatHistory.localDevice")
                        : t("explore.zakatHistory.syncedAccount")}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                    {formatDate(item, language)}
                </Text>
            </View>
            <Pressable
                accessibilityRole='button'
                onPress={() => onDelete(item)}
                style={[styles.heirButton, { borderColor: colors.danger }]}
            >
                <Text style={[styles.heirButtonText, { color: colors.danger }]}>
                    {t("explore.zakatHistory.delete")}
                </Text>
            </Pressable>
        </View>
    );
}

function WebAppZakatHistoryItem({
    formatCurrency,
    item,
    language,
    onDelete,
    t,
}) {
    const wealth = Number(item?.nilai_harta ?? 0);
    const itemNisab = Number(item?.nisab ?? 0);
    const isPaid = Boolean(item?.sudah_dibayar);
    return (
        <View
            key={item.id}
            style={styles.webAppZakatHistoryCard}
            testID='web-app-zakat-history-card'
        >
            <View style={styles.webAppZakatHistoryCardHeader}>
                <View style={styles.webAppZakatHistoryTypeRow}>
                    <View style={styles.webAppZakatHistoryIcon}>
                        <Text style={styles.webAppZakatHistoryIconText}>
                            ZK
                        </Text>
                    </View>
                    <View style={styles.webAppZakatHistoryTypeText}>
                        <Text style={styles.webAppZakatHistoryType}>
                            {item.nama_jenis ||
                                t("explore.zakatHistory.typeFallback")}
                        </Text>
                        <Text style={styles.webAppZakatHistoryDate}>
                            {formatDate(item, language) ||
                                t("explore.zakatHistory.dateUnavailable")}
                        </Text>
                    </View>
                </View>
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={t(
                        "explore.zakatHistory.deleteAccessibility",
                        {
                            title:
                                item.nama_jenis ||
                                t("explore.zakatHistory.itemFallback"),
                        },
                    )}
                    hitSlop={10}
                    onPress={() => onDelete(item)}
                    style={styles.webAppZakatHistoryDelete}
                    testID='web-app-zakat-history-delete'
                >
                    <Trash2 color='#ef4444' size={16} strokeWidth={2.3} />
                </Pressable>
            </View>

            <View style={styles.webAppZakatHistoryMeta}>
                {wealth > 0 ? (
                    <Text style={styles.webAppZakatHistoryMetaText}>
                        {t("explore.zakatHistory.totalWealth", {
                            amount: formatCurrency(wealth),
                        })}
                    </Text>
                ) : null}
                {itemNisab > 0 ? (
                    <Text style={styles.webAppZakatHistoryMetaText}>
                        {t("explore.zakatHistory.nisab", {
                            amount: formatCurrency(itemNisab),
                        })}
                    </Text>
                ) : null}
                {item?.catatan ? (
                    <Text style={styles.webAppZakatHistoryNote}>
                        {item.catatan}
                    </Text>
                ) : null}
            </View>

            <View style={styles.webAppZakatHistoryAmountRow}>
                <Text style={styles.webAppZakatHistoryAmount}>
                    {formatCurrency(item.jumlah_zakat)}
                </Text>
                <Text
                    style={[
                        styles.webAppZakatHistoryStatus,
                        isPaid
                            ? styles.webAppZakatHistoryStatusPaid
                            : styles.webAppZakatHistoryStatusUnpaid,
                    ]}
                >
                    {isPaid
                        ? t("explore.zakatHistory.paid")
                        : t("explore.zakatHistory.unpaid")}
                </Text>
            </View>
        </View>
    );
}

export function WebAppZakatHistoryRoute({
    formatCurrency,
    onBack,
    onDelete,
    session,
    zakatHistory,
}) {
    const { language, t } = useMobileLocale();
    const historyTotal = zakatHistory.reduce(
        (sum, item) => sum + Number(item?.jumlah_zakat ?? 0),
        0,
    );

    return (
        <View
            style={styles.webAppZakatHistorySurface}
            testID='explore-web-app-zakat-history-surface'
        >
            <Pressable
                accessibilityRole='button'
                onPress={onBack}
                style={styles.webAppZakatHistoryBack}
                testID='web-app-zakat-history-back'
            >
                <ArrowLeft color='#047857' size={15} strokeWidth={2.4} />
                <Text style={styles.webAppZakatHistoryBackText}>
                    {t("explore.zakatHistory.back")}
                </Text>
            </Pressable>

            <View style={styles.webAppZakatHistoryHero}>
                <View style={styles.webAppZakatHistoryHeroIcon}>
                    <BookOpen color='#047857' size={24} strokeWidth={2.2} />
                </View>
                <Text style={styles.webAppZakatHistoryTitle}>
                    {t("explore.zakatHistory.title")}
                </Text>
                <Text style={styles.webAppZakatHistorySubtitle}>
                    {t("explore.zakatHistory.subtitle")}
                </Text>
            </View>

            <View style={styles.webAppZakatHistoryStats}>
                <View style={styles.webAppZakatHistoryStatCard}>
                    <Text style={styles.webAppZakatHistoryStatValue}>
                        {zakatHistory.length}
                    </Text>
                    <Text style={styles.webAppZakatHistoryStatLabel}>
                        {t("explore.zakatHistory.historyCount")}
                    </Text>
                </View>
                <View style={styles.webAppZakatHistoryStatCard}>
                    <Text style={styles.webAppZakatHistoryStatValue}>
                        {formatCurrency(historyTotal)}
                    </Text>
                    <Text style={styles.webAppZakatHistoryStatLabel}>
                        {t("explore.zakatHistory.totalZakat")}
                    </Text>
                </View>
            </View>

            {!session?.token ? (
                <Text style={styles.webAppZakatHistoryNotice}>
                    {t("explore.zakatHistory.loginNotice")}
                </Text>
            ) : null}

            {zakatHistory.length === 0 ? (
                <View style={styles.webAppZakatHistoryEmpty}>
                    <Text style={styles.webAppZakatHistoryEmptyTitle}>
                        {t("explore.zakatHistory.emptyTitle")}
                    </Text>
                    <Text style={styles.webAppZakatHistoryEmptyText}>
                        {t("explore.zakatHistory.emptyText")}
                    </Text>
                </View>
            ) : (
                <View style={styles.webAppZakatHistoryList}>
                    {zakatHistory.map((item) => (
                        <WebAppZakatHistoryItem
                            formatCurrency={formatCurrency}
                            item={item}
                            key={item.id}
                            language={language}
                            onDelete={onDelete}
                            t={t}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
