"use client";

/**
 * Replaces the root layout entirely when it throws, so it cannot rely on any
 * provider (no LocaleProvider, no theme class) — hence the inline styles and
 * bilingual copy.
 */
export default function GlobalError({ error, reset }) {
    return (
        <html lang='id'>
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fdfaf3",
                    color: "#064e3b",
                    fontFamily: "system-ui, sans-serif",
                    padding: "1.5rem",
                }}
            >
                <div style={{ maxWidth: "28rem", textAlign: "center" }}>
                    <p style={{ fontSize: "2.5rem", margin: 0 }}>⚠️</p>
                    <h1 style={{ fontSize: "1.25rem", margin: "0.75rem 0" }}>
                        Terjadi kesalahan · Something went wrong
                    </h1>
                    <p
                        style={{
                            fontSize: "0.875rem",
                            lineHeight: 1.6,
                            color: "#475569",
                        }}
                    >
                        Muat ulang halaman ini. Jika masih gagal, coba lagi
                        beberapa saat lagi.
                        <br />
                        Reload this page. If it keeps failing, try again
                        shortly.
                    </p>
                    <button
                        type='button'
                        onClick={() => reset()}
                        style={{
                            marginTop: "1.5rem",
                            padding: "0.5rem 1.25rem",
                            borderRadius: "9999px",
                            border: "none",
                            background: "#047857",
                            color: "#fff",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                        }}
                    >
                        Coba lagi · Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
