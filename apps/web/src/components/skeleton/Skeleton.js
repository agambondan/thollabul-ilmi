"use client";

const S = ({ className = "" }) => (
    <div
        className={`animate-pulse rounded bg-gray-200 dark:bg-slate-700 ${className}`}
    />
);

export const SkeletonNavbar = () => (
    <div className='fixed inset-x-0 top-0 z-50 h-14 bg-emerald-900 dark:bg-gray-950 border-b border-emerald-800 dark:border-gray-800 flex items-center px-4 gap-4'>
        <div className='flex flex-col gap-1'>
            <S className='h-3.5 w-36 bg-emerald-700/60 dark:bg-slate-600' />
            <S className='h-2.5 w-24 bg-emerald-700/40 dark:bg-slate-700' />
        </div>
        <div className='ml-auto flex items-center gap-3'>
            <S className='h-7 w-7 rounded-full bg-emerald-700/60 dark:bg-slate-600' />
            <S className='h-7 w-7 rounded-full bg-emerald-700/60 dark:bg-slate-600' />
        </div>
    </div>
);

const SkeletonSection = ({ children }) => (
    <div className='pt-14 min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <div className='py-6'>{children}</div>
    </div>
);

export const SkeletonProfile = () => (
    <div className='min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <SkeletonNavbar />
        <SkeletonSection>
            <div className='max-w-2xl mx-auto px-4 space-y-4'>
                {/* Header */}
                <div className='flex items-center gap-3 mb-6'>
                    <S className='w-12 h-12 rounded-full' />
                    <div className='space-y-2 flex-1'>
                        <S className='h-4 w-32' />
                        <S className='h-3 w-48' />
                    </div>
                    <S className='h-8 w-16 rounded-lg' />
                </div>
                {/* Streak card */}
                <S className='h-28 w-full rounded-2xl' />
                {/* Progress cards */}
                <div className='grid grid-cols-2 gap-3'>
                    <S className='h-20 rounded-xl' />
                    <S className='h-20 rounded-xl' />
                </div>
                {/* Quick links */}
                <div className='grid grid-cols-2 gap-3'>
                    {[...Array(4)].map((_, i) => (
                        <S key={i} className='h-14 rounded-xl' />
                    ))}
                </div>
                {/* Accordions */}
                <S className='h-14 rounded-2xl' />
                <S className='h-14 rounded-2xl' />
                <S className='h-14 rounded-2xl' />
            </div>
        </SkeletonSection>
    </div>
);

export const SkeletonList = ({ rows = 6, title = true }) => (
    <div className='min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <SkeletonNavbar />
        <SkeletonSection>
            <div className='max-w-3xl mx-auto px-4 space-y-3'>
                {title && (
                    <div className='text-center mb-8 space-y-2'>
                        <S className='h-8 w-24 mx-auto rounded-full' />
                        <S className='h-6 w-40 mx-auto' />
                        <S className='h-4 w-64 mx-auto' />
                    </div>
                )}
                {[...Array(rows)].map((_, i) => (
                    <div
                        key={i}
                        className='flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'
                    >
                        <S className='w-10 h-10 rounded-lg shrink-0' />
                        <div className='flex-1 space-y-2'>
                            <S className='h-3.5 w-3/4' />
                            <S className='h-3 w-1/2' />
                        </div>
                        <S className='h-6 w-16 rounded-lg shrink-0' />
                    </div>
                ))}
            </div>
        </SkeletonSection>
    </div>
);

export const SkeletonCards = ({ cols = 2, rows = 3 }) => (
    <div className='min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <SkeletonNavbar />
        <SkeletonSection>
            <div className='max-w-3xl mx-auto px-4'>
                <div className='text-center mb-8 space-y-2'>
                    <S className='h-8 w-24 mx-auto rounded-full' />
                    <S className='h-6 w-40 mx-auto' />
                    <S className='h-4 w-56 mx-auto' />
                </div>
                <div
                    className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1"}`}
                >
                    {[...Array(cols * rows)].map((_, i) => (
                        <S key={i} className='h-24 rounded-xl' />
                    ))}
                </div>
            </div>
        </SkeletonSection>
    </div>
);

