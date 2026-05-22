'use client';

import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { QURAN_FONTS, useQuranFont } from '@/lib/useQuranFont';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RiSettings3Fill } from 'react-icons/ri';
import { TbLayoutDistributeHorizontal, TbLayoutSidebarRight } from 'react-icons/tb';

const SettingButton = () => {
    const { t } = useLocale();
    const pathname = usePathname();
    const [showPopup, setShowPopup] = useState(false);
    const [navBarVisible, setNavBarVisible] = useState(false);
    const { isWide, setLayout } = useLayoutMode();
    const { fontId, setFont } = useQuranFont();
    const popupRef = useRef(null);

    useEffect(() => {
        if (!showPopup) return;
        const handler = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setShowPopup(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPopup]);

    useEffect(() => {
        let tid;
        const handler = () => {
            setNavBarVisible(true);
            clearTimeout(tid);
            tid = setTimeout(() => setNavBarVisible(false), 2000);
        };
        window.addEventListener('scroll', handler);
        return () => {
            window.removeEventListener('scroll', handler);
            clearTimeout(tid);
        };
    }, []);

    const isDashboard = pathname?.startsWith('/dashboard');
    const bottomClass = isDashboard
        ? navBarVisible
            ? 'bottom-[84px] md:bottom-[52px]'
            : 'bottom-[72px] md:bottom-2'
        : navBarVisible
            ? 'bottom-[52px]'
            : 'bottom-2';

    return (
        <div
            ref={popupRef}
            className={`fixed right-2 z-10 transition-[bottom] duration-200 ${bottomClass}`}
        >
            <button
                className='dark:bg-slate-200 bg-slate-800 dark:text-black text-white rounded-full p-3 shadow hover:opacity-80 transition-opacity'
                onClick={() => setShowPopup((p) => !p)}
                title={t('settings.title')}
                aria-label={t('settings.title')}
            >
                <RiSettings3Fill size={24} />
            </button>

            {showPopup && (
                <div className='absolute right-0 bottom-16 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-52 p-3 shadow-lg text-sm text-emerald-900 dark:text-white'>
                    <p className='font-semibold mb-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                        {t('settings.title')}
                    </p>

                    {/* Layout toggle */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                            {t('settings.ayah_layout')}
                        </p>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setLayout(false)}
                                className={classNames(
                                    'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-all',
                                    {
                                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold':
                                            !isWide,
                                        'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500':
                                            isWide,
                                    }
                                )}
                            >
                                <TbLayoutSidebarRight size={18} />
                                {t('settings.compact')}
                            </button>
                            <button
                                onClick={() => setLayout(true)}
                                className={classNames(
                                    'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-all',
                                    {
                                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold':
                                            isWide,
                                        'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500':
                                            !isWide,
                                    }
                                )}
                            >
                                <TbLayoutDistributeHorizontal size={18} />
                                {t('settings.wide')}
                            </button>
                        </div>
                    </div>

                    {/* Arabic font selector */}
                    <div>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                            {t('settings.arabic_font')}
                        </p>
                        <div className='flex flex-col gap-1'>
                            {QURAN_FONTS.map((font) => (
                                <button
                                    key={font.id}
                                    onClick={() => setFont(font.id)}
                                    className={classNames(
                                        'flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all',
                                        {
                                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold':
                                                fontId === font.id,
                                            'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500':
                                                fontId !== font.id,
                                        }
                                    )}
                                >
                                    <span>{font.label}</span>
                                    <span
                                        className={`${font.cls} text-base leading-none`}
                                        style={{ direction: 'rtl' }}
                                    >
                                        بِسْمِ
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingButton;
