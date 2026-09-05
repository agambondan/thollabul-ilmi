const path = require("path");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    outputFileTracingRoot: path.resolve(__dirname),
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    },
    turbopack: {
        root: path.resolve(__dirname),
    },
    images: {
        formats: ["image/avif", "image/webp"],
    },
    async redirects() {
        return [
            {
                source: "/sholat-tracker",
                destination: "/dashboard/sholat-tracker",
                permanent: true,
            },
            {
                source: "/tilawah",
                destination: "/dashboard/tilawah",
                permanent: true,
            },
            {
                source: "/stats",
                destination: "/dashboard/stats",
                permanent: true,
            },
            {
                source: "/goals",
                destination: "/dashboard/goals",
                permanent: true,
            },
            {
                source: "/hafalan",
                destination: "/dashboard/hafalan",
                permanent: true,
            },
            {
                source: "/amalan",
                destination: "/dashboard/amalan",
                permanent: true,
            },
            {
                source: "/muroja-ah",
                destination: "/dashboard/muroja-ah",
                permanent: true,
            },
            {
                source: "/muhasabah",
                destination: "/dashboard/muhasabah",
                permanent: true,
            },
            {
                source: "/bookmarks",
                destination: "/dashboard/bookmarks",
                permanent: true,
            },
            {
                source: "/notifications",
                destination: "/dashboard/notifications",
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/fonts/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/assets/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
        ];
    },
};

module.exports = withBundleAnalyzer(nextConfig);
