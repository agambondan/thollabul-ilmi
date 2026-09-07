// Auto-injected by build/dev tooling. Provides lightweight inline SVG icon
// components so pages don't need to import the heavier react-icons bundles.
import React from "react";

const Base = ({ size = 16, className = "", children, ...rest }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...rest}
    >
        {children}
    </svg>
);

export const SearchIcon = (props) => (
    <Base {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Base>
);

export const PlayCircleIcon = (props) => (
    <Base {...props}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></Base>
);

export const ShareIcon = (props) => (
    <Base {...props}>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </Base>
);

export const ThreeDotsIcon = (props) => (
    <Base {...props}>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </Base>
);
