"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { notesApi } from "@/lib/api";
import {
    encodePersonalNoteContent,
    normalizePersonalNote,
    parseApiJson,
    pickItems,
    PERSONAL_NOTE_REF_ID,
    PERSONAL_NOTE_REF_TYPE,
    readLocalArray,
    todayISO,
    writeLocalArray,
} from "@/lib/personalSync";
import { useEffect, useState } from "react";
import { BsPencilSquare, BsTrash, BsX } from "react-icons/bs";

const renderMarkdownInline = (text) => {
    if (!text) return "";
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/\n/g, "<br/>");
    if (html.includes("<li>")) {
        html = '<ul class="list-disc list-inside">' + html + "</ul>";
    }
    return html;
};

const NotesPage = () => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editNote, setEditNote] = useState(null);
    const [form, setForm] = useState({ title: "", content: "", tags: "" });
    const [syncError, setSyncError] = useState("");

    useEffect(() => {
        const load = async () => {
            if (isAuthenticated) {
                try {
                    const items = pickItems(
                        await parseApiJson(
                            await notesApi.list({
                                refId: PERSONAL_NOTE_REF_ID,
                                refType: PERSONAL_NOTE_REF_TYPE,
                            }),
                        ),
                    ).map(normalizePersonalNote);
                    setNotes(items);
                    writeLocalArray("tholabul_notes", items);
                    setSyncError("");
                    return;
                } catch {
                    setSyncError(
                        "Belum tersinkron. Menampilkan salinan lokal.",
                    );
                }
            }
            setNotes(
                readLocalArray("tholabul_notes").map(normalizePersonalNote),
            );
        };
        load();
    }, [isAuthenticated]);

    const persist = (updated) => {
        setNotes(updated);
        writeLocalArray("tholabul_notes", updated);
    };

    const openAdd = () => {
        setEditNote(null);
        setForm({ title: "", content: "", tags: "" });
        setShowModal(true);
    };

    const openEdit = (note) => {
        setEditNote(note);
        setForm({
            title: note.title,
            content: note.content,
            tags: (note.tags ?? []).join(", "),
        });
        setShowModal(true);
    };

    const save = async () => {
        if (!form.title.trim()) return;
        const tags = form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        if (editNote) {
            const payload = { title: form.title, content: form.content, tags };
            persist(
                notes.map((n) =>
                    n.id === editNote.id ? { ...n, ...payload } : n,
                ),
            );
            if (isAuthenticated) {
                try {
                    const saved = normalizePersonalNote(
                        await parseApiJson(
                            await notesApi.update(editNote.id, {
                                content: encodePersonalNoteContent(payload),
                            }),
                        ),
                    );
                    persist(
                        notes.map((n) => (n.id === editNote.id ? saved : n)),
                    );
                    setSyncError("");
                    fb("admin:success", t("admin.crud.save_success"));
                } catch {
                    setSyncError(
                        "Catatan tersimpan lokal. Sinkron cloud belum berhasil.",
                    );
                }
            }
        } else {
            const entry = {
                id: Date.now().toString(),
                title: form.title,
                content: form.content,
                tags,
                date: todayISO(),
            };
            persist([entry, ...notes]);
            if (isAuthenticated) {
                try {
                    const saved = normalizePersonalNote(
                        await parseApiJson(
                            await notesApi.create({
                                content: encodePersonalNoteContent(entry),
                                ref_id: PERSONAL_NOTE_REF_ID,
                                ref_type: PERSONAL_NOTE_REF_TYPE,
                            }),
                        ),
                    );
                    persist([saved, ...notes]);
                    setSyncError("");
                    fb("admin:success", t("admin.crud.save_success"));
                } catch {
                    setSyncError(
                        "Catatan tersimpan lokal. Sinkron cloud belum berhasil.",
                    );
                }
            }
        }
        setShowModal(false);
    };

    const remove = async (id) => {
        if (!confirm(t("notes.delete_confirm"))) return;
        persist(notes.filter((n) => n.id !== id));
        if (isAuthenticated) {
            try {
                await parseApiJson(await notesApi.delete(id));
                setSyncError("");
                fb("admin:success", t("admin.crud.delete_success"));
            } catch {
                setSyncError(
                    "Catatan dihapus lokal. Sinkron cloud belum berhasil.",
                );
            }
        }
    };

    const filtered = notes.filter(
        (n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            (n.content ?? "").toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className='px-4 py-6'>
            <div className='flex items-center justify-between mb-4'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t("notes.title")}
                </h1>
                <button
                    onClick={openAdd}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    <BsPencilSquare />
                    {t("notes.add")}
                </button>
            </div>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}

            {/* Search */}
            <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("notes.search_placeholder")}
                className='w-full px-4 py-2.5 mb-5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
            />

            {filtered.length === 0 ? (
                <div className='text-center py-16'>
                    <p className='text-4xl mb-3'>📝</p>
                    <p className='text-gray-500 dark:text-gray-400 text-sm'>
                        {search ? t("notes.empty_search") : t("notes.empty")}
                    </p>
                    {!search && (
                        <button
                            onClick={openAdd}
                            className='mt-4 text-emerald-600 dark:text-emerald-400 text-sm hover:underline'
                        >
                            {t("notes.add_first")}
                        </button>
                    )}
                </div>
            ) : (
                <ul className='space-y-3'>
                    {filtered.map((note) => (
                        <li
                            key={note.id}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors cursor-pointer'
                            onClick={() => openEdit(note)}
                        >
                            <div className='flex items-start justify-between gap-2'>
                                <div className='min-w-0'>
                                    <p className='text-sm font-bold text-gray-800 dark:text-white truncate'>
                                        {note.title}
                                    </p>
                                    <p className='text-xs text-gray-400 mt-0.5'>
                                        {note.date
                                            ? new Date(
                                                  note.date + "T00:00:00",
                                              ).toLocaleDateString(
                                                  lang === "EN"
                                                      ? "en-US"
                                                      : "id-ID",
                                                  {
                                                      day: "numeric",
                                                      month: "short",
                                                      year: "numeric",
                                                  },
                                              )
                                            : ""}
                                    </p>
                                    {note.content && (
                                        <div
                                            className='text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed'
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    note.content.length > 100
                                                        ? renderMarkdownInline(
                                                              note.content.slice(
                                                                  0,
                                                                  100,
                                                              ),
                                                          ) + "..."
                                                        : renderMarkdownInline(
                                                              note.content,
                                                          ),
                                            }}
                                        />
                                    )}
                                    {(note.tags ?? []).length > 0 && (
                                        <div className='flex flex-wrap gap-1 mt-2'>
                                            {note.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className='px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-full text-[11px]'
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        remove(note.id);
                                    }}
                                    aria-label={t("notes.delete")}
                                    className='text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors shrink-0'
                                >
                                    <BsTrash />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
                    onClick={(e) =>
                        e.target === e.currentTarget && setShowModal(false)
                    }
                >
                    <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                                {editNote ? t("notes.edit") : t("notes.add")}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>

                        <div className='space-y-3'>
                            <div>
                                <label htmlFor='page-label-title' className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                    {t("notes.label_title")}
                                </label>
                                <input
                                    id='page-label-title'
                                    type='text'
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder={t("notes.title_placeholder")}
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                            <div>
                                <label htmlFor='page-label-content' className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                    {t("notes.label_content")}
                                </label>
                                <textarea
                                    id='page-label-content'
                                    value={form.content}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            content: e.target.value,
                                        }))
                                    }
                                    rows={5}
                                    placeholder={t("notes.content_placeholder")}
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
                                />
                            </div>
                            <div>
                                <label htmlFor='page-label-tags' className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                    {t("notes.label_tags")}
                                </label>
                                <input
                                    id='page-label-tags'
                                    type='text'
                                    value={form.tags}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            tags: e.target.value,
                                        }))
                                    }
                                    placeholder={t("notes.search_example")}
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                        </div>

                        <div className='flex justify-end gap-2 mt-5'>
                            <button
                                onClick={() => setShowModal(false)}
                                className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={save}
                                disabled={!form.title.trim()}
                                className='px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                            >
                                {t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesPage;
