export default function manifest() {
    return {
        name: "Thollabul Ilmi",
        short_name: "Thollabul Ilmi",
        description:
            "Islamic knowledge portal for Al-Quran, Hadith, duas, dhikr, memorization, and more.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#065f46",
        theme_color: "#065f46",
        icons: [
            {
                src: "/icon",
                sizes: "32x32",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
                purpose: "any",
            },
        ],
        categories: ["education", "religion", "lifestyle"],
    };
}
