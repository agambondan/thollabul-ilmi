"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { kalkulasiZakatApi } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { BsBookmarkPlus } from "react-icons/bs";
import { FaCalculator } from "react-icons/fa";
import { MdInfo } from "react-icons/md";

const TABS = [
    "zakat.maal",
    "zakat.fitrah",
    "zakat.profession",
    "zakat.trade",
    "zakat.agriculture",
    "zakat.gold",
];

const NISAB_SILVER_GRAM = 595; // 595 gram silver
const NISAB_GRAM = 85;

export function ZakatContent({ basePath = "/zakat" }) {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [tab, setTab] = useState(0);
    const [goldPrice, setGoldPrice] = useState(1050000);
    const [totalWealth, setTotalWealth] = useState("");
    const [haul, setHaul] = useState(true);
    const [ricePrice, setRicePrice] = useState(16000);
    const [familyCount, setFamilyCount] = useState(1);
    const [monthlyIncome, setMonthlyIncome] = useState("");
    // Tab 3 — Perdagangan
    const [tradeCapital, setTradeCapital] = useState("");
    const [tradeStock, setTradeStock] = useState("");
    const [tradeReceivable, setTradeReceivable] = useState("");
    const [tradeDebt, setTradeDebt] = useState("");
    const [tradeHaul, setTradeHaul] = useState(true);
    // Tab 4 — Pertanian
    const [harvestWeight, setHarvestWeight] = useState("");
    const [harvestIrrigated, setHarvestIrrigated] = useState(false);
    const [riceKgPrice, setRiceKgPrice] = useState(16000);
    // Tab 5 — Emas & Perak
    const [goldGrams, setGoldGrams] = useState("");
    const [silverGrams, setSilverGrams] = useState("");
    const [silverPrice, setSilverPrice] = useState(14000);
    const [goldHaul, setGoldHaul] = useState(true);

    const nisab = NISAB_GRAM * goldPrice;
    const nisabMonthly = nisab / 12;
    const wealth = parseFloat(totalWealth) || 0;
    const income = parseFloat(monthlyIncome) || 0;
    const zakatMaal = wealth >= nisab && haul ? wealth * 0.025 : 0;
    const zakatFitrah = 2.5 * ricePrice * familyCount;
    const zakatProfesi = income >= nisabMonthly ? income * 0.025 : 0;
    // Perdagangan
    const tradeNet =
        (parseFloat(tradeCapital) || 0) +
        (parseFloat(tradeStock) || 0) +
        (parseFloat(tradeReceivable) || 0) -
        (parseFloat(tradeDebt) || 0);
    const zakatTrade = tradeNet >= nisab && tradeHaul ? tradeNet * 0.025 : 0;
    // Pertanian (nisab 653 kg gabah)
    const NISAB_HARVEST_KG = 653;
    const harvest = parseFloat(harvestWeight) || 0;
    const harvestRate = harvestIrrigated ? 0.05 : 0.1;
    const zakatAgriculture =
        harvest >= NISAB_HARVEST_KG ? harvest * harvestRate * riceKgPrice : 0;
    // Emas & Perak
    const goldValue = (parseFloat(goldGrams) || 0) * goldPrice;
    const silverValue = (parseFloat(silverGrams) || 0) * silverPrice;
    const goldNisabValue = NISAB_GRAM * goldPrice;
    const silverNisabValue = NISAB_SILVER_GRAM * silverPrice;
    const zakatGold =
        goldHaul &&
        (goldValue >= goldNisabValue || silverValue >= silverNisabValue)
            ? (goldValue + silverValue) * 0.025
            : 0;
    const fmt = (n) =>
        new Intl.NumberFormat(lang === "EN" ? "en-US" : "id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(n);

    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState("");

    const handleSave = async (
        jenis,
        namaJenis,
        jumlahZakat,
        nilaiHarta = 0,
        nisabVal = 0,
        rate = 2.5,
        haulVal = true,
        catatan = "",
    ) => {
        if (!isAuthenticated || jumlahZakat <= 0) return;
        setSaving(true);
        setSavedMsg("");
        try {
            await kalkulasiZakatApi.save({
                jenis,
                nama_jenis: namaJenis,
                jumlah_zakat: jumlahZakat,
                nilai_harta: nilaiHarta,
                nisab: nisabVal,
                rate,
                haul: haulVal,
                catatan,
            });
            setSavedMsg(t("common.saved") ?? "Tersimpan!");
            setTimeout(() => setSavedMsg(""), 2500);
        } catch {
            setSavedMsg(t("common.save_error") ?? "Gagal menyimpan");
        } finally {
            setSaving(false);
        }
    };

    const InputField = ({ label, value, onChange, placeholder, hint }) => (
        <div>
            <label htmlFor='page-field-1' className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                {label}
            </label>
            <input
                id='page-field-1'
                type='number'
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className='w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400'
            />
            {hint && <p className='text-xs text-gray-400 mt-1'>{hint}</p>}
        </div>
    );

    const ResultCard = ({ amount, color = "emerald", label, note }) => (
        <div
            className={`p-5 rounded-2xl text-center ${
                color === "amber"
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : color === "blue"
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-emerald-50 dark:bg-emerald-900/20"
            }`}
        >
            <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                {label}
            </p>
            <p
                className={`text-3xl font-extrabold ${
                    color === "amber"
                        ? "text-amber-700 dark:text-amber-300"
                        : color === "blue"
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-emerald-700 dark:text-emerald-300"
                }`}
            >
                {fmt(amount)}
            </p>
            {note && (
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {note}
                </p>
            )}
        </div>
    );

    return (
        <ContentWidth compact='max-w-xl' className='flex-1 px-4 pt-6 pb-8'>
            <div className='mb-8 text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <FaCalculator className='text-3xl text-emerald-600 dark:text-emerald-400' />
                </div>
                <h1 className='text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-2'>
                    {t("zakat.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("zakat.subtitle")}
                </p>
            </div>

            {/* Tabs */}
            <div className='overflow-x-auto mb-6'>
                <div className='flex gap-2 min-w-max'>
                    {TABS.map((labelKey, i) => (
                        <button
                            key={labelKey}
                            onClick={() => setTab(i)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                                tab === i
                                    ? "bg-emerald-600 text-white shadow"
                                    : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-emerald-400"
                            }`}
                        >
                            {t(labelKey)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zakat Maal */}
            {tab === 0 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-5'>
                    <div className='flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm text-emerald-800 dark:text-emerald-300'>
                        <MdInfo className='text-lg flex-shrink-0 mt-0.5' />
                        <span>
                            {t("zakat.maal_info_prefix")} <strong>2,5%</strong>.
                        </span>
                    </div>
                    <InputField
                        label={t("zakat.gold_price")}
                        value={goldPrice}
                        onChange={(v) => setGoldPrice(parseFloat(v) || 0)}
                        hint={`${t("zakat.current_nisab")}: ${fmt(nisab)}`}
                    />
                    <InputField
                        label={t("zakat.total_wealth")}
                        value={totalWealth}
                        onChange={setTotalWealth}
                        placeholder={t("zakat.total_wealth_placeholder")}
                    />
                    <div className='flex items-center gap-3'>
                        <input
                            id='haul'
                            type='checkbox'
                            checked={haul}
                            onChange={(e) => setHaul(e.target.checked)}
                            className='w-4 h-4 accent-emerald-600'
                        />
                        <label
                            htmlFor='haul'
                            className='text-sm text-gray-700 dark:text-gray-300'
                        >
                            {t("zakat.haul_label")}
                        </label>
                    </div>
                    {wealth > 0 && wealth < nisab && (
                        <p className='text-sm text-center text-amber-600 dark:text-amber-400'>
                            {t("zakat.wealth_below_nisab")} ({fmt(nisab)})
                        </p>
                    )}
                    {wealth >= nisab && !haul && (
                        <p className='text-sm text-center text-amber-600 dark:text-amber-400'>
                            {t("zakat.haul_unmet")}
                        </p>
                    )}
                    <ResultCard
                        amount={zakatMaal}
                        label={t("zakat.maal_result")}
                    />
                    {isAuthenticated && zakatMaal > 0 && (
                        <button
                            onClick={() =>
                                handleSave(
                                    "maal",
                                    t("zakat.maal") ?? "Zakat Maal",
                                    zakatMaal,
                                    wealth,
                                    nisab,
                                    2.5,
                                    haul,
                                )
                            }
                            disabled={saving}
                            className='w-full mt-3 flex items-center justify-center gap-2 py-2 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50'
                        >
                            <BsBookmarkPlus />
                            {saving
                                ? (t("common.saving") ?? "Menyimpan...")
                                : (t("zakat.save") ?? "Simpan")}
                        </button>
                    )}
                </div>
            )}

            {/* Zakat Fitrah */}
            {tab === 1 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-5'>
                    <div className='flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-800 dark:text-amber-300'>
                        <MdInfo className='text-lg flex-shrink-0 mt-0.5' />
                        <span>
                            {t("zakat.fitrah_info_prefix")}{" "}
                            <strong>1 sha&apos; (±2,5 kg)</strong>{" "}
                            {t("zakat.fitrah_info_suffix")}
                        </span>
                    </div>
                    <InputField
                        label={t("zakat.rice_price")}
                        value={ricePrice}
                        onChange={(v) => setRicePrice(parseFloat(v) || 0)}
                    />
                    <div>
                        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                            {t("zakat.family_count")}
                        </label>
                        <div className='flex items-center gap-4'>
                            <button
                                onClick={() =>
                                    setFamilyCount(Math.max(1, familyCount - 1))
                                }
                                className='w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 font-bold text-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-gray-700 dark:text-gray-300'
                            >
                                −
                            </button>
                            <span className='text-2xl font-extrabold text-amber-700 dark:text-amber-300 w-8 text-center'>
                                {familyCount}
                            </span>
                            <button
                                onClick={() => setFamilyCount(familyCount + 1)}
                                className='w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 font-bold text-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-gray-700 dark:text-gray-300'
                            >
                                +
                            </button>
                            <span className='text-sm text-gray-500 dark:text-gray-400'>
                                {t("zakat.person_unit")}
                            </span>
                        </div>
                    </div>
                    <ResultCard
                        amount={zakatFitrah}
                        color='amber'
                        label={t("zakat.fitrah_result")}
                        note={`${familyCount} ${t("zakat.person_unit")} × 2,5 kg × ${fmt(ricePrice)}/kg`}
                    />
                    {isAuthenticated && zakatFitrah > 0 && (
                        <button
                            onClick={() =>
                                handleSave(
                                    "fitrah",
                                    t("zakat.fitrah") ?? "Zakat Fitrah",
                                    zakatFitrah,
                                    0,
                                    0,
                                    0,
                                    true,
                                    `${familyCount} orang × Rp${ricePrice}/kg`,
                                )
                            }
                            disabled={saving}
                            className='w-full mt-3 flex items-center justify-center gap-2 py-2 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50'
                        >
                            <BsBookmarkPlus />
                            {saving
                                ? (t("common.saving") ?? "Menyimpan...")
                                : (t("zakat.save") ?? "Simpan")}
                        </button>
                    )}
                </div>
            )}

            {/* Zakat Profesi */}
            {tab === 2 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-5'>
                    <div className='flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-800 dark:text-blue-300'>
                        <MdInfo className='text-lg flex-shrink-0 mt-0.5' />
                        <span>
                            {t("zakat.profession_info_prefix")}{" "}
                            <strong>2,5%</strong>{" "}
                            {t("zakat.profession_info_suffix")}
                        </span>
                    </div>
                    <InputField
                        label={t("zakat.gold_price")}
                        value={goldPrice}
                        onChange={(v) => setGoldPrice(parseFloat(v) || 0)}
                        hint={`${t("zakat.monthly_nisab")}: ${fmt(nisabMonthly)}`}
                    />
                    <InputField
                        label={t("zakat.monthly_income")}
                        value={monthlyIncome}
                        onChange={setMonthlyIncome}
                        placeholder={t("zakat.monthly_income_placeholder")}
                    />
                    {income > 0 && income < nisabMonthly && (
                        <p className='text-sm text-center text-blue-600 dark:text-blue-400'>
                            {t("zakat.income_below_nisab")} ({fmt(nisabMonthly)}
                            )
                        </p>
                    )}
                    <ResultCard
                        amount={zakatProfesi}
                        color='blue'
                        label={t("zakat.profession_result")}
                    />
                    {isAuthenticated && zakatProfesi > 0 && (
                        <button
                            onClick={() =>
                                handleSave(
                                    "profesi",
                                    t("zakat.profession") ?? "Zakat Profesi",
                                    zakatProfesi,
                                    income,
                                    nisabMonthly,
                                )
                            }
                            disabled={saving}
                            className='w-full mt-3 flex items-center justify-center gap-2 py-2 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50'
                        >
                            <BsBookmarkPlus />
                            {saving
                                ? (t("common.saving") ?? "Menyimpan...")
                                : (t("zakat.save") ?? "Simpan")}
                        </button>
                    )}
                </div>
            )}

            {/* Zakat Perdagangan */}
            {tab === 3 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-5'>
                    <div className='flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-sm text-purple-800 dark:text-purple-300'>
                        <MdInfo className='text-lg flex-shrink-0 mt-0.5' />
                        <span>
                            {t("zakat.trade_info") ??
                                "Zakat perdagangan 2,5% dari (modal + stok + piutang − utang) jika ≥ nisab emas setelah 1 haul."}
                        </span>
                    </div>
                    <InputField
                        label={t("zakat.gold_price")}
                        value={goldPrice}
                        onChange={(v) => setGoldPrice(parseFloat(v) || 0)}
                        hint={`${t("zakat.current_nisab")}: ${fmt(nisab)}`}
                    />
                    <InputField
                        label={t("zakat.trade_capital") ?? "Modal usaha (Rp)"}
                        value={tradeCapital}
                        onChange={setTradeCapital}
                        placeholder='0'
                    />
                    <InputField
                        label={
                            t("zakat.trade_stock") ?? "Nilai stok barang (Rp)"
                        }
                        value={tradeStock}
                        onChange={setTradeStock}
                        placeholder='0'
                    />
                    <InputField
                        label={
                            t("zakat.trade_receivable") ??
                            "Piutang yang bisa ditagih (Rp)"
                        }
                        value={tradeReceivable}
                        onChange={setTradeReceivable}
                        placeholder='0'
                    />
                    <InputField
                        label={t("zakat.trade_debt") ?? "Utang usaha (Rp)"}
                        value={tradeDebt}
                        onChange={setTradeDebt}
                        placeholder='0'
                    />
                    <div className='flex items-center gap-3'>
                        <input
                            id='trade-haul'
                            type='checkbox'
                            checked={tradeHaul}
                            onChange={(e) => setTradeHaul(e.target.checked)}
                            className='w-4 h-4 accent-emerald-600'
                        />
                        <label
                            htmlFor='trade-haul'
                            className='text-sm text-gray-700 dark:text-gray-300'
                        >
                            {t("zakat.haul_label")}
                        </label>
                    </div>
                    {tradeNet > 0 && (
                        <p className='text-sm text-center text-gray-500 dark:text-gray-400'>
                            {t("zakat.net_assets") ?? "Aset bersih"}:{" "}
                            {fmt(tradeNet)}
                        </p>
                    )}
                    <ResultCard
                        amount={zakatTrade}
                        color='emerald'
                        label={t("zakat.trade_result") ?? "Zakat Perdagangan"}
                    />
                    {isAuthenticated && zakatTrade > 0 && (
                        <button
                            onClick={() =>
                                handleSave(
                                    "perdagangan",
                                    t("zakat.trade") ?? "Zakat Perdagangan",
                                    zakatTrade,
                                    tradeNet,
                                    nisab,
                                    2.5,
                                    tradeHaul,
                                )
                            }
                            disabled={saving}
                            className='w-full mt-3 flex items-center justify-center gap-2 py-2 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50'
                        >
                            <BsBookmarkPlus />
                            {saving
                                ? (t("common.saving") ?? "Menyimpan...")
                                : (t("zakat.save") ?? "Simpan")}
                        </button>
                    )}
                </div>
            )}

            {/* Zakat Pertanian */}
            {tab === 4 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-5'>
                    <div className='flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm text-green-800 dark:text-green-300'>
                        <MdInfo className='text-lg flex-shrink-0 mt-0.5' />
                        <span>
                            {t("zakat.agri_info") ??
                                "Nisab 5 wasq (±653 kg gabah). Irigasi: 5%, tadah hujan: 10%. Wajib tiap panen."}
                        </span>
                    </div>
                    <InputField
                        label={t("zakat.harvest_weight") ?? "Hasil panen (kg)"}
                        value={harvestWeight}
                        onChange={setHarvestWeight}
                        placeholder='0'
                    />
                    <InputField
                        label={
                            t("zakat.rice_kg_price") ??
                            "Harga gabah/beras per kg (Rp)"
                        }
                        value={riceKgPrice}
                        onChange={(v) => setRiceKgPrice(parseFloat(v) || 0)}
                    />
                    <div className='flex items-center gap-3'>
                        <input
                            id='irrigated'
                            type='checkbox'
                            checked={harvestIrrigated}
                            onChange={(e) =>
                                setHarvestIrrigated(e.target.checked)
                            }
                            className='w-4 h-4 accent-emerald-600'
                        />
                        <label
                            htmlFor='irrigated'
                            className='text-sm text-gray-700 dark:text-gray-300'
                        >
                            {t("zakat.uses_irrigation") ??
                                "Menggunakan irigasi/biaya pengairan (tarif 5%)"}
                        </label>
                    </div>
                    {harvest > 0 && harvest < NISAB_HARVEST_KG && (
                        <p className='text-sm text-center text-amber-600 dark:text-amber-400'>
                            {t("zakat.harvest_below_nisab") ??
                                `Panen kurang dari nisab (${NISAB_HARVEST_KG} kg), belum wajib zakat.`}
                        </p>
                    )}
                    <ResultCard
                        amount={zakatAgriculture}
                        color='emerald'
                        label={t("zakat.agri_result") ?? "Zakat Pertanian"}
                        note={
                            harvest >= NISAB_HARVEST_KG
                                ? `${harvestRate * 100}% × ${harvest} kg × ${fmt(riceKgPrice)}/kg`
                                : undefined
                        }
                    />
                    {isAuthenticated && zakatAgriculture > 0 && (
                        <button
                            onClick={() =>
                                handleSave(
                                    "pertanian",
                                    t("zakat.agriculture") ?? "Zakat Pertanian",
                                    zakatAgriculture,
                                    0,
                                    0,
                                    harvestRate * 100,
                                    true,
                                    `${harvest} kg, irigasi: ${harvestIrrigated ? "5%" : "10%"}`,
                                )
                            }
                            disabled={saving}
                            className='w-full mt-3 flex items-center justify-center gap-2 py-2 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50'
                        >
                            <BsBookmarkPlus />
                            {saving
                                ? (t("common.saving") ?? "Menyimpan...")
                                : (t("zakat.save") ?? "Simpan")}
                        </button>
                    )}
                </div>
            )}

            {/* Zakat Emas & Perak */}
            {tab === 5 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 space-y-5'>
                    <div className='flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-300'>
                        <MdInfo className='text-lg flex-shrink-0 mt-0.5' />
                        <span>
                            {t("zakat.gold_info") ??
                                "Nisab emas 85g, perak 595g. Wajib setelah 1 haul. Tarif 2,5%."}
                        </span>
                    </div>
                    <InputField
                        label={
                            t("zakat.gold_price_gram") ??
                            "Harga emas per gram (Rp)"
                        }
                        value={goldPrice}
                        onChange={(v) => setGoldPrice(parseFloat(v) || 0)}
                        hint={`Nisab emas: ${NISAB_GRAM}g = ${fmt(goldNisabValue)}`}
                    />
                    <InputField
                        label={
                            t("zakat.gold_grams") ??
                            "Berat emas yang dimiliki (gram)"
                        }
                        value={goldGrams}
                        onChange={setGoldGrams}
                        placeholder='0'
                    />
                    <InputField
                        label={
                            t("zakat.silver_price_gram") ??
                            "Harga perak per gram (Rp)"
                        }
                        value={silverPrice}
                        onChange={(v) => setSilverPrice(parseFloat(v) || 0)}
                        hint={`Nisab perak: ${NISAB_SILVER_GRAM}g = ${fmt(silverNisabValue)}`}
                    />
                    <InputField
                        label={
                            t("zakat.silver_grams") ??
                            "Berat perak yang dimiliki (gram)"
                        }
                        value={silverGrams}
                        onChange={setSilverGrams}
                        placeholder='0'
                    />
                    <div className='flex items-center gap-3'>
                        <input
                            id='gold-haul'
                            type='checkbox'
                            checked={goldHaul}
                            onChange={(e) => setGoldHaul(e.target.checked)}
                            className='w-4 h-4 accent-emerald-600'
                        />
                        <label
                            htmlFor='gold-haul'
                            className='text-sm text-gray-700 dark:text-gray-300'
                        >
                            {t("zakat.haul_label")}
                        </label>
                    </div>
                    <ResultCard
                        amount={zakatGold}
                        color='amber'
                        label={t("zakat.gold_result") ?? "Zakat Emas & Perak"}
                        note={
                            zakatGold > 0
                                ? `2,5% × ${fmt(goldValue + silverValue)}`
                                : undefined
                        }
                    />
                    {isAuthenticated && zakatGold > 0 && (
                        <button
                            onClick={() =>
                                handleSave(
                                    "emas_perak",
                                    t("zakat.gold") ?? "Zakat Emas & Perak",
                                    zakatGold,
                                    goldValue + silverValue,
                                    goldNisabValue,
                                    2.5,
                                    goldHaul,
                                    `${goldGrams || 0}g emas, ${silverGrams || 0}g perak`,
                                )
                            }
                            disabled={saving}
                            className='w-full mt-3 flex items-center justify-center gap-2 py-2 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50'
                        >
                            <BsBookmarkPlus />
                            {saving
                                ? (t("common.saving") ?? "Menyimpan...")
                                : (t("zakat.save") ?? "Simpan")}
                        </button>
                    )}
                </div>
            )}

            {savedMsg && (
                <p className='text-center text-sm text-emerald-600 dark:text-emerald-400 mt-4 font-medium'>
                    {savedMsg}
                </p>
            )}
            {isAuthenticated && (
                <div className='text-center mt-4'>
                    <Link
                        href={`${basePath}/history`}
                        className='text-sm text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("zakat.view_history") ?? "Lihat Riwayat Zakat"} →
                    </Link>
                </div>
            )}
            <p className='text-center text-xs text-gray-400 mt-6'>
                {t("zakat.disclaimer")}
            </p>
        </ContentWidth>
    );
}

export default function ZakatPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <ZakatContent />
            </div>
        </main>
    );
}
