"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { faraidhSimpanApi } from "@/lib/api";
import { calculateFaraidh, HEIR_LABELS } from "@/lib/faraidh";
import { useEffect, useMemo, useState } from "react";
import {
    BsCalculator,
    BsClockHistory,
    BsCloudCheck,
    BsFloppyFill,
    BsInfoCircle,
    BsPrinter,
    BsTrash,
} from "react-icons/bs";

const HEIR_FIELDS = [
    { key: "suami", max: 1, group: "spouse" },
    { key: "istri", max: 4, group: "spouse" },
    { key: "anakL", max: 20, group: "children" },
    { key: "anakP", max: 20, group: "children" },
    { key: "cucuL", max: 20, group: "grandchildren" },
    { key: "cucuP", max: 20, group: "grandchildren" },
    { key: "ayah", max: 1, group: "parents" },
    { key: "ibu", max: 1, group: "parents" },
    { key: "kakek", max: 1, group: "grandparents" },
    { key: "nenek", max: 4, group: "grandparents" },
    { key: "saudaraL", max: 20, group: "siblings" },
    { key: "saudaraP", max: 20, group: "siblings" },
    { key: "saudaraSeayahL", max: 20, group: "half_siblings" },
    { key: "saudaraSeayahP", max: 20, group: "half_siblings" },
    { key: "saudaraSeibuL", max: 10, group: "maternal_siblings" },
    { key: "saudaraSeibuP", max: 10, group: "maternal_siblings" },
];

const HEIR_LABEL = {
    suami: { idn: "Suami", en: "Husband" },
    istri: { idn: "Istri", en: "Wife" },
    anakL: { idn: "Anak Laki-laki", en: "Son" },
    anakP: { idn: "Anak Perempuan", en: "Daughter" },
    cucuL: {
        idn: "Cucu Laki-laki (dari anak L)",
        en: "Grandson (from son)",
    },
    cucuP: {
        idn: "Cucu Perempuan (dari anak L)",
        en: "Granddaughter (from son)",
    },
    ayah: { idn: "Ayah", en: "Father" },
    ibu: { idn: "Ibu", en: "Mother" },
    kakek: {
        idn: "Kakek (jika ayah tidak ada)",
        en: "Grandfather (if father absent)",
    },
    nenek: {
        idn: "Nenek (jika ibu tidak ada)",
        en: "Grandmother (if mother absent)",
    },
    saudaraL: { idn: "Saudara Laki-laki Kandung", en: "Full Brother" },
    saudaraP: { idn: "Saudara Perempuan Kandung", en: "Full Sister" },
    saudaraSeayahL: {
        idn: "Sd Laki Seayah",
        en: "Paternal Half-Brother",
    },
    saudaraSeayahP: {
        idn: "Sd Perempuan Seayah",
        en: "Paternal Half-Sister",
    },
    saudaraSeibuL: {
        idn: "Sd Laki Seibu",
        en: "Maternal Half-Brother",
    },
    saudaraSeibuP: {
        idn: "Sd Perempuan Seibu",
        en: "Maternal Half-Sister",
    },
};

const heirLabel = (key, lang) =>
    HEIR_LABEL[key]?.[lang === "EN" ? "en" : "idn"] ?? key;

const heirRowLabel = (key, lang) => {
    const entry = HEIR_LABELS[key];
    if (!entry) return key;
    return entry[lang === "EN" ? "en" : "idn"];
};

