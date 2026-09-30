import { StyleSheet, Text, View } from "react-native";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
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

const HEIR_ROW_KEYS = {
    kakek: ["kakek", "kakek_residue"],
    nenek: ["nenek"],
    ayah: ["ayah", "ayah_residue"],
    ibu: ["ibu"],
    suami: ["suami"],
    istri: ["istri"],
    saudaraL: ["saudara_laki"],
    saudaraP: ["saudara_perempuan"],
    saudaraSeayahL: ["saudara_seayah_laki"],
    saudaraSeayahP: ["saudara_seayah_perempuan"],
    anakL: ["anak_laki"],
    anakP: ["anak_perempuan"],
    cucuL: ["cucu_laki"],
    cucuP: ["cucu_perempuan"],
};

export const resolveHeirResult = (calculation, heirKey) => {
    const matches = [];
    (calculation?.rows ?? []).forEach((row) => {
        if (row.members) {
            const heads = Number(row.members[heirKey]) || 0;
            if (heads > 0) {
                matches.push({
                    row,
                    portion: row.count > 0 ? heads / row.count : 1,
                    shared: row.count > heads,
                });
            }
            return;
        }
        if (HEIR_ROW_KEYS[heirKey]?.includes(row.key)) {
            matches.push({ row, portion: 1, shared: false });
        }
    });
    if (matches.length === 0) return null;
    const furudh = matches.find(({ row }) => !row.isAshabah && row.fraction);
    return {
        amount: matches.reduce((sum, m) => sum + m.row.amount * m.portion, 0),
        fraction: furudh?.row.fraction ?? null,
        hasAshabah: matches.some(({ row }) => row.isAshabah),
        share: matches.reduce((sum, m) => sum + m.row.share * m.portion, 0),
        shared: matches.some((m) => m.shared),
    };
};

export const formatHeirBadge = (result) => {
    if (result.hasAshabah && !result.fraction) return "Ashabah";
    const fraction = result.fraction
        ? `${result.fraction.num}/${result.fraction.den}`
        : `${(result.share * 100).toFixed(0)}%`;
    if (result.hasAshabah) return `${fraction} + Ashabah`;
    return result.shared ? `${fraction} bersama` : fraction;
};

function HeirCardMobile({ activeDark, heirKey, count, resultRow }) {
    const meta = HEIR_METAS[heirKey] || { label: heirKey, arabic: "" };
    const isPresent = Boolean(count && count > 0);
    const isEligible = Boolean(resultRow && resultRow.share > 0);
    const isMahjub = isPresent && !isEligible;
    const isAshabah = Boolean(resultRow?.hasAshabah && !resultRow.fraction);

    if (!isPresent && !isEligible) return null;

    return (
        <View
            style={[
                styles.node,
                isEligible
                    ? isAshabah
                        ? [styles.nodeAshabah, activeDark && { backgroundColor: "#451a03", borderColor: "#78350f" }]
                        : [styles.nodeFurudh, activeDark && { backgroundColor: "#064e3b", borderColor: "#059669" }]
                    : [styles.nodeMahjub, activeDark && { backgroundColor: "#450a0a", borderColor: "#7f1d1d" }],
            ]}
        >
            {meta.arabic ? (
                <Text style={[styles.arabicText, activeDark && { color: "#cbd5e1" }]}>
                    {meta.arabic}
                </Text>
            ) : null}
            <Text style={[styles.nodeTitle, activeDark && { color: "#f9fafb" }]}>
                {meta.label}
                {count > 1 ? ` (${count})` : ""}
            </Text>

            {isEligible ? (
                <View style={styles.nodeDetails}>
                    <Text
                        style={[
                            styles.badge,
                            isAshabah ? styles.badgeAshabah : styles.badgeFurudh,
                            activeDark && isAshabah && { backgroundColor: "#78350f", color: "#fde68a" },
                            activeDark && !isAshabah && { backgroundColor: "#065f46", color: "#6ee7b7" },
                        ]}
                    >
                        {formatHeirBadge(resultRow)}
                    </Text>
                    <Text style={[styles.amount, activeDark && { color: "#34d399" }]}>
                        {formatCurrency(resultRow.amount)}
                    </Text>
                </View>
            ) : (
                <Text style={[styles.mahjubBadge, activeDark && { color: "#f87171" }]}>Mahjub (Terhalang)</Text>
            )}
        </View>
    );
}

