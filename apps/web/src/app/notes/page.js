"use client";

import Footer from "@/components/Footer";
import ContentWidth from "@/components/layout/ContentWidth";
import { NavbarTailwindCss } from "@/components/Navbar";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { notesApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BsPencil, BsPlus, BsSearch, BsTrash, BsX } from "react-icons/bs";
import { MdOutlineStickyNote2 } from "react-icons/md";

const LOCAL_KEY = "tholabul_notes";

const loadLocal = () => {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    } catch {
        return [];
    }
};

const saveLocal = (notes) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
};

const genId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2);

const COLORS = [
    "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-700/40",
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-700/40",
    "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-700/40",
    "bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-700/40",
    "bg-pink-50 border-pink-200 dark:bg-pink-900/10 dark:border-pink-700/40",
    "bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-700/40",
];

export default function NotesPage() {
    const { lang, t } = useLocale();
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState(null); // null | { id, title, body, color }
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [backendAvail, setBackendAvail] = useState(true);
    const bodyRef = useRef(null);

    const isNew = editing?.id === "__new__";

    useEffect(() => {
        if (!user) return;
        // Try backend first, fall back to localStorage
        notesApi
            .list()
            .then((r) => r.json())
            .then((data) => {
                const items = data?.items ?? data ?? [];
                setNotes(items);
                setBackendAvail(true);
            })
            .catch(() => {
                setBackendAvail(false);
                setNotes(loadLocal());
            });
    }, [user]);

    const openNew = () => {
        setEditing({ id: "__new__", title: "", body: "", color: 0 });
        setTimeout(() => bodyRef.current?.focus(), 50);
    };

    const openEdit = (note) => {
        setEditing({ ...note });
    };

    const closeEdit = () => setEditing(null);

    const handleSave = async () => {
        if (!editing.body.trim() && !editing.title.trim()) {
            closeEdit();
            return;
        }
        setSaving(true);
        try {
            if (backendAvail && user) {
                if (isNew) {
                    const r = await notesApi.create({
                        title: editing.title,
                        body: editing.body,
                        color: editing.color,
                    });
                    const saved = await r.json();
                    setNotes((prev) => [saved, ...prev]);
                } else {
                    const r = await notesApi.update(editing.id, {
                        title: editing.title,
                        body: editing.body,
                        color: editing.color,
                    });
                    const updated = await r.json();
                    setNotes((prev) =>
                        prev.map((n) => (n.id === editing.id ? updated : n)),
                    );
                }
            } else {
                // localStorage fallback
                if (isNew) {
                    const newNote = {
                        id: genId(),
                        title: editing.title,
                        body: editing.body,
                        color: editing.color,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    const updated = [newNote, ...notes];
                    setNotes(updated);
                    saveLocal(updated);
                } else {
                    const updated = notes.map((n) =>
                        n.id === editing.id
                            ? {
                                  ...n,
                                  title: editing.title,
                                  body: editing.body,
                                  color: editing.color,
                                  updated_at: new Date().toISOString(),
                              }
                            : n,
                    );
                    setNotes(updated);
                    saveLocal(updated);
                }
            }
            closeEdit();
        } catch {
            // fallback to local on backend error
            if (isNew) {
                const newNote = {
                    id: genId(),
                    title: editing.title,
                    body: editing.body,
                    color: editing.color,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                const updated = [newNote, ...notes];
                setNotes(updated);
                saveLocal(updated);
            }
            closeEdit();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            if (backendAvail && user) {
                await notesApi.delete(id);
            }
            const updated = notes.filter((n) => n.id !== id);
            setNotes(updated);
            if (!backendAvail) saveLocal(updated);
        } catch {
            const updated = notes.filter((n) => n.id !== id);
            setNotes(updated);
            saveLocal(updated);
        } finally {
            setDeleting(null);
        }
    };

    const filtered = notes.filter(
        (n) =>
            n.title?.toLowerCase().includes(search.toLowerCase()) ||
            n.body?.toLowerCase().includes(search.toLowerCase()),
    );

    if (!user) {
        return (
            <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
                <NavbarTailwindCss />
                <ContentWidth
                    compact='max-w-xl'
                    className='flex-1 px-4 pt-24 pb-8 text-center'
                >
                    <MdOutlineStickyNote2 className='text-6xl text-emerald-400 mx-auto mb-4' />
                    <h1 className='text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-3'>
                        {t("notes.private_title")}
                    </h1>
                    <p className='text-gray-500 dark:text-gray-400 mb-6 text-sm'>
                        {t("notes.login_desc")}
                    </p>
                    <Link
                        href='/auth/login'
                        className='bg-emerald-600 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-700 transition-colors'
                    >
                        {t("nav.login")}
                    </Link>
                </ContentWidth>
                <Footer />
            </main>
        );
    }

    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <NavbarTailwindCss />
            <ContentWidth
                compact='max-w-3xl'
                className='flex-1 px-4 pt-24 pb-8'
            >
                {/* Header */}
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center'>
                            <MdOutlineStickyNote2 className='text-2xl text-amber-600 dark:text-amber-400' />
                        </div>
                        <div>
                            <h1 className='text-2xl font-extrabold text-emerald-900 dark:text-emerald-100'>
                                {t("notes.title")}
                            </h1>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                {notes.length} {t("notes.unit")}
                                {!backendAvail &&
                                    ` • ${t("notes.local_saved")}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openNew}
                        className='flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm'
                    >
                        <BsPlus className='text-lg' /> {t("common.add")}
                    </button>
                </div>

                {/* Search */}
                {notes.length > 0 && (
                    <div className='relative mb-6'>
                        <BsSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("notes.search_placeholder")}
                            className='w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                        />
                    </div>
                )}

                {/* Notes grid */}
                {filtered.length === 0 && notes.length === 0 && (
                    <div className='text-center py-16'>
                        <MdOutlineStickyNote2 className='text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                        <p className='text-gray-500 dark:text-gray-400 font-semibold mb-2'>
                            {t("notes.empty")}
                        </p>
                        <p className='text-sm text-gray-400 mb-4'>
                            {t("notes.empty_hint2")}
                        </p>
                        <button
                            onClick={openNew}
                            className='bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors'
                        >
                            {t("notes.first_btn")}
                        </button>
                    </div>
                )}

                <div className='columns-1 sm:columns-2 lg:columns-3 gap-4'>
                    {filtered.map((note) => (
                        <div
                            key={note.id}
                            className={`break-inside-avoid mb-4 rounded-2xl border p-4 shadow-sm ${COLORS[note.color ?? 0]}`}
                        >
                            {note.title && (
                                <p className='font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2'>
                                    {note.title}
                                </p>
                            )}
                            <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6'>
                                {note.body}
                            </p>
                            <div className='flex items-center justify-between mt-3'>
                                <p className='text-[10px] text-gray-400'>
                                    {new Date(
                                        note.updated_at ?? note.created_at,
                                    ).toLocaleDateString(
                                        lang === "EN" ? "en-US" : "id-ID",
                                    )}
                                </p>
                                <div className='flex gap-1'>
                                    <button
                                        onClick={() => openEdit(note)}
                                        className='w-7 h-7 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors'
                                    >
                                        <BsPencil className='text-xs' />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        disabled={deleting === note.id}
                                        className='w-7 h-7 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors'
                                    >
                                        <BsTrash className='text-xs' />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ContentWidth>

            {/* Edit modal */}
            {editing && (
                <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 py-6'>
                    <div className='w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='font-extrabold text-gray-900 dark:text-white'>
                                {isNew ? t("notes.new") : t("notes.edit")}
                            </h2>
                            <button
                                onClick={closeEdit}
                                className='w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600'
                            >
                                <BsX />
                            </button>
                        </div>

                        {/* Color picker */}
                        <div className='flex gap-2 mb-3'>
                            {COLORS.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() =>
                                        setEditing((e) => ({ ...e, color: i }))
                                    }
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${c.split(" ")[0].replace("border-", "bg-").replace("/10", "")} ${editing.color === i ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
                                />
                            ))}
                        </div>

                        <input
                            type='text'
                            value={editing.title}
                            onChange={(e) =>
                                setEditing((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            placeholder={t("notes.title_placeholder")}
                            className='w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-3'
                        />
                        <textarea
                            ref={bodyRef}
                            value={editing.body}
                            onChange={(e) =>
                                setEditing((prev) => ({
                                    ...prev,
                                    body: e.target.value,
                                }))
                            }
                            placeholder={t("notes.body_placeholder")}
                            rows={6}
                            className='w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none mb-4'
                        />
                        <div className='flex gap-3'>
                            <button
                                onClick={closeEdit}
                                className='flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className='flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors'
                            >
                                {saving ? t("common.saving") : t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
