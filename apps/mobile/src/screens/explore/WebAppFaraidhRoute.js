import {
    ArrowLeft,
    History,
    Plus,
    Save,
    Scale,
    Trash2,
} from "lucide-react-native";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    deleteFaraidh,
    getFaraidhHistory,
    saveFaraidh,
} from "../../api/personal";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import { calculateFaraidh, HEIR_LABELS } from "../../lib/faraidh";
import {
    deleteCalculatorHistory,
    mergeCalculatorHistory,
    readCalculatorHistory,
    saveCalculatorHistory,
} from "../../storage/calculatorHistory";
import { radius, spacing } from "../../theme";
import {
    digitsOnly,
    formatCurrency,
    formatNumericInput,
    parseNumericInput,
} from "../ExploreScreen.helpers";

const HEIR_FIELDS = [
    { key: "suami", label: "Suami", max: 1, group: "spouse" },
    { key: "istri", label: "Istri", max: 4, group: "spouse" },
    { key: "anakL", label: "Anak Lk", max: 20, group: "children" },
    { key: "anakP", label: "Anak Pr", max: 20, group: "children" },
    { key: "cucuL", label: "Cucu Lk", max: 20, group: "grandchildren" },
    { key: "cucuP", label: "Cucu Pr", max: 20, group: "grandchildren" },
    { key: "ayah", label: "Ayah", max: 1, group: "parents" },
    { key: "ibu", label: "Ibu", max: 1, group: "parents" },
    { key: "kakek", label: "Kakek", max: 1, group: "grandparents" },
    { key: "nenek", label: "Nenek", max: 4, group: "grandparents" },
    { key: "saudaraL", label: "Sdr Lk", max: 20, group: "siblings" },
    { key: "saudaraP", label: "Sdr Pr", max: 20, group: "siblings" },
    {
        key: "saudaraSeayahL",
        label: "Sd Lk Seayah",
        max: 20,
        group: "half_siblings",
    },
    {
        key: "saudaraSeayahP",
        label: "Sd Pr Seayah",
        max: 20,
        group: "half_siblings",
    },
    {
        key: "saudaraSeibuL",
        label: "Sd Lk Seibu",
        max: 10,
        group: "maternal_siblings",
    },
    {
        key: "saudaraSeibuP",
        label: "Sd Pr Seibu",
        max: 10,
        group: "maternal_siblings",
    },
];

const formatDate = (item = {}, language, t) => {
    const value = item.created_at ?? item.createdAt ?? item.date;
    if (!value) return t("explore.faraidh.dateUnavailable");
    const parsed = new Date(
        `${value}`.includes("T") ? value : `${value}T00:00:00`,
    );
    if (Number.isNaN(parsed.getTime()))
        return t("explore.faraidh.dateUnavailable");
    return parsed.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getHeirLabel = (row, language = "idn") =>
    HEIR_LABELS[row.key]?.[language] ?? HEIR_LABELS[row.key]?.idn ?? row.key;
const getHeirCount = (heirs = {}) =>
    Object.values(heirs).reduce((sum, value) => sum + Number(value || 0), 0);

function CurrencyField({ hint, label, onChangeText, value }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.inputShell}>
                <Text style={styles.inputPrefix}>Rp</Text>
                <TextInput
                    keyboardType='numeric'
                    onChangeText={(nextValue) =>
                        onChangeText(digitsOnly(nextValue))
                    }
                    placeholder='0'
                    placeholderTextColor='#94a3b8'
                    returnKeyType='done'
                    style={styles.input}
                    value={formatNumericInput(value)}
                />
            </View>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
}

