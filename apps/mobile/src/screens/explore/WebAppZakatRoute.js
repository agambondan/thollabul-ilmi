import { BookOpen, Calculator, History, Save } from "lucide-react-native";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { deleteKalkulasiZakat, saveKalkulasiZakat } from "../../api/personal";
import { useLayoutModePreference } from "../../hooks/useLayoutModePreference";
import { useMobileLocale } from "../../i18n/MobileLocaleProvider";
import {
    deleteCalculatorHistory,
    mergeCalculatorHistory,
    saveCalculatorHistory,
} from "../../storage/calculatorHistory";
import { colors, radius, spacing, touchTarget } from "../../theme";
import {
    digitsOnly,
    formatCurrency,
    formatNumericInput,
    parseNumericInput,
} from "../ExploreScreen.helpers";
import { WebAppZakatHistoryRoute } from "./WebAppZakatHistoryRoute";

const NISAB_GRAM = 85;
const NISAB_SILVER_GRAM = 595;
const NISAB_HARVEST_KG = 653;

const ZAKAT_TABS = [
    { key: "maal", labelKey: "explore.zakat.tab.maal", testID: "pill-Maal" },
    {
        key: "fitrah",
        labelKey: "explore.zakat.tab.fitrah",
        testID: "pill-Fitrah",
    },
    {
        key: "dagang",
        labelKey: "explore.zakat.tab.dagang",
        testID: "pill-Dagang",
    },
    { key: "tani", labelKey: "explore.zakat.tab.tani", testID: "pill-Tani" },
    { key: "emas", labelKey: "explore.zakat.tab.emas", testID: "pill-Emas" },
    {
        key: "riwayat",
        labelKey: "explore.zakat.tab.riwayat",
        testID: "pill-Riwayat",
    },
];
function Field({ hint, isDarkTheme, label, onChangeText, placeholder = "0", value }) {
    return (
        <View style={styles.field}>
            <Text style={[styles.fieldLabel, isDarkTheme && styles.textPrimaryDark]}>{label}</Text>
            <View style={[styles.inputShell, isDarkTheme && styles.inputShellDark]}>
                <Text style={[styles.inputPrefix, isDarkTheme && styles.textMutedDark]}>Rp</Text>
                <TextInput
                    keyboardType='numeric'
                    onChangeText={(nextValue) =>
                        onChangeText(digitsOnly(nextValue))
                    }
                    placeholder={placeholder}
                    placeholderTextColor={isDarkTheme ? "#64748b" : "#94a3b8"}
                    returnKeyType='done'
                    style={[styles.input, isDarkTheme && styles.inputDark]}
                    value={formatNumericInput(value)}
                />
            </View>
            {hint ? <Text style={[styles.hint, isDarkTheme && styles.textMutedDark]}>{hint}</Text> : null}
        </View>
    );
}

function NumberField({ hint, isDarkTheme, label, onChangeText, placeholder = "0", value }) {
    return (
        <View style={styles.field}>
            <Text style={[styles.fieldLabel, isDarkTheme && styles.textPrimaryDark]}>{label}</Text>
            <TextInput
                keyboardType='numeric'
                onChangeText={(nextValue) =>
                    onChangeText(digitsOnly(nextValue))
                }
                placeholder={placeholder}
                placeholderTextColor={isDarkTheme ? "#64748b" : "#94a3b8"}
                returnKeyType='done'
                style={[styles.inputShell, styles.numberInput, isDarkTheme && styles.inputShellDark, isDarkTheme && styles.inputDark]}
                value={formatNumericInput(value)}
            />
            {hint ? <Text style={[styles.hint, isDarkTheme && styles.textMutedDark]}>{hint}</Text> : null}
        </View>
    );
}

