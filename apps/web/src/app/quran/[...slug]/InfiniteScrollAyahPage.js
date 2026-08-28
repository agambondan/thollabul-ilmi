'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import AyahPage from '@/app/quran/[...slug]/AyahPage';
import AutoScrollButton from '@/components/popup/AutoScrollButton';
import ScrollableComponent from '@/components/popup/ScrollableButton';
import MushafContinuousView from '@/components/quran/MushafContinuousView';
import { SkeletonReader } from '@/components/skeleton/Skeleton';
import SurahAudioPlayer from '@/components/SurahAudioPlayer';
import { useLocale } from '@/context/Locale';
import { progressApi, streakApi } from '@/lib/api';
import { getLocalizedTranslation } from '@/lib/translation';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { useQuranFont } from '@/lib/useQuranFont';
import classNames from 'classnames';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { TbPlayerTrackNext, TbPlayerTrackPrev } from 'react-icons/tb';

const PAGE_SIZE = 10;
const BASMALAH_ARABIC = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

const shouldShowSurahBasmalah = (surahNumber) => {
	const number = Number(surahNumber);
	return number > 1 && number !== 9;
};

const normalizeAyahs = (data) => {
	if (Array.isArray(data?.ayahs)) return data.ayahs;
	if (Array.isArray(data?.items)) return data.items;
	if (Array.isArray(data)) return data;
	return [];
};

