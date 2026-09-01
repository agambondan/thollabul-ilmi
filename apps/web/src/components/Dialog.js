"use client";

import { useLocale } from "@/context/Locale";
import { useCallback, useEffect, useId, useRef } from "react";
import { MdClose } from "react-icons/md";

const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

let openDialogCount = 0;

/**
 * Modal dialog with the behaviour every overlay in this app was missing:
 * dialog semantics for screen readers, a focus trap, focus restored to
 * whatever opened it, Escape to close, and a scroll lock so the page behind
 * does not slide around on mobile.
 *
 * Nested dialogs share one scroll lock via `openDialogCount`, so closing an
 * inner dialog does not unlock the body while an outer one is still open.
 */
const Dialog = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
    initialFocusRef,
    closeOnBackdrop = true,
    hideCloseButton = false,
}) => {
    const { t } = useLocale();
    const panelRef = useRef(null);
    const restoreFocusRef = useRef(null);
    const headingId = useId();
    const descriptionId = useId();

    const handleClose = useCallback(() => {
        if (onClose) onClose();
    }, [onClose]);

    // Scroll lock, shared across nested dialogs.
    useEffect(() => {
        if (!open) return undefined;

        openDialogCount += 1;
        const { body } = document;
        const previousOverflow = body.style.overflow;
        const previousPaddingRight = body.style.paddingRight;

        if (openDialogCount === 1) {
            const scrollbar = window.innerWidth - body.clientWidth;
            body.style.overflow = "hidden";
            if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
        }

        return () => {
            openDialogCount = Math.max(0, openDialogCount - 1);
            if (openDialogCount === 0) {
                body.style.overflow = previousOverflow;
                body.style.paddingRight = previousPaddingRight;
            }
        };
    }, [open]);

    // Focus management + Escape + Tab trap.
    useEffect(() => {
        if (!open) return undefined;

        restoreFocusRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const focusFirst = () => {
            const target =
                initialFocusRef?.current ??
                panelRef.current?.querySelector(FOCUSABLE) ??
                panelRef.current;
            target?.focus?.();
        };
        const frame = requestAnimationFrame(focusFirst);

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                handleClose();
                return;
            }
            if (event.key !== "Tab" || !panelRef.current) return;

            const items = Array.from(
                panelRef.current.querySelectorAll(FOCUSABLE),
            ).filter(
                (el) =>
                    el.offsetParent !== null || el === document.activeElement,
            );
            if (items.length === 0) {
                event.preventDefault();
                panelRef.current.focus();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown, true);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("keydown", onKeyDown, true);
            restoreFocusRef.current?.focus?.();
        };
    }, [open, handleClose, initialFocusRef]);

    if (!open) return null;

    const width =
        size === "sm"
            ? "max-w-sm"
            : size === "lg"
              ? "max-w-3xl"
              : size === "full"
                ? "max-w-5xl"
                : "max-w-lg";

    return (
        <div className='fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4'>
            <div
                className='absolute inset-0 bg-black/50 backdrop-blur-[2px]'
                onClick={closeOnBackdrop ? handleClose : undefined}
                aria-hidden='true'
            />
            <div
                ref={panelRef}
                role='dialog'
                aria-modal='true'
                aria-labelledby={title ? headingId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                aria-label={title ? undefined : t("common.dialog")}
                tabIndex={-1}
                className={`relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl dark:bg-slate-900`}
            >
                {(title || !hideCloseButton) && (
                    <div className='flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-slate-800'>
                        <div className='min-w-0'>
                            {title && (
                                <h2
                                    id={headingId}
                                    className='truncate text-base font-bold text-gray-900 dark:text-white'
                                >
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p
                                    id={descriptionId}
                                    className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'
                                >
                                    {description}
                                </p>
                            )}
                        </div>
                        {!hideCloseButton && (
                            <button
                                type='button'
                                onClick={handleClose}
                                aria-label={t("common.close")}
                                className='-mr-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:hover:bg-slate-800 dark:hover:text-gray-200'
                            >
                                <MdClose
                                    className='text-xl'
                                    aria-hidden='true'
                                />
                            </button>
                        )}
                    </div>
                )}

                <div className='flex-1 overflow-y-auto px-5 py-4'>
                    {children}
                </div>

                {footer && (
                    <div className='border-t border-gray-100 px-5 py-3 dark:border-slate-800'>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dialog;
