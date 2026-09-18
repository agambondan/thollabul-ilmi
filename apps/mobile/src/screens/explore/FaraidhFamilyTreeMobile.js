import { StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "../../theme";
import { formatCurrency } from "../ExploreScreen.helpers";

const HEIR_METAS = {
    kakek: { label: "Kakek", arabic: "الْجَدّ" },
    nenek: { label: "Nenek", arabic: "الْجَدَّة" },
    ayah: { label: "Ayah", arabic: "الْأَب" },
    ibu: { label: "Ibu", arabic: "الْأُمّ" },
    suami: { label: "Suami", arabic: "الزَّوْج" },
    istri: { label: "Istri", arabic: "الزَّوْجَة" },
    saudaraL: { label: "Sdr Kdg (L)", arabic: "أَخٌ شَقِيق" },
    saudaraP: { label: "Sdr Kdg (P)", arabic: "أُخْتٌ شَقِيقَة" },
    saudaraSeayahL: { label: "Sdr Seayah (L)", arabic: "أَخٌ لِأَب" },
    saudaraSeayahP: { label: "Sdr Seayah (P)", arabic: "أُخْتٌ لِأَب" },
    saudaraSeibuL: { label: "Sdr Seibu (L)", arabic: "أَخٌ لِأُمّ" },
    saudaraSeibuP: { label: "Sdr Seibu (P)", arabic: "أُخْتٌ لِأُمّ" },
    anakL: { label: "Anak Lk", arabic: "الِابْن" },
    anakP: { label: "Anak Pr", arabic: "الْبِنْت" },
    cucuL: { label: "Cucu Lk", arabic: "ابْنُ الِابْن" },
    cucuP: { label: "Cucu Pr", arabic: "بِنْتُ الِابْن" },
    pamanKandung: { label: "Paman Kdg", arabic: "الْعَمُّ الشَّقِيق" },
    pamanSeayah: { label: "Paman Seayah", arabic: "الْعَمُّ لِأَب" },
};

function HeirCardMobile({ heirKey, count, resultRow }) {
    const meta = HEIR_METAS[heirKey] || { label: heirKey, arabic: "" };
    const isPresent = Boolean(count && count > 0);
    const isEligible = Boolean(resultRow && resultRow.share > 0);
    const isMahjub = isPresent && !isEligible;

    if (!isPresent && !isEligible) return null;

    return (
        <View
            style={[
                styles.node,
                isEligible
                    ? resultRow.isAshabah
                        ? styles.nodeAshabah
                        : styles.nodeFurudh
                    : styles.nodeMahjub,
            ]}
        >
            {meta.arabic ? (
                <Text style={styles.arabicText}>{meta.arabic}</Text>
            ) : null}
            <Text style={styles.nodeTitle}>
                {meta.label}
                {count > 1 ? ` (${count})` : ""}
            </Text>

            {isEligible ? (
                <View style={styles.nodeDetails}>
                    <Text
                        style={[
                            styles.badge,
                            resultRow.isAshabah
                                ? styles.badgeAshabah
                                : styles.badgeFurudh,
                        ]}
                    >
                        {resultRow.isAshabah
                            ? "Ashabah"
                            : resultRow.fraction
                              ? `${resultRow.fraction.numerator}/${resultRow.fraction.denominator}`
                              : `${(resultRow.share * 100).toFixed(0)}%`}
                    </Text>
                    <Text style={styles.amount}>
                        {formatCurrency(resultRow.amount)}
                    </Text>
                </View>
            ) : (
                <Text style={styles.mahjubBadge}>Mahjub (Terhalang)</Text>
            )}
        </View>
    );
}

export function FaraidhFamilyTreeMobile({ calculation, heirs }) {
    if (!calculation?.rows?.length) return null;

    const rowMap = (calculation.rows || []).reduce((acc, row) => {
        acc[row.key] = row;
        return acc;
    }, {});

    const ushulKeys = ["kakek", "nenek", "ayah", "ibu"];
    const spouseKeys = ["suami", "istri"];
    const siblingKeys = [
        "saudaraSeibuL",
        "saudaraSeibuP",
        "saudaraL",
        "saudaraP",
        "saudaraSeayahL",
        "saudaraSeayahP",
    ];
    const furuKeys = ["anakL", "anakP", "cucuL", "cucuP"];
    const hawasyiKeys = ["pamanKandung", "pamanSeayah"];

    return (
        <View style={styles.treeContainer}>
            <View style={styles.treeHeader}>
                <Text style={styles.treeTitle}>🌳 Diagram Silsilah Waris</Text>
                <Text style={styles.treeSubtitle}>
                    Peta hak waris antar tingkat generasi pewaris
                </Text>
            </View>

            {/* Generasi 1: Ushul */}
            {ushulKeys.some((k) => heirs[k] > 0 || rowMap[k]) && (
                <View style={styles.tierSection}>
                    <Text style={styles.tierLabel}>1. Ushul (Leluhur)</Text>
                    <View style={styles.tierGrid}>
                        {ushulKeys.map((k) => (
                            <HeirCardMobile
                                count={heirs[k]}
                                heirKey={k}
                                key={k}
                                resultRow={rowMap[k]}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Generasi 2: Mayyit, Pasangan & Saudara */}
            <View style={styles.tierSection}>
                <Text style={styles.tierLabel}>
                    2. Pewaris, Pasangan & Saudara
                </Text>
                <View style={styles.tierGrid}>
                    <View style={styles.mayyitCard}>
                        <Text style={styles.mayyitArabic}>الْمَيِّت</Text>
                        <Text style={styles.mayyitText}>AL-MAYYIT</Text>
                    </View>
                    {spouseKeys.map((k) => (
                        <HeirCardMobile
                            count={heirs[k]}
                            heirKey={k}
                            key={k}
                            resultRow={rowMap[k]}
                        />
                    ))}
                    {siblingKeys.map((k) => (
                        <HeirCardMobile
                            count={heirs[k]}
                            heirKey={k}
                            key={k}
                            resultRow={rowMap[k]}
                        />
                    ))}
                </View>
            </View>

            {/* Generasi 3: Furu' */}
            {furuKeys.some((k) => heirs[k] > 0 || rowMap[k]) && (
                <View style={styles.tierSection}>
                    <Text style={styles.tierLabel}>3. Furu' (Keturunan)</Text>
                    <View style={styles.tierGrid}>
                        {furuKeys.map((k) => (
                            <HeirCardMobile
                                count={heirs[k]}
                                heirKey={k}
                                key={k}
                                resultRow={rowMap[k]}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Generasi 4: Hawasyi */}
            {hawasyiKeys.some((k) => heirs[k] > 0 || rowMap[k]) && (
                <View style={styles.tierSection}>
                    <Text style={styles.tierLabel}>4. Hawasyi (Paman)</Text>
                    <View style={styles.tierGrid}>
                        {hawasyiKeys.map((k) => (
                            <HeirCardMobile
                                count={heirs[k]}
                                heirKey={k}
                                key={k}
                                resultRow={rowMap[k]}
                            />
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    treeContainer: {
        backgroundColor: "#ffffff",
        borderColor: "#d1fae5",
        borderRadius: radius.md,
        borderWidth: 1,
        marginTop: spacing.md,
        padding: spacing.md,
    },
    treeHeader: {
        borderBottomColor: "#f1f5f9",
        borderBottomWidth: 1,
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
    },
    treeTitle: {
        color: "#064e3b",
        fontSize: 14,
        fontWeight: "900",
    },
    treeSubtitle: {
        color: "#64748b",
        fontSize: 12,
        marginTop: 2,
    },
    tierSection: {
        marginBottom: spacing.md,
    },
    tierLabel: {
        color: "#047857",
        fontSize: 11,
        fontWeight: "800",
        marginBottom: spacing.xs,
        textTransform: "uppercase",
    },
    tierGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
    },
    node: {
        alignItems: "center",
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: "center",
        minWidth: 100,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    nodeFurudh: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
    },
    nodeAshabah: {
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
    },
    nodeMahjub: {
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        opacity: 0.8,
    },
    arabicText: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "600",
    },
    nodeTitle: {
        color: "#0f172a",
        fontSize: 12,
        fontWeight: "800",
        textAlign: "center",
    },
    nodeDetails: {
        alignItems: "center",
        marginTop: 3,
    },
    badge: {
        borderRadius: 999,
        fontSize: 10,
        fontWeight: "900",
        overflow: "hidden",
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    badgeFurudh: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
    },
    badgeAshabah: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
    },
    mahjubBadge: {
        color: "#b91c1c",
        fontSize: 10,
        fontWeight: "700",
        marginTop: 2,
    },
    amount: {
        color: "#047857",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 2,
    },
    mayyitCard: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.sm,
        justifyContent: "center",
        minWidth: 100,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    mayyitArabic: {
        color: "#a7f3d0",
        fontSize: 11,
        fontWeight: "700",
    },
    mayyitText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "900",
    },
});