function InfoBox({ color = "emerald", isDarkTheme, text }) {
    const themed =
        color === "amber"
            ? (isDarkTheme ? styles.infoAmberDark : styles.infoAmber)
            : color === "blue"
              ? (isDarkTheme ? styles.infoBlueDark : styles.infoBlue)
              : (isDarkTheme ? styles.infoEmeraldDark : styles.infoEmerald);
    const textStyle =
        color === "amber"
            ? (isDarkTheme ? styles.infoTextAmberDark : styles.infoTextAmber)
            : color === "blue"
              ? (isDarkTheme ? styles.infoTextBlueDark : styles.infoTextBlue)
              : (isDarkTheme ? styles.infoTextEmeraldDark : styles.infoTextEmerald);
    return (
        <View style={[styles.infoBox, themed]}>
            <BookOpen
                color={
                    color === "amber"
                        ? (isDarkTheme ? "#fbbf24" : "#b45309")
                        : color === "blue"
                          ? (isDarkTheme ? "#60a5fa" : "#1d4ed8")
                          : (isDarkTheme ? "#34d399" : "#047857")
                }
                size={17}
                strokeWidth={2.2}
            />
            <Text style={[styles.infoText, textStyle]}>{text}</Text>
        </View>
    );
}

function ToggleRow({ isDarkTheme, label, onValueChange, value }) {
    return (
        <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, isDarkTheme && styles.textPrimaryDark]}>{label}</Text>
            <Switch
                onValueChange={onValueChange}
                thumbColor='#ffffff'
                trackColor={{ false: isDarkTheme ? "#334155" : "#e5e7eb", true: "#10b981" }}
                value={value}
            />
        </View>
    );
}

function ResultCard({ amount, color = "emerald", isDarkTheme, label, note }) {
    const valueStyle =
        color === "amber"
            ? (isDarkTheme ? styles.resultAmountAmberDark : styles.resultAmountAmber)
            : color === "blue"
              ? (isDarkTheme ? styles.resultAmountBlueDark : styles.resultAmountBlue)
              : (isDarkTheme ? styles.resultAmountEmeraldDark : styles.resultAmountEmerald);
    return (
        <View style={[styles.resultCard, isDarkTheme && styles.resultCardDark]}>
            <Text style={[styles.resultLabel, isDarkTheme && styles.textMutedDark]}>{label}</Text>
            <Text style={[styles.resultAmount, valueStyle]}>
                {formatCurrency(amount)}
            </Text>
            {note ? <Text style={[styles.resultNote, isDarkTheme && styles.textMutedDark]}>{note}</Text> : null}
        </View>
    );
}

function SaveButton({ disabled, isDarkTheme, onPress, saving, t }) {
    return (
        <Pressable
            accessibilityRole='button'
            accessibilityState={{ disabled: disabled }}
            disabled={disabled}
            onPress={onPress}
            style={[
                styles.saveButton,
                isDarkTheme && styles.saveButtonDark,
                disabled && styles.disabledButton,
            ]}
            testID='web-app-zakat-save'
        >
            <Save color={isDarkTheme ? "#34d399" : "#047857"} size={15} strokeWidth={2.3} />
            <Text style={[styles.saveButtonText, isDarkTheme && styles.saveButtonTextDark]}>
                {saving ? t("explore.zakat.saving") : t("explore.zakat.save")}
            </Text>
        </Pressable>
    );
}

