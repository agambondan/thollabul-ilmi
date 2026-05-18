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
    contentMix: [],
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
            const publishedPosts = postItems.filter(
                (post) => (post.status || '').toLowerCase() === 'published',
            ).length;
            const draftPosts = postItems.filter(
                (post) => ['draft', 'archived'].includes((post.status || '').toLowerCase()),
            ).length;
            const contentMix = [
                { name: t('admin.metric.content_blog'), value: posts.count },
                { name: t('admin.metric.content_library'), value: library.count },
                {
                    name: t('admin.metric.content_worship'),
                    value: doa.count + dzikir.count + wirid.count + tahlil.count + manasik.count,
                },
                {
                    name: t('admin.metric.content_learning'),
                    value: quiz.count + kamus.count + fiqh.count + asbabun.count + sejarah.count + kajian.count + asmaul.count,
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
                worshipContent: doa.count + dzikir.count + wirid.count + tahlil.count + manasik.count,
                learningContent: quiz.count + kamus.count + fiqh.count + asbabun.count + sejarah.count + kajian.count + asmaul.count,
                analytics: analytics.data,
                contentMix,
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
                    <div className='h-72'>
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
                            <p className='mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300'>
                                {t('admin.metrics.top_pages')}
                            </p>
                            <div className='space-y-2'>
                                {(overview.analytics?.top_pages ?? []).slice(0, 4).map((page) => (
                                    <div key={page.path} className='flex items-center justify-between gap-3 text-xs'>
                                        <span className='truncate text-gray-500 dark:text-gray-400'>
                                            {page.path}
                                        </span>
                                        <span className='shrink-0 font-semibold text-gray-900 dark:text-white'>
                                            {page.views}
                                        </span>
                                    </div>
                                ))}
                                {!overview.loading && (overview.analytics?.top_pages ?? []).length === 0 ? (
                                    <p className='text-xs text-gray-400 dark:text-gray-500'>
                                        {t('admin.metrics.no_visitor_data')}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
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
