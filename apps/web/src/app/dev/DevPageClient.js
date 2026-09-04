"use client";

import { useLocale } from "@/context/Locale";
import DeveloperKeyManager from "./DeveloperKeyManager";

const BASE_URL = "https://api.tholabul-ilmi.com";

const groupsByLang = {
    ID: [
        {
            title: "Al-Quran",
            color: "emerald",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/surah",
                    desc: "Daftar semua surah (114 surah)",
                },
                {
                    method: "GET",
                    path: "/api/v1/surah/:id",
                    desc: "Detail surah berdasarkan ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/surah/number/:number",
                    desc: "Detail surah berdasarkan nomor",
                },
                {
                    method: "GET",
                    path: "/api/v1/surah/name/:name",
                    desc: "Cari surah berdasarkan nama",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah",
                    desc: "Daftar ayat dengan filter (query param)",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah/:id",
                    desc: "Detail ayat berdasarkan ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah/number/:number",
                    desc: "Ayat berdasarkan nomor global",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah/surah/number/:number",
                    desc: "Semua ayat dalam surah tertentu",
                },
                {
                    method: "GET",
                    path: "/api/v1/juz",
                    desc: "Daftar 30 juz Al-Quran",
                },
                {
                    method: "GET",
                    path: "/api/v1/juz/:id",
                    desc: "Detail juz berdasarkan ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/juz/surah/:name",
                    desc: "Juz berdasarkan nama surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/tafsir/surah/:number",
                    desc: "Tafsir per surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/tafsir/ayah/:id",
                    desc: "Tafsir per ayat",
                },
                {
                    method: "GET",
                    path: "/api/v1/asbabun-nuzul/surah/:number",
                    desc: "Asbabun Nuzul per surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/asbabun-nuzul/ayah/:id",
                    desc: "Asbabun Nuzul per ayat",
                },
                {
                    method: "GET",
                    path: "/api/v1/mufrodat/ayah/:id",
                    desc: "Kosakata (mufrodat) per ayat",
                },
                {
                    method: "GET",
                    path: "/api/v1/mufrodat/root/:word",
                    desc: "Mufrodat berdasarkan akar kata",
                },
                {
                    method: "GET",
                    path: "/api/v1/audio/surah/:surahId",
                    desc: "Audio tilawah per surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/audio/ayah/:ayahId",
                    desc: "Audio tilawah per ayat",
                },
            ],
        },
        {
            title: "Hadith",
            color: "amber",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/books",
                    desc: "Daftar kitab hadith",
                },
                {
                    method: "GET",
                    path: "/api/v1/books/:id",
                    desc: "Detail kitab berdasarkan ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/books/slug/:slug",
                    desc: "Detail kitab berdasarkan slug",
                },
                {
                    method: "GET",
                    path: "/api/v1/themes",
                    desc: "Daftar tema hadith",
                },
                {
                    method: "GET",
                    path: "/api/v1/themes/book/:slug",
                    desc: "Tema per kitab",
                },
                { method: "GET", path: "/api/v1/chapters", desc: "Daftar bab" },
                {
                    method: "GET",
                    path: "/api/v1/chapters/theme/:id",
                    desc: "Bab per tema",
                },
                {
                    method: "GET",
                    path: "/api/v1/chapters/book/:slug/theme/:themeId",
                    desc: "Bab per kitab dan tema",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths",
                    desc: "Daftar hadith",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/:id",
                    desc: "Detail hadith berdasarkan ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/book/:slug",
                    desc: "Hadith per kitab",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/book/:slug/number/:number",
                    desc: "Detail hadith berdasarkan kitab dan nomor",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/theme/slug/:slug",
                    desc: "Hadith berdasarkan slug tema",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/theme/:themeId",
                    desc: "Hadith berdasarkan ID tema",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/chapter/:id",
                    desc: "Hadith per bab",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/:id/sanad",
                    desc: "Sanad lengkap hadith",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/:id/takhrij",
                    desc: "Takhrij riwayat hadith",
                },
            ],
        },
        {
            title: "Ilmu Rijal",
            color: "rose",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/perawi",
                    desc: "Daftar perawi hadith",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/search",
                    desc: "Cari perawi (?q=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/tabaqah/:tabaqah",
                    desc: "Perawi per thabaqah",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id",
                    desc: "Detail perawi",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id/guru",
                    desc: "Daftar guru perawi",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id/murid",
                    desc: "Daftar murid perawi",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id/jarh-tadil",
                    desc: "Penilaian jarh wa ta'dil per perawi",
                },
                {
                    method: "GET",
                    path: "/api/v1/jarh-tadil",
                    desc: "Daftar penilaian jarh wa ta'dil",
                },
                {
                    method: "GET",
                    path: "/api/v1/jarh-tadil/:id",
                    desc: "Detail penilaian",
                },
                {
                    method: "GET",
                    path: "/api/v1/sanad/:id",
                    desc: "Detail sanad beserta mata sanad",
                },
                {
                    method: "GET",
                    path: "/api/v1/takhrij",
                    desc: "Daftar takhrij riwayat",
                },
                {
                    method: "GET",
                    path: "/api/v1/takhrij/:id",
                    desc: "Detail takhrij",
                },
            ],
        },
        {
            title: "Doa, Dzikir & Wirid",
            color: "purple",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/doa",
                    desc: "Semua doa harian",
                },
                { method: "GET", path: "/api/v1/doa/:id", desc: "Detail doa" },
                {
                    method: "GET",
                    path: "/api/v1/doa/category/:category",
                    desc: "Doa berdasarkan kategori",
                },
                { method: "GET", path: "/api/v1/dzikir", desc: "Semua dzikir" },
                {
                    method: "GET",
                    path: "/api/v1/dzikir/:id",
                    desc: "Detail dzikir",
                },
                {
                    method: "GET",
                    path: "/api/v1/dzikir/category/:category",
                    desc: "Dzikir berdasarkan kategori",
                },
                {
                    method: "GET",
                    path: "/api/v1/wirid/occasion/:occasion",
                    desc: "Wirid khusus (jumat, arafah, ramadan, dst)",
                },
            ],
        },
        {
            title: "Asmaul Husna",
            color: "sky",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/asmaul-husna",
                    desc: "Semua 99 Asmaul Husna",
                },
                {
                    method: "GET",
                    path: "/api/v1/asmaul-husna/:number",
                    desc: "Detail per nomor",
                },
            ],
        },
        {
            title: "Siroh, Blog & Sejarah",
            color: "orange",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/siroh/categories",
                    desc: "Kategori siroh nabawi",
                },
                {
                    method: "GET",
                    path: "/api/v1/siroh/categories/:slug",
                    desc: "Detail kategori siroh",
                },
                {
                    method: "GET",
                    path: "/api/v1/siroh/contents",
                    desc: "Semua konten siroh",
                },
                {
                    method: "GET",
                    path: "/api/v1/siroh/contents/:slug",
                    desc: "Detail konten siroh",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts",
                    desc: "Daftar artikel blog",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts/popular",
                    desc: "Artikel populer",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts/:slug",
                    desc: "Detail artikel",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts/:slug/related",
                    desc: "Artikel terkait",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/categories",
                    desc: "Daftar kategori blog",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/categories/:slug/posts",
                    desc: "Artikel per kategori",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/tags",
                    desc: "Daftar tag blog",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/tags/:slug/posts",
                    desc: "Artikel per tag",
                },
                {
                    method: "GET",
                    path: "/api/v1/history",
                    desc: "Timeline sejarah Islam",
                },
                {
                    method: "GET",
                    path: "/api/v1/history/:slug",
                    desc: "Detail peristiwa sejarah",
                },
            ],
        },
        {
            title: "Ibadah & Panduan",
            color: "cyan",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/sholat-times",
                    desc: "Jadwal sholat (?lat=&lon=&date=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/sholat-times/week",
                    desc: "Jadwal sholat 7 hari",
                },
                {
                    method: "GET",
                    path: "/api/v1/imsakiyah",
                    desc: "Imsakiyah Ramadan",
                },
                {
                    method: "GET",
                    path: "/api/v1/kiblat",
                    desc: "Arah kiblat (?lat=&lon=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/panduan-sholat",
                    desc: "Panduan tata cara sholat",
                },
                {
                    method: "GET",
                    path: "/api/v1/panduan-sholat/:step",
                    desc: "Detail langkah sholat",
                },
                {
                    method: "GET",
                    path: "/api/v1/manasik/:type",
                    desc: "Manasik haji/umrah (umrah|haji)",
                },
                {
                    method: "GET",
                    path: "/api/v1/manasik/:type/:step",
                    desc: "Detail langkah manasik",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/today",
                    desc: "Tanggal Hijriah hari ini",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/convert",
                    desc: "Konversi Masehi ke Hijriah (?date=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/events",
                    desc: "Peristiwa penting kalender Hijriah",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/events/:month",
                    desc: "Peristiwa per bulan Hijriah",
                },
            ],
        },
        {
            title: "Belajar & Referensi",
            color: "teal",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/fiqh",
                    desc: "Kategori fiqh ringkas",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/categories",
                    desc: "Daftar kategori fiqh",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/categories/:slug",
                    desc: "Detail kategori fiqh",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/item/:slug",
                    desc: "Detail item fiqh berdasarkan slug",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/:slug/:id",
                    desc: "Item fiqh per kategori dan ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/kajian",
                    desc: "Koleksi kajian (audio/video)",
                },
                {
                    method: "GET",
                    path: "/api/v1/kajian/:id",
                    desc: "Detail kajian",
                },
                {
                    method: "GET",
                    path: "/api/v1/dictionary",
                    desc: "Kamus istilah Islam",
                },
                {
                    method: "GET",
                    path: "/api/v1/dictionary/category/:category",
                    desc: "Istilah per kategori",
                },
                {
                    method: "GET",
                    path: "/api/v1/dictionary/:term",
                    desc: "Detail istilah",
                },
                {
                    method: "GET",
                    path: "/api/v1/quiz/session",
                    desc: "Sesi quiz/flashcard",
                },
                {
                    method: "GET",
                    path: "/api/v1/amalan",
                    desc: "Daftar template amalan harian",
                },
            ],
        },
        {
            title: "Komunitas & Tools",
            color: "slate",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/search",
                    desc: "Pencarian global (quran, hadith, dll)",
                },
                {
                    method: "GET",
                    path: "/api/v1/leaderboard/streak",
                    desc: "Leaderboard streak aktivitas",
                },
                {
                    method: "GET",
                    path: "/api/v1/leaderboard/hafalan",
                    desc: "Leaderboard hafalan surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/feed",
                    desc: "Daftar share feed publik",
                },
                {
                    method: "GET",
                    path: "/api/v1/feed/:id",
                    desc: "Detail item feed",
                },
                {
                    method: "GET",
                    path: "/api/v1/comments",
                    desc: "Komentar (?ref_type=&ref_id=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/share/ayah/:id",
                    desc: "Metadata share kartu ayat",
                },
                {
                    method: "GET",
                    path: "/api/v1/share/hadith/:id",
                    desc: "Metadata share kartu hadith",
                },
                {
                    method: "POST",
                    path: "/api/v1/zakat/maal",
                    desc: "Hitung zakat maal",
                },
                {
                    method: "POST",
                    path: "/api/v1/zakat/fitrah",
                    desc: "Hitung zakat fitrah",
                },
                {
                    method: "GET",
                    path: "/api/v1/zakat/nishab",
                    desc: "Nilai nishab terkini",
                },
            ],
        },
    ],
    EN: [
        {
            title: "Al-Quran",
            color: "emerald",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/surah",
                    desc: "List all surahs (114 surahs)",
                },
                {
                    method: "GET",
                    path: "/api/v1/surah/:id",
                    desc: "Surah details by ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/surah/number/:number",
                    desc: "Surah by number",
                },
                {
                    method: "GET",
                    path: "/api/v1/surah/name/:name",
                    desc: "Search surah by name",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah",
                    desc: "List ayahs with filters (query params)",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah/:id",
                    desc: "Ayah details by ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah/number/:number",
                    desc: "Ayah by global number",
                },
                {
                    method: "GET",
                    path: "/api/v1/ayah/surah/number/:number",
                    desc: "All ayahs in a surah",
                },
                { method: "GET", path: "/api/v1/juz", desc: "List all 30 juz" },
                {
                    method: "GET",
                    path: "/api/v1/juz/:id",
                    desc: "Juz details by ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/juz/surah/:name",
                    desc: "Juz containing a surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/tafsir/surah/:number",
                    desc: "Tafsir by surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/tafsir/ayah/:id",
                    desc: "Tafsir by ayah",
                },
                {
                    method: "GET",
                    path: "/api/v1/asbabun-nuzul/surah/:number",
                    desc: "Asbabun Nuzul by surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/asbabun-nuzul/ayah/:id",
                    desc: "Asbabun Nuzul by ayah",
                },
                {
                    method: "GET",
                    path: "/api/v1/mufrodat/ayah/:id",
                    desc: "Vocabulary (mufrodat) by ayah",
                },
                {
                    method: "GET",
                    path: "/api/v1/mufrodat/root/:word",
                    desc: "Mufrodat by root word",
                },
                {
                    method: "GET",
                    path: "/api/v1/audio/surah/:surahId",
                    desc: "Recitation audio by surah",
                },
                {
                    method: "GET",
                    path: "/api/v1/audio/ayah/:ayahId",
                    desc: "Recitation audio by ayah",
                },
            ],
        },
        {
            title: "Hadith",
            color: "amber",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/books",
                    desc: "List hadith books",
                },
                {
                    method: "GET",
                    path: "/api/v1/books/:id",
                    desc: "Book details by ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/books/slug/:slug",
                    desc: "Book details by slug",
                },
                {
                    method: "GET",
                    path: "/api/v1/themes",
                    desc: "List hadith themes",
                },
                {
                    method: "GET",
                    path: "/api/v1/themes/book/:slug",
                    desc: "Themes by book",
                },
                {
                    method: "GET",
                    path: "/api/v1/chapters",
                    desc: "List chapters",
                },
                {
                    method: "GET",
                    path: "/api/v1/chapters/theme/:id",
                    desc: "Chapters by theme",
                },
                {
                    method: "GET",
                    path: "/api/v1/chapters/book/:slug/theme/:themeId",
                    desc: "Chapters by book and theme",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths",
                    desc: "List hadiths",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/:id",
                    desc: "Hadith details by ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/book/:slug",
                    desc: "Hadiths by book",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/book/:slug/number/:number",
                    desc: "Hadith details by book and number",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/theme/slug/:slug",
                    desc: "Hadiths by theme slug",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/theme/:themeId",
                    desc: "Hadiths by theme ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/chapter/:id",
                    desc: "Hadiths by chapter",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/:id/sanad",
                    desc: "Hadith full sanad",
                },
                {
                    method: "GET",
                    path: "/api/v1/hadiths/:id/takhrij",
                    desc: "Hadith takhrij narrations",
                },
            ],
        },
        {
            title: "Ilmu Rijal",
            color: "rose",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/perawi",
                    desc: "List hadith narrators",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/search",
                    desc: "Search narrators (?q=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/tabaqah/:tabaqah",
                    desc: "Narrators by thabaqah",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id",
                    desc: "Narrator details",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id/guru",
                    desc: "Narrator teachers",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id/murid",
                    desc: "Narrator students",
                },
                {
                    method: "GET",
                    path: "/api/v1/perawi/:id/jarh-tadil",
                    desc: "Jarh wa ta'dil rulings per narrator",
                },
                {
                    method: "GET",
                    path: "/api/v1/jarh-tadil",
                    desc: "List jarh wa ta'dil rulings",
                },
                {
                    method: "GET",
                    path: "/api/v1/jarh-tadil/:id",
                    desc: "Ruling details",
                },
                {
                    method: "GET",
                    path: "/api/v1/sanad/:id",
                    desc: "Sanad details with mata sanad",
                },
                {
                    method: "GET",
                    path: "/api/v1/takhrij",
                    desc: "List takhrij narrations",
                },
                {
                    method: "GET",
                    path: "/api/v1/takhrij/:id",
                    desc: "Takhrij details",
                },
            ],
        },
        {
            title: "Dua, Dhikr & Wirid",
            color: "purple",
            endpoints: [
                { method: "GET", path: "/api/v1/doa", desc: "All daily duas" },
                { method: "GET", path: "/api/v1/doa/:id", desc: "Dua details" },
                {
                    method: "GET",
                    path: "/api/v1/doa/category/:category",
                    desc: "Duas by category",
                },
                { method: "GET", path: "/api/v1/dzikir", desc: "All dhikr" },
                {
                    method: "GET",
                    path: "/api/v1/dzikir/:id",
                    desc: "Dhikr details",
                },
                {
                    method: "GET",
                    path: "/api/v1/dzikir/category/:category",
                    desc: "Dhikr by category",
                },
                {
                    method: "GET",
                    path: "/api/v1/wirid/occasion/:occasion",
                    desc: "Special wirid (jumat, arafah, ramadan, etc.)",
                },
            ],
        },
        {
            title: "Asmaul Husna",
            color: "sky",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/asmaul-husna",
                    desc: "All 99 Asmaul Husna",
                },
                {
                    method: "GET",
                    path: "/api/v1/asmaul-husna/:number",
                    desc: "Details by number",
                },
            ],
        },
        {
            title: "Sirah, Blog & History",
            color: "orange",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/siroh/categories",
                    desc: "Prophetic sirah categories",
                },
                {
                    method: "GET",
                    path: "/api/v1/siroh/categories/:slug",
                    desc: "Sirah category details",
                },
                {
                    method: "GET",
                    path: "/api/v1/siroh/contents",
                    desc: "All sirah content",
                },
                {
                    method: "GET",
                    path: "/api/v1/siroh/contents/:slug",
                    desc: "Sirah content details",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts",
                    desc: "Blog article list",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts/popular",
                    desc: "Popular articles",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts/:slug",
                    desc: "Article details",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/posts/:slug/related",
                    desc: "Related articles",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/categories",
                    desc: "Blog categories",
                },
                {
                    method: "GET",
                    path: "/api/v1/blog/categories/:slug/posts",
                    desc: "Articles by category",
                },
                { method: "GET", path: "/api/v1/blog/tags", desc: "Blog tags" },
                {
                    method: "GET",
                    path: "/api/v1/blog/tags/:slug/posts",
                    desc: "Articles by tag",
                },
                {
                    method: "GET",
                    path: "/api/v1/history",
                    desc: "Islamic history timeline",
                },
                {
                    method: "GET",
                    path: "/api/v1/history/:slug",
                    desc: "Historical event details",
                },
            ],
        },
        {
            title: "Worship & Guides",
            color: "cyan",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/sholat-times",
                    desc: "Prayer times (?lat=&lon=&date=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/sholat-times/week",
                    desc: "Prayer times for 7 days",
                },
                {
                    method: "GET",
                    path: "/api/v1/imsakiyah",
                    desc: "Ramadan imsakiyah schedule",
                },
                {
                    method: "GET",
                    path: "/api/v1/kiblat",
                    desc: "Qibla direction (?lat=&lon=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/panduan-sholat",
                    desc: "Prayer step-by-step guide",
                },
                {
                    method: "GET",
                    path: "/api/v1/panduan-sholat/:step",
                    desc: "Prayer step details",
                },
                {
                    method: "GET",
                    path: "/api/v1/manasik/:type",
                    desc: "Hajj/Umrah manasik (umrah|haji)",
                },
                {
                    method: "GET",
                    path: "/api/v1/manasik/:type/:step",
                    desc: "Manasik step details",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/today",
                    desc: "Today's Hijri date",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/convert",
                    desc: "Convert Gregorian to Hijri (?date=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/events",
                    desc: "Important Hijri events",
                },
                {
                    method: "GET",
                    path: "/api/v1/hijri/events/:month",
                    desc: "Events by Hijri month",
                },
            ],
        },
        {
            title: "Learning & Reference",
            color: "teal",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/fiqh",
                    desc: "Concise fiqh categories",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/categories",
                    desc: "List fiqh categories",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/categories/:slug",
                    desc: "Fiqh category details",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/item/:slug",
                    desc: "Fiqh item by slug",
                },
                {
                    method: "GET",
                    path: "/api/v1/fiqh/:slug/:id",
                    desc: "Fiqh item by category and ID",
                },
                {
                    method: "GET",
                    path: "/api/v1/kajian",
                    desc: "Lecture collection (audio/video)",
                },
                {
                    method: "GET",
                    path: "/api/v1/kajian/:id",
                    desc: "Lecture details",
                },
                {
                    method: "GET",
                    path: "/api/v1/dictionary",
                    desc: "Islamic terms dictionary",
                },
                {
                    method: "GET",
                    path: "/api/v1/dictionary/category/:category",
                    desc: "Terms by category",
                },
                {
                    method: "GET",
                    path: "/api/v1/dictionary/:term",
                    desc: "Term details",
                },
                {
                    method: "GET",
                    path: "/api/v1/quiz/session",
                    desc: "Quiz/flashcard session",
                },
                {
                    method: "GET",
                    path: "/api/v1/amalan",
                    desc: "Daily amalan templates",
                },
            ],
        },
        {
            title: "Community & Tools",
            color: "slate",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/v1/search",
                    desc: "Global search (quran, hadith, etc.)",
                },
                {
                    method: "GET",
                    path: "/api/v1/leaderboard/streak",
                    desc: "Activity streak leaderboard",
                },
                {
                    method: "GET",
                    path: "/api/v1/leaderboard/hafalan",
                    desc: "Surah memorization leaderboard",
                },
                {
                    method: "GET",
                    path: "/api/v1/feed",
                    desc: "Public share feed",
                },
                {
                    method: "GET",
                    path: "/api/v1/feed/:id",
                    desc: "Feed item details",
                },
                {
                    method: "GET",
                    path: "/api/v1/comments",
                    desc: "Comments (?ref_type=&ref_id=)",
                },
                {
                    method: "GET",
                    path: "/api/v1/share/ayah/:id",
                    desc: "Ayah share card metadata",
                },
                {
                    method: "GET",
                    path: "/api/v1/share/hadith/:id",
                    desc: "Hadith share card metadata",
                },
                {
                    method: "POST",
                    path: "/api/v1/zakat/maal",
                    desc: "Calculate zakat maal",
                },
                {
                    method: "POST",
                    path: "/api/v1/zakat/fitrah",
                    desc: "Calculate zakat fitrah",
                },
                {
                    method: "GET",
                    path: "/api/v1/zakat/nishab",
                    desc: "Current nishab values",
                },
            ],
        },
    ],
};