const InfiniteScrollAyahPage = ({ params, searchParams, basePath = '/quran/surah' }) => {
	const { t, lang } = useLocale();
	const { isWide } = useLayoutMode();
	const { fontCls } = useQuranFont();
	const [surah, setSurah] = useState(null);
	const [ayahs, setAyahs] = useState([]);
	const [pageRequest, setPageRequest] = useState(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isFetchingMore, setIsFetchingMore] = useState(false);
	const [isFetchingMushaf, setIsFetchingMushaf] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState('');
	const [hafalanMode, setHafalanMode] = useState('off');
	const [readerMode, setReaderMode] = useState('ayah');
	const [showMushafTranslation, setShowMushafTranslation] = useState(true);
	const [selectedQari, setSelectedQari] = useState('');
	const [openActionMenuAyahId, setOpenActionMenuAyahId] = useState(null);
	const loadMoreSentinelRef = useRef(null);
	const pendingPageRef = useRef(null);
	const retryAfterRef = useRef(0);

	const rawSlug = params.slug;
	const slugPart = Array.isArray(rawSlug) ? (rawSlug[0] === 'surah' ? rawSlug[1] : rawSlug[0]) : rawSlug;
	const slug = decodeURIComponent(slugPart ?? '');

	const loadMoreAyah = useCallback(() => {
		if (isInitialLoading || isFetchingMore || !hasMore) return;
		if (Date.now() < retryAfterRef.current) return;
		const nextPage = Math.floor(ayahs.length / PAGE_SIZE);
		if (nextPage <= 0 || pendingPageRef.current === nextPage) return;
		pendingPageRef.current = nextPage;
		setPageRequest({ index: nextPage, requestedAt: Date.now() });
	}, [ayahs.length, hasMore, isFetchingMore, isInitialLoading]);

	const getTargetAyah = () => {
		if (typeof window === 'undefined') return 0;
		const hash = window.location.hash.replace('#', '');
		if (!hash) return 0;
		const match = hash.match(/^(?:ayah-?)?(\d+)$/);
		if (!match) return 0;
		return parseInt(match[1], 10);
	};

	const fetchSurah = useCallback(
		async (pageIndex, size = PAGE_SIZE) => {
			const target = pageIndex === 0 ? getTargetAyah() : 0;
			const nextSize = target > 0 ? Math.max(size, Math.ceil(target / PAGE_SIZE) * PAGE_SIZE) : size;

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/v1/surah/name/${slug}?page=${pageIndex}&size=${nextSize}`,
			);
			if (!res.ok) {
				const err = new Error('failed');
				err.status = res.status;
				err.retryAfter = Number.parseInt(res.headers.get('retry-after') ?? '', 10);
				throw err;
			}
			return res.json();
		},
		[slug],
	);

	const openMushafMode = useCallback(async () => {
		setReaderMode('mushaf');
		const totalAyahs = surah?.number_of_ayahs ?? ayahs.length;
		if (!surah || ayahs.length >= totalAyahs) return;

		setIsFetchingMushaf(true);
		try {
			const data = await fetchSurah(0, totalAyahs);
			const nextAyahs = normalizeAyahs(data);
			if (!nextAyahs.length) return;
			setSurah(data ?? surah);
			setAyahs(nextAyahs);
			setHasMore(nextAyahs.length < totalAyahs);
		} catch {
			setError(t('quran.error_desc'));
		} finally {
			setIsFetchingMushaf(false);
		}
	}, [ayahs.length, fetchSurah, surah, t]);

	useEffect(() => {
		let isActive = true;
		setIsInitialLoading(true);
		setError('');
		setPageRequest(null);
		pendingPageRef.current = null;
		retryAfterRef.current = 0;
		setAyahs([]);
		setSurah(null);
		setHasMore(true);
		setOpenActionMenuAyahId(null);

		fetchSurah(0)
			.then((data) => {
				if (!isActive) return;
				const nextSurah = data ?? {};
				const nextAyahs = normalizeAyahs(nextSurah);
				setSurah(nextSurah);
				setAyahs(nextAyahs);
				setHasMore(nextAyahs.length < (nextSurah.number_of_ayahs ?? nextAyahs.length));
				if (nextSurah.number && nextAyahs[0]) {
					progressApi.saveQuran(nextSurah.number, nextAyahs[0].number, nextAyahs[0].id).catch(e => console.error(e));
					streakApi.logActivity('quran').catch(e => console.error(e));
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
		if (!pageRequest || !surah) return;

		let isActive = true;
		setIsFetchingMore(true);
		fetchSurah(pageRequest.index)
			.then((data) => {
				if (!isActive) return;
				const nextAyahs = normalizeAyahs(data);
				if (!nextAyahs.length) {
					const totalAyahs = surah.number_of_ayahs ?? ayahs.length;
					if (ayahs.length >= totalAyahs) setHasMore(false);
					return;
				}
				setAyahs((prev) => {
					const seen = new Set(prev.map((item) => item.number));
					const merged = [
						...prev,
						...nextAyahs.filter((item) => !seen.has(item.number)),
					];
					setHasMore(merged.length < (surah.number_of_ayahs ?? merged.length));
					return merged;
				});
			})
			.catch((err) => {
				if (isActive) {
					const retryAfterSeconds = Number.isFinite(err?.retryAfter)
						? Math.max(1, err.retryAfter)
						: 2;
					retryAfterRef.current =
						err?.status === 429
							? Date.now() + retryAfterSeconds * 1000
							: Date.now() + 1500;
					pendingPageRef.current = null;
				}
			})
			.finally(() => {
				if (isActive) {
					pendingPageRef.current = null;
					setIsFetchingMore(false);
				}
			});

		return () => {
			isActive = false;
		};
	}, [fetchSurah, pageRequest, surah]);

	useEffect(() => {
		if (isInitialLoading || !hasMore) return;
		const sentinel = loadMoreSentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) loadMoreAyah();
			},
			{ rootMargin: '700px 0px' },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [ayahs.length, hasMore, isInitialLoading, loadMoreAyah]);

	useEffect(() => {
		if (isInitialLoading || !hasMore) return;

		const maybeLoadMore = () => {
			const remaining =
				document.documentElement.scrollHeight - (window.innerHeight + window.scrollY);
			if (remaining < 900) loadMoreAyah();
		};

		window.addEventListener('scroll', maybeLoadMore, { passive: true });
		maybeLoadMore();
		return () => window.removeEventListener('scroll', maybeLoadMore);
	}, [hasMore, isInitialLoading, loadMoreAyah]);

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
	const showSurahBasmalah = shouldShowSurahBasmalah(surah?.number);

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
					{showSurahBasmalah && (
						<p
							className={`${fontCls} mt-1 text-3xl leading-[1.8] text-gray-800 dark:text-gray-100`}
							style={{ direction: 'rtl' }}
						>
							{BASMALAH_ARABIC}
						</p>
					)}
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

				<div className='flex flex-wrap items-center gap-2 px-4 py-2 text-xs border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40'>
					<span className='text-emerald-700 dark:text-emerald-400 font-medium'>
						{t('mushaf.view')}:
					</span>
					{[
						{ value: 'ayah', label: t('mushaf.list') },
						{ value: 'mushaf', label: t('mushaf.continuous') },
					].map((m) => (
						<button
							key={m.value}
							type='button'
							onClick={() => (m.value === 'mushaf' ? openMushafMode() : setReaderMode(m.value))}
							disabled={m.value === 'mushaf' && isFetchingMushaf}
							aria-pressed={readerMode === m.value}
							className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
								readerMode === m.value
									? 'bg-emerald-500 text-white'
									: 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-slate-700'
							}`}
						>
							{m.label}
						</button>
					))}
					{readerMode === 'mushaf' && (
						<button
							type='button'
							onClick={() => setShowMushafTranslation((v) => !v)}
							className='px-2.5 py-1 rounded-full font-medium bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
						>
							{showMushafTranslation ? t('mushaf.translation_off') : t('mushaf.translation_on')}
						</button>
					)}
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

				{readerMode === 'mushaf' ? (
					<div className='p-4 bg-gray-50 dark:bg-slate-950'>
						{isFetchingMushaf ? (
							<SkeletonReader />
						) : (
							<MushafContinuousView
								ayahs={ayahs.map((ayah) => ({ ...ayah, surah }))}
								lang={lang}
								showTranslation={showMushafTranslation}
								readerBasePath={basePath}
							/>
						)}
					</div>
				) : (
					<ul
						key={`${surahTitle}-${surah?.number ?? ''}`}
						id={`${surahTitle}-${surah?.number ?? ''}`}
					>
						{ayahs.map((ayah) => {
							const actionMenuKey = ayah.id ?? `${surah?.number ?? 'surah'}:${ayah.number}`;
							return (
								<AyahPage
									surah={surah}
									key={ayah.number}
									ayah={ayah}
									newLimit={loadMoreAyah}
									isLast={false}
									hafalanMode={hafalanMode}
									selectedQari={selectedQari}
									onQariChange={setSelectedQari}
									isActionMenuOpen={openActionMenuAyahId === actionMenuKey}
									onActionMenuToggle={(isOpen) => setOpenActionMenuAyahId(isOpen ? actionMenuKey : null)}
								/>
							);
						})}
					</ul>
				)}
				<div ref={loadMoreSentinelRef} className='h-px' aria-hidden='true' />
			</div>

			{isFetchingMore && (
				<div className='py-4'>
					<SkeletonReader />
				</div>
			)}

			{!hasMore && ayahs.length >= (surah?.number_of_ayahs ?? ayahs.length) && (
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
