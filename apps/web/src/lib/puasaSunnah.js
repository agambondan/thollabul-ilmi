// Dataset puasa sunnah berdasarkan kalender Hijri.
// Dipakai untuk highlight di kalender Hijri dan reminder.
//
// Format Item: { type, day?, monthHijri?, label_id, label_en, dalil? }
//   - type 'weekly': day 1=Senin, 4=Kamis (mingguan)
//   - type 'monthly': dayOfMonthHijri 13/14/15 (Ayyamul Bidh)
//   - type 'fixed': monthHijri + dayOfMonthHijri (Asyura, Arafah, dll.)
//   - type 'range': monthHijri + range hari (6 Syawal, 10 Dzulhijjah, dll.)

export const PUASA_SUNNAH = [
    {
        id: "senin",
        type: "weekly",
        day: 1,
        label_id: "Puasa Senin",
        label_en: "Monday Fasting",
        dalil: "HR. Muslim — Nabi ﷺ menyukai puasa Senin (hari kelahiran beliau).",
    },
    {
        id: "kamis",
        type: "weekly",
        day: 4,
        label_id: "Puasa Kamis",
        label_en: "Thursday Fasting",
        dalil: "HR. Tirmidzi — amal manusia diangkat pada hari Senin & Kamis.",
    },
    {
        id: "ayyamul_bidh",
        type: "monthly",
        days: [13, 14, 15],
        label_id: "Ayyamul Bidh",
        label_en: "White Days",
        dalil: "HR. Tirmidzi — Nabi ﷺ menganjurkan puasa 13, 14, 15 setiap bulan Hijri.",
    },
    {
        id: "daud",
        type: "alternating",
        label_id: "Puasa Nabi Daud (sehari puasa, sehari tidak)",
        label_en: "Prophet Dawud Fasting (alternating days)",
        dalil: "HR. Bukhari & Muslim — puasa terbaik adalah puasa Daud.",
    },
    {
        id: "syawal_6",
        type: "range",
        monthHijri: 10,
        days: [2, 3, 4, 5, 6, 7],
        label_id: "6 Hari di Bulan Syawal",
        label_en: "6 Days of Shawwal",
        dalil: "HR. Muslim — pahala puasa Ramadan + 6 hari Syawal seperti puasa setahun.",
    },
    {
        id: "arafah",
        type: "fixed",
        monthHijri: 12,
        day: 9,
        label_id: "Puasa Arafah (9 Dzulhijjah)",
        label_en: "Day of Arafah (9 Dhul Hijjah)",
        dalil: "HR. Muslim — menghapus dosa 2 tahun (tahun lalu & tahun depan).",
    },
    {
        id: "tarwiyah",
        type: "fixed",
        monthHijri: 12,
        day: 8,
        label_id: "Puasa Tarwiyah (8 Dzulhijjah)",
        label_en: "Day of Tarwiyah (8 Dhul Hijjah)",
        dalil: "Sebagian ulama menganjurkan puasa 1-9 Dzulhijjah bagi yang tidak haji.",
    },
    {
        id: "dzulhijjah_1_9",
        type: "range",
        monthHijri: 12,
        days: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        label_id: "1-9 Dzulhijjah (kecuali yang berhaji)",
        label_en: "1-9 Dhul Hijjah (except pilgrims)",
        dalil: "HR. Bukhari — amal di 10 hari pertama Dzulhijjah lebih dicintai Allah.",
    },
    {
        id: "tasua_asyura",
        type: "range",
        monthHijri: 1,
        days: [9, 10],
        label_id: "Tasu'a & Asyura (9-10 Muharram)",
        label_en: "Tasua & Ashura (9-10 Muharram)",
        dalil: "HR. Muslim — puasa Asyura menghapus dosa setahun yang lalu.",
    },
    {
        id: "syaban",
        type: "month_emphasis",
        monthHijri: 8,
        label_id: "Memperbanyak Puasa di Bulan Syaban",
        label_en: "Increase Fasting in Sha'ban",
        dalil: "HR. Bukhari — Nabi ﷺ paling banyak puasa di bulan Sya'ban.",
    },
    {
        id: "muharram",
        type: "month_emphasis",
        monthHijri: 1,
        label_id: "Memperbanyak Puasa di Bulan Muharram",
        label_en: "Increase Fasting in Muharram",
        dalil: "HR. Muslim — puasa terbaik setelah Ramadan adalah puasa di bulan Allah (Muharram).",
    },
];

// Tentukan apakah tanggal Masehi tertentu adalah hari puasa sunnah.
// Input:
//   gregorian: Date object (tanggal Masehi)
//   hijri: { day, month, year } (tanggal Hijri yang sesuai)
// Output: array of matching PUASA_SUNNAH entries
export function getPuasaSunnahForDate(gregorian, hijri) {
    const matches = [];
    const dayOfWeek = gregorian.getDay() === 0 ? 7 : gregorian.getDay();
    const hijriDay = Number(hijri?.day ?? 0);
    const hijriMonth = Number(hijri?.month ?? 0);

    for (const p of PUASA_SUNNAH) {
        if (p.type === "weekly" && p.day === dayOfWeek) {
            matches.push(p);
        } else if (p.type === "monthly" && p.days?.includes(hijriDay)) {
            matches.push(p);
        } else if (
            p.type === "fixed" &&
            p.monthHijri === hijriMonth &&
            p.day === hijriDay
        ) {
            matches.push(p);
        } else if (
            p.type === "range" &&
            p.monthHijri === hijriMonth &&
            p.days?.includes(hijriDay)
        ) {
            matches.push(p);
        } else if (p.type === "month_emphasis" && p.monthHijri === hijriMonth) {
            matches.push(p);
        }
    }
    return matches;
}

// Hitung berapa hari sampai 1 Ramadan (bulan ke-9 Hijri)
// dari tanggal Hijri sekarang. Asumsi naive: setiap bulan Hijri 30 hari.
// Lebih akurat: query API `/hijri/convert` untuk dapat tanggal Masehi target.
export function daysUntilRamadan(currentHijri) {
    const day = Number(currentHijri?.day ?? 1);
    const month = Number(currentHijri?.month ?? 1);
    if (month === 9) return 0;
    const RAMADAN = 9;
    let monthsLeft;
    if (month < RAMADAN) {
        monthsLeft = RAMADAN - month;
    } else {
        monthsLeft = 12 - month + RAMADAN;
    }
    const daysLeftThisMonth = 30 - day + 1;
    const fullMonthsBetween = Math.max(0, monthsLeft - 1);
    return daysLeftThisMonth + fullMonthsBetween * 30 - 1;
}