const colorMap = {
    emerald: {
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        title: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800",
        header: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    amber: {
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        title: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        header: "bg-amber-50 dark:bg-amber-900/20",
    },
    purple: {
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
        title: "text-purple-700 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
        header: "bg-purple-50 dark:bg-purple-900/20",
    },
    sky: {
        badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
        title: "text-sky-700 dark:text-sky-400",
        border: "border-sky-200 dark:border-sky-800",
        header: "bg-sky-50 dark:bg-sky-900/20",
    },
    orange: {
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
        title: "text-orange-700 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        header: "bg-orange-50 dark:bg-orange-900/20",
    },
    teal: {
        badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
        title: "text-teal-700 dark:text-teal-400",
        border: "border-teal-200 dark:border-teal-800",
        header: "bg-teal-50 dark:bg-teal-900/20",
    },
    rose: {
        badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
        title: "text-rose-700 dark:text-rose-400",
        border: "border-rose-200 dark:border-rose-800",
        header: "bg-rose-50 dark:bg-rose-900/20",
    },
    cyan: {
        badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
        title: "text-cyan-700 dark:text-cyan-400",
        border: "border-cyan-200 dark:border-cyan-800",
        header: "bg-cyan-50 dark:bg-cyan-900/20",
    },
    slate: {
        badge: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
        title: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-700",
        header: "bg-slate-50 dark:bg-slate-800/40",
    },
};

const methodBadge = {
    GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function DevPageClient() {
    const { lang, t } = useLocale();
    const groups = groupsByLang[lang] ?? groupsByLang.ID;
    const totalEndpoints = groups.reduce(
        (acc, g) => acc + g.endpoints.length,
        0,
    );

    return (
        <div className='max-w-4xl mx-auto px-4 py-8'>
            <div className='mb-10'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    وَاجِهَةُ الْبَرْمَجَة
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("dev.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-4'>
                    {t("dev.subtitle")}
                </p>

                <div className='flex items-center gap-3 bg-slate-900 dark:bg-slate-950 rounded-xl px-4 py-3 font-mono text-sm overflow-x-auto'>
                    <span className='text-slate-500 dark:text-slate-300 shrink-0'>
                        {t("dev.base_url")}
                    </span>
                    <span className='text-emerald-400 font-semibold'>
                        {BASE_URL}
                    </span>
                </div>
            </div>

            <div className='mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 dark:text-emerald-200'>
                {t("dev.public_get_prefix")}{" "}
                <span className='font-mono bg-white dark:bg-slate-800 px-1 rounded'>
                    GET
                </span>{" "}
                {t("dev.public_get_suffix")}
            </div>

            <div className='mb-6 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                <span className='font-mono px-2 py-1 rounded bg-gray-100 dark:bg-slate-800'>
                    {totalEndpoints} endpoints
                </span>
                <span className='font-mono px-2 py-1 rounded bg-gray-100 dark:bg-slate-800'>
                    {groups.length} groups
                </span>
            </div>

            <div className='mb-8'>
                <DeveloperKeyManager />
            </div>

            <div className='flex flex-col gap-6'>
                {groups.map((group) => {
                    const c = colorMap[group.color] ?? colorMap.slate;
                    return (
                        <div
                            key={group.title}
                            className={`border rounded-2xl overflow-hidden ${c.border}`}
                        >
                            <div
                                className={`px-4 py-3 ${c.header} flex items-center justify-between`}
                            >
                                <h2
                                    className={`font-semibold text-sm ${c.title}`}
                                >
                                    {group.title}
                                </h2>
                                <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${c.badge}`}
                                >
                                    {group.endpoints.length}
                                </span>
                            </div>
                            <div className='divide-y divide-gray-100 dark:divide-slate-700/60'>
                                {group.endpoints.map((ep) => (
                                    <div
                                        key={`${ep.method}-${ep.path}`}
                                        className='flex flex-col sm:flex-row sm:items-start gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors'
                                    >
                                        <span
                                            className={`shrink-0 text-xs font-bold font-mono px-2 py-0.5 rounded ${methodBadge[ep.method] ?? c.badge} w-fit`}
                                        >
                                            {ep.method}
                                        </span>
                                        <code className='text-sm text-slate-700 dark:text-slate-200 dark:text-slate-300 font-mono break-all'>
                                            {ep.path}
                                        </code>
                                        <span className='sm:ml-auto text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 sm:text-right shrink-0 max-w-xs'>
                                            {ep.desc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className='mt-8 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden'>
                <div className='px-4 py-3 bg-slate-50 dark:bg-slate-800/60'>
                    <h2 className='font-semibold text-sm text-slate-700 dark:text-slate-200 dark:text-slate-300'>
                        {t("dev.auth_title")}
                    </h2>
                </div>
                <div className='px-4 py-4 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400 leading-relaxed'>
                    {t("dev.auth_intro")}
                    <pre className='mt-3 bg-slate-900 dark:bg-slate-950 text-emerald-400 rounded-xl px-4 py-3 font-mono text-xs overflow-x-auto'>
                        {`Authorization: Bearer <token>`}
                    </pre>
                    <p className='mt-3'>{t("dev.auth_scope")}</p>
                </div>
            </div>

            <p className='mt-8 text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300'>
                {t("dev.full_docs_soon")}
            </p>
        </div>
    );
}
