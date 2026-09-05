"use client";

import { useLocale } from "@/context/Locale";
import { useCallback, useEffect, useId, useRef } from "react";

const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

let openModalCount = 0;

/**
 * Drop-in replacement for the hand-rolled `fixed inset-0` overlays used across
 * the app. It keeps each modal's existing panel markup and classes intact —
 * only the outer scaffolding changes — while adding what every one of them was
 * missing: dialog semantics, a focus trap, focus restored on close, Escape,
 * and a body scroll lock.
 *
 * Use `Dialog` for new modals; this exists so the existing ones could be fixed
 * without redesigning 20-odd screens.
 */
const ModalShell = ({
    isOpen = true,
    onClose,
    children,
    panelClassName = "",
    overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
    label,
    closeOnBackdrop = true,
}) => {
    const { t } = useLocale();
    const panelRef = useRef(null);
    const restoreFocusRef = useRef(null);
    const labelId = useId();

    const handleClose = useCallback(() => {
        if (onClose) onClose();
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;
        openModalCount += 1;
        const { body } = document;
        const previousOverflow = body.style.overflow;
        if (openModalCount === 1) body.style.overflow = "hidden";

        restoreFocusRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const frame = requestAnimationFrame(() => {
            const target =
                panelRef.current?.querySelector(FOCUSABLE) ?? panelRef.current;
            target?.focus?.();
        });

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                handleClose();
                return;
            }
            if (event.key !== "Tab" || !panelRef.current) return;

            const items = Array.from(
                panelRef.current.querySelectorAll(FOCUSABLE),
            ).filter((el) => el.offsetParent !== null);
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
            openModalCount = Math.max(0, openModalCount - 1);
            if (openModalCount === 0) body.style.overflow = previousOverflow;
            restoreFocusRef.current?.focus?.();
        };
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return (
        <div className={overlayClassName}>
            <div
                className='absolute inset-0'
                onClick={closeOnBackdrop ? handleClose : undefined}
                aria-hidden='true'
            />
            <div
                ref={panelRef}
                role='dialog'
                aria-modal='true'
                aria-label={label ?? t("common.dialog")}
                aria-labelledby={undefined}
                id={labelId}
                tabIndex={-1}
                className={`relative outline-none ${panelClassName}`}
            >
                {children}
            </div>
        </div>
    );
};

export default ModalShell;