function HeirStepper({ count, field, onChange, t }) {
    return (
        <View style={styles.heirCard}>
            <Text style={styles.heirLabel}>
                {t(`explore.faraidh.heir.${field.key}`)}
            </Text>
            <Text style={styles.heirCount}>{count}</Text>
            <View style={styles.heirActions}>
                <Pressable
                    accessibilityRole='button'
                    accessibilityState={{ disabled: count === 0 }}
                    disabled={count === 0}
                    onPress={() => onChange(field.key, -1)}
                    style={[
                        styles.stepperButton,
                        count === 0 && styles.disabledButton,
                    ]}
                    testID={`web-app-faraidh-heir-${field.key}-minus`}
                >
                    <Text style={styles.stepperText}>-</Text>
                </Pressable>
                <Pressable
                    accessibilityLabel={t("a11y.addHeir")}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: count >= field.max }}
                    disabled={count >= field.max}
                    onPress={() => onChange(field.key, 1)}
                    style={[
                        styles.stepperButton,
                        count >= field.max && styles.disabledButton,
                    ]}
                    testID={`web-app-faraidh-heir-${field.key}-plus`}
                >
                    <Plus color='#047857' size={14} strokeWidth={2.5} />
                </Pressable>
            </View>
        </View>
    );
}

function ResultRows({ calculation, distributable, language, t }) {
    if (!calculation?.rows?.length) {
        return (
            <View style={styles.emptyResult}>
                <Text style={styles.emptyTitle}>
                    {t("explore.faraidh.emptyResult")}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.resultList}>
            {calculation.rows.map((row) => (
                <View key={`${row.key}-${row.count}`} style={styles.resultRow}>
                    <View style={styles.resultMain}>
                        <Text style={styles.resultName}>
                            {getHeirLabel(row, language)}
                            {row.count > 1
                                ? ` (${t("explore.faraidh.peopleCount", { count: row.count })})`
                                : ""}
                        </Text>
                        {row.isAshabah ? (
                            <Text style={styles.ashabahBadge}>
                                {t("explore.faraidh.ashabah")}
                            </Text>
                        ) : null}
                    </View>
                    <View style={styles.resultMeta}>
                        <Text style={styles.resultShare}>
                            {row.fraction
                                ? `${row.fraction.num}/${row.fraction.den}`
                                : t("explore.faraidh.remainder")}{" "}
                            · {(row.share * 100).toFixed(2)}%
                        </Text>
                        <Text style={styles.resultAmount}>
                            {formatCurrency(row.amount)}
                        </Text>
                    </View>
                </View>
            ))}
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                    {t("explore.faraidh.totalDistributed")}
                </Text>
                <Text style={styles.totalValue}>
                    {formatCurrency(distributable * calculation.totalShare)}
                </Text>
            </View>
        </View>
    );
}

function Notice({ children, tone = "amber" }) {
    return (
        <View
            style={[
                styles.notice,
                tone === "blue" ? styles.noticeBlue : styles.noticeAmber,
            ]}
        >
            <Text
                style={[
                    styles.noticeText,
                    tone === "blue"
                        ? styles.noticeTextBlue
                        : styles.noticeTextAmber,
                ]}
            >
                {children}
            </Text>
        </View>
    );
}

function HistoryCard({ item, language, onDelete, t }) {
    const wealth = Number(item.wealth ?? 0);
    return (
        <View style={styles.historyCard} testID='web-app-faraidh-history-card'>
            <View style={styles.historyHeader}>
                <View>
                    <Text style={styles.historyAmount}>
                        {formatCurrency(wealth)}
                    </Text>
                    <Text style={styles.historyDate}>
                        {formatDate(item, language, t)}
                    </Text>
                </View>
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={t(
                        "explore.faraidh.deleteHistoryAccessibility",
                    )}
                    onPress={() => onDelete(item.id)}
                    style={styles.historyDelete}
                    testID='web-app-faraidh-history-delete'
                >
                    <Trash2 color='#dc2626' size={16} strokeWidth={2.3} />
                </Pressable>
            </View>
            {item.result_summary ? (
                <Text style={styles.historySummary}>{item.result_summary}</Text>
            ) : null}
            <Text style={styles.historySource}>
                {item.is_local
                    ? t("explore.faraidh.localSource")
                    : t("explore.faraidh.accountSource")}
            </Text>
        </View>
    );
}

