export default function HadithLoading() {
    return (
        <main className='min-h-screen bg-parchment-50 dark:bg-slate-900 px-4 pt-24 pb-12'>
            <div className='max-w-4xl mx-auto space-y-6 animate-pulse'>
                {/* Header Skeleton */}
                <div className='h-36 bg-emerald-900/20 rounded-2xl w-full' />
                {/* Books Grid Skeleton */}
                <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className='h-32 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl p-4'
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
