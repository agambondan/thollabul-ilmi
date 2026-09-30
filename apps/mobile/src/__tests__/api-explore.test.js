jest.mock("../api/client", () => ({
    requestJson: jest.fn(),
    getAyahById: jest.fn(),
    getHadithDetail: jest.fn(),
    normalizeAyah: (item) => ({
        arabic: item.translation?.ar ?? "",
        number: item.number,
        surahName: item.surah?.translation?.latin_idn ?? "",
        translation: item.translation?.idn ?? "",
    }),
    normalizeHadith: (item) => ({
        arabic: item.translation?.ar ?? "",
        book: item.book?.translation?.idn ?? "Hadith",
        number: item.number,
        translation: item.translation?.idn ?? "",
    }),
}));

jest.mock("../api/personal", () => ({
    getBookmarks: jest.fn(),
}));

const {
    requestJson,
    getAyahById,
    getHadithDetail,
} = require("../api/client");
const { getBookmarks } = require("../api/personal");
const {
    normalizeExploreItem,
    getAllNotes,
    getBookmarkItems,
    searchDictionary,
    getQuizQuestions,
    getHijriOverview,
    getFeatureItemPage,
    getFeatureItems,
} = require("../api/explore");

describe("explore api", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("normalizeExploreItem", () => {
        test("normalizes item with translation fields", () => {
            const result = normalizeExploreItem({
                name: "Al-Fatihah",
                translation: {
                    arab: "الفاتحة",
                },
                type: "surah",
            });
            expect(result.title).toBe("Al-Fatihah");
            expect(result.arabic).toBe("الفاتحة");
            expect(result.body).toBe("");
            expect(result.meta).toBe("surah");
        });

        test("normalizes ayah/tafsir item", () => {
            const result = normalizeExploreItem({
                ayah_id: 1,
                ayah: {
                    number: 1,
                    surah: { translation: { latin_en: "Al-Fatihah" } },
                    translation: { ar: "نص", idn: "Makna" },
                },
                kemenag: { text_idn: "Tafsir Kemenag" },
                ibnu_katsir: { text_idn: "Tafsir Al-Mishbah" },
            });
            expect(result.title).toBe("Ayat 1");
            expect(result.arabic).toBe("نص");
            expect(result.body).toBe("Makna");
            expect(result.meta).toContain("Al-Fatihah");
            expect(result.meta).toContain("Tafsir Kemenag");
            expect(result.meta).toContain("Tafsir Al-Mishbah");
            expect(result.tafsir).toBe("Tafsir Kemenag");
            expect(result.secondaryTafsir).toBe("Tafsir Al-Mishbah");
        });

        test("normalizes jarh/tadil item", () => {
            const result = normalizeExploreItem({
                jenis_nilai: "jarh",
                teks_nilai: "Tidak tsiqah",
                perawi: { nama_latin: "Abu Hurairah" },
                tingkat: 3,
                sumber: "Adz-Dzahabi",
            });
            expect(result.title).toBe("Tidak tsiqah");
            expect(result.body).toContain("Abu Hurairah");
            expect(result.meta).toContain("Jarh");
            expect(result.meta).toContain("Tingkat 3");
            expect(result.meta).toContain("Adz-Dzahabi");
        });

        test("normalizes perawi item", () => {
            const result = normalizeExploreItem({
                id: 7,
                nama_arab: "أبو هريرة",
                nama_latin: "Abu Hurairah",
                status: "tsiqah",
                tabaqah: "sahabat",
                tahun_wafat: 59,
            });
            expect(result.id).toBe(7);
            expect(result.title).toBe("Abu Hurairah");
            expect(result.arabic).toBe("أبو هريرة");
            expect(result.meta).toContain("sahabat");
            expect(result.meta).toContain("59 H");
            expect(result.meta).toContain("tsiqah");
        });

        test("normalizes imsakiyah schedule row", () => {
            const result = normalizeExploreItem({
                date: "2026-05-01",
                prayers: { imsak: "04:20", fajr: "04:30", maghrib: "17:50" },
            });
            expect(result.id).toBe("2026-05-01");
            expect(result.title).toBe("2026-05-01");
            expect(result.body).toContain("04:20");
            expect(result.meta).toBe("Imsakiyah");
        });

        test("uses fallback title and id", () => {
            const result = normalizeExploreItem({}, 5);
            expect(result.title).toBe("Item 6");
            expect(result.id).toBe("Item 6-5");
        });

        test("passes through raw items", () => {
            const result = normalizeExploreItem({
                raw: true,
                title: "x",
                body: "y",
                arabic: "z",
            });
            expect(result.raw).toBe(true);
            expect(result.title).toBe("x");
        });
    });

    describe("getAllNotes", () => {
        test("calls correct endpoint and normalizes", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ name: "Catatan" }],
            });
            const result = await getAllNotes();
            expect(requestJson).toHaveBeenCalledWith("/api/v1/notes", {
                auth: true,
            });
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Catatan");
        });

        test("titles ayah and hadith notes by what they refer to", async () => {
            requestJson.mockResolvedValueOnce({
                items: [
                    { id: 1, ref_type: "ayah", ref_id: 2149, content: "Kisah" },
                    { id: 2, ref_type: "hadith", ref_id: 7, content: "Niat" },
                ],
            });
            getAyahById.mockResolvedValueOnce({
                number: 9,
                surahName: "Al-Kahf",
                arabic: "ar",
                translation: "terjemah",
            });
            getHadithDetail.mockResolvedValueOnce({
                number: 3087,
                book: "Sunan Abu Daud",
                arabic: "ar",
                translation: "terjemah",
            });
            const result = await getAllNotes();
            expect(getAyahById).toHaveBeenCalledWith(2149);
            expect(getHadithDetail).toHaveBeenCalledWith(7);
            expect(result[0].title).toBe("Al-Kahf · Ayat 9");
            expect(result[0].body).toBe("Kisah");
            expect(result[1].title).toBe("Sunan Abu Daud No. 3087");
            expect(result[1].body).toBe("Niat");
        });

        test("looks each referenced item up once", async () => {
            requestJson.mockResolvedValueOnce({
                items: [
                    { id: 1, ref_type: "ayah", ref_id: 5, content: "a" },
                    { id: 2, ref_type: "ayah", ref_id: 5, content: "b" },
                ],
            });
            getAyahById.mockResolvedValue({ number: 5, surahName: "An-Nisa" });
            const result = await getAllNotes();
            expect(getAyahById).toHaveBeenCalledTimes(1);
            expect(result.map((item) => item.title)).toEqual([
                "An-Nisa · Ayat 5",
                "An-Nisa · Ayat 5",
            ]);
        });

        test("keeps the default title when the lookup fails", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ id: 1, ref_type: "ayah", ref_id: 9, content: "x" }],
            });
            getAyahById.mockRejectedValueOnce(new Error("offline"));
            const result = await getAllNotes();
            expect(result[0].title).toBe("ayah 9");
            expect(result[0].body).toBe("x");
        });
    });

    describe("getBookmarkItems", () => {
        test("calls getBookmarks and normalizes", async () => {
            getBookmarks.mockResolvedValueOnce([{ name: "Bookmark 1" }]);
            const result = await getBookmarkItems();
            expect(getBookmarks).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Bookmark 1");
        });

        test("titles ayah and hadith bookmarks from their nested data", async () => {
            getBookmarks.mockResolvedValueOnce([
                {
                    id: "a",
                    ref_type: "ayah",
                    ref_id: 2149,
                    ayah: {
                        number: 9,
                        surah: { translation: { latin_idn: "Al-Kahf" } },
                        translation: { idn: "Atau kamu mengira", ar: "ar" },
                    },
                },
                {
                    id: "h",
                    ref_type: "hadith",
                    ref_id: 1,
                    hadith: {
                        number: 3087,
                        book: { translation: { idn: "Sunan Abu Daud" } },
                        translation: { idn: "Telah menceritakan" },
                    },
                },
            ]);
            const result = await getBookmarkItems();
            expect(result[0].title).toBe("Al-Kahf · Ayat 9");
            expect(result[0].body).toBe("Atau kamu mengira");
            expect(result[1].title).toBe("Sunan Abu Daud No. 3087");
            expect(result[1].body).toBe("Telah menceritakan");
        });

        test("keeps the default title for other bookmark types", async () => {
            getBookmarks.mockResolvedValueOnce([
                { id: "l", ref_type: "library_book", ref_id: 4 },
            ]);
            const result = await getBookmarkItems();
            expect(result[0].title).toBe("library_book 4");
        });
    });

    describe("searchDictionary", () => {
        test("calls correct endpoint", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ name: "Iman", definition: "Percaya" }],
            });
            const result = await searchDictionary("iman");
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/dictionary?q=iman&size=20",
            );
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Iman");
        });

        test("encodes query", async () => {
            requestJson.mockResolvedValueOnce({ items: [] });
            await searchDictionary("al kitab");
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/dictionary?q=al%20kitab&size=20",
            );
        });

        test("returns empty for blank query", async () => {
            const result = await searchDictionary("   ");
            expect(requestJson).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe("getQuizQuestions", () => {
        test("calls correct endpoint", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ question: "Apa itu iman?" }],
            });
            const result = await getQuizQuestions();
            expect(requestJson).toHaveBeenCalledWith(
                "/api/v1/quiz/session?count=5",
            );
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("Apa itu iman?");
        });
    });

    describe("getHijriOverview", () => {
        test("returns today and events when both succeed", async () => {
            requestJson
                .mockResolvedValueOnce({ date_hijri: "1 Ramadhan 1446" })
                .mockResolvedValueOnce({
                    items: [{ name: "Nuzulul Quran" }],
                });
            const result = await getHijriOverview();
            expect(result).toHaveLength(2);
            expect(result[0].title).toBe("Today");
            expect(result[0].body).toBe("1 Ramadhan 1446");
            expect(result[0].raw.type).toBe("hijri_today");
        });

        test("handles today failure gracefully", async () => {
            requestJson
                .mockRejectedValueOnce(new Error("fail"))
                .mockResolvedValueOnce({ items: [] });
            const result = await getHijriOverview();
            expect(result).toHaveLength(0);
        });
    });

    describe("getFeatureItemPage", () => {
        test("calls feature endpoint without pagination", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ title: "Item 1", translation: { idn: "desk" } }],
            });
            const result = await getFeatureItemPage({
                endpoint: "/api/v1/some-feature",
                type: "public",
            });
            expect(requestJson).toHaveBeenCalledWith("/api/v1/some-feature", {
                auth: false,
            });
            expect(result.items).toHaveLength(1);
            expect(result.meta).toBeDefined();
        });

        test("keeps the API total in the page meta", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ title: "A" }],
                last: false,
                page: 0,
                size: 20,
                total: 7346,
            });
            const paged = await getFeatureItemPage(
                { endpoint: "/api/v1/kajian", type: "list" },
                { page: 0, size: 20 },
            );
            expect(paged.meta.total).toBe(7346);

            requestJson.mockResolvedValueOnce({
                items: [{ title: "A" }],
                meta: { has_more: true, total: "12" },
            });
            const withMeta = await getFeatureItemPage({
                endpoint: "/api/v1/other",
                type: "list",
            });
            expect(withMeta.meta.total).toBe(12);

            requestJson.mockResolvedValueOnce([{ title: "A" }]);
            const plain = await getFeatureItemPage({
                endpoint: "/api/v1/plain",
                type: "list",
            });
            expect(plain.meta.total).toBeNull();
        });

        test("treats a null items list as empty instead of one bogus item", async () => {
            requestJson.mockResolvedValueOnce({
                items: null,
                last: true,
                page: 0,
                size: 20,
                total: 0,
            });
            const result = await getFeatureItemPage(
                { endpoint: "/api/v1/empty-list", type: "list" },
                { page: 0, size: 20 },
            );
            expect(result.items).toEqual([]);
            expect(result.meta.total).toBe(0);
            expect(result.meta.hasMore).toBe(false);
        });

        test("adds pagination params when pagination given", async () => {
            requestJson.mockResolvedValueOnce({ items: [] });
            await getFeatureItemPage(
                { endpoint: "/api/v1/some-feature", type: "public" },
                { page: 1, size: 10 },
            );
            expect(requestJson).toHaveBeenCalled();
            const url = requestJson.mock.calls[0][0];
            expect(url).toContain("page=1");
            expect(url).toContain("size=10");
        });

        test("picks imsakiyah schedule rows from response data", async () => {
            requestJson.mockResolvedValueOnce({
                data: {
                    schedule: [
                        { date: "2026-05-01", prayers: { imsak: "04:20" } },
                        { date: "2026-05-02", prayers: { imsak: "04:21" } },
                    ],
                },
            });
            const result = await getFeatureItemPage({
                endpoint: "/api/v1/imsakiyah",
                type: "list",
            });
            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe("2026-05-01");
        });
    });

    describe("getFeatureItems", () => {
        test("returns items from getFeatureItemPage", async () => {
            requestJson.mockResolvedValueOnce({
                items: [{ title: "A", translation: { idn: "a" } }],
            });
            const result = await getFeatureItems(
                { endpoint: "/api/v1/features", type: "public" },
                { page: 0, size: 20 },
            );
            expect(result).toHaveLength(1);
        });
    });
});
