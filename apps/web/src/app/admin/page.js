'use client';

import Link from 'next/link';
import { useLocale } from '@/context/Locale';
import {
    BsArrowRight,
    BsBook,
    BsBookHalf,
    BsBookmark,
    BsCameraVideo,
    BsClock,
    BsFileText,
    BsHeart,
    BsJournalText,
    BsListCheck,
    BsMap,
    BsMoon,
    BsPeople,
    BsPlusCircle,
    BsQuestionCircle,
    BsRepeat,
    BsStar,
} from 'react-icons/bs';

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

const cards = [
    {
        href: '/admin/blog',
        icon: <BsFileText className='text-3xl text-emerald-500' />,
        titleKey: 'admin.nav.blog',
        descKey: 'admin.card.blog_desc',
    },
    {
        href: '/admin/siroh',
        icon: <BsJournalText className='text-3xl text-blue-500' />,
        titleKey: 'admin.nav.sirah',
        descKey: 'admin.card.sirah_desc',
    },
    {
        href: '/admin/doa',
        icon: <BsBookHalf className='text-3xl text-purple-500' />,
        titleKey: 'admin.nav.prayers',
        descKey: 'admin.card.prayers_desc',
    },
    {
        href: '/admin/dzikir',
        icon: <BsRepeat className='text-3xl text-teal-500' />,
        titleKey: 'admin.nav.dhikr',
        descKey: 'admin.card.dhikr_desc',
    },
    {
        href: '/admin/asmaul-husna',
        icon: <BsStar className='text-3xl text-yellow-500' />,
        titleKey: 'admin.nav.asmaul',
        descKey: 'admin.card.asmaul_desc',
    },
    {
        href: '/admin/kajian',
        icon: <BsCameraVideo className='text-3xl text-red-500' />,
        titleKey: 'admin.nav.studies',
        descKey: 'admin.card.studies_desc',
    },
    {
        href: '/admin/library',
        icon: <BsBook className='text-3xl text-emerald-600' />,
        titleKey: 'admin.nav.library',
        descKey: 'admin.card.library_desc',
    },
    {
        href: '/admin/kamus',
        icon: <BsBook className='text-3xl text-indigo-500' />,
        titleKey: 'admin.nav.dictionary',
        descKey: 'admin.card.dictionary_desc',
    },
    {
        href: '/admin/quiz',
        icon: <BsQuestionCircle className='text-3xl text-orange-500' />,
        titleKey: 'admin.nav.quiz',
        descKey: 'admin.card.quiz_desc',
    },
    {
        href: '/admin/sejarah',
        icon: <BsClock className='text-3xl text-gray-500' />,
        titleKey: 'admin.nav.history',
        descKey: 'admin.card.history_desc',
    },
    {
        href: '/admin/asbabun-nuzul',
        icon: <BsBookmark className='text-3xl text-cyan-500' />,
        titleKey: 'admin.nav.asbabun',
        descKey: 'admin.card.asbabun_desc',
    },
    {
        href: '/admin/wirid',
        icon: <BsHeart className='text-3xl text-pink-500' />,
        titleKey: 'admin.nav.wird',
        descKey: 'admin.card.wird_desc',
    },
    {
        href: '/admin/tahlil',
        icon: <BsMoon className='text-3xl text-violet-500' />,
        titleKey: 'admin.nav.tahlil',
        descKey: 'admin.card.tahlil_desc',
    },
    {
        href: '/admin/manasik',
        icon: <BsMap className='text-3xl text-amber-600' />,
        titleKey: 'admin.nav.manasik',
        descKey: 'admin.card.manasik_desc',
    },
    {
        href: '/admin/fiqh',
        icon: <BsListCheck className='text-3xl text-lime-600' />,
        titleKey: 'admin.nav.fiqh',
        descKey: 'admin.card.fiqh_desc',
    },
    {
        href: '/admin/users',
        icon: <BsPeople className='text-3xl text-slate-500' />,
        titleKey: 'admin.nav.users',
        descKey: 'admin.card.users_desc',
    },
];

const AdminDashboard = () => {
    const { t } = useLocale();

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

            <section>
                <div className='mb-3'>
                    <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        {t('admin.modules.title')}
                    </h2>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                        {t('admin.modules.subtitle')}
                    </p>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {cards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow'
                        >
                            <div className='mb-3'>{card.icon}</div>
                            <h2 className='text-base font-bold text-gray-900 dark:text-white mb-1'>
                                {t(card.titleKey)}
                            </h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>{t(card.descKey)}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
