// Khatam Quran tracker helper.
// Total ayat Al-Quran: 6236 (jumlah baku tanpa basmalah).
// Mendukung target khatam: tanggal target (misal akhir Ramadan), berdasarkan posisi ayat global.

export const TOTAL_AYAH = 6236;
export const TOTAL_JUZ = 30;

// Tabel jumlah ayat per surah (114 surah). Sumber: hitungan baku.
// Index 0 = surah 1.
export const SURAH_AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
    54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49,
    62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28,
    28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5,
    6,
];

// Konversi posisi (surah_number, ayah_number) → indeks ayat global (1..6236).
export function ayahIndex(surahNumber, ayahNumber) {
    const sIdx = Number(surahNumber);
    const aIdx = Number(ayahNumber);
    if (sIdx < 1 || sIdx > 114) return 0;
    let total = 0;
    for (let i = 0; i < sIdx - 1; i++) {
        total += SURAH_AYAH_COUNTS[i];
    }
    return total + Math.max(1, Math.min(aIdx, SURAH_AYAH_COUNTS[sIdx - 1]));
}

export function progressPct(surahNumber, ayahNumber) {
    const idx = ayahIndex(surahNumber, ayahNumber);
    return Math.min(100, (idx / TOTAL_AYAH) * 100);
}

// Distribusi ayat per juz (1..30). Sumber: pembagian standar mushaf Madinah.
// Setiap juz ~ 1/30 dari total. Untuk visualisasi sederhana, pakai pembagian rata.
// Jika butuh akurat, ganti dengan tabel index awal tiap juz.
const JUZ_BOUNDARIES = [
    { juz: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
    { juz: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
    { juz: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
    { juz: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
    { juz: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
    { juz: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
    { juz: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
    { juz: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
    { juz: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
    { juz: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
    { juz: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
    { juz: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
    { juz: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
    { juz: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
    { juz: 15, startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
    { juz: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
    { juz: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
    { juz: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
    { juz: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
    { juz: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
    { juz: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
    { juz: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
    { juz: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
    { juz: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
    { juz: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
    { juz: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
    { juz: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
    { juz: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
    { juz: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
    { juz: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

export function getJuzBoundaries() {
    return JUZ_BOUNDARIES;
}

// Hitung progress per juz given current surah/ayah position.
export function juzProgress(surahNumber, ayahNumber) {
    const currentIdx = ayahIndex(surahNumber, ayahNumber);
    return JUZ_BOUNDARIES.map((j) => {
        const startIdx = ayahIndex(j.startSurah, j.startAyah);
        const endIdx = ayahIndex(j.endSurah, j.endAyah);
        const total = endIdx - startIdx + 1;
        let read;
        if (currentIdx < startIdx) read = 0;
        else if (currentIdx >= endIdx) read = total;
        else read = currentIdx - startIdx + 1;
        return {
            juz: j.juz,
            total,
            read,
            pct: Math.round((read / total) * 100),
            isCurrent: currentIdx >= startIdx && currentIdx <= endIdx,
        };
    });
}

// Hitung target harian: dari posisi sekarang, berapa ayat per hari sampai target.
// Input:
//   currentIdx: posisi ayat global sekarang (1..6236)
//   targetDate: Date object — tanggal target khatam
// Output: { daysLeft, ayahsLeft, ayahsPerDay }
export function dailyTarget(currentIdx, targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLeft = Math.max(0, Math.round((target - today) / msPerDay));
    const ayahsLeft = Math.max(0, TOTAL_AYAH - currentIdx);
    const ayahsPerDay =
        daysLeft > 0 ? Math.ceil(ayahsLeft / daysLeft) : ayahsLeft;
    return { daysLeft, ayahsLeft, ayahsPerDay };
}
