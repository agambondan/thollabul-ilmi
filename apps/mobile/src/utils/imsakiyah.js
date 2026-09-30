export const IMSAKIYAH_MONTH_WINDOW = 12;

const pad = (value) => String(value).padStart(2, "0");

export const currentImsakiyahMonth = (now = new Date()) => ({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
});

export const parseImsakiyahMonth = (value) => {
    const match = /^(\d{4})-(\d{2})/.exec(String(value ?? ""));
    if (!match) return null;
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return { month, year: Number(match[1]) };
};

export const shiftImsakiyahMonth = ({ month, year }, delta) => {
    const index = year * 12 + (month - 1) + delta;
    return { month: (index % 12) + 1, year: Math.floor(index / 12) };
};

export const imsakiyahMonthDistance = (from, to) =>
    (to.year - from.year) * 12 + (to.month - from.month);

export const imsakiyahMonthKey = ({ month, year }) => `${year}-${pad(month)}`;