export const SkeletonStats = () => (
    <div className='min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <SkeletonNavbar />
        <SkeletonSection>
            <div className='max-w-2xl mx-auto px-4 space-y-4'>
                <div className='flex items-center gap-2 mb-6'>
                    <S className='h-5 w-5 rounded' />
                    <S className='h-7 w-40' />
                </div>
                {/* Chart */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <S className='h-3 w-32 mb-4' />
                    <div className='flex items-end gap-1.5 h-20'>
                        {[60, 80, 40, 100, 70, 50, 90].map((h, i) => (
                            <div
                                key={i}
                                className='flex flex-col items-center flex-1 gap-1'
                            >
                                <S
                                    className='w-full rounded-t-sm'
                                    style={{ height: `${h}%` }}
                                />
                                <S className='h-2 w-4 rounded' />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Stat cards */}
                <div className='grid grid-cols-2 gap-3'>
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 space-y-2'
                        >
                            <S className='h-3 w-24' />
                            <S className='h-8 w-16' />
                        </div>
                    ))}
                </div>
            </div>
        </SkeletonSection>
    </div>
);

export const SkeletonHafalan = () => (
    <div className='min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <SkeletonNavbar />
        <SkeletonSection>
            <div className='max-w-3xl mx-auto px-4 space-y-3'>
                {/* Summary bar */}
                <S className='h-20 w-full rounded-2xl mb-6' />
                {/* Filter tabs */}
                <div className='flex gap-2 mb-4'>
                    {[...Array(4)].map((_, i) => (
                        <S key={i} className='h-8 w-20 rounded-lg' />
                    ))}
                </div>
                {/* Surah rows */}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className='flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3'
                    >
                        <S className='w-8 h-8 rounded-lg shrink-0' />
                        <div className='flex-1 space-y-1.5'>
                            <S className='h-3.5 w-28' />
                            <S className='h-3 w-16' />
                        </div>
                        <S className='h-8 w-24 rounded-lg shrink-0' />
                    </div>
                ))}
            </div>
        </SkeletonSection>
    </div>
);

export const SkeletonReader = () => (
    <div className='min-h-screen bg-parchment-50 dark:bg-slate-900'>
        <SkeletonNavbar />
        <SkeletonSection>
            <div className='max-w-4xl mx-auto px-4 space-y-6'>
                {/* Header */}
                <div className='text-center py-6 space-y-3'>
                    <S className='h-6 w-12 mx-auto rounded-full' />
                    <S className='h-8 w-48 mx-auto' />
                    <S className='h-5 w-32 mx-auto' />
                    <S className='h-10 w-64 mx-auto rounded-full mt-2' />
                </div>
                {/* Ayah cards */}
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4'
                    >
                        <div className='flex justify-between'>
                            <S className='h-6 w-8 rounded-full' />
                            <div className='flex gap-2'>
                                <S className='h-7 w-7 rounded-lg' />
                                <S className='h-7 w-7 rounded-lg' />
                                <S className='h-7 w-7 rounded-lg' />
                            </div>
                        </div>
                        <S
                            className={`h-10 w-${i % 2 === 0 ? "full" : "4/5"} ml-auto`}
                        />
                        <S className='h-4 w-3/4' />
                        <S className='h-3.5 w-2/3' />
                    </div>
                ))}
            </div>
        </SkeletonSection>
    </div>
);

export const SkeletonInline = ({ rows = 4 }) => (
    <div className='space-y-3 py-4'>
        {[...Array(rows)].map((_, i) => (
            <div
                key={i}
                className='flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'
            >
                <S className='w-9 h-9 rounded-lg shrink-0' />
                <div className='flex-1 space-y-2'>
                    <S
                        className={`h-3.5 ${i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-2/3"}`}
                    />
                    <S className='h-3 w-1/2' />
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonInlineCards = ({ cols = 2, rows = 2 }) => (
    <div
        className={`grid gap-3 py-4 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}
    >
        {[...Array(cols * rows)].map((_, i) => (
            <S key={i} className='h-20 rounded-xl' />
        ))}
    </div>
);

export { S as SkeletonBlock };
