"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { contentReportApi } from "@/lib/api";
import { useState } from "react";
import { BsExclamationTriangleFill } from "react-icons/bs";
import { MdClose } from "react-icons/md";

const CATEGORIES = [
    { value: "translation_error", labelId: "Kesalahan Terjemahan", labelEn: "Translation Error" },
    { value: "arabic_text_error", labelId: "Kesalahan Teks Arab/Harakat", labelEn: "Arabic/Harakat Error" },
    { value: "tafsir_error", labelId: "Kekeliruan Tafsir/Penjelasan", labelEn: "Tafsir Error" },
    { value: "sanad_grading_error", labelId: "Derajat Hadits/Sanad Salah", labelEn: "Grading/Sanad Error" },
    { value: "typo", labelId: "Typo / Salah Ketik", labelEn: "Typo" },
    { value: "other", labelId: "Lainnya", labelEn: "Other" },
];

export default function ContentReportModal({
    isOpen,
    onClose,
    targetType, // 'quran', 'hadith', 'fiqh', etc
    targetId,
    targetTitle,
    snippet,
}) {
    const { t, lang } = useLocale();
    const auth = useAuth() || {};
    const isAuthenticated = auth.isAuthenticated;
    const [category, setCategory] = useState("translation_error");
    const [description, setDescription] = useState("");
    const [correction, setCorrection] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError(
                lang === "EN"
                    ? "Please login to submit a review/report"
                    : "Silakan login untuk mengirimkan laporan/review koreksi",
            );
            return;
        }
        if (!description.trim()) {
            setError(
                lang === "EN"
                    ? "Please provide an explanation of the error"
                    : "Mohon isi penjelasan bagian yang salah",
            );
            return;
        }

        setLoading(true);
        setError("");
        try {
            const res = await contentReportApi.create({
                target_type: targetType,
                target_id: String(targetId),
                target_title: targetTitle || "",
                category,
                description: description.trim(),
                correction: correction.trim(),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || (lang === "EN" ? "Failed to submit report" : "Gagal mengirim laporan"));
            }
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setDescription("");
                setCorrection("");
                onClose();
            }, 1800);
        } catch (err) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-gray-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-base">
                        <BsExclamationTriangleFill className="text-lg" />
                        <span>
                            {lang === "EN"
                                ? "Report / Review Content"
                                : "Koreksi / Review Dalil"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {targetTitle && (
                    <div className="mt-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 p-3 text-xs border border-gray-100 dark:border-slate-700/50">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">
                            {targetTitle}
                        </p>
                        {snippet && (
                            <p className="mt-1 line-clamp-2 text-gray-500 dark:text-gray-400 italic">
                                &ldquo;{snippet}&rdquo;
                            </p>
                        )}
                    </div>
                )}

                {success ? (
                    <div className="py-8 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                            ✓
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {lang === "EN" ? "Thank you!" : "Jazakallahu Khairan!"}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {lang === "EN"
                                ? "Your correction report has been received and will be reviewed."
                                : "Laporan koreksi Anda telah kami terima untuk ditinjau oleh tim."}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-xs text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {lang === "EN" ? "Issue Category" : "Kategori Masalah"}
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:border-emerald-500 focus:outline-none"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {lang === "EN" ? cat.labelEn : cat.labelId}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {lang === "EN" ? "What's wrong? *" : "Bagian yang keliru / penjelasan *"}
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={
                                    lang === "EN"
                                        ? "Describe the wrong translation, typo, or missing info..."
                                        : "Jelaskan bagian terjemahan/teks yang salah atau kurang tepat..."
                                }
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-gray-800 dark:text-gray-200 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {lang === "EN" ? "Suggested Correction (optional)" : "Usulan Koreksi / Terjemahan yang Benar (opsional)"}
                            </label>
                            <textarea
                                rows={2}
                                value={correction}
                                onChange={(e) => setCorrection(e.target.value)}
                                placeholder={
                                    lang === "EN"
                                        ? "Your recommended correct text or translation..."
                                        : "Teks atau terjemahan yang seharusnya..."
                                }
                                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-gray-800 dark:text-gray-200 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="rounded-lg px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                {lang === "EN" ? "Cancel" : "Batal"}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-medium text-white shadow transition-colors disabled:opacity-50"
                            >
                                {loading
                                    ? (lang === "EN" ? "Submitting..." : "Mengirim...")
                                    : (lang === "EN" ? "Submit Review" : "Kirim Koreksi")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
