"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { notesApi } from "@/lib/api";
import { buildLoginHref } from "@/lib/authRedirect";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    BsSticky,
    BsStickyFill,
    BsTrash,
    BsX,
    BsTypeBold,
    BsTypeItalic,
    BsListUl,
} from "react-icons/bs";
import { useModalA11y } from "@/lib/useModalA11y";

let noteListCache = null;
let noteListPromise = null;

const resetNoteListCache = () => {
    noteListCache = null;
    noteListPromise = null;
};

const loadNoteList = () => {
    if (noteListCache) return Promise.resolve(noteListCache);
    if (noteListPromise) return noteListPromise;

    noteListPromise = notesApi
        .list()
        .then((r) => r.json())
        .then((data) => {
            const items = data?.items ?? data ?? [];
            noteListCache = Array.isArray(items) ? items : [];
            return noteListCache;
        })
        .finally(() => {
            noteListPromise = null;
        });

    return noteListPromise;
};

const NoteButton = ({ refType, refId, className = "" }) => {
    const { isAuthenticated } = useAuth();
    const { t } = useLocale();
    const router = useRouter();
    const [note, setNote] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const textareaRef = useRef(null);
    const modalA11y = useModalA11y({
        open: showModal,
        onClose: () => setShowModal(false),
    });

    const insertFormat = (prefix, suffix = "") => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = content.substring(start, end);
        const before = content.substring(0, start);
        const after = content.substring(end);
        const formatted = prefix + selected + suffix;
        setContent(before + formatted + after);
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(
                start + prefix.length,
                start + formatted.length,
            );
        }, 0);
    };

    useEffect(() => {
        if (!isAuthenticated || !refId) return;
        let isActive = true;
        loadNoteList()
            .then((items) => {
                if (!isActive) return;
                const found = items.find(
                    (n) =>
                        n.ref_type === refType &&
                        String(n.ref_id) === String(refId),
                );
                if (found) {
                    setNote(found);
                    setContent(found.content ?? "");
                }
            })
            .catch((e) => console.error(e));
        return () => {
            isActive = false;
        };
    }, [isAuthenticated, refType, refId]);

    const openModal = () => {
        if (!isAuthenticated) {
            const currentPath =
                typeof window === "undefined"
                    ? "/dashboard"
                    : `${window.location.pathname}${window.location.search}`;
            router.push(buildLoginHref(currentPath));
            return;
        }
        setContent(note?.content ?? "");
        setShowModal(true);
    };

    const save = async () => {
        if (!content.trim()) return;
        setSaving(true);
        try {
            if (note) {
                const res = await notesApi.update(note.id ?? note._id, {
                    content: content.trim(),
                });
                if (!res.ok) throw new Error("update failed");
                const data = await res.json();
                resetNoteListCache();
                setNote({
                    ...(note ?? {}),
                    ...(data ?? {}),
                    content: content.trim(),
                });
            } else {
                const res = await notesApi.create({
                    ref_type: refType,
                    ref_id: Number(refId),
                    content: content.trim(),
                });
                if (!res.ok) throw new Error("create failed");
                const data = await res.json();
                resetNoteListCache();
                setNote(data ?? { content: content.trim() });
            }
            setShowModal(false);
        } catch {
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!note) return;
        setSaving(true);
        try {
            const res = await notesApi.delete(note.id ?? note._id);
            if (!res.ok) throw new Error("delete failed");
            resetNoteListCache();
            setNote(null);
            setContent("");
            setShowModal(false);
        } catch {
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <button
                title={
                    note
                        ? (t("notes.edit") ?? "Edit Catatan")
                        : (t("notes.add") ?? "Tambah Catatan")
                }
                onClick={openModal}
                className={`p-2 rounded-lg text-lg transition-colors ${
                    note
                        ? "text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700"
                        : "text-gray-400 hover:bg-emerald-100 dark:hover:bg-slate-700"
                } ${className}`}
            >
                {note ? <BsStickyFill /> : <BsSticky />}
            </button>

            {showModal && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    onClick={(e) =>
                        e.target === e.currentTarget && setShowModal(false)
                    }
                >
                    <div {...modalA11y} className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                                {note
                                    ? (t("notes.edit") ?? "Edit Catatan")
                                    : (t("notes.add") ?? "Tambah Catatan")}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>
                        <div className='flex items-center gap-1 mb-2 border-b border-gray-100 dark:border-slate-700 pb-2'>
                            <button
                                type='button'
                                title={t("notes.bold") ?? "Tebal"}
                                onClick={() => insertFormat("**", "**")}
                                className='p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsTypeBold />
                            </button>
                            <button
                                type='button'
                                title={t("notes.italic") ?? "Miring"}
                                onClick={() => insertFormat("*", "*")}
                                className='p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsTypeItalic />
                            </button>
                            <button
                                type='button'
                                title={t("notes.list") ?? "Daftar"}
                                onClick={() => insertFormat("\n- ")}
                                className='p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsListUl />
                            </button>
                            <span className='text-[10px] text-gray-400 dark:text-gray-600 ml-auto'>
                                Markdown
                            </span>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            placeholder={
                                t("notes.content_placeholder") ??
                                "Tulis catatan tadabbur Anda..."
                            }
                            autoFocus
                            className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
                        />
                        <div className='flex justify-between items-center mt-4'>
                            {note ? (
                                <button
                                    type='button'
                                    onClick={remove}
                                    disabled={saving}
                                    className='flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40'
                                >
                                    <BsTrash />
                                    {t("common.delete") ?? "Hapus"}
                                </button>
                            ) : (
                                <span />
                            )}
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
                                >
                                    {t("common.cancel") ?? "Batal"}
                                </button>
                                <button
                                    onClick={save}
                                    disabled={saving || !content.trim()}
                                    className='px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 transition-colors'
                                >
                                    {saving
                                        ? (t("common.saving") ?? "Menyimpan...")
                                        : (t("common.save") ?? "Simpan")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NoteButton;
