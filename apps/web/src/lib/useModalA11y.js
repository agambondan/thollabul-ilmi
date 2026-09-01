"use client";

import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

let openCount = 0;

/**
 * Adds the missing modal behaviour to an existing overlay without changing its
 * markup: spread the returned props onto the panel element.
 *
 * Use this for the overlays that already had their own backdrop and layout
 * (`ModalShell` replaces the scaffold; `Dialog` is for new modals). All three
 * share the same contract — dialog semantics, focus trap, focus restore,
 * Escape, body scroll lock.
 */
export const useModalA11y = ({ open = true, onClose, label } = {}) => {
    const panelRef = useRef(null);
    const restoreRef = useRef(null);

    const close = useCallback(() => {
        if (onClose) onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;

        openCount += 1;
        const { body } = document;
        const previousOverflow = body.style.overflow;
        if (openCount === 1) body.style.overflow = "hidden";

        restoreRef.current =
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
                close();
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
            openCount = Math.max(0, openCount - 1);
            if (openCount === 0) body.style.overflow = previousOverflow;
            restoreRef.current?.focus?.();
        };
    }, [open, close]);

    return {
        ref: panelRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": label,
        tabIndex: -1,
    };
};
