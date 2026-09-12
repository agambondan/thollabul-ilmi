import Link from "next/link";

export default function DetailPagerNav({
    prev,
    next,
    prevChrome,
    nextChrome,
    className = "",
}) {
    if (!prev && !next) return null;

    return (
        <nav className={`mt-6 grid grid-cols-2 gap-3 ${className}`}>
            {prev ? (
                <Link
                    href={prev.href}
                    className='flex flex-col rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors min-w-0'
                >
                    <span className='text-[11px] text-gray-400 flex items-center gap-1'>
                        ← {prevChrome}
                    </span>
                    <span className='text-sm font-medium text-emerald-900 dark:text-white truncate mt-0.5'>
                        {prev.label}
                    </span>
                </Link>
            ) : (
                <span />
            )}
            {next ? (
                <Link
                    href={next.href}
                    className='flex flex-col items-end text-right rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors min-w-0'
                >
                    <span className='text-[11px] text-gray-400 flex items-center gap-1'>
                        {nextChrome} →
                    </span>
                    <span className='text-sm font-medium text-emerald-900 dark:text-white truncate mt-0.5'>
                        {next.label}
                    </span>
                </Link>
            ) : (
                <span />
            )}
        </nav>
    );
}