export function WebAppFaraidhRoute({ context }) {
    const { language, t } = useMobileLocale();
    const {
        faraidh = { bequest: "", debts: "", estate: "", heirs: {} },
        faraidhCatatan = "",
        faraidhHistory = [],
        savingFaraidh = false,
        session = null,
        setFaraidh = () => {},
        setFaraidhCatatan = () => {},
        setFaraidhHistory = () => {},
        setSavingFaraidh = () => {},
        setShowFaraidhHistory = () => {},
        showError = () => {},
        showFaraidhHistory = false,
        showSuccess = () => {},
    } = context;

    const setHeir = (key, delta) => {
        const field = HEIR_FIELDS.find((item) => item.key === key);
        setFaraidh((current) => {
            const currentValue = current.heirs[key] ?? 0;
            const nextValue = Math.min(
                field?.max ?? 20,
                Math.max(0, currentValue + delta),
            );
            return {
                ...current,
                heirs: { ...current.heirs, [key]: nextValue },
            };
        });
    };

    const wealth = parseNumericInput(faraidh.estate);
    const debts = parseNumericInput(faraidh.debts);
    const requestedBequest = parseNumericInput(faraidh.bequest);
    const maxBequest = Math.floor(wealth / 3);
    const bequest = Math.min(requestedBequest, maxBequest);
    const distributable = Math.max(0, wealth - debts - bequest);
    const bequestCapped = wealth > 0 && requestedBequest > maxBequest;
    const heirCount = getHeirCount(faraidh.heirs);
    const calculation =
        distributable > 0
            ? calculateFaraidh(faraidh.heirs, distributable)
            : null;
    const hasRows = Boolean(calculation?.rows?.length);

    const handleSave = async () => {
        if (distributable <= 0) return;
        setSavingFaraidh(true);
        const payload = {
            catatan: faraidhCatatan,
            debt: debts,
            funeral: 0,
            heirs_json: JSON.stringify(faraidh.heirs),
            result_summary: hasRows
                ? calculation.rows
                      .map(
                          (row) =>
                              `${getHeirLabel(row, language)}: ${Math.round(row.share * 100)}%`,
                      )
                      .join(", ")
                : "",
            wealth,
            will: bequest,
        };
        try {
            if (session?.token) {
                await saveFaraidh(payload);
                showSuccess(t("explore.faraidh.savedAccount"));
            } else {
                await saveCalculatorHistory("faraidh", payload);
                showSuccess(t("explore.faraidh.savedLocal"));
            }
            setFaraidhCatatan("");
        } catch (err) {
            showError(err?.message ?? t("explore.faraidh.saveError"));
        } finally {
            setSavingFaraidh(false);
        }
    };

    const handleLoadHistory = async () => {
        try {
            const localItems = await readCalculatorHistory("faraidh");
            const remoteItems = session?.token ? await getFaraidhHistory() : [];
            setFaraidhHistory(mergeCalculatorHistory(remoteItems, localItems));
            setShowFaraidhHistory(true);
        } catch {
            showError(t("explore.faraidh.historyLoadError"));
        }
    };

    const handleDelete = async (id) => {
        try {
            if (`${id ?? ""}`.startsWith("local-faraidh-")) {
                await deleteCalculatorHistory("faraidh", id);
            } else {
                await deleteFaraidh(id);
            }
            setFaraidhHistory((current) =>
                current.filter((item) => item.id !== id),
            );
            showSuccess(t("explore.faraidh.historyDeleted"));
        } catch {
            showError(t("explore.faraidh.deleteError"));
        }
    };

    if (showFaraidhHistory) {
        return (
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                style={styles.root}
            >
                <View testID='explore-web-app-faraidh-surface' />
                <View testID='explore-web-app-faraidh-history-surface' />
                <Pressable
                    accessibilityRole='button'
                    onPress={() => setShowFaraidhHistory(false)}
                    style={styles.backButton}
                    testID='web-app-faraidh-history-back'
                >
                    <ArrowLeft color='#047857' size={15} strokeWidth={2.4} />
                    <Text style={styles.backText}>
                        {t("explore.faraidh.backToCalculator")}
                    </Text>
                </Pressable>
                <View style={styles.hero}>
                    <View style={styles.heroIcon}>
                        <History color='#047857' size={26} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.title}>
                        {t("explore.faraidh.historyTitle")}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t("explore.faraidh.historySubtitle")}
                    </Text>
                </View>
                {!session?.token ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.historyLoginNotice")}
                    </Notice>
                ) : null}
                {faraidhHistory.length === 0 ? (
                    <View style={styles.emptyResult}>
                        <Text style={styles.emptyTitle}>
                            {t("explore.faraidh.historyEmpty")}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.historyList}>
                        {faraidhHistory.map((item) => (
                            <HistoryCard
                                item={item}
                                key={item.id}
                                language={language}
                                onDelete={handleDelete}
                                t={t}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={styles.root}
        >
            <View testID='explore-web-app-faraidh-surface' />
            <View style={styles.hero}>
                <Text style={styles.arabicTitle}>الْفَرَائِض</Text>
                <View style={styles.heroIcon}>
                    <Scale color='#047857' size={28} strokeWidth={2.2} />
                </View>
                <Text style={styles.title}>{t("explore.faraidh.title")}</Text>
                <Text style={styles.subtitle}>
                    {t("explore.faraidh.subtitle")}
                </Text>
            </View>

            <Notice>{t("explore.faraidh.scopeNotice")}</Notice>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    {t("explore.faraidh.assetsSection")}
                </Text>
                <CurrencyField
                    label={t("explore.faraidh.estateLabel")}
                    onChangeText={(value) =>
                        setFaraidh((current) => ({ ...current, estate: value }))
                    }
                    value={faraidh.estate}
                />
                <CurrencyField
                    label={t("explore.faraidh.debtsLabel")}
                    onChangeText={(value) =>
                        setFaraidh((current) => ({ ...current, debts: value }))
                    }
                    value={faraidh.debts}
                />
                <CurrencyField
                    hint={t("explore.faraidh.maxBequest", {
                        amount: formatCurrency(maxBequest),
                    })}
                    label={t("explore.faraidh.bequestLabel")}
                    onChangeText={(value) =>
                        setFaraidh((current) => ({
                            ...current,
                            bequest: value,
                        }))
                    }
                    value={faraidh.bequest}
                />
            </View>

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {t("explore.faraidh.heirsSection")}
                    </Text>
                    <Text style={styles.sectionMeta}>
                        {t("explore.faraidh.heirCount", { count: heirCount })}
                    </Text>
                </View>
                {[
                    {
                        key: "spouse",
                        label: t("explore.faraidh.group_spouse") ?? "Pasangan",
                    },
                    {
                        key: "children",
                        label: t("explore.faraidh.group_children") ?? "Anak",
                    },
                    {
                        key: "grandchildren",
                        label:
                            t("explore.faraidh.group_grandchildren") ??
                            "Cucu (dari anak laki-laki)",
                    },
                    {
                        key: "parents",
                        label:
                            t("explore.faraidh.group_parents") ?? "Orang Tua",
                    },
                    {
                        key: "grandparents",
                        label:
                            t("explore.faraidh.group_grandparents") ??
                            "Kakek/Nenek",
                    },
                    {
                        key: "siblings",
                        label:
                            t("explore.faraidh.group_siblings") ??
                            "Saudara Kandung",
                    },
                    {
                        key: "half_siblings",
                        label:
                            t("explore.faraidh.group_half_siblings") ??
                            "Saudara Seayah",
                    },
                    {
                        key: "maternal_siblings",
                        label:
                            t("explore.faraidh.group_maternal_siblings") ??
                            "Saudara Seibu",
                    },
                ].map((group) => {
                    const fields = HEIR_FIELDS.filter(
                        (f) => f.group === group.key,
                    );
                    if (fields.length === 0) return null;
                    return (
                        <View key={group.key} style={styles.heirGroup}>
                            <Text style={styles.heirGroupLabel}>
                                {group.label}
                            </Text>
                            <View style={styles.heirGrid}>
                                {fields.map((field) => (
                                    <HeirStepper
                                        count={faraidh.heirs[field.key] ?? 0}
                                        field={field}
                                        key={field.key}
                                        onChange={setHeir}
                                        t={t}
                                    />
                                ))}
                            </View>
                        </View>
                    );
                })}
            </View>

            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {t("explore.faraidh.resultSection")}
                    </Text>
                    <Text style={styles.sectionMeta}>
                        {formatCurrency(distributable)}
                    </Text>
                </View>
                {bequestCapped ? (
                    <Notice>
                        {t("explore.faraidh.bequestCapped", {
                            amount: formatCurrency(maxBequest),
                        })}
                    </Notice>
                ) : null}
                {calculation?.applied?.musytarakah ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.musytarakahNotice")}
                    </Notice>
                ) : null}
                {calculation?.applied?.umariyyah ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.umariyyahNotice")}
                    </Notice>
                ) : null}
                {calculation?.applied?.kakek_saudara ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.kakekSaudaraNotice")}
                    </Notice>
                ) : null}
                {calculation?.applied?.akdariyah ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.akdariyahNotice")}
                    </Notice>
                ) : null}
                {calculation?.applied?.aul ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.aulNotice")}
                    </Notice>
                ) : null}
                {calculation?.applied?.radd ? (
                    <Notice tone='blue'>
                        {t("explore.faraidh.raddNotice")}
                    </Notice>
                ) : null}
                <ResultRows
                    calculation={calculation}
                    distributable={distributable}
                    language={language}
                    t={t}
                />

                <TextInput
                    multiline
                    onChangeText={setFaraidhCatatan}
                    placeholder={t("explore.faraidh.notePlaceholder")}
                    placeholderTextColor='#94a3b8'
                    style={styles.noteInput}
                    value={faraidhCatatan}
                />

                <View style={styles.actions}>
                    <Pressable
                        accessibilityRole='button'
                        accessibilityState={{
                            disabled: savingFaraidh || distributable <= 0,
                        }}
                        disabled={savingFaraidh || distributable <= 0}
                        onPress={handleSave}
                        style={[
                            styles.primaryButton,
                            (savingFaraidh || distributable <= 0) &&
                                styles.disabledButton,
                        ]}
                        testID='web-app-faraidh-save'
                    >
                        <Save color='#ffffff' size={15} strokeWidth={2.4} />
                        <Text style={styles.primaryButtonText}>
                            {savingFaraidh
                                ? t("explore.faraidh.saving")
                                : t("explore.faraidh.save")}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole='button'
                        onPress={handleLoadHistory}
                        style={styles.secondaryButton}
                        testID='web-app-faraidh-history-link'
                    >
                        <History color='#047857' size={15} strokeWidth={2.4} />
                        <Text style={styles.secondaryButtonText}>
                            {t("explore.faraidh.history")}
                        </Text>
                    </Pressable>
                </View>
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
    hero: {
        alignItems: "center",
        marginBottom: spacing.md,
    },
    arabicTitle: {
        color: "#047857",
        fontSize: 30,
        lineHeight: 43,
        marginBottom: spacing.xs,
    },
    heroIcon: {
        alignItems: "center",
        backgroundColor: "#d1fae5",
        borderRadius: 18,
        height: 62,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 62,
    },
    title: {
        color: "#064e3b",
        fontSize: 25,
        fontWeight: "900",
        lineHeight: 31,
        textAlign: "center",
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    notice: {
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    noticeAmber: {
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
        borderWidth: 1,
    },
    noticeBlue: {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
        borderWidth: 1,
    },
    noticeText: {
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 18,
    },
    noticeTextAmber: {
        color: "#92400e",
    },
    noticeTextBlue: {
        color: "#1e40af",
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.lg,
    },
    sectionHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sectionTitle: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    sectionMeta: {
        color: "#047857",
        fontSize: 12,
        fontWeight: "900",
    },
    field: {
        gap: 6,
    },
    fieldLabel: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "900",
    },
    inputShell: {
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        minHeight: 44,
        paddingHorizontal: spacing.md,
    },
    inputPrefix: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "900",
        marginRight: spacing.sm,
    },
    input: {
        color: "#111827",
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        paddingVertical: spacing.sm,
    },
    hint: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
    },
    heirGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    heirGroup: {
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomColor: "#e5e7eb",
        borderBottomWidth: 1,
    },
    heirGroupLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    heirCard: {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.sm,
        width: "48%",
    },
    heirLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "900",
    },
    heirCount: {
        color: "#064e3b",
        fontSize: 24,
        fontWeight: "900",
        lineHeight: 30,
        marginTop: 2,
    },
    heirActions: {
        flexDirection: "row",
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    stepperButton: {
        alignItems: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: radius.sm,
        flex: 1,
        height: 30,
        justifyContent: "center",
    },
    stepperText: {
        color: "#047857",
        fontSize: 18,
        fontWeight: "900",
        lineHeight: 21,
    },
    disabledButton: {
        opacity: 0.45,
    },
    emptyResult: {
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.lg,
    },
    emptyTitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "800",
        textAlign: "center",
    },
    resultList: {
        gap: spacing.sm,
    },
    resultRow: {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.md,
    },
    resultMain: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
    },
    resultName: {
        color: "#111827",
        flex: 1,
        fontSize: 13,
        fontWeight: "900",
    },
    ashabahBadge: {
        backgroundColor: "#fef3c7",
        borderRadius: 999,
        color: "#92400e",
        fontSize: 10,
        fontWeight: "900",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    resultMeta: {
        alignItems: "flex-end",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing.xs,
    },
    resultShare: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "800",
    },
    resultAmount: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    totalRow: {
        alignItems: "center",
        borderTopColor: "#e5e7eb",
        borderTopWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: spacing.md,
    },
    totalLabel: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "800",
    },
    totalValue: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "900",
    },
    noteInput: {
        backgroundColor: "#f9fafb",
        borderColor: "#e5e7eb",
        borderRadius: radius.md,
        borderWidth: 1,
        color: "#111827",
        fontSize: 13,
        minHeight: 72,
        padding: spacing.md,
        textAlignVertical: "top",
    },
    actions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    primaryButton: {
        alignItems: "center",
        backgroundColor: "#047857",
        borderRadius: radius.md,
        flex: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 42,
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    secondaryButton: {
        alignItems: "center",
        borderColor: "#a7f3d0",
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 42,
        paddingHorizontal: spacing.md,
    },
    secondaryButtonText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    backButton: {
        alignItems: "center",
        alignSelf: "flex-start",
        flexDirection: "row",
        gap: spacing.xs,
        marginBottom: spacing.md,
        padding: spacing.xs,
    },
    backText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    historyList: {
        gap: spacing.sm,
    },
    historyCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.md,
    },
    historyHeader: {
        alignItems: "flex-start",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    historyAmount: {
        color: "#047857",
        fontSize: 17,
        fontWeight: "900",
    },
    historyDate: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 2,
    },
    historyDelete: {
        alignItems: "center",
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    historySummary: {
        color: "#334155",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: spacing.sm,
    },
    historySource: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
        marginTop: spacing.sm,
    },
});
