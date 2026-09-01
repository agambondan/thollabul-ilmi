"use client";

import NoteButton from "@/components/NoteButton";
import Section from "@/components/Section";
import { SkeletonList } from "@/components/skeleton/Skeleton";
import { useAuth } from "@/context/Auth";
import { bookmarkApi, libraryApi, libraryProgressApi } from "@/lib/api";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { BsBookmark, BsBookmarkFill, BsBoxArrowUpRight } from "react-icons/bs";

const normalizeBook = (data) => data?.data ?? data;
const PROGRESS_STATUSES = [
    { value: "planned", label: "Rencana" },
    { value: "reading", label: "Dibaca" },
    { value: "paused", label: "Dijeda" },
    { value: "completed", label: "Selesai" },
];

const formatFileSize = (bytes) => {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return "";
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const metaItems = (book) =>
    [
        book?.author,
        book?.category,
        book?.level,
        book?.language,
        book?.format ? String(book.format).toUpperCase() : "",
        book?.pages ? `${book.pages} halaman` : "",
    ].filter(Boolean);

export const LibraryDetailContent = ({ params, basePath = "/library" }) => {
    const { isWide } = useLayoutMode();
    const { isAuthenticated } = useAuth();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [bookmarkId, setBookmarkId] = useState(null);
    const [progress, setProgress] = useState(null);
    const [progressForm, setProgressForm] = useState({
        current_page: "",
        note: "",
        status: "reading",
    });
    const [savingProgress, setSavingProgress] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        libraryApi
            .detail(params.slug)
            .then((res) => {
                if (!res.ok) throw new Error("failed");
                return res.json();
            })
            .then((data) => {
                if (active) setBook(normalizeBook(data));
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [params.slug]);

    useEffect(() => {
        if (!isAuthenticated || !book?.id) return;
        bookmarkApi
            .list()
            .then((res) => res.json())
            .then((data) => {
                const items = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data)
                      ? data
                      : [];
                const existing = items.find(
                    (item) =>
                        item.ref_type === "library_book" &&
                        String(item.ref_id) === String(book.id),
                );
                if (existing) {
                    setBookmarked(true);
                    setBookmarkId(existing.id);
                }
            })
            .catch((e) => console.error(e));
    }, [book?.id, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || !book?.id) return;
        libraryProgressApi
            .detail(book.id)
            .then((res) => res.json())
            .then((data) => {
                const item = data?.data ?? data;
                if (!item) return;
                setProgress(item);
                setProgressForm({
                    current_page: item.current_page
                        ? String(item.current_page)
                        : "",
                    note: item.note ?? "",
                    status: item.status ?? "reading",
                });
            })
            .catch((e) => console.error(e));
    }, [book?.id, isAuthenticated]);

    const toggleBookmark = async () => {
        if (!isAuthenticated || !book?.id) return;
        if (bookmarked && bookmarkId) {
            setBookmarked(false);
            setBookmarkId(null);
            bookmarkApi.remove(bookmarkId).catch(() => setBookmarked(true));
            return;
        }

        try {
            const res = await bookmarkApi.add("library_book", book.id, {
                label: book.title,
            });
            if (!res.ok) throw new Error("failed");
            const data = await res.json();
            setBookmarked(true);
            setBookmarkId(data?.data?.id ?? data?.id ?? null);
        } catch {}
    };

    const saveProgress = async () => {
        if (!isAuthenticated || !book?.id) return;
        setSavingProgress(true);
        setProgressMessage("");
        try {
            const res = await libraryProgressApi.save(book.id, {
                current_page: Number(progressForm.current_page) || 0,
                note: progressForm.note,
                status: progressForm.status,
            });
            if (!res.ok) throw new Error("failed");
            const data = await res.json();
            setProgress(data?.data ?? data);
            setProgressMessage("Progress belajar disimpan.");
        } catch {
            setProgressMessage("Progress belum bisa disimpan.");
        } finally {
            setSavingProgress(false);
        }
    };

    if (loading) return <SkeletonList title={false} rows={4} />;

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto max-w-4xl px-4"
            }
        >
            <Link
                className='mb-6 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-300'
                href={basePath}
            >
                ← Kembali ke perpustakaan
            </Link>

            {error || !book ? (
                <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
                    Buku tidak ditemukan atau belum bisa dimuat.
                </div>
            ) : (
                <article className='rounded-xl border border-emerald-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                    <div className='p-5 md:p-8'>
                        <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
                            <div>
                                <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'>
                                    {book.category || "Perpustakaan"}
                                </p>
                                <h1 className='mt-2 text-2xl font-bold leading-snug text-emerald-950 dark:text-white md:text-3xl'>
                                    {book.title}
                                </h1>
                            </div>
                            <div className='flex items-center gap-2'>
                                {isAuthenticated && (
                                    <button
                                        className={`rounded-lg p-2 transition ${
                                            bookmarked
                                                ? "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-slate-800"
                                                : "text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800"
                                        }`}
                                        onClick={toggleBookmark}
                                        title={
                                            bookmarked
                                                ? "Hapus bookmark"
                                                : "Simpan bookmark"
                                        }
                                    >
                                        {bookmarked ? (
                                            <BsBookmarkFill />
                                        ) : (
                                            <BsBookmark />
                                        )}
                                    </button>
                                )}
                                <NoteButton
                                    refType='library_book'
                                    refId={book.id}
                                />
                            </div>
                        </div>

                        <div className='mb-6 flex flex-wrap gap-2'>
                            {metaItems(book).map((item) => (
                                <span
                                    className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                    key={item}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>

                        <p className='text-sm leading-7 text-gray-700 dark:text-gray-300'>
                            {book.description}
                        </p>

                        {book.tags && (
                            <p className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
                                Topik: {book.tags}
                            </p>
                        )}

                        <div className='mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-5 dark:border-slate-800'>
                            {book.source_url ? (
                                <a
                                    className='inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800'
                                    href={book.source_url}
                                    rel='noreferrer'
                                    target='_blank'
                                >
                                    Buka resource
                                    <BsBoxArrowUpRight />
                                </a>
                            ) : (
                                <span className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'>
                                    File sumber belum dilampirkan.
                                </span>
                            )}
                            {book.license && (
                                <span className='text-xs leading-5 text-gray-500 dark:text-gray-400'>
                                    {book.license}
                                </span>
                            )}
                            {book.file_name && (
                                <span className='rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-200'>
                                    {book.file_name}
                                    {formatFileSize(book.file_size_bytes)
                                        ? ` · ${formatFileSize(book.file_size_bytes)}`
                                        : ""}
                                </span>
                            )}
                        </div>
                        {((book.license_status &&
                            book.license_status !== "unverified") ||
                            book.is_source_verified ||
                            book.source_note) && (
                            <div className='mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-gray-300'>
                                <div className='flex flex-wrap gap-2'>
                                    {book.license_status &&
                                        book.license_status !==
                                            "unverified" && (
                                            <span className='rounded-full bg-white px-2 py-0.5 font-semibold text-gray-700 dark:bg-slate-900 dark:text-gray-200'>
                                                Lisensi: {book.license_status}
                                            </span>
                                        )}
                                    {book.is_source_verified && (
                                        <span className='rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'>
                                            Sumber terverifikasi
                                        </span>
                                    )}
                                </div>
                                {book.source_note && (
                                    <p className='mt-2 text-gray-500 dark:text-gray-400'>
                                        {book.source_note}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className='mt-8 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/70'>
                            <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                                <div>
                                    <h2 className='text-sm font-bold text-emerald-950 dark:text-white'>
                                        Progress Belajar
                                    </h2>
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {isAuthenticated
                                            ? "Simpan posisi belajar dan catatan ringkas untuk resource ini."
                                            : "Masuk untuk menyimpan progress belajar."}
                                    </p>
                                </div>
                                {progress?.last_studied_at && (
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        {new Date(
                                            progress.last_studied_at,
                                        ).toLocaleDateString("id-ID")}
                                    </span>
                                )}
                            </div>
                            {isAuthenticated ? (
                                <div className='grid gap-3 md:grid-cols-[160px_1fr]'>
                                    <div>
                                        <label
                                            htmlFor='page-status'
                                            className='mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300'
                                        >
                                            Status
                                        </label>
                                        <select
                                            id='page-status'
                                            className='w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100'
                                            onChange={(event) =>
                                                setProgressForm((current) => ({
                                                    ...current,
                                                    status: event.target.value,
                                                }))
                                            }
                                            value={progressForm.status}
                                        >
                                            {PROGRESS_STATUSES.map((item) => (
                                                <option
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            htmlFor='page-halaman-terakhir'
                                            className='mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300'
                                        >
                                            Halaman terakhir
                                        </label>
                                        <input
                                            id='page-halaman-terakhir'
                                            className='w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100'
                                            min='0'
                                            onChange={(event) =>
                                                setProgressForm((current) => ({
                                                    ...current,
                                                    current_page:
                                                        event.target.value,
                                                }))
                                            }
                                            placeholder={
                                                book.pages
                                                    ? `0-${book.pages}`
                                                    : "0"
                                            }
                                            type='number'
                                            value={progressForm.current_page}
                                        />
                                    </div>
                                    <div className='md:col-span-2'>
                                        <label
                                            htmlFor='page-catatan-ringkas'
                                            className='mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300'
                                        >
                                            Catatan ringkas
                                        </label>
                                        <textarea
                                            id='page-catatan-ringkas'
                                            className='w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100'
                                            onChange={(event) =>
                                                setProgressForm((current) => ({
                                                    ...current,
                                                    note: event.target.value,
                                                }))
                                            }
                                            rows={3}
                                            value={progressForm.note}
                                        />
                                    </div>
                                    <div className='flex items-center gap-3 md:col-span-2'>
                                        <button
                                            className='rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50'
                                            disabled={savingProgress}
                                            onClick={saveProgress}
                                        >
                                            {savingProgress
                                                ? "Menyimpan..."
                                                : "Simpan progress"}
                                        </button>
                                        {progressMessage && (
                                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                {progressMessage}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </article>
            )}
        </div>
    );
};

const LibraryDetailPage = ({ params }) => {
    const resolvedParams = use(params);
    return (
        <main className='flex min-h-screen flex-col'>
            <Section>
                <LibraryDetailContent
                    params={resolvedParams}
                    basePath='/library'
                />
            </Section>
        </main>
    );
};

export default LibraryDetailPage;
