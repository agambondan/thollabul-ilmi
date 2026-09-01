import {
    classifyShareLines,
    isArabicText,
    wrapShareLine,
} from "@/lib/shareImage";

const ARABIC =
    "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى";

// Context tiruan: tiap karakter dihitung 10px, cukup untuk menguji wrapping.
const fakeContext = (charWidth = 10) => ({
    measureText: (value) => ({ width: value.length * charWidth }),
});

describe("isArabicText", () => {
    it("mendeteksi baris berhuruf Arab", () => {
        expect(isArabicText(ARABIC)).toBe(true);
    });

    it("tidak menganggap latin sebagai Arab", () => {
        expect(isArabicText("Semua perbuatan tergantung niatnya")).toBe(false);
        expect(isArabicText("")).toBe(false);
        expect(isArabicText(undefined)).toBe(false);
    });
});

describe("classifyShareLines", () => {
    it("memberi peran arabic pada baris Arab di posisi mana pun", () => {
        const hadith = [
            ARABIC,
            "Semua perbuatan tergantung niatnya.",
            "HR. Bukhari no. 1",
            "via https://example.com/hadith/bukhari/1",
        ].join("\n");

        expect(classifyShareLines(hadith).map((b) => b.role)).toEqual([
            "arabic",
            "latin",
            "meta",
            "meta",
        ]);
    });

    it("tetap benar saat Arab bukan baris pertama", () => {
        const ayah = [
            "Allah Ta'ala berfirman:",
            ARABIC,
            "Innamal a'malu binniyat",
            "Semua perbuatan tergantung niatnya.",
            "QS. Contoh [1]: Ayat 1",
            "via https://example.com/quran/contoh#ayah-1",
        ].join("\n");

        expect(classifyShareLines(ayah).map((b) => b.role)).toEqual([
            "latin",
            "arabic",
            "latin",
            "latin",
            "meta",
            "meta",
        ]);
    });

    it("membuang baris kosong dan trailing newline", () => {
        expect(classifyShareLines("satu\n\n  \ndua\n")).toHaveLength(2);
        expect(classifyShareLines("")).toEqual([]);
        expect(classifyShareLines(null)).toEqual([]);
    });
});

describe("wrapShareLine", () => {
    it("memecah baris sesuai lebar maksimum", () => {
        const rows = wrapShareLine(
            fakeContext(),
            "satu dua tiga empat lima",
            100,
        );

        rows.forEach((row) => expect(row.length * 10).toBeLessThanOrEqual(100));
        expect(rows.join(" ")).toBe("satu dua tiga empat lima");
    });

    it("memecah kata tunggal yang lebih panjang dari lebar maksimum", () => {
        const url = "https://example.com/quran/al-baqarah#ayah-153";
        const rows = wrapShareLine(fakeContext(), url, 100);

        expect(rows.length).toBeGreaterThan(1);
        rows.forEach((row) => expect(row.length * 10).toBeLessThanOrEqual(100));
        expect(rows.join("")).toBe(url);
    });

    it("menjaga urutan kata Arab secara logis", () => {
        const rows = wrapShareLine(fakeContext(2), ARABIC, 200);

        expect(rows.join(" ").split(/\s+/)).toEqual(ARABIC.split(/\s+/));
    });

    it("mengembalikan array kosong untuk baris kosong", () => {
        expect(wrapShareLine(fakeContext(), "   ", 100)).toEqual([]);
    });
});
