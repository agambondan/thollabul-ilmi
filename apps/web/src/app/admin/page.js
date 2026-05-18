'use client';

import Link from 'next/link';
import { useLocale } from '@/context/Locale';
import {
    adminAsbabunNuzulApi,
    adminAsmaulHusnaApi,
    adminAnalyticsApi,
    adminBlogApi,
    adminDoaApi,
    adminDzikirApi,
    adminFiqhApi,
    adminKajianApi,
    adminKamusApi,
    adminLibraryApi,
    adminManasikApi,
    adminQuizApi,
    adminSejarahApi,
    adminTahlilApi,
    adminUserApi,
    adminWiridApi,
} from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import {
    BsActivity,
    BsArrowRight,
    BsBarChart,
    BsBook,
    BsBookHalf,
    BsClipboardCheck,
    BsExclamationTriangle,
    BsFileText,
    BsHourglassSplit,
    BsPeople,
    BsPlusCircle,
} from 'react-icons/bs';
import {
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const CHART_COLORS = ['#047857', '#0f766e', '#b45309', '#475569', '#7c3aed'];
const METRIC_TONES = {
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const countItems = (payload) => {
    const list = normalizeList(payload);
    return Number(payload?.total ?? payload?.total_items ?? payload?.count ?? list.length);
};

const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
};

const countWhere = (items, predicate) => items.filter(predicate).length;

const shortTick = (value, max = 16) => {
    const text = String(value ?? '');
    return text.length > max ? `${text.slice(0, max)}...` : text;
};

const needsBlogMetadata = (post) =>
    !hasValue(post.category_id ?? post.category?.id) ||
    !hasValue(post.excerpt) ||
    !hasValue(post.cover_image);

const needsLibrarySourceReview = (book) =>
    book.status === 'draft' ||
    !book.is_source_verified ||
    !['verified', 'restricted'].includes(book.license_status);

const needsLibraryResource = (book) =>
    !hasValue(book.source_url) && !hasValue(book.file_name);

const safeJson = async (promise) => {
    try {
        const res = await promise;
        if (!res?.ok) return { ok: false, count: 0, items: [] };
        const payload = await res.json();
        return { ok: true, count: countItems(payload), items: normalizeList(payload) };
    } catch {
        return { ok: false, count: 0, items: [] };
    }
};

const safeData = async (promise) => {
    try {
        const res = await promise;
        if (!res?.ok) return { ok: false, data: null };
        return { ok: true, data: await res.json() };
    } catch {
        return { ok: false, data: null };
    }
};

const quickActions = [
    {
        href: '/admin/blog/new',
        icon: <BsPlusCircle className='text-xl' />,
        titleKey: 'admin.quick.write_article',
        descKey: 'admin.quick.write_article_desc',
        primary: true,
    },
    {
        href: '/admin/blog',
        icon: <BsFileText className='text-xl' />,
        titleKey: 'admin.quick.review_content',
        descKey: 'admin.quick.review_content_desc',
    },
    {
        href: '/admin/doa',
        icon: <BsBookHalf className='text-xl' />,
        titleKey: 'admin.quick.add_prayer',
        descKey: 'admin.quick.add_prayer_desc',
    },
    {
        href: '/admin/users',
        icon: <BsPeople className='text-xl' />,
        titleKey: 'admin.quick.manage_users',
        descKey: 'admin.quick.manage_users_desc',
    },
];

const initialOverview = {
    loading: true,
    failed: 0,
    users: 0,
    roles: [],
    publishedPosts: 0,
    draftPosts: 0,
    libraryBooks: 0,
    worshipContent: 0,
    learningContent: 0,
    analytics: null,
    sourceBreakdown: [],
    activeUsers: [],
    topPagesBySource: [],
    recentActivity: [],
    trafficInsights: [],
    contentMix: [],
    reviewQueue: [],
    healthItems: [],
    statusMix: [],
};

const buildRoleData = (users) => {
    const counts = users.reduce((acc, user) => {
        const role = user.role || 'user';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {});

    return ['user', 'author', 'editor', 'admin']
        .map((role) => ({
            role,
            nameKey: `admin.role.${role}`,
            value: counts[role] || 0,
        }))
        .filter((item) => item.value > 0);
};

const AdminDashboard = () => {
    const { t } = useLocale();
    const [overview, setOverview] = useState(initialOverview);

    useEffect(() => {
        let alive = true;

        const loadOverview = async () => {
            setOverview((current) => ({ ...current, loading: true }));
            const [
                users,
                posts,
                library,
                doa,
                dzikir,
                wirid,
                tahlil,
                manasik,
                quiz,
                kamus,
                fiqh,
                asbabun,
                sejarah,
                kajian,
                asmaul,
                analytics,
            ] = await Promise.all([
                safeJson(adminUserApi.list()),
                safeJson(adminBlogApi.listAll()),
                safeJson(adminLibraryApi.list(0, 100)),
                safeJson(adminDoaApi.list(0, 100)),
                safeJson(adminDzikirApi.list(0, 100)),
                safeJson(adminWiridApi.list(0, 100)),
                safeJson(adminTahlilApi.list(0, 100)),
                safeJson(adminManasikApi.list(0, 100)),
                safeJson(adminQuizApi.list(0, 100)),
                safeJson(adminKamusApi.list(0, 100)),
                safeJson(adminFiqhApi.list(0, 100)),
                safeJson(adminAsbabunNuzulApi.list(0, 100)),
                safeJson(adminSejarahApi.list()),
                safeJson(adminKajianApi.list(0, 100)),
                safeJson(adminAsmaulHusnaApi.list()),
                safeData(adminAnalyticsApi.summary(14)),
            ]);

            if (!alive) return;

            const postItems = posts.items;
            const libraryItems = library.items;
            const publishedPosts = postItems.filter(
                (post) => (post.status || '').toLowerCase() === 'published',
            ).length;
            const draftPosts = postItems.filter(
                (post) => ['draft', 'archived'].includes((post.status || '').toLowerCase()),
            ).length;
            const archivedPosts = countWhere(
                postItems,
                (post) => (post.status || '').toLowerCase() === 'archived',
            );
            const blogNeedsMetadata = countWhere(postItems, needsBlogMetadata);
            const libraryNeedsSourceReview = countWhere(libraryItems, needsLibrarySourceReview);
            const libraryNeedsResource = countWhere(libraryItems, needsLibraryResource);
            const worshipTotal = doa.count + dzikir.count + wirid.count + tahlil.count + manasik.count;
            const learningTotal = quiz.count + kamus.count + fiqh.count + asbabun.count + sejarah.count + kajian.count + asmaul.count;
            const analyticsData = analytics.data;
            const dailyAnalytics = analyticsData?.daily ?? [];
            const sourceBreakdown = analyticsData?.source_breakdown ?? [];
            const activeUsers = analyticsData?.active_users ?? [];
            const topPagesBySource = analyticsData?.top_pages_by_source ?? [];
            const recentActivity = analyticsData?.recent_activity ?? [];
            const totalViews = Number(analyticsData?.total_views ?? 0);
            const averageDailyViews =
                dailyAnalytics.length > 0 ? Math.round(totalViews / dailyAnalytics.length) : 0;
            const bestDay = dailyAnalytics.reduce(
                (best, day) => (Number(day.views ?? 0) > Number(best.views ?? 0) ? day : best),
                { date: '-', views: 0 },
            );
            const topPage = analyticsData?.top_pages?.[0];
            const contentMix = [
                { name: t('admin.metric.content_blog'), value: posts.count },
                { name: t('admin.metric.content_library'), value: library.count },
                {
                    name: t('admin.metric.content_worship'),
                    value: worshipTotal,
                },
                {
                    name: t('admin.metric.content_learning'),
                    value: learningTotal,
                },
            ];
            const statusMix = [
                { name: t('admin.status.published'), value: publishedPosts },
                { name: t('admin.status.draft'), value: draftPosts - archivedPosts },
                { name: t('admin.status.archived'), value: archivedPosts },
            ].filter((item) => item.value > 0);
            const reviewQueue = [
                {
                    href: '/admin/blog',
                    labelKey: 'admin.queue.blog_drafts',
                    descKey: 'admin.queue.blog_drafts_desc',
                    count: draftPosts,
                    tone: 'amber',
                },
                {
                    href: '/admin/blog',
                    labelKey: 'admin.queue.blog_metadata',
                    descKey: 'admin.queue.blog_metadata_desc',
                    count: blogNeedsMetadata,
                    tone: 'slate',
                },
                {
                    href: '/admin/library',
                    labelKey: 'admin.queue.library_source',
                    descKey: 'admin.queue.library_source_desc',
                    count: libraryNeedsSourceReview,
                    tone: 'teal',
                },
                {
                    href: '/admin/library',
                    labelKey: 'admin.queue.library_resource',
                    descKey: 'admin.queue.library_resource_desc',
                    count: libraryNeedsResource,
                    tone: 'emerald',
                },
            ];
            const healthItems = [
                {
                    href: '/admin/blog',
                    labelKey: 'admin.health.blog_metadata',
                    descKey: 'admin.health.blog_metadata_desc',
                    value: Math.max(posts.count - blogNeedsMetadata, 0),
                    total: posts.count,
                },
                {
                    href: '/admin/library',
                    labelKey: 'admin.health.library_source',
                    descKey: 'admin.health.library_source_desc',
                    value: Math.max(library.count - libraryNeedsSourceReview, 0),
                    total: library.count,
                },
                {
                    href: '/admin/doa',
                    labelKey: 'admin.health.worship_coverage',
                    descKey: 'admin.health.worship_coverage_desc',
                    value: worshipTotal,
                    total: Math.max(worshipTotal, 50),
                },
                {
                    href: '/admin/quiz',
                    labelKey: 'admin.health.learning_coverage',
                    descKey: 'admin.health.learning_coverage_desc',
                    value: learningTotal,
                    total: Math.max(learningTotal, 50),
                },
            ];
            const trafficInsights = [
                {
                    labelKey: 'admin.traffic.total_views',
                    descKey: 'admin.traffic.total_views_desc',
                    value: totalViews.toLocaleString('id-ID'),
                    hint: t('admin.traffic.last_14_days'),
                },
                {
                    labelKey: 'admin.traffic.today_views',
                    descKey: 'admin.traffic.today_views_desc',
                    value: Number(analyticsData?.today_views ?? 0).toLocaleString('id-ID'),
                    hint: `${Number(analyticsData?.today_visitors ?? 0).toLocaleString('id-ID')} ${t('admin.traffic.visitors')}`,
                },
                {
                    labelKey: 'admin.traffic.avg_daily',
                    descKey: 'admin.traffic.avg_daily_desc',
                    value: averageDailyViews.toLocaleString('id-ID'),
                    hint: t('admin.traffic.views_per_day'),
                },
                {
                    labelKey: 'admin.traffic.best_day',
                    descKey: 'admin.traffic.best_day_desc',
                    value: Number(bestDay.views ?? 0).toLocaleString('id-ID'),
                    hint: topPage?.path || bestDay.date,
                },
            ];

            setOverview({
                loading: false,
                failed: [
                    users,
                    posts,
                    library,
                    doa,
                    dzikir,
                    wirid,
                    tahlil,
                    manasik,
                    quiz,
                    kamus,
                    fiqh,
                    asbabun,
                    sejarah,
                    kajian,
                    asmaul,
                    analytics,
                ].filter((item) => !item.ok).length,
                users: users.count,
                roles: buildRoleData(users.items),
                publishedPosts,
                draftPosts,
                libraryBooks: library.count,
                worshipContent: worshipTotal,
                learningContent: learningTotal,
                analytics: analyticsData,
                sourceBreakdown,
                activeUsers,
                topPagesBySource,
                recentActivity,
                trafficInsights,
                contentMix,
                reviewQueue,
                healthItems,
                statusMix,
            });
        };

        loadOverview();

        return () => {
            alive = false;
        };
    }, [t]);

    const metricCards = useMemo(
        () => [
            {
                label: t('admin.metric.visitors'),
                value: overview.loading
                    ? '...'
                    : Number(overview.analytics?.unique_visitors ?? 0).toLocaleString('id-ID'),
                desc: t('admin.metric.visitors_desc'),
                icon: <BsActivity />,
                tone: 'amber',
            },
            {
                label: t('admin.metric.users'),
                value: overview.loading ? '...' : overview.users.toLocaleString('id-ID'),
                desc: t('admin.metric.users_desc'),
                icon: <BsPeople />,
                tone: 'emerald',
            },
            {
                label: t('admin.metric.reading_content'),
                value: overview.loading
                    ? '...'
                    : (overview.libraryBooks + overview.publishedPosts).toLocaleString('id-ID'),
                desc: t('admin.metric.reading_content_desc'),
                icon: <BsBook />,
                tone: 'teal',
            },
            {
                label: t('admin.metric.drafts'),
                value: overview.loading ? '...' : overview.draftPosts.toLocaleString('id-ID'),
                desc: t('admin.metric.drafts_desc'),
                icon: <BsHourglassSplit />,
                tone: 'slate',
            },
        ],
        [overview, t],
    );

    const contentHealthChart = useMemo(
        () => overview.healthItems.map((item) => ({
            name: t(item.labelKey),
            percent: item.total > 0 ? Math.round((item.value / item.total) * 100) : 0,
            value: item.value,
            total: item.total,
        })),
        [overview.healthItems, t],
    );

    const reviewQueueChart = useMemo(
        () => overview.reviewQueue.map((item) => ({
            name: t(item.labelKey),
            count: item.count,
        })),
        [overview.reviewQueue, t],
    );

    return (
        <div className='px-4 py-6'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>{t('admin.nav.dashboard')}</h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    {t('admin.dashboard.subtitle')}
                </p>
            </div>

            <section className='mb-8'>
                <div className='mb-3 flex items-end justify-between gap-4'>
                    <div>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {t('admin.metrics.title')}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            {t('admin.metrics.subtitle')}
                        </p>
                    </div>
                    {overview.failed > 0 && !overview.loading ? (
                        <span className='rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'>
                            {t('admin.metrics.partial_data')}
                        </span>
                    ) : null}
                </div>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
                    {metricCards.map((metric) => (
                        <div
                            key={metric.label}
                            className='rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800'
                        >
                            <div className='mb-4 flex items-center justify-between gap-3'>
                                <span
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                                        METRIC_TONES[metric.tone] ?? METRIC_TONES.slate
                                    }`}
                                >
                                    {metric.icon}
                                </span>
                                <BsBarChart className='text-gray-300 dark:text-gray-600' />
                            </div>
                            <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                                {metric.label}
                            </p>
                            <p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
                                {metric.value}
                            </p>
                            <p className='mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400'>
                                {metric.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className='mb-8'>
                <div className='mb-3 flex items-end justify-between gap-4'>
                    <div>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {t('admin.traffic.title')}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            {t('admin.traffic.subtitle')}
                        </p>
                    </div>
                </div>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
                    {overview.trafficInsights.map((item) => (
                        <div
                            key={item.labelKey}
                            className='rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800'
                        >
                            <div className='mb-3 flex items-center justify-between gap-3'>
                                <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'>
                                    {t(item.labelKey)}
                                </p>
                                <BsActivity className='text-emerald-600 dark:text-emerald-400' />
                            </div>
                            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                {overview.loading ? '...' : item.value}
                            </p>
                            <p className='mt-1 truncate text-xs font-medium text-emerald-700 dark:text-emerald-300'>
                                {overview.loading ? '...' : item.hint}
                            </p>
                            <p className='mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400'>
                                {t(item.descKey)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className='mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]'>
                <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                    <div className='mb-4 flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                                {t('admin.queue.title')}
                            </h2>
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                {t('admin.queue.subtitle')}
                            </p>
                        </div>
                        <BsExclamationTriangle className='mt-1 text-amber-500' />
                    </div>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                        {overview.reviewQueue.map((item) => (
                            <Link
                                key={item.labelKey}
                                href={item.href}
                                className='group rounded-lg border border-gray-100 p-4 transition-colors hover:border-emerald-100 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:border-emerald-900/60 dark:hover:bg-emerald-900/10'
                            >
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0'>
                                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                            {t(item.labelKey)}
                                        </p>
                                        <p className='mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400'>
                                            {t(item.descKey)}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                                            METRIC_TONES[item.tone] ?? METRIC_TONES.slate
                                        }`}
                                    >
                                        {overview.loading ? '...' : item.count.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className='mt-3 flex items-center justify-between text-xs font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-300'>
                                    <span>{t('admin.queue.open_module')}</span>
                                    <BsArrowRight />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                    <div className='mb-4 flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                                {t('admin.health.title')}
                            </h2>
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                {t('admin.health.subtitle')}
                            </p>
                        </div>
                        <BsClipboardCheck className='mt-1 text-emerald-600' />
                    </div>
                    <div className='space-y-4'>
                        {overview.healthItems.map((item) => {
                            const percent = item.total > 0
                                ? Math.round((item.value / item.total) * 100)
                                : 0;

                            return (
                                <Link key={item.labelKey} href={item.href} className='block'>
                                    <div className='mb-2 flex items-start justify-between gap-3'>
                                        <div>
                                            <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                                {t(item.labelKey)}
                                            </p>
                                            <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
                                                {t(item.descKey)}
                                            </p>
                                        </div>
                                        <span className='shrink-0 text-xs font-bold text-gray-700 dark:text-gray-200'>
                                            {overview.loading ? '...' : `${percent}%`}
                                        </span>
                                    </div>
                                    <div className='h-2 rounded-full bg-gray-100 dark:bg-slate-700'>
                                        <div
                                            className='h-2 rounded-full bg-emerald-700 dark:bg-emerald-500'
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className='mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>
                <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                    <div className='mb-4 flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                                {t('admin.metrics.content_chart')}
                            </h2>
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                {t('admin.metrics.content_chart_desc')}
                            </p>
                        </div>
                    </div>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <div className='h-64'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart data={overview.contentMix} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                                    <XAxis dataKey='name' tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(4, 120, 87, 0.08)' }}
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: '#e2e8f0',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar dataKey='value' radius={[8, 8, 0, 0]}>
                                        {overview.contentMix.map((_, index) => (
                                            <Cell key={`content-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <div className='flex items-center justify-between gap-4'>
                                <div>
                                    <p className='text-xs font-semibold text-gray-900 dark:text-white'>
                                        {t('admin.metrics.status_chart')}
                                    </p>
                                    <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
                                        {t('admin.metrics.status_chart_desc')}
                                    </p>
                                </div>
                            </div>
                            <div className='h-48'>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <PieChart>
                                        <Pie
                                            data={overview.statusMix}
                                            dataKey='value'
                                            nameKey='name'
                                            innerRadius={50}
                                            outerRadius={74}
                                            paddingAngle={3}
                                        >
                                            {overview.statusMix.map((_, index) => (
                                                <Cell key={`status-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 12,
                                                borderColor: '#e2e8f0',
                                                fontSize: 12,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className='mt-5 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 dark:border-slate-700 lg:grid-cols-2'>
                        <div>
                            <div className='mb-3'>
                                <p className='text-xs font-semibold text-gray-900 dark:text-white'>
                                    {t('admin.metrics.content_health_chart')}
                                </p>
                                <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
                                    {t('admin.metrics.content_health_chart_desc')}
                                </p>
                            </div>
                            <div className='h-56'>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <BarChart
                                        data={contentHealthChart}
                                        layout='vertical'
                                        margin={{ top: 4, right: 18, bottom: 4, left: 12 }}
                                    >
                                        <XAxis
                                            type='number'
                                            domain={[0, 100]}
                                            tickFormatter={(value) => `${value}%`}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            type='category'
                                            dataKey='name'
                                            width={92}
                                            tickFormatter={(value) => shortTick(value, 14)}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                        />
                                        <Tooltip
                                            formatter={(value, name, props) => [
                                                `${value}% (${props.payload.value}/${props.payload.total})`,
                                                t('admin.metrics.ready'),
                                            ]}
                                            contentStyle={{
                                                borderRadius: 12,
                                                borderColor: '#e2e8f0',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey='percent' fill='#047857' radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div>
                            <div className='mb-3'>
                                <p className='text-xs font-semibold text-gray-900 dark:text-white'>
                                    {t('admin.metrics.review_queue_chart')}
                                </p>
                                <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
                                    {t('admin.metrics.review_queue_chart_desc')}
                                </p>
                            </div>
                            <div className='h-56'>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <BarChart data={reviewQueueChart} margin={{ top: 6, right: 8, bottom: 8, left: -12 }}>
                                        <XAxis
                                            dataKey='name'
                                            tickFormatter={(value) => shortTick(value, 12)}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                value,
                                                t('admin.metrics.review_items'),
                                            ]}
                                            cursor={{ fill: 'rgba(180, 83, 9, 0.08)' }}
                                            contentStyle={{
                                                borderRadius: 12,
                                                borderColor: '#e2e8f0',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey='count' fill='#b45309' radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-4'>
                    <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {t('admin.metrics.role_chart')}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            {t('admin.metrics.role_chart_desc')}
                        </p>
                        <div className='mt-4 h-44'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <PieChart>
                                    <Pie
                                        data={overview.roles}
                                        dataKey='value'
                                        nameKey='role'
                                        innerRadius={46}
                                        outerRadius={70}
                                        paddingAngle={3}
                                    >
                                        {overview.roles.map((_, index) => (
                                            <Cell key={`role-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [
                                            value,
                                            t(`admin.role.${name}`),
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: '#e2e8f0',
                                            fontSize: 12,
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className='mt-3 grid grid-cols-2 gap-2'>
                            {overview.roles.map((role, index) => (
                                <div key={role.role} className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                                    <span
                                        className='h-2.5 w-2.5 rounded-full'
                                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                    />
                                    <span>{t(role.nameKey)}</span>
                                    <span className='font-semibold text-gray-800 dark:text-gray-200'>
                                        {role.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                        <div className='mb-4 flex items-start justify-between gap-4'>
                            <div>
                                <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                                    {t('admin.metrics.source_chart')}
                                </h2>
                                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                    {t('admin.metrics.source_chart_desc')}
                                </p>
                            </div>
                        </div>
                        <div className='h-44'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <PieChart>
                                    <Pie
                                        data={overview.sourceBreakdown}
                                        dataKey='visitors'
                                        nameKey='source'
                                        innerRadius={46}
                                        outerRadius={70}
                                        paddingAngle={3}
                                    >
                                        {overview.sourceBreakdown.map((_, index) => (
                                            <Cell key={`source-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [
                                            value,
                                            t(`admin.source.${name}`),
                                        ]}
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: '#e2e8f0',
                                            fontSize: 12,
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className='mt-3 grid grid-cols-2 gap-2'>
                            {overview.sourceBreakdown.map((item, index) => (
                                <div key={item.source} className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                                    <span
                                        className='h-2.5 w-2.5 rounded-full'
                                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                    />
                                    <span>{t(`admin.source.${item.source}`)}</span>
                                    <span className='font-semibold text-gray-800 dark:text-gray-200'>
                                        {item.visitors}
                                    </span>
                                </div>
                            ))}
                            {!overview.loading && overview.sourceBreakdown.length === 0 ? (
                                <p className='col-span-2 text-xs text-gray-400 dark:text-gray-500'>
                                    {t('admin.metrics.no_visitor_data')}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className='rounded-xl border border-gray-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {t('admin.metrics.visitor_chart')}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            {t('admin.metrics.visitor_chart_desc')}
                        </p>
                        <div className='mt-4 h-40'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart data={overview.analytics?.daily ?? []} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
                                    <XAxis dataKey='date' tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(180, 83, 9, 0.08)' }}
                                        contentStyle={{
                                            borderRadius: 12,
                                            borderColor: '#e2e8f0',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Bar dataKey='visitors' fill='#b45309' radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className='mt-4 border-t border-gray-100 pt-3 dark:border-slate-700'>
                            <p className='mb-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300'>
                                {t('admin.metrics.top_pages_source')}
                            </p>
                            <p className='mb-3 text-xs text-gray-400 dark:text-gray-500'>
                                {t('admin.metrics.top_pages_source_desc')}
                            </p>
                            {overview.topPagesBySource.length > 0 ? (() => {
                                const groups = {};
                                overview.topPagesBySource.forEach((p) => {
                                    if (!groups[p.source]) groups[p.source] = [];
                                    groups[p.source].push(p);
                                });
                                return (
                                    <div className='grid grid-cols-2 gap-2'>
                                        {Object.entries(groups).map(([source, pages]) => (
                                            <div key={source} className='rounded-lg border border-gray-50 bg-gray-50/50 p-2 dark:border-slate-600 dark:bg-slate-700/30'>
                                                <span className='mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300'>
                                                    {t(`admin.source.${source}`)}
                                                </span>
                                                {pages.slice(0, 3).map((page) => (
                                                    <div key={page.path} className='flex items-center justify-between gap-2 py-0.5 text-xs'>
                                                        <span className='truncate text-gray-500 dark:text-gray-400'>
                                                            {page.path}
                                                        </span>
                                                        <span className='shrink-0 font-semibold text-gray-900 dark:text-white'>
                                                            {page.views}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })() : !overview.loading ? (
                                <p className='text-xs text-gray-400 dark:text-gray-500'>
                                    {t('admin.metrics.no_visitor_data')}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <section className='mb-8'>
                <div className='mb-3 flex items-end justify-between gap-4'>
                    <div>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {t('admin.metrics.active_users')}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            {t('admin.metrics.active_users_desc')}
                        </p>
                    </div>
                </div>
                <div className='overflow-x-auto rounded-xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800'>
                    <table className='w-full text-xs'>
                        <thead>
                            <tr className='border-b border-gray-100 dark:border-slate-700'>
                                <th className='px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400'>{t('admin.metric.users')}</th>
                                <th className='px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400'>{t('admin.table.email')}</th>
                                <th className='px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-400'>{t('admin.table.views')}</th>
                                <th className='px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400'>{t('admin.table.last_seen')}</th>
                                <th className='px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400'>{t('admin.table.last_route')}</th>
                                <th className='px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400'>{t('admin.table.source')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overview.activeUsers.map((user) => (
                                <tr key={user.user_id} className='border-b border-gray-50 last:border-0 dark:border-slate-700/50'>
                                    <td className='max-w-[120px] truncate px-4 py-2.5 font-medium text-gray-900 dark:text-white' title={user.name}>
                                        {user.name}
                                    </td>
                                    <td className='max-w-[160px] truncate px-4 py-2.5 text-gray-500 dark:text-gray-400' title={user.email}>
                                        {user.email}
                                    </td>
                                    <td className='px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white'>
                                        {user.total_views}
                                    </td>
                                    <td className='whitespace-nowrap px-4 py-2.5 text-gray-500 dark:text-gray-400'>
                                        {user.last_seen}
                                    </td>
                                    <td className='max-w-[140px] truncate px-4 py-2.5 text-gray-500 dark:text-gray-400' title={user.last_path}>
                                        {user.last_path}
                                    </td>
                                    <td className='px-4 py-2.5'>
                                        <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-gray-300'>
                                            {t(`admin.source.${user.source}`)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!overview.loading && overview.activeUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-4 py-6 text-center text-gray-400 dark:text-gray-500'>
                                        {t('admin.metrics.no_visitor_data')}
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className='mb-8'>
                <div className='mb-3 flex items-end justify-between gap-4'>
                    <div>
                        <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {t('admin.quick.title')}
                        </h2>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            {t('admin.quick.subtitle')}
                        </p>
                    </div>
                </div>
                <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className={`group rounded-xl border p-4 transition-all ${
                                action.primary
                                    ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
                                    : 'border-gray-100 bg-white text-gray-900 hover:border-emerald-100 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-emerald-900/60 dark:hover:bg-emerald-900/10'
                            }`}
                        >
                            <div className='mb-3 flex items-center justify-between gap-3'>
                                <span
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                                        action.primary
                                            ? 'bg-white/15 text-white'
                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    }`}
                                >
                                    {action.icon}
                                </span>
                                <BsArrowRight
                                    className={`text-sm transition-transform group-hover:translate-x-0.5 ${
                                        action.primary
                                            ? 'text-white/80'
                                            : 'text-gray-300 dark:text-gray-500'
                                    }`}
                                />
                            </div>
                            <h3
                                className={`text-sm font-semibold ${
                                    action.primary ? 'text-white' : 'text-gray-900 dark:text-white'
                                }`}
                            >
                                {t(action.titleKey)}
                            </h3>
                            <p
                                className={`mt-1 text-xs leading-5 ${
                                    action.primary
                                        ? 'text-emerald-50'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {t(action.descKey)}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default AdminDashboard;
