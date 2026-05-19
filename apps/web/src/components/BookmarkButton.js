'use client';

import { useAuth } from '@/context/Auth';
import { useLocale } from '@/context/Locale';
import { bookmarkApi } from '@/lib/api';
import { buildLoginHref } from '@/lib/authRedirect';
import {
    BOOKMARK_COLORS,
    clearBookmarkMeta,
    colorById,
    getBookmarkMeta,
    setBookmarkMeta,
} from '@/lib/bookmarkLabels';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BsBookmark, BsBookmarkFill, BsCheck2, BsX } from 'react-icons/bs';

const BookmarkButton = ({ refType, refId, refSlug = '', extra = {}, className = '' }) => {
    const { isAuthenticated } = useAuth();
    const { t, lang } = useLocale();
    const router = useRouter();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkId, setBookmarkId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [meta, setMeta] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [labelDraft, setLabelDraft] = useState('');

    useEffect(() => {
        if (!isAuthenticated) return;
        bookmarkApi
            .list()
            .then((r) => r.json())
            .then((data) => {
                const found = (data?.items ?? []).find(
                    (b) =>
                        b.ref_type === refType &&
                        (String(b.ref_id) === String(refId) ||
                            (refSlug && b.ref_slug === refSlug)),
                );
                if (found) {
                    setIsBookmarked(true);
                    setBookmarkId(found.id ?? found._id);
                    // Prefer BE meta (cross-device); fallback to localStorage if BE empty.
                    const beMeta = {
                        color: found.color || undefined,
                        label: found.label || undefined,
                    };
                    const localMeta = getBookmarkMeta(refType, refId);
                    const finalMeta = {
                        color: beMeta.color ?? localMeta?.color,
                        label: beMeta.label ?? localMeta?.label,
                    };
                    setMeta(finalMeta);
                    setLabelDraft(finalMeta.label ?? '');
                }
            })
            .catch(e => console.error(e));
    }, [isAuthenticated, refType, refId, refSlug]);

    const toggleBookmark = async () => {
        if (!isAuthenticated) {
            const currentPath =
                typeof window === 'undefined'
                    ? '/dashboard'
                    : `${window.location.pathname}${window.location.search}`;
            router.push(buildLoginHref(currentPath));
            return;
        }
        setIsLoading(true);
        const prevBookmarked = isBookmarked;
        const prevBookmarkId = bookmarkId;
        try {
            if (isBookmarked) {
                await bookmarkApi.remove(bookmarkId);
                clearBookmarkMeta(refType, refId);
                setIsBookmarked(false);
                setBookmarkId(null);
                setMeta(null);
                setLabelDraft('');
                setShowMenu(false);
            } else {
                const res = await bookmarkApi.add(refType, refId, {
                    ...extra,
                    ...(refSlug ? { ref_slug: refSlug } : {}),
                });
                if (!res.ok) throw new Error('bookmark failed');
                const data = await res.json();
                setIsBookmarked(true);
                setBookmarkId(data.id ?? data._id);
            }
        } catch {
            setIsBookmarked(prevBookmarked);
            setBookmarkId(prevBookmarkId);
        } finally {
            setIsLoading(false);
        }
    };

    const syncMeta = async (patch) => {
        // Optimistic localStorage write — works offline & for not-yet-migrated BE.
        setBookmarkMeta(refType, refId, patch);
        setMeta((prev) => ({ ...(prev ?? {}), ...patch }));
        // Best-effort BE sync.
        if (bookmarkId) {
            try {
                await bookmarkApi.update(bookmarkId, patch);
            } catch {
                // Silently fall back to localStorage.
            }
        }
    };

    const pickColor = (colorId) => {
        syncMeta({ color: colorId });
    };

    const saveLabel = () => {
        const label = labelDraft.trim();
        syncMeta({ label });
        setShowMenu(false);
    };

    const onMainClick = () => {
        if (!isBookmarked) {
            toggleBookmark();
        } else {
            setShowMenu((v) => !v);
        }
    };

    const colorTw = meta?.color ? colorById(meta.color).tw : '';

    return (
        <div className='relative inline-block'>
            <button
                title={isBookmarked ? t('bookmarks.remove') : t('bookmarks.save')}
                onClick={onMainClick}
                disabled={isLoading}
                className={`relative p-2 rounded-lg text-lg transition-colors disabled:opacity-50 ${
                    isBookmarked
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-700'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-slate-700'
                } ${className}`}
            >
                {isBookmarked ? <BsBookmarkFill /> : <BsBookmark />}
                {isBookmarked && meta?.color && (
                    <span
                        className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-slate-800 ${colorTw}`}
                    />
                )}
            </button>

            {showMenu && (
                <div className='absolute z-30 mt-1 left-0 top-full w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3'>
                    <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs font-semibold text-gray-700 dark:text-gray-200'>
                            {t('bookmarks.color') ?? 'Warna'}
                        </p>
                        <button
                            type='button'
                            onClick={() => setShowMenu(false)}
                            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                        >
                            <BsX />
                        </button>
                    </div>
                    <div className='flex flex-wrap gap-1.5 mb-3'>
                        {BOOKMARK_COLORS.map((c) => (
                            <button
                                key={c.id}
                                type='button'
                                onClick={() => pickColor(c.id)}
                                title={lang === 'EN' ? c.label_en : c.label_id}
                                className={`w-7 h-7 rounded-full ${c.tw} flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform`}
                            >
                                {meta?.color === c.id && <BsCheck2 className='text-sm' />}
                            </button>
                        ))}
                    </div>

                    <p className='text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5'>
                        {t('bookmarks.label') ?? 'Label'}
                    </p>
                    <input
                        type='text'
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        placeholder={t('bookmarks.label_placeholder') ?? 'tadabbur, hafalan...'}
                        maxLength={40}
                        className='w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-2'
                    />
                    <div className='flex gap-1.5'>
                        <button
                            type='button'
                            onClick={saveLabel}
                            className='flex-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-colors'
                        >
                            {t('common.save') ?? 'Simpan'}
                        </button>
                        <button
                            type='button'
                            onClick={toggleBookmark}
                            disabled={isLoading}
                            className='px-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40'
                        >
                            {t('bookmarks.remove') ?? 'Hapus'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookmarkButton;
