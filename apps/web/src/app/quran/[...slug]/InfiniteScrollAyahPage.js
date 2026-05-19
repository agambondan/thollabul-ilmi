'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import AyahPage from '@/app/quran/[...slug]/AyahPage';
import AutoScrollButton from '@/components/popup/AutoScrollButton';
import ScrollableComponent from '@/components/popup/ScrollableButton';
import { SkeletonReader } from '@/components/skeleton/Skeleton';
import SurahAudioPlayer from '@/components/SurahAudioPlayer';
import { useLocale } from '@/context/Locale';
import { progressApi, streakApi } from '@/lib/api';
import { getLocalizedTranslation } from '@/lib/translation';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { useQuranFont } from '@/lib/useQuranFont';
import classNames from 'classnames';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { TbPlayerTrackNext, TbPlayerTrackPrev } from 'react-icons/tb';

const PAGE_SIZE = 10;

const normalizeAyahs = (data) => data?.ayahs ?? data?.items ?? data ?? [];

const InfiniteScrollAyahPage = ({ params, searchParams, basePath = '/quran/surah' }) => {
	const { t, lang } = useLocale();
	const { isWide } = useLayoutMode();
	const { fontCls } = useQuranFont();
	const [surah, setSurah] = useState(null);
	const [ayahs, setAyahs] = useState([]);
	const [page, setPage] = useState(0);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isFetchingMore, setIsFetchingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState('');
	const [hafalanMode, setHafalanMode] = useState('off');
	const [selectedQari, setSelectedQari] = useState('');

	const rawSlug = params.slug;
	const slug = decodeURIComponent(Array.isArray(rawSlug) ? (rawSlug[1] ?? '') : (rawSlug ?? ''));

	const loadMoreAyah = useCallback(() => {
		if (isInitialLoading || isFetchingMore || !hasMore) return;
		setPage((prev) => prev + 1);
	}, [hasMore, isFetchingMore, isInitialLoading]);

	const getTargetAyah = () => {
		if (typeof window === 'undefined') return 0;
		const hash = window.location.hash.replace('#', '');
		if (!hash) return 0;
		const match = hash.match(/^ayah-?(\d+)$/);
		if (!match) return 0;
		return parseInt(match[1], 10);
	};

	const fetchSurah = useCallback(
		async (pageIndex, size = PAGE_SIZE) => {
			const target = pageIndex === 0 ? getTargetAyah() : 0;
			const nextSize = target > 0 ? target + (target % PAGE_SIZE) : size;

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/surah/name/${slug}?page=${pageIndex}&size=${nextSize}`,
			);
			if (!res.ok) {
				throw new Error('failed');
			}
			return res.json();
		},
		[slug],
	);

	useEffect(() => {
		let isActive = true;
		setIsInitialLoading(true);
		setError('');
		setPage(0);
		setAyahs([]);
		setSurah(null);
		setHasMore(true);

		fetchSurah(0)
			.then((data) => {
				if (!isActive) return;
				const nextSurah = data ?? {};
				const nextAyahs = normalizeAyahs(nextSurah);
				setSurah(nextSurah);
				setAyahs(nextAyahs);
				setHasMore(nextAyahs.length < (nextSurah.number_of_ayahs ?? nextAyahs.length));
				if (nextSurah.number && nextAyahs[0]) {
					progressApi.saveQuran(nextSurah.number, nextAyahs[0].number).catch(() => {});
					streakApi.logActivity('quran').catch(() => {});
				}
			})
			.catch(() => {
				if (isActive) setError(t('quran.error_desc'));
			})
			.finally(() => {
				if (isActive) setIsInitialLoading(false);
			});

		return () => {
			isActive = false;
		};
	}, [fetchSurah]);

	useEffect(() => {
		if (page === 0 || !surah) return;

		let isActive = true;
		setIsFetchingMore(true);
		fetchSurah(page)
			.then((data) => {
				if (!isActive) return;
				const nextAyahs = normalizeAyahs(data);
				setAyahs((prev) => {
					const merged = [...prev, ...nextAyahs];
					setHasMore(merged.length < (surah.number_of_ayahs ?? merged.length));
					return merged;
				});
			})
			.catch(() => {
				if (isActive) setHasMore(false);
			})
			.finally(() => {
				if (isActive) setIsFetchingMore(false);
			});

		return () => {
			isActive = false;
		};
	}, [fetchSurah, page, surah]);

	useEffect(() => {
		if (isInitialLoading || !ayahs.length) return;
		const target = getTargetAyah();
		if (!target) return;
		const el = document.getElementById(`ayah-${target}`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, [isInitialLoading, ayahs.length]);

	if (isInitialLoading) return <SkeletonReader />;
	if (error)
		return (
			<div className='flex flex-col items-center justify-center min-h-[40vh] text-center px-4'>
				<p className='text-4xl mb-3'>⚠️</p>
				<h2 className='text-lg font-bold text-emerald-900 dark:text-white mb-2'>
					{t('quran.error_title')}
				</h2>
				<p className='text-sm text-gray-500 dark:text-gray-400'>
					{error}
				</p>
			</div>
		);

	const surahTitle = surah?.translation?.latin_en ?? 'Al-Quran';
	const prevHref = surah?.prev_surah?.translation?.latin_en
		? `${basePath}/${surah.prev_surah.translation.latin_en}`
		: '';
	const nextHref = surah?.next_surah?.translation?.latin_en
		? `${basePath}/${surah.next_surah.translation.latin_en}`
		: '';

	return (
		<div className={isWide ? 'w-full' : 'max-w-3xl mx-auto'}>
			<div className='overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'>
				<div className='text-center py-6 px-4 border-b border-gray-100 dark:border-slate-800'>
					<p className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1'>
						Surah {surah?.number ?? '-'}
					</p>
					{surah?.number && (
						<div className='flex justify-center mb-3'>
							<SurahAudioPlayer
								surahNumber={surah.number}
								surahName={surahTitle}
								totalAyahs={surah.number_of_ayahs}
							/>
						</div>
					)}
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-0.5'>
						{surahTitle}
					</h1>
					<p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
						{getLocalizedTranslation(surah?.translation, lang)} &middot;{' '}
						{surah?.number_of_ayahs ?? ayahs.length} {t('common.verse')} &middot;{' '}
						{surah?.revelation_type?.toLowerCase() === 'meccan' ? t('quran.meccan') : surah?.revelation_type?.toLowerCase() === 'medinan' ? t('quran.medinan') : (surah?.revelation_type ?? '')}
					</p>
					<p
						className={`${fontCls} text-5xl leading-[2] text-gray-900 dark:text-white`}
						style={{ direction: 'rtl' }}
					>
						{surah?.translation?.ar?.replace('سُورَةُ', '').trim() ?? ''}
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-2 px-4 py-2 text-xs border-b border-gray-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-900/10'>
					<span className='flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium'>
						{hafalanMode === 'off' ? <BsEye /> : <BsEyeSlash />}
						{t('hafalan.mode_label') ?? 'Mode Hafalan'}:
					</span>
					{[
						{ value: 'off', labelKey: 'hafalan.mode_off' },
						{ value: 'hide_arabic', labelKey: 'hafalan.mode_hide_arabic' },
						{ value: 'hide_translation', labelKey: 'hafalan.mode_hide_translation' },
						{ value: 'hide_all', labelKey: 'hafalan.mode_hide_all' },
					].map((m) => (
						<button
							key={m.value}
							type='button'
							onClick={() => setHafalanMode(m.value)}
							className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
								hafalanMode === m.value
									? 'bg-emerald-500 text-white'
									: 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-slate-700'
							}`}
						>
							{t(m.labelKey) ??
								(m.value === 'off'
									? 'Off'
									: m.value === 'hide_arabic'
									? 'Sembunyikan Arab'
									: m.value === 'hide_translation'
									? 'Sembunyikan Terjemahan'
									: 'Sembunyikan Semua')}
						</button>
					))}
				</div>

				<div className='flex justify-between items-center px-4 py-3 text-sm border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40'>
				<div
					className={classNames({
						'flex items-center': true,
						'opacity-30 pointer-events-none': !prevHref,
					})}
				>
					<Link
						className='flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors'
						href={prevHref}
					>
						<TbPlayerTrackPrev size={14} />
						<span className='hidden sm:inline'>{t('quran.prev_surah')}</span>
						<span className='sm:hidden'>Prev</span>
					</Link>
				</div>
				<div
					className={classNames({
						'flex items-center': true,
						'opacity-30 pointer-events-none': !nextHref,
					})}
				>
					<Link
						className='flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors'
						href={nextHref}
					>
						<span className='hidden sm:inline'>{t('quran.next_surah')}</span>
						<span className='sm:hidden'>Next</span>
						<TbPlayerTrackNext size={14} />
					</Link>
				</div>
				</div>

				<ul
					key={`${surahTitle}-${surah?.number ?? ''}`}
					id={`${surahTitle}-${surah?.number ?? ''}`}
				>
					{ayahs.map((ayah, index) => (
						<AyahPage
							surah={surah}
							key={ayah.number}
							ayah={ayah}
							newLimit={loadMoreAyah}
							isLast={index === ayahs.length - 2}
							hafalanMode={hafalanMode}
							selectedQari={selectedQari}
							onQariChange={setSelectedQari}
						/>
					))}
				</ul>
			</div>

			{isFetchingMore && (
				<div className='py-4'>
					<SkeletonReader />
				</div>
			)}

			{!hasMore && ayahs.length > 0 && (
				<p className='text-center text-xs text-gray-400 dark:text-gray-600 py-4'>
					{t('quran.all_displayed')}
				</p>
			)}

			<ScrollableComponent>
				<div className='flex justify-between items-center text-sm max-w-4xl mx-auto'>
					<div
						className={classNames({
							'flex items-center': true,
							'opacity-30 pointer-events-none': !prevHref,
						})}
					>
						<Link
							className='flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors'
							href={prevHref}
						>
							<TbPlayerTrackPrev size={14} />
							<span className='hidden sm:inline'>{t('quran.prev_surah')}</span>
							<span className='sm:hidden'>Prev</span>
						</Link>
					</div>
					<div
						className={classNames({
							'flex items-center': true,
							'opacity-30 pointer-events-none': !nextHref,
						})}
					>
						<Link
							className='flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors'
							href={nextHref}
						>
							<span className='hidden sm:inline'>{t('quran.next_surah')}</span>
							<span className='sm:hidden'>Next</span>
							<TbPlayerTrackNext size={14} />
						</Link>
					</div>
				</div>
			</ScrollableComponent>
			<AutoScrollButton />
		</div>
	);
};

export default InfiniteScrollAyahPage;
