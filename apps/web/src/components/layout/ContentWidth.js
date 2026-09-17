"use client";

import { useLayoutMode } from "@/lib/useLayoutMode";
import classNames from "classnames";

const ContentWidth = ({
    children,
    compact = "max-w-3xl",
    className = "",
    wideClassName = "w-full max-w-none",
    compactClassName,
}) => {
    const { isWide } = useLayoutMode();

    return (
        <div
            className={classNames(
                isWide
                    ? wideClassName
                    : (compactClassName ?? `${compact} mx-auto`),
                className,
            )}
        >
            {children}
        </div>
    );
};

export default ContentWidth;
