"use client";

import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useAuth } from "@/context/Auth";
import { libraryApi, libraryProgressApi } from "@/lib/api";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BsBook, BsBoxArrowUpRight, BsSearch } from "react-icons/bs";

const PAGE_SIZE = 24;

const normalizeItems = (data) => {
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

const hasMorePages = (data, itemCount) => {
    const page = data?.data ?? data;
    if (typeof page?.last === "boolean") return !page.last;
    if (typeof page?.has_more === "boolean") return page.has_more;
    if (typeof page?.hasMore === "boolean") return page.hasMore;
    const currentPage = Number(page?.page ?? 0);
    const totalPages = Number(
        page?.total_pages ?? page?.totalPages ?? page?.max_page ?? 0,
    );
    if (totalPages > 0) return currentPage + 1 < totalPages;
    return itemCount >= PAGE_SIZE;
};

const normalizeProgressItems = (data) => {
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
};

const PROGRESS_LABELS = {
    planned: "Rencana",
    reading: "Dibaca",
    paused: "Dijeda",
    completed: "Selesai",
};

const PROGRESS_FILTERS = [
    { value: "planned", label: "Rencana" },
    { value: "reading", label: "Dibaca" },
    { value: "paused", label: "Dijeda" },
    { value: "completed", label: "Selesai" },
];

const uniqueValues = (items, key) =>
    Array.from(
        new Set(items.map((item) => item?.[key]).filter(Boolean)),
    ).sort();

const BookMeta = ({ book }) => (
    <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
        {book.author && <span>{book.author}</span>}
        {book.category && <span>{book.category}</span>}
        {book.level && <span>{book.level}</span>}
        {book.format && <span className='uppercase'>{book.format}</span>}
    </div>
);

export const LibraryContent = ({
    basePath = "/library",
    showProgressSummary = false,
}) => {
    const { isWide } = useLayoutMode();
    const { isAuthenticated } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [level, setLevel] = useState("");
    const [progressStatus, setProgressStatus] = useState("");
    const [progressItems, setProgressItems] = useState([]);
    const [progressLoading, setProgressLoading] = useState(false);

    const fetchBooks = (pageNumber, append = false) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(false);
        libraryApi
            .list({ page: pageNumber, size: PAGE_SIZE })
            .then((res) => {
                if (!res.ok) throw new Error("failed");
                return res.json();
            })
            .then((data) => {
                const items = normalizeItems(data);
                setBooks((current) => {
                    if (!append) return items;
                    const seen = new Set(
                        current.map((book) => String(book.id ?? book.slug)),
                    );
                    return [
                        ...current,
                        ...items.filter((book) => {
                            const key = String(book.id ?? book.slug);
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        }),
                    ];
                });
                setHasMore(hasMorePages(data, items.length));
                setPage(pageNumber);
            })
            .catch(() => {
                if (!append) setBooks([]);
                setError(true);
                setHasMore(false);
            })
            .finally(() => {
                if (append) setLoadingMore(false);
                else setLoading(false);
            });
    };

    useEffect(() => {
        fetchBooks(0, false);
    }, []);

    useEffect(() => {
        if (!showProgressSummary || !isAuthenticated) {
            setProgressItems([]);
            return;
        }

        let active = true;
        setProgressLoading(true);
        libraryProgressApi
            .list()
            .then((res) => {
                if (!res.ok) throw new Error("failed");
                return res.json();
            })
            .then((data) => {
                if (active) setProgressItems(normalizeProgressItems(data));
            })
            .catch(() => {
                if (active) setProgressItems([]);
            })
            .finally(() => {
                if (active) setProgressLoading(false);
            });

        return () => {
            active = false;
        };
    }, [isAuthenticated, showProgressSummary]);

    const categories = useMemo(() => uniqueValues(books, "category"), [books]);
    const levels = useMemo(() => uniqueValues(books, "level"), [books]);
    const progressByBookId = useMemo(() => {
        const next = {};
        progressItems.forEach((progress) => {
            const bookId =
                progress?.library_book_id ??
                progress?.book?.id ??
                progress?.Book?.id;
            if (bookId) next[String(bookId)] = progress;
        });
        return next;
    }, [progressItems]);
    const filteredBooks = useMemo(() => {
        const query = search.trim().toLowerCase();
        return books.filter((book) => {
            const progress = progressByBookId[String(book.id)];
            const text = [
                book.title,
                book.author,
                book.description,
                book.tags,
                book.category,
                book.level,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            const matchesSearch = !query || text.includes(query);
            const matchesCategory = !category || book.category === category;
            const matchesLevel = !level || book.level === level;
            const matchesProgress =
                !progressStatus || progress?.status === progressStatus;
            return (
                matchesSearch &&
                matchesCategory &&
                matchesLevel &&
                matchesProgress
            );
        });
    }, [books, category, level, progressByBookId, progressStatus, search]);

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto max-w-5xl px-4"
            }
        >
            <div className='mb-8'>
                <p className='text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'>
                    Belajar
                </p>
                <h1 className='mt-1 text-2xl font-bold text-emerald-950 dark:text-white'>
                    Perpustakaan Ilmu
                </h1>
                <p className='mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300'>
                    Katalog kitab dan bahan belajar yang bisa dibaca dari sumber
                    resmi, disimpan, dan diberi catatan belajar.
                </p>
            </div>

            {showProgressSummary && isAuthenticated && (
                <section className='mb-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-slate-800 dark:bg-slate-900'>
                    <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                        <div>
                            <h2 className='text-sm font-bold text-emerald-950 dark:text-white'>
                                Progress Saya
                            </h2>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                Lanjutkan resource yang sedang dipelajari dari
                                dashboard.
                            </p>
                        </div>
                        <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-slate-800 dark:text-emerald-200'>
                            {progressItems.length} resource
                        </span>
                    </div>
                    {progressLoading ? (
                        <SkeletonInline rows={2} />
                    ) : progressItems.length ? (
                        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                            {progressItems.slice(0, 6).map((progress) => {
                                const book = progress.book ?? progress.Book;
                                if (!book?.slug) return null;
                                return (
                                    <Link
                                        className='rounded-lg border border-emerald-100 bg-white p-3 text-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950'
                                        href={`${basePath}/${book.slug}`}
                                        key={
                                            progress.id ??
                                            `${progress.library_book_id}-${progress.status}`
                                        }
                                    >
                                        <div className='mb-2 flex items-center justify-between gap-2'>
                                            <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'>
                                                {PROGRESS_LABELS[
                                                    progress.status
                                                ] ??
                                                    progress.status ??
                                                    "Dibaca"}
                                            </span>
                                            {progress.current_page ? (
                                                <span className='text-[11px] text-gray-500 dark:text-gray-400'>
                                                    Hal. {progress.current_page}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className='line-clamp-2 font-semibold text-emerald-950 dark:text-white'>
                                            {book.title}
                                        </p>
                                        {progress.note ? (
                                            <p className='mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400'>
                                                {progress.note}
                                            </p>
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className='rounded-lg border border-dashed border-emerald-200 bg-white px-3 py-4 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-950 dark:text-gray-400'>
                            Belum ada progress. Buka detail buku lalu simpan
                            status belajar.
                        </p>
                    )}
                </section>
            )}

            <div
                className={`mb-5 grid gap-3 ${
                    showProgressSummary && isAuthenticated
                        ? "md:grid-cols-[1fr_auto_auto_auto]"
                        : "md:grid-cols-[1fr_auto_auto]"
                }`}
            >
                <div className='flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900'>
                    <BsSearch className='shrink-0 text-gray-400' />
                    <input
                        className='w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100'
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder='Cari judul, penulis, atau topik'
                        value={search}
                    />
                </div>
                <select
                    className='rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100'
                    onChange={(event) => setCategory(event.target.value)}
                    value={category}
                >
                    <option value=''>Semua kategori</option>
                    {categories.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
                <select
                    className='rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100'
                    onChange={(event) => setLevel(event.target.value)}
                    value={level}
                >
                    <option value=''>Semua level</option>
                    {levels.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
                {showProgressSummary && isAuthenticated && (
                    <select
                        className='rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100'
                        onChange={(event) =>
                            setProgressStatus(event.target.value)
                        }
                        value={progressStatus}
                    >
                        <option value=''>Semua progress</option>
                        {PROGRESS_FILTERS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {loading && <SkeletonInline rows={4} />}

            {error && !loading && (
                <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
                    Perpustakaan belum bisa dimuat. Coba refresh halaman.
                </div>
            )}

            {!error && !loading && filteredBooks.length === 0 && (
                <div className='rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900'>
                    <BsBook className='mx-auto mb-3 text-3xl text-emerald-700 dark:text-emerald-300' />
                    <p className='text-sm font-semibold text-gray-800 dark:text-gray-100'>
                        Belum ada buku yang cocok.
                    </p>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                        Ubah pencarian atau filter kategori.
                    </p>
                </div>
            )}

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {filteredBooks.map((book) => {
                    const progress = progressByBookId[String(book.id)];
                    return (
                        <Link
                            className='group flex h-full flex-col rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700'
                            href={`${basePath}/${book.slug}`}
                            key={book.id ?? book.slug}
                        >
                            <div className='mb-4 flex items-start justify-between gap-3'>
                                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
                                    <BsBook />
                                </div>
                                {book.source_url && (
                                    <BsBoxArrowUpRight className='mt-1 text-gray-300 transition group-hover:text-emerald-600 dark:text-slate-600 dark:group-hover:text-emerald-300' />
                                )}
                            </div>
                            {showProgressSummary &&
                                isAuthenticated &&
                                progress && (
                                    <div className='mb-3 flex flex-wrap items-center gap-2'>
                                        <span className='rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'>
                                            {PROGRESS_LABELS[progress.status] ??
                                                progress.status ??
                                                "Dibaca"}
                                        </span>
                                        {progress.current_page ? (
                                            <span className='text-[11px] font-medium text-gray-500 dark:text-gray-400'>
                                                Hal. {progress.current_page}
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            <h2 className='text-base font-bold leading-snug text-emerald-950 dark:text-white'>
                                {book.title}
                            </h2>
                            <p className='mt-2 line-clamp-3 flex-1 text-sm leading-6 text-gray-600 dark:text-gray-300'>
                                {book.description}
                            </p>
                            <div className='mt-4 border-t border-gray-100 pt-3 dark:border-slate-800'>
                                <BookMeta book={book} />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {hasMore && !loading && !error && (
                <div className='mt-6 flex justify-center'>
                    <button
                        className='rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-200 dark:hover:border-emerald-700 dark:hover:bg-slate-800'
                        disabled={loadingMore}
                        onClick={() => fetchBooks(page + 1, true)}
                        type='button'
                    >
                        {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                    </button>
                </div>
            )}
        </div>
    );
};

const LibraryPage = () => (
    <main className='flex min-h-screen flex-col'>
        <NavbarTailwindCss />
        <Section>
            <LibraryContent basePath='/library' />
        </Section>
        <Footer />
    </main>
);

export default LibraryPage;