export function FaraidhFamilyTreeMobile({ calculation, heirs = {} }) {
    const { isDarkTheme } = useLayoutModePreference();
    const activeDark = isDarkTheme ?? false;

    if (!calculation?.rows?.length) return null;

    const resultOf = (heirKey) => resolveHeirResult(calculation, heirKey);

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
        <View style={[styles.treeContainer, activeDark && { backgroundColor: "#111827", borderColor: "#374151" }]}>
            <View style={[styles.treeHeader, activeDark && { borderBottomColor: "#1e293b" }]}>
                <Text style={[styles.treeTitle, activeDark && { color: "#34d399" }]}>🌳 Diagram Silsilah Waris</Text>
                <Text style={[styles.treeSubtitle, activeDark && { color: "#9ca3af" }]}>
                    Peta hak waris antar tingkat generasi pewaris
                </Text>
            </View>

            {/* Generasi 1: Ushul */}
            {ushulKeys.some((k) => heirs[k] > 0 || resultOf(k)) && (
                <View style={styles.tierSection}>
                    <Text style={[styles.tierLabel, activeDark && { color: "#6ee7b7" }]}>1. Ushul (Leluhur)</Text>
                    <View style={styles.tierGrid}>
                        {ushulKeys.map((k) => (
                            <HeirCardMobile
                                activeDark={activeDark}
                                count={heirs[k]}
                                heirKey={k}
                                key={k}
                                resultRow={resultOf(k)}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Generasi 2: Mayyit, Pasangan & Saudara */}
            <View style={styles.tierSection}>
                <Text style={[styles.tierLabel, activeDark && { color: "#6ee7b7" }]}>
                    2. Pewaris, Pasangan & Saudara
                </Text>
                <View style={styles.tierGrid}>
                    <View style={[styles.mayyitCard, activeDark && { backgroundColor: "#059669" }]}>
                        <Text style={styles.mayyitArabic}>الْمَيِّت</Text>
                        <Text style={styles.mayyitText}>AL-MAYYIT</Text>
                    </View>
                    {spouseKeys.map((k) => (
                        <HeirCardMobile
                            activeDark={activeDark}
                            count={heirs[k]}
                            heirKey={k}
                            key={k}
                            resultRow={resultOf(k)}
                        />
                    ))}
                    {siblingKeys.map((k) => (
                        <HeirCardMobile
                            activeDark={activeDark}
                            count={heirs[k]}
                            heirKey={k}
                            key={k}
                            resultRow={resultOf(k)}
                        />
                    ))}
                </View>
            </View>

            {/* Generasi 3: Furu' */}
            {furuKeys.some((k) => heirs[k] > 0 || resultOf(k)) && (
                <View style={styles.tierSection}>
                    <Text style={[styles.tierLabel, activeDark && { color: "#6ee7b7" }]}>3. Furu' (Keturunan)</Text>
                    <View style={styles.tierGrid}>
                        {furuKeys.map((k) => (
                            <HeirCardMobile
                                activeDark={activeDark}
                                count={heirs[k]}
                                heirKey={k}
                                key={k}
                                resultRow={resultOf(k)}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Generasi 4: Hawasyi */}
            {hawasyiKeys.some((k) => heirs[k] > 0 || resultOf(k)) && (
                <View style={styles.tierSection}>
                    <Text style={[styles.tierLabel, activeDark && { color: "#6ee7b7" }]}>4. Hawasyi (Paman)</Text>
                    <View style={styles.tierGrid}>
                        {hawasyiKeys.map((k) => (
                            <HeirCardMobile
                                activeDark={activeDark}
                                count={heirs[k]}
                                heirKey={k}
                                key={k}
                                resultRow={resultOf(k)}
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
