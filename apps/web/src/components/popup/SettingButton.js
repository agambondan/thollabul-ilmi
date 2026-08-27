'use client';

import { useLocale } from '@/context/Locale';
import { useActionPosition } from '@/lib/useActionPosition';
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
    const [isCompactViewport, setIsCompactViewport] = useState(false);
    const [mobileControlsVisible, setMobileControlsVisible] = useState(false);
    const { isWide, setLayout } = useLayoutMode();
    const { isMenu, position, setPosition } = useActionPosition();
    const {
        arabicFontSize,
        decreaseArabicFontSize,
        decreaseTranslationFontSize,
        fontId,
        increaseArabicFontSize,
        increaseTranslationFontSize,
        resetArabicFontSize,
        resetTranslationFontSize,
        setFont,
        translationFontSize,
    } = useQuranFont();
    const popupRef = useRef(null);
    const mobileControlsTimeoutRef = useRef(null);
    const label = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    useEffect(() => {
        const media = window.matchMedia('(max-width: 767px)');
        const updateViewport = () => setIsCompactViewport(media.matches);
        updateViewport();
        media.addEventListener('change', updateViewport);
        return () => media.removeEventListener('change', updateViewport);
    }, []);

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
            setMobileControlsVisible(true);
            clearTimeout(tid);
            clearTimeout(mobileControlsTimeoutRef.current);
            tid = setTimeout(() => setNavBarVisible(false), 2000);
            mobileControlsTimeoutRef.current = setTimeout(() => {
                setMobileControlsVisible(false);
            }, 2200);
        };
        window.addEventListener('scroll', handler);
        document.addEventListener('scroll', handler, true);
        window.addEventListener('touchmove', handler, { passive: true });
        return () => {
            window.removeEventListener('scroll', handler);
            document.removeEventListener('scroll', handler, true);
            window.removeEventListener('touchmove', handler);
            clearTimeout(tid);
            clearTimeout(mobileControlsTimeoutRef.current);
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
    const shouldShowMobileControls = !isCompactViewport || mobileControlsVisible || showPopup;
    const visibilityClass = shouldShowMobileControls
        ? 'translate-y-0 opacity-100 pointer-events-auto'
        : 'translate-y-2 opacity-0 pointer-events-none';

    return (
        <div
            ref={popupRef}
            data-testid='global-setting-control'
            className={`fixed right-2 z-10 transition-all duration-200 ${bottomClass} ${visibilityClass}`}
        >
            <button
                type='button'
                data-testid='global-setting-button'
                className='dark:bg-slate-200 bg-slate-800 dark:text-black text-white rounded-full p-3 shadow hover:opacity-80 transition-opacity'
                onClick={() => setShowPopup((p) => !p)}
                title={t('settings.title')}
                aria-label={t('settings.title')}
            >
                <RiSettings3Fill size={24} />
            </button>

            {showPopup && (
                <div className='absolute right-0 bottom-16 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-60 max-h-[calc(100vh-7rem)] overflow-y-auto p-3 shadow-lg text-sm text-emerald-900 dark:text-white'>
                    <p className='font-semibold mb-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                        {t('settings.title')}
                    </p>

                    {/* Layout toggle */}
                    <div className='hidden md:block mb-3'>
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

                    {/* Action layout */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                            {label('settings.action_position', 'Aksi Ayat/Hadith')}
                        </p>
                        <div className='grid grid-cols-3 gap-2'>
                            <button
                                onClick={() => setPosition('side')}
                                className={classNames(
                                    'py-2 px-1 rounded-lg border text-xs transition-all',
                                    {
                                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold':
                                            position === 'side',
                                        'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500':
                                            position !== 'side',
                                    }
                                )}
                            >
                                {label('settings.action_side', 'Samping')}
                            </button>
                            <button
                                onClick={() => setPosition('menu')}
                                className={classNames(
                                    'py-2 px-1 rounded-lg border text-xs transition-all',
                                    {
                                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold':
                                            isMenu,
                                        'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500':
                                            !isMenu,
                                    }
                                )}
                            >
                                {label('settings.action_menu', 'Menu')}
                            </button>
                            <button
                                onClick={() => setPosition('hidden')}
                                className={classNames(
                                    'py-2 px-1 rounded-lg border text-xs transition-all',
                                    {
                                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold':
                                            position === 'hidden',
                                        'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500':
                                            position !== 'hidden',
                                    }
                                )}
                            >
                                {label('settings.action_hidden', 'Hide')}
                            </button>
                        </div>
                    </div>

                    {/* Arabic font size */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                            {label('settings.arabic_size', 'Ukuran Arab (Quran/Hadis)')}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={decreaseArabicFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label='Perkecil huruf Arab'
                            >
                                A-
                            </button>
                            <button
                                type='button'
                                onClick={resetArabicFontSize}
                                className='h-9 flex-1 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                            >
                                {arabicFontSize}px
                            </button>
                            <button
                                type='button'
                                onClick={increaseArabicFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label='Perbesar huruf Arab'
                            >
                                A+
                            </button>
                        </div>
                    </div>

                    {/* Translation font size */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                            {label('settings.translation_size', 'Ukuran Terjemahan')}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={decreaseTranslationFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label='Perkecil huruf terjemahan'
                            >
                                T-
                            </button>
                            <button
                                type='button'
                                onClick={resetTranslationFontSize}
                                className='h-9 flex-1 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                            >
                                {translationFontSize}px
                            </button>
                            <button
                                type='button'
                                onClick={increaseTranslationFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label='Perbesar huruf terjemahan'
                            >
                                T+
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
