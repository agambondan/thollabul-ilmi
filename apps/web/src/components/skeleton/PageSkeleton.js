/**
 * Route-level fallback. Server components in this app fetch during render, so
 * without a loading boundary a navigation showed the previous page frozen
 * until the new one was ready.
 */
export default function PageSkeleton({ rows = 6 }) {
    return (
        <div
            className='mx-auto w-full max-w-4xl px-4 py-8'
            role='status'
            aria-busy='true'
            aria-live='polite'
        >
            <span className='sr-only'>Loading</span>
            <div className='h-8 w-56 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800' />
            <div className='mt-3 h-4 w-80 max-w-full animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800/70' />
            <div className='mt-8 space-y-3'>
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className='h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800/70'
                    />
                ))}
            </div>
        </div>
    );
}
