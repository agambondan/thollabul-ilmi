export const defaultMockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "user",
    email_verified_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
};

export const mockSurahs = [
    {
        number: 1,
        name: "الفاتحة",
        number_of_ayahs: 7,
        revelation_type: "meccan",
        translation: {
            ar: "سُورَةُ الفَاتِحَة",
            latin_en: "Al-Fatihah",
            idn: "Pembukaan",
            latin_idn: "Al-Fatihah",
        },
    },
    {
        number: 2,
        name: "البقرة",
        number_of_ayahs: 286,
        revelation_type: "medinan",
        translation: {
            ar: "سُورَةُ البَقَرَة",
            latin_en: "Al-Baqarah",
            idn: "Sapi Betina",
            latin_idn: "Al-Baqarah",
        },
    },
    {
        number: 36,
        name: "يس",
        number_of_ayahs: 83,
        revelation_type: "meccan",
        translation: {
            ar: "سُورَةُ يس",
            latin_en: "Ya Sin",
            idn: "Ya Sin",
            latin_idn: "Ya Sin",
        },
    },
    {
        number: 67,
        name: "الملك",
        number_of_ayahs: 30,
        revelation_type: "meccan",
        translation: {
            ar: "سُورَةُ المُلْك",
            latin_en: "Al-Mulk",
            idn: "Kerajaan",
            latin_idn: "Al-Mulk",
        },
    },
    {
        number: 112,
        name: "الإخلاص",
        number_of_ayahs: 4,
        revelation_type: "meccan",
        translation: {
            ar: "سُورَةُ الإخْلَاص",
            latin_en: "Al-Ikhlas",
            idn: "Keikhlasan",
            latin_idn: "Al-Ikhlas",
        },
    },
];

export const mockAyahs = [
    {
        id: 1,
        number: 1,
        surahNumber: 1,
        surahName: "Al-Fatihah",
        juzNumber: 1,
        pageNumber: 1,
        translation:
            "In the name of Allah, the Most Gracious, the Most Merciful",
        arab: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        latin: "Bismillahirrahmanirrahim",
    },
    {
        id: 2,
        number: 2,
        surahNumber: 1,
        surahName: "Al-Fatihah",
        juzNumber: 1,
        pageNumber: 1,
        translation: "All praise is due to Allah, the Lord of all worlds",
        arab: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        latin: "Alhamdulillahi rabbil alamin",
    },
    {
        id: 3,
        number: 255,
        surahNumber: 2,
        surahName: "Al-Baqarah",
        juzNumber: 3,
        pageNumber: 42,
        translation:
            "Allah! There is no deity except Him, the Ever-Living, the Sustainer of existence",
        arab: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
        latin: "Allahu la ilaha illa huwal hayyul qayyum",
    },
];

export const mockHadiths = [
    {
        id: 1,
        number: 1,
        grade: "shahih",
        arab: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
        translation: {
            ar: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
            idn: "Sesungguhnya amal itu tergantung niatnya",
            latin_idn: "Innamal aamalu binniyat",
            en: "Actions are judged by intentions",
        },
        book: {
            slug: "bukhari",
            translation: { idn: "Shahih Bukhari", en: "Sahih Bukhari" },
        },
    },
    {
        id: 2,
        number: 13,
        grade: "hasan",
        arab: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        translation: {
            ar: "",
            idn: "Tidak beriman salah seorang di antara kalian hingga ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri",
            latin_idn:
                "La yuminu ahadukum hatta yuhibba li akhihi ma yuhibbu li nafsihi",
        },
        book: {
            slug: "bukhari",
            translation: { idn: "Shahih Bukhari", en: "Sahih Bukhari" },
        },
    },
];

export const mockDoas = [
    {
        id: 1,
        title: "Doa Sebelum Tidur",
        category: "tidur",
        translation: {
            ar: "بِسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ",
            idn: "Dengan nama-Mu ya Allah aku hidup dan mati",
            latin_idn: "Bismikallahumma ahya wa amut",
        },
    },
    {
        id: 2,
        title: "Doa Bangun Tidur",
        category: "pagi",
        translation: {
            ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
            idn: "Segala puji bagi Allah yang menghidupkan kami setelah mematikan kami dan kepada-Nya kebangkitan",
            latin_idn:
                "Alhamdulillahilladzi ahyana baada ma amatana wa ilayhin nusyur",
        },
    },
];