export function WebAppZakatRoute({
    loadZakatHistory = () => {},
    session = null,
    setZakat = () => {},
    setZakatFamilyCount = () => {},
    setZakatGoldGrams = () => {},
    setZakatGoldHaul = () => {},
    setZakatGoldPrice = () => {},
    setZakatHarvestIrrigated = () => {},
    setZakatHarvestWeight = () => {},
    setZakatHaul = () => {},
    setZakatHistory = () => {},
    setZakatRiceKgPrice = () => {},
    setZakatRicePrice = () => {},
    setZakatSavedMsg = () => {},
    setZakatSaving = () => {},
    setZakatSilverGrams = () => {},
    setZakatSilverPrice = () => {},
    setZakatTab = () => {},
    setZakatTradeCapital = () => {},
    setZakatTradeDebt = () => {},
    setZakatTradeHaul = () => {},
    setZakatTradeReceivable = () => {},
    setZakatTradeStock = () => {},
    showError = () => {},
    zakat = { assets: "", debts: "" },
    zakatFamilyCount = 1,
    zakatGoldGrams = "",
    zakatGoldHaul = true,
    zakatGoldPrice = "1050000",
    zakatHarvestIrrigated = false,
    zakatHarvestWeight = "",
    zakatHaul = true,
    zakatHistory = [],
    zakatRiceKgPrice = "16000",
    zakatRicePrice = "16000",
    zakatSavedMsg = "",
    zakatSaving = false,
    zakatSilverGrams = "",
    zakatSilverPrice = "14000",
    zakatTab = 0,
    zakatTimerRef = { current: null },
    zakatTradeCapital = "",
    zakatTradeDebt = "",
    zakatTradeHaul = true,
    zakatTradeReceivable = "",
    zakatTradeStock = "",
}) {
    const { t } = useMobileLocale();
    const { isDarkTheme, isWebAppLayout } = useLayoutModePreference();
    const goldPrice = parseNumericInput(zakatGoldPrice) || 1050000;
    const nisab = NISAB_GRAM * goldPrice;
    const assets = parseNumericInput(zakat.assets);
    const debts = parseNumericInput(zakat.debts);
    const net = Math.max(0, assets - debts);
    const zakatMaal = net >= nisab && zakatHaul ? net * 0.025 : 0;
    const ricePrice = parseNumericInput(zakatRicePrice) || 16000;
    const zakatFitrah = 2.5 * ricePrice * zakatFamilyCount;
    const tradeNet =
        (parseNumericInput(zakatTradeCapital) || 0) +
        (parseNumericInput(zakatTradeStock) || 0) +
        (parseNumericInput(zakatTradeReceivable) || 0) -
        (parseNumericInput(zakatTradeDebt) || 0);
    const zakatTrade =
        tradeNet >= nisab && zakatTradeHaul ? tradeNet * 0.025 : 0;
    const harvest = parseNumericInput(zakatHarvestWeight) || 0;
    const riceKgPrice = parseNumericInput(zakatRiceKgPrice) || 16000;
    const harvestRate = zakatHarvestIrrigated ? 0.05 : 0.1;
    const zakatAgriculture =
        harvest >= NISAB_HARVEST_KG ? harvest * harvestRate * riceKgPrice : 0;
    const goldG = parseNumericInput(zakatGoldGrams) || 0;
    const silverPriceNum = parseNumericInput(zakatSilverPrice) || 14000;
    const silverG = parseNumericInput(zakatSilverGrams) || 0;
    const goldValue = goldG * goldPrice;
    const silverValue = silverG * silverPriceNum;
    const goldNisabValue = NISAB_GRAM * goldPrice;
    const silverNisabValue = NISAB_SILVER_GRAM * silverPriceNum;
    const zakatGold =
        zakatGoldHaul &&
        (goldValue >= goldNisabValue || silverValue >= silverNisabValue)
            ? (goldValue + silverValue) * 0.025
            : 0;

    const handleSave = async (
        jenis,
        namaJenis,
        jumlahZakat,
        nilaiHarta = 0,
        nisabVal = 0,
        rate = 2.5,
        haul = true,
        catatan = "",
    ) => {
        if (jumlahZakat <= 0) return;
        setZakatSaving(true);
        setZakatSavedMsg("");
        const payload = {
            catatan,
            haul,
            jenis,
            jumlah_zakat: jumlahZakat,
            nama_jenis: namaJenis,
            nilai_harta: nilaiHarta,
            nisab: nisabVal,
            rate,
        };
        try {
            if (session?.token) {
                await saveKalkulasiZakat(payload);
                setZakatSavedMsg(t("explore.zakat.savedAccount"));
                loadZakatHistory();
            } else {
                const created = await saveCalculatorHistory("zakat", payload);
                setZakatHistory((current) =>
                    mergeCalculatorHistory(current, [created]),
                );
                setZakatSavedMsg(t("explore.zakat.savedDevice"));
            }
        } catch {
            setZakatSavedMsg(t("explore.zakat.saveError"));
        } finally {
            setZakatSaving(false);
            if (zakatTimerRef.current) clearTimeout(zakatTimerRef.current);
            zakatTimerRef.current = setTimeout(
                () => setZakatSavedMsg(""),
                2500,
            );
        }
    };

    const handleDelete = async (item) => {
        try {
            if (
                item?.is_local ||
                `${item?.id ?? ""}`.startsWith("local-zakat-")
            ) {
                await deleteCalculatorHistory("zakat", item.id);
            } else {
                await deleteKalkulasiZakat(item.id);
            }
            loadZakatHistory();
        } catch {
            showError(t("explore.zakat.deleteError"));
        }
    };

    if (zakatTab === 5) {
        return (
            <ScrollView
                contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
                showsVerticalScrollIndicator={false}
                style={[styles.root, isDarkTheme && styles.rootDark]}
            >
                <View testID='explore-web-app-zakat-surface' />
                <WebAppZakatHistoryRoute
                    formatCurrency={formatCurrency}
                    onBack={() => setZakatTab(0)}
                    onDelete={handleDelete}
                    session={session}
                    zakatHistory={zakatHistory}
                />
            </ScrollView>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
            style={[styles.root, isDarkTheme && styles.rootDark]}
        >
            <View testID='explore-web-app-zakat-surface' />
            <View style={styles.hero}>
                <View style={[styles.heroIcon, isDarkTheme && styles.heroIconDark]}>
                    <Calculator color={isDarkTheme ? "#34d399" : "#047857"} size={28} strokeWidth={2.2} />
                </View>
                <Text style={[styles.title, isDarkTheme && styles.titleDark]}>{t("explore.zakat.title")}</Text>
                <Text style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>
                    {t("explore.zakat.subtitle")}
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroller}
            >
                <View style={styles.tabs}>
                    {ZAKAT_TABS.map((tab, index) => (
                        <Pressable
                            accessibilityRole='tab'
                            accessibilityState={{
                                selected: zakatTab === index,
                            }}
                            key={tab.key}
                            onPress={() => setZakatTab(index)}
                            style={[
                                styles.tab,
                                isDarkTheme && styles.tabDark,
                                zakatTab === index && (isDarkTheme ? styles.tabActiveDark : styles.tabActive),
                            ]}
                            testID={tab.testID}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    isDarkTheme && styles.tabTextDark,
                                    zakatTab === index && styles.tabTextActive,
                                ]}
                            >
                                {t(tab.labelKey)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View style={[styles.card, isDarkTheme && styles.cardDark]}>
                {zakatTab === 0 ? (
                    <>
                        <InfoBox isDarkTheme={isDarkTheme} text={t("explore.zakat.info.maal")} />
                        <Field
                            hint={t("explore.zakat.nisabHint", {
                                amount: formatCurrency(nisab),
                            })}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.goldPrice")}
                            onChangeText={setZakatGoldPrice}
                            value={zakatGoldPrice}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.assets")}
                            onChangeText={(value) =>
                                setZakat((current) => ({
                                    ...current,
                                    assets: value,
                                }))
                            }
                            value={zakat.assets}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.dueDebt")}
                            onChangeText={(value) =>
                                setZakat((current) => ({
                                    ...current,
                                    debts: value,
                                }))
                            }
                            value={zakat.debts}
                        />
                        <ToggleRow
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.haul")}
                            onValueChange={setZakatHaul}
                            value={zakatHaul}
                        />
                        {assets > 0 && assets < nisab ? (
                            <Text style={[styles.warning, isDarkTheme && styles.warningDark]}>
                                {t("explore.zakat.warning.assetsBelowNisab", {
                                    amount: formatCurrency(nisab),
                                })}
                            </Text>
                        ) : null}
                        {assets >= nisab && !zakatHaul ? (
                            <Text style={[styles.warning, isDarkTheme && styles.warningDark]}>
                                {t("explore.zakat.warning.noHaul")}
                            </Text>
                        ) : null}
                        <ResultCard
                            amount={zakatMaal}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.result.maal")}
                        />
                        {zakatMaal > 0 ? (
                            <SaveButton
                                disabled={zakatSaving}
                                isDarkTheme={isDarkTheme}
                                onPress={() =>
                                    handleSave(
                                        "maal",
                                        "Zakat Maal",
                                        zakatMaal,
                                        net,
                                        nisab,
                                        2.5,
                                        zakatHaul,
                                    )
                                }
                                saving={zakatSaving}
                                t={t}
                            />
                        ) : null}
                    </>
                ) : null}

                {zakatTab === 1 ? (
                    <>
                        <InfoBox
                            color='amber'
                            isDarkTheme={isDarkTheme}
                            text={t("explore.zakat.info.fitrah")}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.ricePrice")}
                            onChangeText={setZakatRicePrice}
                            value={zakatRicePrice}
                        />
                        <View style={styles.counterRow}>
                            <Pressable
                                accessibilityRole='button'
                                onPress={() =>
                                    setZakatFamilyCount(
                                        Math.max(1, zakatFamilyCount - 1),
                                    )
                                }
                                style={[styles.counterButton, isDarkTheme && styles.counterButtonDark]}
                            >
                                <Text style={[styles.counterText, isDarkTheme && styles.counterTextDark]}>-</Text>
                            </Pressable>
                            <View style={styles.counterCenter}>
                                <Text style={[styles.counterValue, isDarkTheme && styles.counterValueDark]}>
                                    {zakatFamilyCount}
                                </Text>
                                <Text style={[styles.counterLabel, isDarkTheme && styles.textMutedDark]}>
                                    {t("explore.zakat.personUnit")}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityRole='button'
                                onPress={() =>
                                    setZakatFamilyCount(zakatFamilyCount + 1)
                                }
                                style={[styles.counterButton, isDarkTheme && styles.counterButtonDark]}
                            >
                                <Text style={[styles.counterText, isDarkTheme && styles.counterTextDark]}>+</Text>
                            </Pressable>
                        </View>
                        <ResultCard
                            amount={zakatFitrah}
                            color='amber'
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.result.fitrah")}
                            note={t("explore.zakat.note.fitrah", {
                                count: zakatFamilyCount,
                                price: formatCurrency(ricePrice),
                            })}
                        />
                        {zakatFitrah > 0 ? (
                            <SaveButton
                                disabled={zakatSaving}
                                isDarkTheme={isDarkTheme}
                                onPress={() =>
                                    handleSave(
                                        "fitrah",
                                        "Zakat Fitrah",
                                        zakatFitrah,
                                        0,
                                        0,
                                        0,
                                        true,
                                        `${zakatFamilyCount} orang x Rp${ricePrice}/kg`,
                                    )
                                }
                                saving={zakatSaving}
                                t={t}
                            />
                        ) : null}
                    </>
                ) : null}

                {zakatTab === 2 ? (
                    <>
                        <InfoBox isDarkTheme={isDarkTheme} text={t("explore.zakat.info.dagang")} />
                        <Field
                            hint={t("explore.zakat.nisabHint", {
                                amount: formatCurrency(nisab),
                            })}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.goldPrice")}
                            onChangeText={setZakatGoldPrice}
                            value={zakatGoldPrice}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.tradeCapital")}
                            onChangeText={setZakatTradeCapital}
                            value={zakatTradeCapital}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.tradeStock")}
                            onChangeText={setZakatTradeStock}
                            value={zakatTradeStock}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.tradeReceivable")}
                            onChangeText={setZakatTradeReceivable}
                            value={zakatTradeReceivable}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.tradeDebt")}
                            onChangeText={setZakatTradeDebt}
                            value={zakatTradeDebt}
                        />
                        <ToggleRow
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.haul")}
                            onValueChange={setZakatTradeHaul}
                            value={zakatTradeHaul}
                        />
                        {tradeNet > 0 ? (
                            <Text style={[styles.metaText, isDarkTheme && styles.textMutedDark]}>
                                {t("explore.zakat.netAssets", {
                                    amount: formatCurrency(tradeNet),
                                })}
                            </Text>
                        ) : null}
                        <ResultCard
                            amount={zakatTrade}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.result.dagang")}
                        />
                        {zakatTrade > 0 ? (
                            <SaveButton
                                disabled={zakatSaving}
                                isDarkTheme={isDarkTheme}
                                onPress={() =>
                                    handleSave(
                                        "perdagangan",
                                        "Zakat Perdagangan",
                                        zakatTrade,
                                        tradeNet,
                                        nisab,
                                        2.5,
                                        zakatTradeHaul,
                                    )
                                }
                                saving={zakatSaving}
                                t={t}
                            />
                        ) : null}
                    </>
                ) : null}

                {zakatTab === 3 ? (
                    <>
                        <InfoBox
                            isDarkTheme={isDarkTheme}
                            text={t("explore.zakat.info.tani", {
                                kg: NISAB_HARVEST_KG,
                            })}
                        />
                        <NumberField
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.harvestWeight")}
                            onChangeText={setZakatHarvestWeight}
                            value={zakatHarvestWeight}
                        />
                        <Field
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.riceKgPrice")}
                            onChangeText={setZakatRiceKgPrice}
                            value={zakatRiceKgPrice}
                        />
                        <ToggleRow
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.irrigated")}
                            onValueChange={setZakatHarvestIrrigated}
                            value={zakatHarvestIrrigated}
                        />
                        {harvest > 0 && harvest < NISAB_HARVEST_KG ? (
                            <Text style={[styles.warning, isDarkTheme && styles.warningDark]}>
                                {t("explore.zakat.warning.harvestBelowNisab", {
                                    kg: NISAB_HARVEST_KG,
                                })}
                            </Text>
                        ) : null}
                        <ResultCard
                            amount={zakatAgriculture}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.result.tani")}
                            note={
                                harvest >= NISAB_HARVEST_KG
                                    ? t("explore.zakat.note.tani", {
                                          rate: harvestRate * 100,
                                          weight: harvest,
                                          price: formatCurrency(riceKgPrice),
                                      })
                                    : ""
                            }
                        />
                        {zakatAgriculture > 0 ? (
                            <SaveButton
                                disabled={zakatSaving}
                                isDarkTheme={isDarkTheme}
                                onPress={() =>
                                    handleSave(
                                        "pertanian",
                                        "Zakat Pertanian",
                                        zakatAgriculture,
                                        0,
                                        0,
                                        harvestRate * 100,
                                        true,
                                        `${harvest} kg, irigasi: ${zakatHarvestIrrigated ? "5%" : "10%"}`,
                                    )
                                }
                                saving={zakatSaving}
                                t={t}
                            />
                        ) : null}
                    </>
                ) : null}

                {zakatTab === 4 ? (
                    <>
                        <InfoBox
                            color='amber'
                            isDarkTheme={isDarkTheme}
                            text={t("explore.zakat.info.emas")}
                        />
                        <Field
                            hint={t("explore.zakat.goldNisabHint", {
                                amount: formatCurrency(goldNisabValue),
                            })}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.goldPrice")}
                            onChangeText={setZakatGoldPrice}
                            value={zakatGoldPrice}
                        />
                        <NumberField
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.goldWeight")}
                            onChangeText={setZakatGoldGrams}
                            value={zakatGoldGrams}
                        />
                        <Field
                            hint={t("explore.zakat.silverNisabHint", {
                                amount: formatCurrency(silverNisabValue),
                            })}
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.silverPrice")}
                            onChangeText={setZakatSilverPrice}
                            value={zakatSilverPrice}
                        />
                        <NumberField
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.silverWeight")}
                            onChangeText={setZakatSilverGrams}
                            value={zakatSilverGrams}
                        />
                        <ToggleRow
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.field.haul")}
                            onValueChange={setZakatGoldHaul}
                            value={zakatGoldHaul}
                        />
                        <ResultCard
                            amount={zakatGold}
                            color='amber'
                            isDarkTheme={isDarkTheme}
                            label={t("explore.zakat.result.emas")}
                            note={
                                zakatGold > 0
                                    ? t("explore.zakat.note.emas", {
                                          amount: formatCurrency(
                                              goldValue + silverValue,
                                          ),
                                      })
                                    : ""
                            }
                        />
                        {zakatGold > 0 ? (
                            <SaveButton
                                disabled={zakatSaving}
                                isDarkTheme={isDarkTheme}
                                onPress={() =>
                                    handleSave(
                                        "emas_perak",
                                        "Zakat Emas & Perak",
                                        zakatGold,
                                        goldValue + silverValue,
                                        goldNisabValue,
                                        2.5,
                                        zakatGoldHaul,
                                        `${goldG}g emas, ${silverG}g perak`,
                                    )
                                }
                                saving={zakatSaving}
                                t={t}
                            />
                        ) : null}
                    </>
                ) : null}
            </View>

            {zakatSavedMsg ? (
                <Text style={[styles.savedText, isDarkTheme && styles.savedTextDark]}>{zakatSavedMsg}</Text>
            ) : null}
            <Pressable
                accessibilityRole='button'
                onPress={() => setZakatTab(5)}
                style={styles.historyLink}
                testID='web-app-zakat-history-link'
            >
                <History color={isDarkTheme ? "#34d399" : "#047857"} size={15} strokeWidth={2.3} />
                <Text style={[styles.historyText, isDarkTheme && styles.historyTextDark]}>
                    {t("explore.zakat.viewHistory")}
                </Text>
            </Pressable>
            <Text style={[styles.disclaimer, isDarkTheme && styles.textMutedDark]}>
                {t("explore.zakat.disclaimer")}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: "#f8fafc",
        flex: 1,
    },
    rootDark: {
        backgroundColor: "#020617",
    },
    content: {
        backgroundColor: "#f8fafc",
        flexGrow: 1,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    contentDark: {
        backgroundColor: "#020617",
    },
    hero: {
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    heroIcon: {
        alignItems: "center",
        backgroundColor: "#d1fae5",
        borderRadius: 18,
        height: 64,
        justifyContent: "center",
        marginBottom: spacing.md,
        width: 64,
    },
    heroIconDark: {
        backgroundColor: "#064e3b",
    },
    title: {
        color: "#064e3b",
        fontSize: 27,
        fontWeight: "900",
        lineHeight: 33,
        textAlign: "center",
    },
    titleDark: {
        color: "#f8fafc",
    },
    subtitle: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 19,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    subtitleDark: {
        color: "#94a3b8",
    },
    tabScroller: {
        marginBottom: spacing.md,
    },
    tabs: {
        flexDirection: "row",
        gap: spacing.xs,
        paddingRight: spacing.md,
    },
    tab: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    tabDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    tabActive: {
        backgroundColor: "#047857",
        borderColor: "#047857",
    },
    tabActiveDark: {
        backgroundColor: "#065f46",
        borderColor: "#059669",
    },
    tabText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "900",
    },
    tabTextDark: {
        color: "#94a3b8",
    },
    tabTextActive: {
        color: "#ffffff",
    },
    card: {
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: spacing.md,
        padding: spacing.lg,
    },
    cardDark: {
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
    },
    infoBox: {
        alignItems: "flex-start",
        borderRadius: radius.lg,
        flexDirection: "row",
        gap: spacing.sm,
        padding: spacing.md,
    },
    infoEmerald: {
        backgroundColor: "#ecfdf5",
    },
    infoEmeraldDark: {
        backgroundColor: "rgba(6, 78, 59, 0.3)",
    },
    infoAmber: {
        backgroundColor: "#fffbeb",
    },
    infoAmberDark: {
        backgroundColor: "rgba(180, 83, 9, 0.25)",
    },
    infoBlue: {
        backgroundColor: "#eff6ff",
    },
    infoBlueDark: {
        backgroundColor: "rgba(29, 78, 216, 0.25)",
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 19,
    },
    infoTextEmerald: {
        color: "#065f46",
    },
    infoTextEmeraldDark: {
        color: "#6ee7b7",
    },
    infoTextAmber: {
        color: "#92400e",
    },
    infoTextAmberDark: {
        color: "#fde68a",
    },
    infoTextBlue: {
        color: "#1e40af",
    },
    infoTextBlueDark: {
        color: "#93c5fd",
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
    inputShellDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
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
    inputDark: {
        color: "#f8fafc",
    },
    numberInput: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "700",
    },
    hint: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
    },
    toggleRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    toggleLabel: {
        color: "#374151",
        flex: 1,
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 18,
    },
    warning: {
        color: "#b45309",
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 18,
        textAlign: "center",
    },
    warningDark: {
        color: "#fbbf24",
    },
    metaText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "800",
        textAlign: "center",
    },
    resultCard: {
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        borderRadius: radius.lg,
        borderWidth: 1,
        padding: spacing.lg,
    },
    resultCardDark: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
    },
    resultLabel: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "900",
    },
    resultAmount: {
        fontSize: 26,
        fontWeight: "900",
        lineHeight: 32,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    resultAmountEmerald: {
        color: "#047857",
    },
    resultAmountEmeraldDark: {
        color: "#34d399",
    },
    resultAmountAmber: {
        color: "#b45309",
    },
    resultAmountAmberDark: {
        color: "#fbbf24",
    },
    resultAmountBlue: {
        color: "#1d4ed8",
    },
    resultAmountBlueDark: {
        color: "#60a5fa",
    },
    resultNote: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
        marginTop: spacing.xs,
        textAlign: "center",
    },
    saveButton: {
        alignItems: "center",
        borderColor: "#a7f3d0",
        borderRadius: radius.lg,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 44,
    },
    saveButtonDark: {
        borderColor: "#065f46",
    },
    saveButtonText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    saveButtonTextDark: {
        color: "#34d399",
    },
    disabledButton: {
        opacity: 0.5,
    },
    counterRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "center",
    },
    counterButton: {
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: radius.md,
        height: 46,
        justifyContent: "center",
        width: 46,
    },
    counterButtonDark: {
        backgroundColor: "#1e293b",
    },
    counterText: {
        color: "#374151",
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 25,
    },
    counterTextDark: {
        color: "#f1f5f9",
    },
    counterCenter: {
        alignItems: "center",
        minWidth: 58,
    },
    counterValue: {
        color: "#b45309",
        fontSize: 24,
        fontWeight: "900",
    },
    counterValueDark: {
        color: "#fbbf24",
    },
    counterLabel: {
        color: "#64748b",
        fontSize: 11,
        fontWeight: "800",
    },
    savedText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
        marginTop: spacing.md,
        textAlign: "center",
    },
    savedTextDark: {
        color: "#34d399",
    },
    historyLink: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.xs,
        justifyContent: "center",
        minHeight: 44,
        marginTop: spacing.md,
        padding: spacing.sm,
    },
    historyText: {
        color: "#047857",
        fontSize: 13,
        fontWeight: "900",
    },
    historyTextDark: {
        color: "#34d399",
    },
    disclaimer: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
        marginTop: spacing.sm,
        textAlign: "center",
    },
    textPrimaryDark: {
        color: "#f8fafc",
    },
    textMutedDark: {
        color: "#94a3b8",
    },
});
