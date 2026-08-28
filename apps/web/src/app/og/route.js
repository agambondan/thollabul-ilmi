import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

const size = { width: 1200, height: 630 };

export async function GET() {
    try {
        const image = new ImageResponse(
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#065f46",
                    fontFamily: "sans-serif",
                }}
            >
                {/* Book icon box */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "140px",
                        height: "140px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderRadius: "32px",
                        marginBottom: "40px",
                    }}
                >
                    <svg
                        width='90'
                        height='90'
                        viewBox='0 0 100 100'
                        fill='none'
                    >
                        <path
                            d='M10 28 C10 28 34 20 50 20 C66 20 90 28 90 28 L90 72 C90 72 66 64 50 64 C34 64 10 72 10 72 Z'
                            fill='white'
                            fill-opacity='0.95'
                        />
                        <line
                            x1='50'
                            y1='20'
                            x2='50'
                            y2='64'
                            stroke='#065f46'
                            stroke-width='4'
                        />
                        <rect
                            x='44'
                            y='64'
                            width='12'
                            height='16'
                            rx='2'
                            fill='#fbbf24'
                        />
                    </svg>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: "flex",
                        fontSize: "72px",
                        fontWeight: "800",
                        color: "white",
                        lineHeight: 1,
                        marginBottom: "20px",
                    }}
                >
                    Thullaabul &apos;Ilmi
                </div>

                {/* Tagline */}
                <div
                    style={{
                        display: "flex",
                        fontSize: "28px",
                        color: "#6ee7b7",
                    }}
                >
                    Islamic Knowledge Portal — Al-Quran · Hadith · Duas
                </div>
            </div>,
            { ...size },
        );

        const buf = await image.arrayBuffer();
        return new Response(buf, {
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=86400, immutable",
            },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[og] render failed:", msg);
        return new Response(msg, { status: 500 });
    }
}