export const mockDzikirs = [
    {
        id: 1,
        title: "Subhanallah",
        count: 33,
        category: "dzikir_umum",
        translation: {
            ar: "سُبْحَانَ اللَّهِ",
            idn: "Maha Suci Allah",
            latin_idn: "Subhanallah",
        },
    },
    {
        id: 2,
        title: "Alhamdulillah",
        count: 33,
        category: "dzikir_umum",
        translation: {
            ar: "الْحَمْدُ لِلَّهِ",
            idn: "Segala puji bagi Allah",
            latin_idn: "Alhamdulillah",
        },
    },
];

export const mockKajians = [
    {
        id: 1,
        title: "Tafsir Al-Fatihah",
        ustadz: "Ustadz Abdul Somad",
        category: "tafsir",
        platform: "youtube",
        url: "https://youtube.com/watch?v=123",
        duration: "45:00",
        description: "Kajian tafsir Al-Fatihah secara mendalam",
    },
    {
        id: 2,
        title: "Fiqih Shalat",
        ustadz: "Ustadz Adi Hidayat",
        category: "fiqh",
        platform: "youtube",
        url: "https://youtube.com/watch?v=456",
        duration: "60:00",
        description: "Pembahasan fiqih shalat lengkap",
    },
];

export const mockDictionaries = [
    {
        id: 1,
        arabic: "تَقْوَى",
        latin: "Taqwa",
        meaning: "Ketakwaan",
        root: "و ق ي",
    },
    {
        id: 2,
        arabic: "صَبْر",
        latin: "Shabr",
        meaning: "Kesabaran",
        root: "ص ب ر",
    },
    {
        id: 3,
        arabic: "إِيمَان",
        latin: "Iman",
        meaning: "Keyakinan",
        root: "أ م ن",
    },
];

export const mockPerawis = [
    {
        id: 1,
        nama_latin: "Bukhari",
        nama_arab: "البخاري",
        nama_lengkap: "Muhammad bin Ismail al-Bukhari",
    },
    {
        id: 2,
        nama_latin: "Muslim",
        nama_arab: "مسلم",
        nama_lengkap: "Muslim bin al-Hajjaj",
    },
    {
        id: 3,
        nama_latin: "Abu Dawud",
        nama_arab: "أبو داود",
        nama_lengkap: "Sulaiman bin al-Ash'ats",
    },
];

export const mockAsmaulHusna = [
    {
        id: 1,
        number: 1,
        arabic: "الرَّحْمَنُ",
        latin: "Ar-Rahman",
        transliteration: "Ar-Rahman",
        indonesian: "Maha Pengasih",
    },
    {
        id: 2,
        number: 2,
        arabic: "الرَّحِيمُ",
        latin: "Ar-Rahim",
        transliteration: "Ar-Rahim",
        indonesian: "Maha Penyayang",
    },
    {
        id: 3,
        number: 3,
        arabic: "الْمَلِكُ",
        latin: "Al-Malik",
        transliteration: "Al-Malik",
        indonesian: "Maha Merajai",
    },
];

export const mockPrayerTimes = {
    imsak: "04:20",
    fajr: "04:30",
    sunrise: "05:50",
    dhuhr: "12:00",
    asr: "15:30",
    maghrib: "17:50",
    isha: "19:10",
};

