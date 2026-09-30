export const HIJRI_MONTH_NAMES = [
    "",
    "Muharram",
    "Safar",
    "Rabiul Awal",
    "Rabiul Akhir",
    "Jumadal Ula",
    "Jumadal Akhirah",
    "Rajab",
    "Sya'ban",
    "Ramadan",
    "Syawal",
    "Dzulqa'dah",
    "Dzulhijjah",
];

export const MIN_GREGORIAN_DATE = { year: 622, month: 7, day: 19 };

const ISLAMIC_EPOCH = 1948439.5;
const COMPACT_DATE = /^(\d{4})(\d{2})(\d{2})$/;
const SEPARATED_DATE = /^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})$/;

const pad = (value, length = 2) => String(value).padStart(length, "0");

const isGregorianLeap = (year) =>
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const daysInGregorianMonth = (year, month) => {
    if (month === 2) return isGregorianLeap(year) ? 29 : 28;
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

const gregorianToJulianDay = (year, month, day) => {
    let extra = 0;
    if (month > 2) extra = isGregorianLeap(year) ? -1 : -2;
    return (
        1721425.5 -
        1 +
        365 * (year - 1) +
        Math.floor((year - 1) / 4) -
        Math.floor((year - 1) / 100) +
        Math.floor((year - 1) / 400) +
        Math.floor((367 * month - 362) / 12 + extra + day)
    );
};

const islamicToJulianDay = (year, month, day) =>
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    ISLAMIC_EPOCH -
    1;

const julianDayToIslamic = (julianDay) => {
    const jd = Math.floor(julianDay) + 0.5;
    const year = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631);
    const month = Math.min(
        12,
        Math.ceil((jd - (29 + islamicToJulianDay(year, 1, 1))) / 29.5) + 1,
    );
    const day = Math.trunc(jd - islamicToJulianDay(year, month, 1)) + 1;
    return { year, month, day };
};

const compareGregorian = (a, b) =>
    a.year - b.year || a.month - b.month || a.day - b.day;

export const gregorianToHijri = ({ year, month, day }) => {
    const hijri = julianDayToIslamic(gregorianToJulianDay(year, month, day));
    return { ...hijri, monthName: HIJRI_MONTH_NAMES[hijri.month] ?? "" };
};

export const formatGregorianInput = ({ year, month, day }) =>
    `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

export const toLocalDateInput = (now = new Date()) =>
    formatGregorianInput({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
    });

export const formatHijriDate = ({ day, monthName, year }) =>
    `${day} ${monthName} ${year} H`;

export const formatHijriDateArabic = ({ day, monthName, year }) =>
    `${day} ${monthName} ${year} هـ`;

export const parseGregorianInput = (text) => {
    const value = String(text ?? "").trim();
    const compact = COMPACT_DATE.exec(value);
    const separated = SEPARATED_DATE.exec(value);
    let parts = null;
    if (compact) {
        parts = [compact[1], compact[2], compact[3]];
    } else if (separated && separated[1].length === 4) {
        parts = [separated[1], separated[2], separated[3]];
    } else if (separated && separated[3].length === 4) {
        parts = [separated[3], separated[2], separated[1]];
    }
    if (!parts || parts[2].length > 2) return { ok: false, reason: "format" };

    const [year, month, day] = parts.map(Number);
    if (month < 1 || month > 12 || day < 1)
        return { ok: false, reason: "date" };
    if (day > daysInGregorianMonth(year, month)) {
        return { ok: false, reason: "date" };
    }
    const date = { year, month, day };
    if (compareGregorian(date, MIN_GREGORIAN_DATE) < 0) {
        return { ok: false, reason: "range" };
    }
    return { ok: true, date };
};