const fmtNumber = (n, lang) =>
    new Intl.NumberFormat(lang === "EN" ? "en-US" : "id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(n) ? n : 0);

const fmtFrac = (f) => (f ? `${f.num}/${f.den}` : "—");

export function FaraidhContent() {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [wealth, setWealth] = useState("100000000");
    const [debt, setDebt] = useState("");
    const [funeral, setFuneral] = useState("");
    const [will, setWill] = useState("");
    const [heirs, setHeirs] = useState({
        suami: 0,
        istri: 0,
        anakL: 0,
        anakP: 0,
        cucuL: 0,
        cucuP: 0,
        ayah: 0,
        ibu: 0,
        kakek: 0,
        nenek: 0,
        saudaraL: 0,
        saudaraP: 0,
        saudaraSeayahL: 0,
        saudaraSeayahP: 0,
        saudaraSeibuL: 0,
        saudaraSeibuP: 0,
    });

    const setHeir = (key, value) => {
        const cap = HEIR_FIELDS.find((f) => f.key === key)?.max ?? 0;
        const num = Math.min(cap, Math.max(0, Number(value) || 0));
        setHeirs((prev) => {
            const next = { ...prev, [key]: num };
            if (key === "suami" && num > 0) next.istri = 0;
            if (key === "istri" && num > 0) next.suami = 0;
            if (key === "ayah" && num > 0) next.kakek = 0;
            if (key === "ibu" && num > 0) next.nenek = 0;
            return next;
        });
    };

    const totalNet = useMemo(() => {
        const w = Number(wealth) || 0;
        const d = Number(debt) || 0;
        const f = Number(funeral) || 0;
        const wi = Number(will) || 0;
        const wasiyahCap = Math.max(0, w - d - f) / 3;
        const willEffective = Math.min(wi, wasiyahCap);
        return Math.max(0, w - d - f - willEffective);
    }, [wealth, debt, funeral, will]);

    const result = useMemo(
        () => calculateFaraidh(heirs, totalNet),
        [heirs, totalNet],
    );

    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        try {
            setHistory(
                JSON.parse(
                    localStorage.getItem("tholabul_faraidh_history") ?? "[]",
                ),
            );
        } catch {}
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        faraidhSimpanApi
            .list()
            .then((r) => r.json())
            .then((data) => {
                const items = (data?.items ?? []).map((item) => ({
                    id: item.id,
                    _beId: item.id,
                    date: item.created_at ? item.created_at.slice(0, 10) : "",
                    wealth: String(item.wealth || ""),
                    debt: String(item.debt || ""),
                    funeral: String(item.funeral || ""),
                    will: String(item.will || ""),
                    heirs: JSON.parse(item.heirs_json || "{}"),
                }));
                setHistory((prev) => {
                    const localOnly = prev.filter((e) => !e._beId);
                    return [...items, ...localOnly].slice(0, 20);
                });
            })
            .catch((e) => console.error(e));
    }, [isAuthenticated]);

    const persistHistory = (updated) => {
        setHistory(updated);
        try {
            localStorage.setItem(
                "tholabul_faraidh_history",
                JSON.stringify(updated),
            );
        } catch {}
    };

    const saveCalculation = async () => {
        const entry = {
            id: Date.now().toString(),
            date: new Date().toISOString().slice(0, 10),
            wealth,
            debt,
            funeral,
            will,
            heirs,
        };
        const updated = [entry, ...history].slice(0, 20);
        persistHistory(updated);

        if (isAuthenticated && totalNet > 0) {
            setSaving(true);
            const summary = result?.distribution
                ? result.distribution
                      .filter((d) => d.shareAmount > 0)
                      .map(
                          (d) =>
                              `${heirRowLabel(d.key, lang)}: ${fmtNumber(d.shareAmount, lang)}`,
                      )
                      .join("; ")
                : "";
            try {
                const res = await faraidhSimpanApi.save({
                    wealth: Number(wealth) || 0,
                    debt: Number(debt) || 0,
                    funeral: Number(funeral) || 0,
                    will: Number(will) || 0,
                    heirs_json: JSON.stringify(heirs),
                    result_summary: summary,
                });
                if (res.ok) {
                    const data = await res.json();
                    entry._beId = data?.id;
                    persistHistory(
                        updated.map((e) => (e.id === entry.id ? entry : e)),
                    );
                }
            } catch {}
            setSaving(false);
        }
    };

    const loadHistory = (entry) => {
        setWealth(entry.wealth);
        setDebt(entry.debt);
        setFuneral(entry.funeral);
        setWill(entry.will);
        setHeirs(entry.heirs);
        setShowHistory(false);
    };

    const deleteHistory = (id) => {
        const entry = history.find((h) => h.id === id);
        if (entry?._beId && isAuthenticated) {
            faraidhSimpanApi.delete(entry._beId).catch((e) => console.error(e));
        }
        persistHistory(history.filter((h) => h.id !== id));
    };

    const handlePrint = () => {
        if (typeof window !== "undefined") window.print();
    };

    const willCap = Math.max(
        0,
        ((Number(wealth) || 0) - (Number(debt) || 0) - (Number(funeral) || 0)) /
            3,
    );
    const totalHeirs = Object.values(heirs).reduce((s, n) => s + n, 0);

    return (
        <ContentWidth compact='max-w-4xl' className='px-4 py-6'>
            <div className='text-center mb-6'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    الْفَرَائِض
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                    {t("faraidh.title") ?? "Kalkulator Waris (Faraidh)"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("faraidh.subtitle") ??
                        "Perhitungan pembagian harta warisan sesuai Ashabul Furudh"}
                </p>
            </div>

            <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5 flex items-start gap-3'>
                <BsInfoCircle className='text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5' />
                <p className='text-xs text-amber-800 dark:text-amber-300 leading-relaxed'>
                    {t("faraidh.disclaimer") ??
                        "Kalkulator ini menangani kasus dasar Ashabul Furudh & Ashabah. Kasus kompleks (Musytarakah, Akdariyah, kakek bersama saudara, dll.) memerlukan konsultasi ulama. Selalu konfirmasi hasil ke ahli faraidh."}
                </p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6'>
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2'>
                        <BsCalculator className='text-emerald-600' />
                        {t("faraidh.wealth_section") ?? "Harta dan Pengurang"}
                    </h2>
                    <div className='space-y-3'>
                        <div>
                            <label
                                htmlFor='page-total-wealth'
                                className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                            >
                                {t("faraidh.total_wealth") ??
                                    "Total Harta (Rp)"}
                            </label>
                            <input
                                id='page-total-wealth'
                                type='number'
                                min='0'
                                value={wealth}
                                onChange={(e) => setWealth(e.target.value)}
                                placeholder='100000000'
                                className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-debt'
                                className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                            >
                                {t("faraidh.debt") ?? "Hutang Almarhum (Rp)"}
                            </label>
                            <input
                                id='page-debt'
                                type='number'
                                min='0'
                                value={debt}
                                onChange={(e) => setDebt(e.target.value)}
                                placeholder='0'
                                className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-funeral'
                                className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                            >
                                {t("faraidh.funeral") ?? "Biaya Pemakaman (Rp)"}
                            </label>
                            <input
                                id='page-funeral'
                                type='number'
                                min='0'
                                value={funeral}
                                onChange={(e) => setFuneral(e.target.value)}
                                placeholder='0'
                                className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-will'
                                className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                            >
                                {t("faraidh.will") ?? "Wasiat (Rp, maks 1/3)"}
                            </label>
                            <input
                                id='page-will'
                                type='number'
                                min='0'
                                value={will}
                                onChange={(e) => setWill(e.target.value)}
                                placeholder='0'
                                className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                            />
                            <p className='text-xs text-gray-400 mt-1'>
                                {t("faraidh.will_cap_label") ??
                                    "Maksimal wasiat"}
                                : {fmtNumber(willCap, lang)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-base font-semibold text-gray-800 dark:text-white mb-4'>
                        {t("faraidh.heirs_section") ?? "Ahli Waris"}
                    </h2>
                    <div className='space-y-4'>
                        {[
                            {
                                key: "spouse",
                                label: t("faraidh.group_spouse") ?? "Pasangan",
                            },
                            {
                                key: "children",
                                label: t("faraidh.group_children") ?? "Anak",
                            },
                            {
                                key: "grandchildren",
                                label:
                                    t("faraidh.group_grandchildren") ??
                                    "Cucu (dari anak laki-laki)",
                            },
                            {
                                key: "parents",
                                label:
                                    t("faraidh.group_parents") ?? "Orang Tua",
                            },
                            {
                                key: "grandparents",
                                label:
                                    t("faraidh.group_grandparents") ??
                                    "Kakek/Nenek",
                            },
                            {
                                key: "siblings",
                                label:
                                    t("faraidh.group_siblings") ??
                                    "Saudara Kandung",
                            },
                            {
                                key: "half_siblings",
                                label:
                                    t("faraidh.group_half_siblings") ??
                                    "Saudara Seayah",
                            },
                            {
                                key: "maternal_siblings",
                                label:
                                    t("faraidh.group_maternal_siblings") ??
                                    "Saudara Seibu",
                            },
                        ].map((group) => {
                            const fields = HEIR_FIELDS.filter(
                                (f) => f.group === group.key,
                            );
                            if (fields.length === 0) return null;
                            return (
                                <div
                                    key={group.key}
                                    className='border border-gray-100 dark:border-slate-700 rounded-xl p-3 bg-gray-50 dark:bg-slate-800/50'
                                >
                                    <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2'>
                                        {group.label}
                                    </h3>
                                    <div className='grid grid-cols-2 gap-x-3 gap-y-3'>
                                        {fields.map((field) => (
                                            <div key={field.key}>
                                                <label
                                                    htmlFor='page-field-1'
                                                    className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
                                                >
                                                    {heirLabel(field.key, lang)}
                                                </label>
                                                <input
                                                    id='page-field-1'
                                                    type='number'
                                                    min='0'
                                                    max={field.max}
                                                    value={heirs[field.key]}
                                                    onChange={(e) =>
                                                        setHeir(
                                                            field.key,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className='w-full px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className='text-xs text-gray-400 mt-3'>
                        {t("faraidh.heir_count_label") ?? "Jumlah ahli waris"}:{" "}
                        {totalHeirs}
                    </p>
                </div>
            </div>

            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                <div className='flex items-center justify-between mb-4 gap-2'>
                    <h2 className='text-base font-semibold text-gray-800 dark:text-white'>
                        {t("faraidh.result") ?? "Hasil Perhitungan"}
                    </h2>
                    <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-400 hidden sm:block'>
                            {t("faraidh.net_wealth") ?? "Tirkah bersih"}:{" "}
                            {fmtNumber(totalNet, lang)}
                        </span>
                        {history.length > 0 && (
                            <button
                                onClick={() => setShowHistory((v) => !v)}
                                className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsClockHistory />
                                {t("faraidh.history") ?? "Riwayat"} (
                                {history.length})
                            </button>
                        )}
                        {totalHeirs > 0 && result.rows.length > 0 && (
                            <button
                                onClick={saveCalculation}
                                disabled={saving}
                                className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50'
                            >
                                {saving ? (
                                    <span className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                ) : isAuthenticated ? (
                                    <BsCloudCheck />
                                ) : (
                                    <BsFloppyFill />
                                )}
                                {saving
                                    ? (t("common.saving") ?? "Menyimpan...")
                                    : (t("common.save") ?? "Simpan")}
                            </button>
                        )}
                        {totalHeirs > 0 && result.rows.length > 0 && (
                            <button
                                onClick={handlePrint}
                                className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsPrinter />
                                {t("faraidh.print") ?? "Cetak"}
                            </button>
                        )}
                    </div>
                </div>

                {totalHeirs === 0 ? (
                    <p className='text-center text-gray-400 py-8 text-sm'>
                        {t("faraidh.fill_heirs") ??
                            "Masukkan ahli waris untuk melihat hasil."}
                    </p>
                ) : result.rows.length === 0 ? (
                    <p className='text-center text-gray-400 py-8 text-sm'>
                        {t("faraidh.no_eligible") ??
                            "Kombinasi ahli waris tidak menghasilkan pembagian Ashabul Furudh / Ashabah dasar."}
                    </p>
                ) : (
                    <>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='text-xs text-gray-400 border-b border-gray-100 dark:border-slate-700'>
                                        <th className='text-left px-3 py-2 font-medium'>
                                            {t("faraidh.col_heir") ??
                                                "Ahli Waris"}
                                        </th>
                                        <th className='text-center px-3 py-2 font-medium'>
                                            {t("faraidh.col_count") ?? "Jumlah"}
                                        </th>
                                        <th className='text-center px-3 py-2 font-medium'>
                                            {t("faraidh.col_fraction") ??
                                                "Bagian"}
                                        </th>
                                        <th className='text-right px-3 py-2 font-medium'>
                                            {t("faraidh.col_share") ??
                                                "Persentase"}
                                        </th>
                                        <th className='text-right px-3 py-2 font-medium'>
                                            {t("faraidh.col_amount") ??
                                                "Nominal"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.rows.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            className='border-b border-gray-50 dark:border-slate-700/50 last:border-0'
                                        >
                                            <td className='px-3 py-2.5 text-gray-700 dark:text-gray-300'>
                                                {heirRowLabel(row.key, lang)}
                                                {row.isAshabah && (
                                                    <span className='ml-2 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium'>
                                                        {t("faraidh.ashabah") ??
                                                            "Ashabah"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className='px-3 py-2.5 text-center text-gray-500 dark:text-gray-400'>
                                                {row.count}
                                            </td>
                                            <td className='px-3 py-2.5 text-center text-emerald-700 dark:text-emerald-400 font-medium'>
                                                {fmtFrac(row.fraction)}
                                            </td>
                                            <td className='px-3 py-2.5 text-right text-gray-600 dark:text-gray-300'>
                                                {(row.share * 100).toFixed(2)}%
                                            </td>
                                            <td className='px-3 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-400'>
                                                {fmtNumber(row.amount, lang)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className='border-t-2 border-gray-200 dark:border-slate-600'>
                                        <td
                                            colSpan={3}
                                            className='px-3 py-2.5 text-right text-xs text-gray-500 dark:text-gray-400'
                                        >
                                            {t("common.total") ?? "Total"}
                                        </td>
                                        <td className='px-3 py-2.5 text-right text-sm font-bold text-gray-800 dark:text-white'>
                                            {(result.totalShare * 100).toFixed(
                                                2,
                                            )}
                                            %
                                        </td>
                                        <td className='px-3 py-2.5 text-right text-sm font-bold text-gray-800 dark:text-white'>
                                            {fmtNumber(
                                                totalNet * result.totalShare,
                                                lang,
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {(result.applied.aul ||
                            result.applied.radd ||
                            result.applied.umariyyah ||
                            result.applied.musytarakah ||
                            result.applied.kakek_saudara ||
                            result.applied.akdariyah) && (
                            <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-1'>
                                {result.applied.aul && (
                                    <p>
                                        <strong>
                                            {t("faraidh.aul_applied") ??
                                                "Aul diterapkan"}
                                            :
                                        </strong>{" "}
                                        {t("faraidh.aul_desc") ??
                                            "Total bagian Ashabul Furudh melebihi 1, sehingga semua bagian dikurangi proporsional."}
                                    </p>
                                )}
                                {result.applied.radd && (
                                    <p>
                                        <strong>
                                            {t("faraidh.radd_applied") ??
                                                "Radd diterapkan"}
                                            :
                                        </strong>{" "}
                                        {t("faraidh.radd_desc") ??
                                            "Sisa harta dikembalikan ke ahli waris (selain pasangan) secara proporsional."}
                                    </p>
                                )}
                                {result.applied.umariyyah && (
                                    <p>
                                        <strong>Umariyyatain:</strong> ayah
                                        mengambil sisa setelah pasangan, sesuai
                                        musyawarah Umar dengan 6 sahabat senior.
                                    </p>
                                )}
                                {result.applied.musytarakah && (
                                    <p>
                                        <strong>Musytarakah:</strong> 1/3
                                        bersama untuk ibu + saudara, dibagi
                                        proporsional lalu sisa dikembalikan
                                        (radd).
                                    </p>
                                )}
                                {result.applied.kakek_saudara && (
                                    <p>
                                        <strong>Minbariyah (Zaid):</strong>{" "}
                                        kakek ambil 1/6 tetap, saudara ashabah
                                        mengambil sisanya.
                                    </p>
                                )}
                                {result.applied.akdariyah && (
                                    <p>
                                        <strong>Akdariyah:</strong> kakek 1/6,
                                        saudara P ashabul furudh (1/2 atau 2/3),
                                        sisa jadi ashabah kakek.
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* History panel */}
            {showHistory && history.length > 0 && (
                <div className='mt-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2'>
                        <BsClockHistory className='text-emerald-600' />
                        {t("faraidh.history") ?? "Riwayat Perhitungan"}
                    </h2>
                    <ul className='space-y-2'>
                        {history.map((entry) => {
                            const w = Number(entry.wealth) || 0;
                            const d = Number(entry.debt) || 0;
                            const f = Number(entry.funeral) || 0;
                            const wi = Number(entry.will) || 0;
                            const net = Math.max(
                                0,
                                w -
                                    d -
                                    f -
                                    Math.min(wi, Math.max(0, w - d - f) / 3),
                            );
                            const heirCount = Object.values(
                                entry.heirs ?? {},
                            ).reduce((s, n) => s + n, 0);
                            return (
                                <li
                                    key={entry.id}
                                    className='flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors'
                                >
                                    <button
                                        onClick={() => loadHistory(entry)}
                                        className='flex-1 text-left'
                                    >
                                        <p className='text-sm font-medium text-gray-800 dark:text-white'>
                                            {fmtNumber(net, lang)}{" "}
                                            <span className='text-xs font-normal text-gray-400'>
                                                — {heirCount}{" "}
                                                {t("faraidh.heir_unit") ??
                                                    "ahli waris"}
                                            </span>
                                        </p>
                                        <p className='text-xs text-gray-400 mt-0.5'>
                                            {new Date(
                                                entry.date + "T00:00:00",
                                            ).toLocaleDateString(
                                                lang === "EN"
                                                    ? "en-US"
                                                    : "id-ID",
                                                {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                },
                                            )}
                                        </p>
                                    </button>
                                    <button
                                        onClick={() => deleteHistory(entry.id)}
                                        className='text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors'
                                    >
                                        <BsTrash />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </ContentWidth>
    );
}

export default function FaraidhPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950'>
            <Section>
                <FaraidhContent />
            </Section>
        </main>
    );
}
