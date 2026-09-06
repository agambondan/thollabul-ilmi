"use client";

import classNames from "classnames";

/**
 * Shared chrome for the admin and dashboard panels.
 *
 * Every list screen used to inline the same card + scroll + table markup, so a
 * styling change meant touching ~20 files — and a typo in one of them (the
 * non-existent `slate-750` hover) went unnoticed because there was no single
 * place to look. Keep the surface styling here; pages describe only their data.
 */

/** Outer padding for one panel screen. */
export const PanelPage = ({ children, className }) => (
    <div className={classNames("p-4 md:p-6", className)}>{children}</div>
);

/** Screen title, optional subtitle, and right-aligned actions. */
export const PanelHeader = ({ title, subtitle, actions, className }) => (
    <div
        className={classNames(
            "flex items-start justify-between gap-3 mb-6",
            className,
        )}
    >
        <div className='min-w-0'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                {title}
            </h1>
            {subtitle ? (
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {subtitle}
                </p>
            ) : null}
        </div>
        {actions ? (
            <div className='flex items-center gap-2 shrink-0'>{actions}</div>
        ) : null}
    </div>
);

/** Card surface — the white/slate panel every list and form sits on. */
export const PanelCard = ({ children, className, padded = false }) => (
    <div
        className={classNames(
            "bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden",
            padded && "p-4 md:p-6",
            className,
        )}
    >
        {children}
    </div>
);

/**
 * Card + horizontal scroll + table.
 *
 * `head` is the <Th> cells only — the header <tr> is supplied here so a page
 * cannot accidentally give the header row the body row's hover styling.
 *
 * `minWidth` keeps columns legible on phones by letting the table scroll inside
 * the card instead of squashing; it is an inline style because Tailwind cannot
 * generate a class from a runtime value.
 */
export const PanelTable = ({
    head,
    children,
    minWidth = 640,
    className,
    tableClassName,
}) => (
    <PanelCard className={className}>
        <div className='overflow-x-auto'>
            <table
                className={classNames("w-full text-sm", tableClassName)}
                style={{ minWidth }}
            >
                <thead className='bg-gray-50 dark:bg-slate-700'>
                    <tr>{head}</tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                    {children}
                </tbody>
            </table>
        </div>
    </PanelCard>
);

export const Th = ({ children, className, align = "left" }) => (
    <th
        className={classNames(
            "px-4 py-3 font-medium text-gray-600 dark:text-gray-300",
            align === "left" && "text-left",
            align === "right" && "text-right",
            align === "center" && "text-center",
            className,
        )}
    >
        {children}
    </th>
);

export const Td = ({ children, className, ...rest }) => (
    <td className={classNames("px-4 py-3", className)} {...rest}>
        {children}
    </td>
);

/** A body row. The dark hover colour lives here so it can never drift again. */
export const Tr = ({ children, className, ...rest }) => (
    <tr
        className={classNames(
            "hover:bg-gray-50 dark:hover:bg-slate-700",
            className,
        )}
        {...rest}
    >
        {children}
    </tr>
);

/** Placeholder row for an empty result set. */
export const PanelEmpty = ({ colSpan, children }) => (
    <tr>
        <td
            colSpan={colSpan}
            className='px-4 py-8 text-center text-gray-400 dark:text-gray-400'
        >
            {children}
        </td>
    </tr>
);

/**
 * Footer pager for a panel list.
 *
 * Admin screens hold their whole dataset in memory so search can span it, but
 * rendering all of it produced pages tens of thousands of pixels tall. Slice at
 * the render boundary instead: search still sees everything, the DOM does not.
 */
export const PanelPagination = ({
    page,
    pageCount,
    total,
    onChange,
    labels,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50],
}) => {
    if (pageCount <= 1 && !onPageSizeChange) return null;
    const btn =
        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 enabled:hover:bg-gray-50 dark:enabled:hover:bg-slate-700";

    return (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 mt-4'>
            <div className='flex items-center gap-3'>
                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {page} / {pageCount}
                    {typeof total === "number" ? ` · Total: ${total}` : null}
                </p>
                {onPageSizeChange && (
                    <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
                        <span>Baris:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className='px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs text-gray-700 dark:text-gray-200 outline-none cursor-pointer'
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className='flex items-center gap-2'>
                <button
                    type='button'
                    className={btn}
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1}
                >
                    {labels?.prev ?? "Prev"}
                </button>
                <button
                    type='button'
                    className={btn}
                    onClick={() => onChange(page + 1)}
                    disabled={page >= pageCount}
                >
                    {labels?.next ?? "Next"}
                </button>
            </div>
        </div>
    );
};
