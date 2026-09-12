"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

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
            <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                {title}
            </h1>
            {subtitle ? (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
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

/**
 * `sortKey` + `onSort` turn the header into a toggle button; omit both for a
 * plain (non-sortable) header, unchanged from before this pair existed.
 * `activeSort` is the page's current `{ key, dir }` state — compare it against
 * this header's own `sortKey` to know whether to show the active arrow.
 */
export const Th = ({
    children,
    className,
    align = "left",
    sortKey,
    activeSort,
    onSort,
}) => {
    const isSortable = Boolean(sortKey && onSort);
    const isActive = isSortable && activeSort?.key === sortKey;

    return (
        <th
            className={classNames(
                "px-5 py-3.5 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap",
                align === "left" && "text-left",
                align === "right" && "text-right",
                align === "center" && "text-center",
                className,
            )}
        >
            {isSortable ? (
                <button
                    type='button'
                    onClick={() => onSort(sortKey)}
                    className={classNames(
                        "inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white",
                        isActive && "text-gray-900 dark:text-white",
                    )}
                >
                    {children}
                    <span className='text-[10px] leading-none opacity-70'>
                        {isActive ? (activeSort.dir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                </button>
            ) : (
                children
            )}
        </th>
    );
};

/**
 * Toggle helper for a page's own sort state: same key flips direction, a new
 * key starts ascending. Pages own the state (`useState(null)` or a default
 * column) and call `setSort((s) => toggleSort(s, key))` from `Th`'s `onSort`.
 */
export const toggleSort = (current, key) => {
    if (current?.key === key) {
        return { key, dir: current.dir === "asc" ? "desc" : "asc" };
    }
    return { key, dir: "asc" };
};

/**
 * Apply a page's sort state to its item list using per-key comparators the
 * page supplies (string/number/date fields all differ, so there is no single
 * generic comparator). Returns `items` unchanged if there's no active sort or
 * no comparator registered for the active key.
 */
export const applySort = (items, sort, comparators) => {
    if (!sort?.key || !comparators?.[sort.key]) return items;
    const compare = comparators[sort.key];
    const sorted = [...items].sort(compare);
    return sort.dir === "desc" ? sorted.reverse() : sorted;
};

/**
 * A single "Semua" + option-list filter dropdown, styled to match
 * `PanelPagination`'s page-size select. `options` is `[{value, label}]`;
 * `value === ""` means "no filter" (the `allLabel` option).
 */
export const PanelFilterSelect = ({
    label,
    value,
    onChange,
    options,
    allLabel = "Semua",
    className,
}) => (
    <div
        className={classNames(
            "flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400",
            className,
        )}
    >
        {label ? <span>{label}:</span> : null}
        <select
            aria-label={label}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className='px-2 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs text-gray-700 dark:text-gray-200 outline-none cursor-pointer'
        >
            <option value=''>{allLabel}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

export const Td = ({ children, className, ...rest }) => (
    <td
        className={classNames("px-5 py-4 leading-relaxed align-top", className)}
        {...rest}
    >
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
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {page} / {pageCount}
                    {typeof total === "number" ? ` · Total: ${total}` : null}
                </p>
                {onPageSizeChange && (
                    <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
                        <span>Baris:</span>
                        <select
                            value={pageSize}
                            onChange={(e) =>
                                onPageSizeChange(Number(e.target.value))
                            }
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

/**
 * Multi-select filter — a button that opens a checkbox list. Use this instead
 * of `PanelFilterSelect` when a row can plausibly match more than one option
 * at once (free-text/multi-tag fields), or when the page just wants an "OR
 * across several values" filter. `selected` is the array of currently-checked
 * values; `onChange` receives the whole next array on every toggle.
 */
export const PanelFilterCheckboxGroup = ({
    label,
    selected = [],
    onChange,
    options,
    allLabel = "Semua",
    className,
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onOutsideClick = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onOutsideClick);
        return () =>
            document.removeEventListener("mousedown", onOutsideClick);
    }, [open]);

    const toggleValue = (value) => {
        onChange(
            selected.includes(value)
                ? selected.filter((v) => v !== value)
                : [...selected, value],
        );
    };

    const summary =
        selected.length === 0
            ? allLabel
            : selected.length === 1
              ? (options.find((o) => o.value === selected[0])?.label ??
                selected[0])
              : `${selected.length} dipilih`;

    return (
        <div
            ref={containerRef}
            className={classNames("relative", className)}
        >
            <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
                {label ? <span>{label}:</span> : null}
                <button
                    type='button'
                    aria-label={label ? `${label}: ${summary}` : summary}
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                    className='flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs text-gray-700 dark:text-gray-200 outline-none cursor-pointer max-w-[12rem] truncate'
                >
                    <span className='truncate'>{summary}</span>
                    <span className='shrink-0 opacity-60'>▾</span>
                </button>
            </div>
            {open && (
                <div className='absolute z-20 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 shadow-lg'>
                    {selected.length > 0 && (
                        <button
                            type='button'
                            onClick={() => onChange([])}
                            className='mb-1 w-full rounded px-2 py-1 text-left text-xs text-emerald-700 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                        >
                            Hapus semua ({selected.length})
                        </button>
                    )}
                    {options.map((opt) => (
                        <label
                            key={opt.value}
                            className='flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                        >
                            <input
                                type='checkbox'
                                checked={selected.includes(opt.value)}
                                onChange={() => toggleValue(opt.value)}
                                className='mt-0.5 shrink-0'
                            />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};
