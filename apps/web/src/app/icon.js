import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#065f46",
                borderRadius: "6px",
            }}
        >
            <svg
                width='24'
                height='24'
                viewBox='0 0 100 100'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M10 28 C10 28 34 20 50 20 C66 20 90 28 90 28 L90 72 C90 72 66 64 50 64 C34 64 10 72 10 72 Z'
                    fill='white'
                    fillOpacity='0.95'
                />
                <line
                    x1='50'
                    y1='20'
                    x2='50'
                    y2='64'
                    stroke='#065f46'
                    strokeWidth='5'
                    strokeLinecap='round'
                />
                <rect
                    x='44'
                    y='64'
                    width='12'
                    height='14'
                    rx='2'
                    fill='#fbbf24'
                />
            </svg>
        </div>,
        { ...size },
    );
}