export async function setupApiMocks(page, options = {}) {
    const { isAuthenticated = false, mockUser = defaultMockUser } = options;

    await page.route("**/api/v1/**", async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        const method = route.request().method();

        if (path.includes("/auth/login") && method === "POST") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    token: "mock-token-123",
                    user: defaultMockUser,
                }),
            });
        }

        if (path.includes("/auth/register") && method === "POST") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    message:
                        "Registration successful. Please check your email to verify.",
                }),
            });
        }

        if (path.includes("/auth/me")) {
            if (isAuthenticated) {
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify(mockUser),
                });
            }
            return route.fulfill({
                status: 401,
                contentType: "application/json",
                body: JSON.stringify({ message: "Unauthenticated" }),
            });
        }

        if (path.includes("/auth/refresh")) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ token: "mock-refreshed-token" }),
            });
        }

        if (path.includes("/auth/logout")) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ message: "ok" }),
            });
        }

        if (path.match(/\/surah/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockSurahs,
                    total: mockSurahs.length,
                }),
            });
        }

        if (path.match(/\/ayah(\/keyset)?/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockAyahs,
                    total: mockAyahs.length,
                }),
            });
        }

        if (path.match(/\/search/)) {
            const q = url.searchParams.get("q") || "";
            const type = url.searchParams.get("type") || "all";

            if (q === "ERROR_TRIGGER_500") {
                return route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Internal Server Error" }),
                });
            }
            if (q === "TIMEOUT_TRIGGER") {
                return new Promise(() => {});
            }

            const result = {
                total: 0,
                ayah: [],
                ayah_total: 0,
                hadith: [],
                hadith_total: 0,
                doas: [],
                doa_total: 0,
                dictionaries: [],
                dictionary_total: 0,
                kajians: [],
                kajian_total: 0,
                perawis: [],
                perawi_total: 0,
            };

            if (type === "all" || type === "ayah") {
                result.ayah = mockAyahs.slice(0, 3);
                result.ayah_total = 3;
                result.total += 3;
            }
            if (type === "all" || type === "hadith") {
                result.hadith = mockHadiths.slice(0, 2);
                result.hadith_total = 2;
                result.total += 2;
            }
            if (type === "all" || type === "doa") {
                result.doas = mockDoas.slice(0, 2);
                result.doa_total = 2;
                result.total += 2;
            }
            if (type === "all" || type === "dictionary") {
                result.dictionaries = mockDictionaries.slice(0, 3);
                result.dictionary_total = 3;
                result.total += 3;
            }
            if (type === "all" || type === "kajian") {
                result.kajians = mockKajians.slice(0, 2);
                result.kajian_total = 2;
                result.total += 2;
            }
            if (type === "all" || type === "perawi") {
                result.perawis = mockPerawis.slice(0, 3);
                result.perawi_total = 3;
                result.total += 3;
            }

            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(result),
            });
        }

        if (path.match(/\/hadiths/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockHadiths,
                    total: mockHadiths.length,
                }),
            });
        }

        if (path.match(/\/doa/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockDoas,
                    total: mockDoas.length,
                }),
            });
        }

        if (path.match(/\/dzikir/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockDzikirs,
                    total: mockDzikirs.length,
                }),
            });
        }

        if (path.match(/\/kajian/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(mockKajians),
            });
        }

        if (path.match(/\/dictionary/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockDictionaries,
                    total: mockDictionaries.length,
                }),
            });
        }

        if (path.match(/\/perawi/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockPerawis,
                    total: mockPerawis.length,
                }),
            });
        }

        if (path.match(/\/asmaul-husna/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    items: mockAsmaulHusna,
                    total: mockAsmaulHusna.length,
                }),
            });
        }

        if (path.match(/\/sholat-times/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ data: { prayers: mockPrayerTimes } }),
            });
        }

        if (path.match(/\/adzan-sounds$/) && method === "GET") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ data: [] }),
            });
        }

        if (path.match(/\/settings$/) && method === "GET") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    data: {
                        settings: JSON.stringify({
                            adzanReminderLead: 15,
                            adzanReminderLeadByPrayer: { fajr: 5 },
                        }),
                    },
                }),
            });
        }

        if (path.match(/\/settings$/) && method === "PUT") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ message: "ok" }),
            });
        }

        if (path.match(/\/sholat\/today/)) {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    data: {
                        subuh: true,
                        dzuhur: false,
                        ashar: true,
                        maghrib: false,
                        isya: true,
                    },
                }),
            });
        }

        if (method === "GET") {
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ items: [], total: 0, message: "ok" }),
            });
        }

        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ message: "ok" }),
        });
    });
}

export async function setupAuthenticatedPage(page) {
    await page.addInitScript(() => {
        localStorage.setItem("auth_token", "mock-token-123");
    });
    await setupApiMocks(page, { isAuthenticated: true });
}

export async function setupExpiredTokenPage(page) {
    await page.addInitScript(() => {
        localStorage.setItem("auth_token", "expired-token-456");
    });
    await setupApiMocks(page, { isAuthenticated: false });
}
