'use client';

import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BsChatDots, BsStarFill, BsBook, BsChatLeftDots, BsNewspaper } from 'react-icons/bs';
import ChatBox from './_components/ChatBox';
import { blogApi, forumApi, leaderboardApi } from '@/lib/api';

const pickItems = (payload) => {
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
};

const getAuthorName = (author) => {
    if (!author) return '';
    if (typeof author === 'string') return author;
    return author.name ?? '';
};

const formatRelative = (iso) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const day = 1000 * 60 * 60 * 24;
    if (diff < day) return 'Hari ini';
    if (diff < day * 2) return 'Kemarin';
    if (diff < day * 7) return `${Math.floor(diff / day)} hari lalu`;
    if (diff < day * 30) return `${Math.floor(diff / (day * 7))} minggu lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export default function KomunitasPage() {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [blogPosts, setBlogPosts] = useState([]);
    const [topForum, setTopForum] = useState([]);
    const [hallOfFame, setHallOfFame] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const fetchBlog = async () => {
            try {
                const res = await blogApi.list(0, 3);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setBlogPosts(pickItems(data).slice(0, 3));
            } catch {}
        };

        const fetchForum = async () => {
            try {
                const res = await forumApi.list({ page: 0, size: 50, sort: 'top' });
                if (!res.ok) return;
                const data = await res.json();
                const items = pickItems(data);
                const sorted = [...items].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
                if (!cancelled) setTopForum(sorted.slice(0, 3));
            } catch {}
        };

        const fetchLeaderboard = async () => {
            try {
                const res = await leaderboardApi.hafalan();
                if (!res.ok) return;
                const data = await res.json();
                const items = pickItems(data);
                if (!cancelled) setHallOfFame(items.slice(0, 3));
            } catch {}
        };

        fetchBlog();
        fetchForum();
        fetchLeaderboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const LeaderboardSkeleton = () => (
        <div className='space-y-3'>
            {[0, 1, 2].map((i) => (
                <div key={i} className='h-9 bg-gray-50 dark:bg-slate-900 rounded-lg animate-pulse' />
            ))}
        </div>
    );

    return (
        <div className={isWide ? 'px-4 py-6' : 'px-4 py-6 max-w-md mx-auto'}>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                    {t('komunitas.title')}
                </h1>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {t('komunitas.desc')}
                </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-6'>
                    <div className='bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-md'>
                        <BsChatDots className='text-3xl text-emerald-300 mb-3' />
                        <h2 className='text-lg font-bold mb-1'>{t('komunitas.qa_title')}</h2>
                        <p className='text-sm text-emerald-100 mb-4 opacity-90 leading-relaxed'>
                            {t('komunitas.qa_desc')}
                        </p>
                        <div className='flex flex-wrap gap-2'>
                            <Link
                                href='/dashboard/forum/ask'
                                className='inline-block px-4 py-2 bg-white text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors'
                            >
                                {t('komunitas.ask_question')}
                            </Link>
                            <Link
                                href='/dashboard/forum'
                                className='inline-block px-4 py-2 bg-emerald-900/40 text-white text-xs font-bold rounded-lg hover:bg-emerald-900/60 transition-colors border border-emerald-400/30'
                            >
                                {t('komunitas.view_forum')}
                            </Link>
                        </div>
                    </div>

                    <ChatBox />
                </div>

                <div className='space-y-6'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                            <BsStarFill className='text-amber-500' /> {t('komunitas.hall_of_fame')}
                        </h3>
                        <p className='text-xs text-gray-500 mb-3'>{t('komunitas.weekly_top')}</p>
                        {hallOfFame.length === 0 ? (
                            <LeaderboardSkeleton />
                        ) : (
                            <div className='space-y-3'>
                                {hallOfFame.map((u, i) => (
                                    <div
                                        key={u.user_id || u.id || i}
                                        className='flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700'
                                    >
                                        <div className='flex items-center gap-2 min-w-0'>
                                            <div className='w-6 h-6 shrink-0 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center'>
                                                {i + 1}
                                            </div>
                                            <span className='text-sm font-medium text-gray-800 dark:text-gray-200 truncate'>
                                                {u.name || u.user_name || u.user?.name || 'Anonim'}
                                            </span>
                                        </div>
                                        <span className='text-xs font-bold text-amber-600 shrink-0'>
                                            {u.points ?? u.score ?? u.total ?? 0} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link href='/dashboard/leaderboard' className='block text-center text-xs font-bold text-emerald-600 mt-4 hover:underline'>
                            Lihat Peringkat Penuh &rarr;
                        </Link>
                    </div>

                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                            <BsChatLeftDots className='text-rose-500' /> {t('komunitas.hot_forum')}
                        </h3>
                        {topForum.length === 0 ? (
                            <LeaderboardSkeleton />
                        ) : (
                            <div className='space-y-4'>
                                {topForum.map((q) => (
                                    <Link key={q.id || q.slug} href={`/dashboard/forum/${q.slug}`} className='block group'>
                                        <p className='text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 transition-colors line-clamp-2'>
                                            {q.title}
                                        </p>
                                        <p className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                                            <span>▲ {q.vote_count || 0}</span>
                                            <span>•</span>
                                            <span>{q.answer_count || 0} jawaban</span>
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                            <BsNewspaper className='text-blue-500' /> {t('komunitas.highlight')}
                        </h3>
                        {blogPosts.length === 0 ? (
                            <LeaderboardSkeleton />
                        ) : (
                            <div className='space-y-4'>
                                {blogPosts.map((p) => (
                                    <Link key={p.id || p.slug} href={`/dashboard/blog/${p.slug}`} className='block group'>
                                        <p className='text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 transition-colors line-clamp-2'>
                                            {p.title}
                                        </p>
                                        <p className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                                            <span>Oleh {getAuthorName(p.author) || p.author_name || 'Tim Redaksi'}</span>
                                            <span>•</span>
                                            <span>{formatRelative(p.published_at || p.created_at || p.createdAt)}</span>
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Link href='/dashboard/blog' className='block text-center text-xs font-bold text-emerald-600 mt-4 hover:underline'>
                            Lihat Semua Blog &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
