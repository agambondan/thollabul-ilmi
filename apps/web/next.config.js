const path = require("path");

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
};

module.exports = nextConfig;
