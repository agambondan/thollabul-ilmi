import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(145deg, #065f46 0%, #047857 100%)",
                borderRadius: "40px",
            }}
        >
            <svg
                width='130'
                height='130'
                viewBox='0 0 100 100'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                {/* Book pages */}
                <path
                    d='M10 28 C10 28 34 20 50 20 C66 20 90 28 90 28 L90 72 C90 72 66 64 50 64 C34 64 10 72 10 72 Z'
                    fill='white'
                    fillOpacity='0.95'
                />
                {/* Center spine */}
                <line
                    x1='50'
                    y1='20'
                    x2='50'
                    y2='64'
                    stroke='#065f46'
                    strokeWidth='4'
                    strokeLinecap='round'
                />
                {/* Text lines — left page */}
                <path
                    d='M22 36 C30 34 42 33.5 50 34'
                    stroke='#065f46'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    opacity='0.35'
                />
                <path
                    d='M22 45 C30 43 42 42.5 50 43'
                    stroke='#065f46'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    opacity='0.35'
                />
                <path
                    d='M22 54 C30 52 42 51.5 50 52'
                    stroke='#065f46'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    opacity='0.35'
                />
                {/* Text lines — right page */}
                <path
                    d='M78 36 C70 34 58 33.5 50 34'
                    stroke='#065f46'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    opacity='0.35'
                />
                <path
                    d='M78 45 C70 43 58 42.5 50 43'
                    stroke='#065f46'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    opacity='0.35'
                />
                <path
                    d='M78 54 C70 52 58 51.5 50 52'
                    stroke='#065f46'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    opacity='0.35'
                />
                {/* Gold bookmark */}
                <rect
                    x='44'
                    y='64'
                    width='12'
                    height='16'
                    rx='2'
                    fill='#fbbf24'
                />
                <polygon
                    points='44,80 50,75.5 56,80'
                    fill='#065f46'
                    opacity='0.4'
                />
            </svg>
        </div>,
        { ...size },
    );
}
