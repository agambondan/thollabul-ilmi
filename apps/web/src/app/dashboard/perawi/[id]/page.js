"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useLocale } from "@/context/Locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_COLORS = {
    tsiqah_tsiqah:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    tsiqah: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    shaduq: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    la_baasa_bihi:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    maqbul: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    majhul: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    layyin: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    dhaif: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    matruk: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    kadzdzab: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    nabi: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function StatusBadge({ status }) {
    if (!status) return null;
    const color =
        STATUS_COLORS[status] ??
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    return (
        <span
            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${color}`}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}

function SectionTitle({ children }) {
    return (
        <h2 className='text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3'>
            {children}
        </h2>
    );
}

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className='flex gap-2 text-sm'>
            <span className='text-gray-500 dark:text-gray-400 shrink-0 min-w-[120px]'>
                {label}
            </span>
            <span className='text-gray-800 dark:text-gray-200'>{value}</span>
        </div>
    );
}

function PerawiMiniCard({ perawi, basePath = "/dashboard/perawi" }) {
    return (
        <Link
            href={`${basePath}/${perawi.id}`}
            className='flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group'
        >
            <div className='w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 text-xs font-bold shrink-0'>
                {(perawi.nama_latin ?? "?")[0].toUpperCase()}
            </div>
            <div className='min-w-0 flex-1'>
                <p className='text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 truncate'>
                    {perawi.nama_latin}
                </p>
                {perawi.tabaqah && (
                    <p className='text-xs text-gray-400 capitalize'>
                        {perawi.tabaqah.replace(/_/g, " ")}
                    </p>
                )}
            </div>
            {perawi.status && <StatusBadge status={perawi.status} />}
        </Link>
    );
}

export default function DashboardPerawiDetailPage(props) {
    const params = use(props.params);
    return <PerawiDetailContent params={params} basePath='/dashboard/perawi' />;
}

export function PerawiDetailContent({
    params,
    basePath = "/dashboard/perawi",
}) {
    const { id } = params;
    const { t } = useLocale();
    const [data, setData] = useState(null);
    const [guru, setGuru] = useState([]);
    const [murid, setMurid] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/api/v1/perawi/${id}`).then((r) => r.json()),
            fetch(`${API_URL}/api/v1/perawi/${id}/guru`)
                .then((r) => r.json())
                .catch(() => []),
            fetch(`${API_URL}/api/v1/perawi/${id}/murid`)
                .then((r) => r.json())
                .catch(() => []),
        ])
            .then(([p, g, m]) => {
                setData(p);
                setGuru(Array.isArray(g?.items ?? g) ? (g?.items ?? g) : []);
                setMurid(Array.isArray(m?.items ?? m) ? (m?.items ?? m) : []);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className='p-6 text-center text-sm text-gray-400'>
                {t("perawi.loading")}
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className='p-6'>
                <Link
                    href={basePath}
                    className='inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline mb-4'
                >
                    ← {t("perawi.back")}
                </Link>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("perawi.empty")}
                </p>
            </div>
        );
    }

    const jarhTadilList = data.jarh_tadil ?? [];
    const tadilList = jarhTadilList.filter((j) => j.jenis_nilai === "tadil");
    const jarhList = jarhTadilList.filter((j) => j.jenis_nilai === "jarh");

    return (
        <div className='p-4 md:p-6'>
            <Link
                href={basePath}
                className='inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline mb-5'
            >
                ← {t("perawi.back")}
            </Link>
            {/* Header */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4'>
                {data.nama_arab && (
                    <p
                        dir='rtl'
                        className='font-arabic text-3xl text-gray-800 dark:text-gray-100 leading-loose text-right mb-2'
                    >
                        {data.nama_arab}
                    </p>
                )}
                <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>
                    {data.nama_latin}
                </h1>
                {data.nama_lengkap && (
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>
                        {data.nama_lengkap}
                    </p>
                )}
                <div className='flex flex-wrap gap-2 items-center'>
                    {data.status && <StatusBadge status={data.status} />}
                    {data.tabaqah && (
                        <span className='px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg capitalize'>
                            {data.tabaqah.replace(/_/g, " ")}
                        </span>
                    )}
                    {data.tahun_wafat && (
                        <span className='text-xs text-gray-400'>
                            w. {data.tahun_wafat} {t("perawi.hijri")}
                        </span>
                    )}
                </div>
            </div>
            {/* Bio & Info */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4 space-y-2'>
                {data.kunyah && <InfoRow label='Kunyah' value={data.kunyah} />}
                {data.laqab && <InfoRow label='Laqab' value={data.laqab} />}
                {data.nisbah && <InfoRow label='Nisbah' value={data.nisbah} />}
                {data.tahun_lahir && (
                    <InfoRow
                        label={t("perawi.lahir")}
                        value={`${data.tahun_lahir} ${t("perawi.hijri")}${data.tempat_lahir ? ` — ${data.tempat_lahir}` : ""}`}
                    />
                )}
                {data.tahun_wafat && (
                    <InfoRow
                        label={t("perawi.wafat")}
                        value={`${data.tahun_wafat} ${t("perawi.hijri")}${data.tempat_wafat ? ` — ${data.tempat_wafat}` : ""}`}
                    />
                )}
                {data.biografis && (
                    <div className='pt-1'>
                        <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1'>
                            {t("perawi.biografis")}
                        </p>
                        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                            {data.biografis}
                        </p>
                    </div>
                )}
            </div>
            {/* Jarh wa Ta'dil */}
            {jarhTadilList.length > 0 && (
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4'>
                    <SectionTitle>{t("perawi.jarh_tadil")}</SectionTitle>
                    <div className='space-y-3'>
                        {[...tadilList, ...jarhList].map((j, idx) => (
                            <div
                                key={j.id ?? idx}
                                className={`p-3 rounded-xl border-l-4 ${
                                    j.jenis_nilai === "tadil"
                                        ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                                        : "border-red-400 bg-red-50 dark:bg-red-900/10"
                                }`}
                            >
                                <div className='flex items-center gap-2 mb-1.5'>
                                    <span
                                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                            j.jenis_nilai === "tadil"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        }`}
                                    >
                                        {j.jenis_nilai === "tadil"
                                            ? "Ta'dil"
                                            : "Jarh"}{" "}
                                        {j.tingkat && `(${j.tingkat})`}
                                    </span>
                                    {j.penilai?.nama_latin && (
                                        <Link
                                            href={`${basePath}/${j.penilai.id}`}
                                            className='text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium'
                                        >
                                            {j.penilai.nama_latin}
                                        </Link>
                                    )}
                                </div>
                                {j.teks_nilai && (
                                    <p
                                        dir='rtl'
                                        className='font-arabic text-base text-gray-700 dark:text-gray-300 leading-loose text-right mb-1'
                                    >
                                        {j.teks_nilai}
                                    </p>
                                )}
                                {j.catatan && (
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {j.catatan}
                                    </p>
                                )}
                                {j.sumber && (
                                    <p className='text-xs text-gray-400 mt-1'>
                                        📖 {j.sumber}
                                        {j.halaman ? ` hlm. ${j.halaman}` : ""}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Guru & Murid */}
            {(guru.length > 0 || murid.length > 0) && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                    {guru.length > 0 && (
                        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4'>
                            <SectionTitle>
                                {t("perawi.guru")} ({guru.length})
                            </SectionTitle>
                            <div className='space-y-1.5'>
                                {guru.map((g) => (
                                    <PerawiMiniCard
                                        key={g.id}
                                        perawi={g}
                                        basePath={basePath}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {murid.length > 0 && (
                        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4'>
                            <SectionTitle>
                                {t("perawi.murid")} ({murid.length})
                            </SectionTitle>
                            <div className='space-y-1.5'>
                                {murid.map((m) => (
                                    <PerawiMiniCard
                                        key={m.id}
                                        perawi={m}
                                        basePath={basePath}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
