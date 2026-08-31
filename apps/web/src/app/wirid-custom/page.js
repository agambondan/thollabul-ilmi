"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { userWirdApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BsChevronDown,
    BsChevronUp,
    BsPencilSquare,
    BsPlusCircle,
    BsTrash,
    BsX,
} from "react-icons/bs";
import { GiOpenBook } from "react-icons/gi";

const EMPTY_FORM = {
    title: "",
    arabic: "",
    transliteration: "",
    translation: "",
    source: "",
    count: 1,
    occasion: "",
    note: "",
};

export function WiridCustomContent() {
    const { isAuthenticated } = useAuth();
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const load = () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        setLoading(true);
        userWirdApi
            .list()
            .then((r) => r.json())
            .then((data) =>
                setItems(
                    Array.isArray(data?.items ?? data)
                        ? (data?.items ?? data)
                        : [],
                ),
            )
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, [isAuthenticated]);

    const openCreate = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditId(item.id);
        setForm({
            title: item.title ?? "",
            arabic: item.arabic ?? "",
            transliteration: item.transliteration ?? "",
            translation: item.translation ?? "",
            source: item.source ?? "",
            count: item.count ?? 1,
            occasion: item.occasion ?? "",
            note: item.note ?? "",
        });
        setShowModal(true);
    };

    const fb = (type, msg) =>
        typeof window !== "undefined" &&
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const save = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            let res;
            if (editId) {
                res = await userWirdApi.update(editId, form);
            } else {
                res = await userWirdApi.create(form);
            }
            if (!res.ok) throw new Error(t("admin.error.save"));
            setShowModal(false);
            load();
            fb("admin:success", t("admin.crud.save_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!confirm(t("wirid_custom.delete_confirm") ?? "Hapus wirid ini?"))
            return;
        try {
            const res = await userWirdApi.delete(id);
            if (!res.ok) throw new Error(t("admin.error.save"));
            setItems((prev) => prev.filter((w) => w.id !== id));
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    if (!isAuthenticated) {
        return (
            <ContentWidth
                compact='max-w-2xl'
                className='px-4 py-10 text-center'
            >
                <GiOpenBook className='mx-auto text-5xl text-emerald-300 dark:text-emerald-700 mb-4' />
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white mb-2'>
                    {t("wirid_custom.title") ?? "Wirid Pribadi"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                    {t("wirid_custom.login_required") ??
                        "Login untuk menyimpan wirid pribadi."}
                </p>
                <Link
                    href='/auth/login'
                    className='inline-block px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    {t("auth.login_btn") ?? "Masuk"}
                </Link>
            </ContentWidth>
        );
    }

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-0.5'>
                        {t("wirid_custom.title") ?? "Wirid Pribadi"}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("wirid_custom.subtitle") ??
                            "Kumpulan wirid yang kamu buat sendiri"}
                    </p>
                </div>
                <button
                    type='button'
                    onClick={openCreate}
                    className='flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("common.add") ?? "Tambah"}
                </button>
            </div>

            {loading ? (
                <div className='flex items-center justify-center py-16'>
                    <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                </div>
            ) : items.length === 0 ? (
                <div className='text-center py-16'>
                    <GiOpenBook className='mx-auto text-4xl text-gray-300 dark:text-slate-600 mb-3' />
                    <p className='text-gray-500 dark:text-gray-400 text-sm mb-3'>
                        {t("wirid_custom.empty") ?? "Belum ada wirid pribadi."}
                    </p>
                    <button
                        type='button'
                        onClick={openCreate}
                        className='text-sm text-emerald-700 dark:text-emerald-400 hover:underline'
                    >
                        {t("wirid_custom.add_first") ?? "Buat wirid pertama"}
                    </button>
                </div>
            ) : (
                <ul className='space-y-3'>
                    {items.map((item) => {
                        const isOpen = expanded === item.id;
                        return (
                            <li
                                key={item.id}
                                className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                            >
                                <div className='flex items-center justify-between gap-2 px-4 py-3'>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setExpanded(isOpen ? null : item.id)
                                        }
                                        className='flex items-center gap-3 flex-1 min-w-0 text-left'
                                    >
                                        {item.count > 0 && (
                                            <span className='inline-flex items-center justify-center min-w-[2rem] px-2 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0'>
                                                {item.count}×
                                            </span>
                                        )}
                                        <span className='font-semibold text-gray-800 dark:text-white text-sm truncate'>
                                            {item.title}
                                        </span>
                                        {item.occasion && (
                                            <span className='px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 capitalize shrink-0'>
                                                {item.occasion}
                                            </span>
                                        )}
                                    </button>
                                    <div className='flex items-center gap-1 shrink-0'>
                                        <button
                                            type='button'
                                            onClick={() => openEdit(item)}
                                            aria-label={t("common.edit")}
                                            className='p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors'
                                        >
                                            <BsPencilSquare />
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => remove(item.id)}
                                            aria-label={t("common.delete")}
                                            className='p-1.5 text-gray-400 hover:text-red-500 transition-colors'
                                        >
                                            <BsTrash />
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                setExpanded(
                                                    isOpen ? null : item.id,
                                                )
                                            }
                                            className='p-1.5 text-gray-400'
                                        >
                                            {isOpen ? (
                                                <BsChevronUp />
                                            ) : (
                                                <BsChevronDown />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {isOpen && (
                                    <div className='px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2'>
                                        {item.arabic && (
                                            <p
                                                dir='rtl'
                                                className='text-xl font-arabic leading-loose text-emerald-900 dark:text-emerald-300'
                                            >
                                                {item.arabic}
                                            </p>
                                        )}
                                        {item.transliteration && (
                                            <p className='text-sm italic text-gray-500 dark:text-gray-400'>
                                                {item.transliteration}
                                            </p>
                                        )}
                                        {item.translation && (
                                            <p className='text-sm text-gray-700 dark:text-gray-300'>
                                                {item.translation}
                                            </p>
                                        )}
                                        {item.source && (
                                            <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
                                                {item.source}
                                            </p>
                                        )}
                                        {item.note && (
                                            <p className='text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-emerald-200 dark:border-emerald-700 pl-2'>
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {showModal && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    onClick={(e) =>
                        e.target === e.currentTarget && setShowModal(false)
                    }
                >
                    <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                                {editId
                                    ? (t("wirid_custom.edit") ?? "Edit Wirid")
                                    : (t("wirid_custom.create") ??
                                      "Buat Wirid Baru")}
                            </h2>
                            <button
                                type='button'
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>

                        <div className='space-y-3'>
                            <Field
                                label={t("wirid_custom.field_title") ?? "Judul"}
                                value={form.title}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, title: v }))
                                }
                                required
                                placeholder={t("wirid_custom.title_example")}
                            />
                            <Field
                                label={
                                    t("wirid_custom.field_arabic") ??
                                    "Teks Arab"
                                }
                                value={form.arabic}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, arabic: v }))
                                }
                                multiline
                                rtl
                            />
                            <Field
                                label={
                                    t("wirid_custom.field_latin") ??
                                    "Transliterasi (Latin)"
                                }
                                value={form.transliteration}
                                onChange={(v) =>
                                    setForm((f) => ({
                                        ...f,
                                        transliteration: v,
                                    }))
                                }
                            />
                            <Field
                                label={
                                    t("wirid_custom.field_translation") ??
                                    "Terjemahan"
                                }
                                value={form.translation}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, translation: v }))
                                }
                                multiline
                            />
                            <div className='grid grid-cols-2 gap-3'>
                                <Field
                                    label={
                                        t("wirid_custom.field_count") ??
                                        "Hitungan (×)"
                                    }
                                    type='number'
                                    value={form.count}
                                    onChange={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            count: Number(v) || 1,
                                        }))
                                    }
                                />
                                <Field
                                    label={
                                        t("wirid_custom.field_occasion") ??
                                        "Waktu/Kesempatan"
                                    }
                                    value={form.occasion}
                                    onChange={(v) =>
                                        setForm((f) => ({ ...f, occasion: v }))
                                    }
                                    placeholder={t("wirid_custom.occasion_example")}
                                />
                            </div>
                            <Field
                                label={
                                    t("wirid_custom.field_source") ?? "Sumber"
                                }
                                value={form.source}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, source: v }))
                                }
                                    placeholder={t("wirid_custom.source_example")}
                            />
                            <Field
                                label={
                                    t("wirid_custom.field_note") ??
                                    "Catatan Pribadi"
                                }
                                value={form.note}
                                onChange={(v) =>
                                    setForm((f) => ({ ...f, note: v }))
                                }
                                multiline
                            />
                        </div>

                        <div className='flex justify-end gap-2 mt-5'>
                            <button
                                type='button'
                                onClick={() => setShowModal(false)}
                                className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
                            >
                                {t("common.cancel") ?? "Batal"}
                            </button>
                            <button
                                type='button'
                                onClick={save}
                                disabled={saving || !form.title.trim()}
                                className='px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 transition-colors'
                            >
                                {saving
                                    ? (t("common.saving") ?? "Menyimpan...")
                                    : (t("common.save") ?? "Simpan")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ContentWidth>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    multiline,
    rtl,
    placeholder,
    required,
}) {
    return (
        <div>
            <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                {label}
                {required && <span className='text-red-500 ml-0.5'>*</span>}
            </label>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    dir={rtl ? "rtl" : "ltr"}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${rtl ? "font-arabic text-lg leading-loose" : ""}`}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
            )}
        </div>
    );
}

export default function WiridCustomPage() {
    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <WiridCustomContent />
            </Section>
            <Footer />
        </main>
    );
}
