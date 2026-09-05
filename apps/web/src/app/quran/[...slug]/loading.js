export default function QuranSurahLoading() {
    return (
        <main className='min-h-screen bg-parchment-50 dark:bg-slate-900 px-4 pt-24 pb-12'>
            <div className='max-w-4xl mx-auto space-y-4 animate-pulse'>
                {/* Surah Header Skeleton */}
                <div className='h-24 bg-emerald-900/20 rounded-2xl w-full' />
                <div className='h-12 bg-emerald-800/10 rounded-xl w-full max-w-sm mx-auto' />
                {/* Ayah Cards */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className='bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-2xl p-5 space-y-3'
                    >
                        <div className='flex items-center justify-between'>
                            <div className='h-7 w-7 bg-emerald-700/20 rounded-full' />
                            <div className='h-4 bg-emerald-800/10 rounded w-24' />
                        </div>
                        <div className='h-10 bg-emerald-800/10 rounded w-full' />
                        <div className='h-4 bg-emerald-800/5 rounded w-3/4' />
                    </div>
                ))}
            </div>
        </main>
    );
}
